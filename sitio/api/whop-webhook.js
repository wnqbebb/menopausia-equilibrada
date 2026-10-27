// Webhook de Whop: cuando un pago se confirma (payment.succeeded), marca el pedido como pagado.
// Configúralo en Whop → Developer → Webhooks con la URL https://TU-DOMINIO/api/whop-webhook
// y el evento payment.succeeded. Copia el secreto (ws_...) en la variable WHOP_WEBHOOK_SECRET.
// Firma: estándar «Standard Webhooks» (cabeceras webhook-id, webhook-timestamp, webhook-signature).
import { db } from "../lib/store.js";
import { json, envGet as env } from "../lib/catalog.js";

const enc = new TextEncoder();
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
async function sign(keyBytes, msg) {
  const k = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64(await crypto.subtle.sign("HMAC", k, enc.encode(msg)));
}
function safeEq(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
// Whop indica usar el secreto completo tal cual; por compatibilidad también se acepta la variante
// del estándar (parte posterior al prefijo, decodificada en base64).
function candidateKeys(secret) {
  const keys = [enc.encode(secret)];
  const m = secret.match(/^(?:ws|whsec)_(.+)$/);
  if (m) {
    try { keys.push(Uint8Array.from(atob(m[1]), (c) => c.charCodeAt(0))); } catch {}
    keys.push(enc.encode(m[1]));
  }
  return keys;
}

export async function verify(secret, headers, body, now = Date.now()) {
  const id = headers.get("webhook-id") || "";
  const ts = headers.get("webhook-timestamp") || "";
  const sigs = (headers.get("webhook-signature") || "").split(" ").map((s) => s.split(",")[1]).filter(Boolean);
  if (!id || !/^\d+$/.test(ts) || !sigs.length) return false;
  if (Math.abs(now / 1000 - Number(ts)) > 300) return false;
  const msg = `${id}.${ts}.${body}`;
  for (const k of candidateKeys(secret)) {
    const expected = await sign(k, msg);
    if (sigs.some((s) => safeEq(s, expected))) return true;
  }
  return false;
}

const toCents = (money) => {
  if (money == null) return null;
  if (typeof money === "number") return Math.round(money * 100);
  const n = Number(money.amount);
  return Number.isFinite(n) ? Math.round(n * 100) : null;
};

async function handler(req) {
  if (req.method !== "POST") return json({ error: "Método no permitido." }, 405);
  const secret = env("WHOP_WEBHOOK_SECRET");
  const body = await req.text();
  if (!secret || !(await verify(secret, req.headers, body))) return json({ error: "Firma no válida." }, 401);
  let ev; try { ev = JSON.parse(body); } catch { return json({ error: "JSON no válido." }, 400); }
  if (ev.type !== "payment.succeeded") return json({ ok: true, ignored: ev.type });
  const p = ev.data || {};
  const pid = String(p.metadata?.pedido || "").replace(/[^a-z0-9]/gi, "");
  if (!pid) return json({ ok: true, note: "Pago sin pedido asociado (venta hecha directamente en Whop)." });
  const store = db().orders;
  const rec = await store.get(pid);
  if (!rec) return json({ ok: true, note: "Pedido no encontrado." });
  if (rec.status === "pagado") return json({ ok: true, already: true });
  const paidCents = toCents(p.usd_total) ?? toCents(p.total) ?? toCents(p.subtotal);
  rec.paymentId = p.id || "";
  rec.paidCents = paidCents;
  if (paidCents != null && paidCents + 1 < rec.cents) {
    // Pagó menos de lo esperado (p. ej. cupón): se deja para revisión manual en el panel.
    rec.status = "revisar";
    rec.note = `Whop cobró ${(paidCents / 100).toFixed(2)} y el pedido era de ${(rec.cents / 100).toFixed(2)}.`;
  } else {
    rec.status = "pagado";
    rec.paidAt = new Date().toISOString();
  }
  await store.save(rec);
  return json({ ok: true, status: rec.status });
}

export { handler as POST, handler as GET };
