// Webhook de Whop: cuando un pago se confirma (payment.succeeded), marca el pedido como pagado.
// Configúralo en Whop → Developer → Webhooks con la URL https://TU-DOMINIO/api/whop-webhook
// y el evento payment.succeeded. Copia el secreto (ws_...) en la variable WHOP_WEBHOOK_SECRET.
// Firma: estándar «Standard Webhooks» (cabeceras webhook-id, webhook-timestamp, webhook-signature).
import { db } from "../lib/store.js";
import { json, CURRENCY, envGet as env } from "../lib/catalog.js";
import { reflejarEnCuenta, avisarPagado, origen } from "../lib/cuentas.js";

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
  // payment.succeeded = pago normal. Las compras de 0 USD (cupón del 100 %) pueden llegar solo como membresía activada.
  const MEMB = ["membership.activated", "membership.went_valid"];
  if (ev.type !== "payment.succeeded" && !MEMB.includes(ev.type)) return json({ ok: true, ignored: ev.type });
  const p = ev.data || {};
  if (MEMB.includes(ev.type)) p._membresia = true;
  const pid = String(p.metadata?.pedido || "").replace(/[^a-z0-9]/gi, "");
  if (!pid) return ventaDirecta(p, req);
  const store = db().orders;
  const rec = await store.get(pid);
  if (!rec) return json({ ok: true, note: "Pedido no encontrado." });
  if (rec.status === "pagado") return json({ ok: true, already: true });
  const paidCents = p._membresia ? null : toCents(p.usd_total) ?? toCents(p.total) ?? toCents(p.subtotal);
  rec.paymentId = p._membresia ? rec.paymentId || "" : p.id || "";
  if (paidCents != null) rec.paidCents = paidCents;
  // Un cobro menor solo puede venir de un cupón que creaste tú en Whop (la clienta no puede inventarlo): se entrega igual.
  if (paidCents != null && paidCents + 1 < rec.cents) rec.note = `Pagó ${(paidCents / 100).toFixed(2)} USD con un cupón de Whop (pedido de ${(rec.cents / 100).toFixed(2)}).`;
  rec.status = "pagado";
  rec.paidAt = new Date().toISOString();
  await store.save(rec);
  // Si es una mejora a «Todo junto» de alguien que ya tiene cuenta, se le activa PLENA al momento.
  if (rec.status === "pagado") {
    await reflejarEnCuenta(rec).catch((e) => console.error("webhook cuenta", e.message));
    await avisarPagado(rec, origen(rec, req.url)).catch((e) => console.error("webhook correo", e.message));
  }
  return json({ ok: true, status: rec.status });
}

// ---------- Ventas hechas directamente en Whop (tienda de Whop o enlace de pago enviado por WhatsApp) ----------
// No traen nuestro número de pedido: se crea uno «pagado» con el pack completo y se envía «Crea tu cuenta de PLENA».
// Productos aceptados: WHOP_PRODUCT_ID y los de WHOP_PRODUCTOS_DIRECTOS (ids prod_… separados por comas) → PLENA completa;
// WHOP_PRODUCTO_LIBROS (prod_…) → solo la Biblioteca PAUSA (13 libros, sin PLENA).
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
const txt = (v) => (typeof v === "string" ? v.trim() : "");
function productoDe(p) { return txt(p.product?.id) || txt(p.product_id) || txt(p.plan?.product?.id) || txt(p.plan?.product_id) || txt(p.access_pass?.id); }
function correoDe(p) {
  for (const v of [p.user?.email, p.member?.email, p.member?.user?.email, p.billing_address?.email, p.email, p.customer_email, p.metadata?.email]) { const e = txt(v).toLowerCase(); if (EMAIL.test(e)) return e; }
  return "";
}
function telefonoDe(p) { return (txt(p.member?.phone) || txt(p.customer_phone) || txt(p.membership?.phone_number)).slice(0, 30); }
function nombreDe(p) { return txt(p.user?.name) || txt(p.member?.name) || txt(p.member?.user?.name) || txt(p.billing_address?.name) || txt(p.user?.username) || ""; }
// Whop manda el correo en data.user.email solo si el webhook y la API key tienen el permiso member:email:read.
// Si no viene, se pregunta a GET /api/v1/payments/{id} (WHOP_API_KEY con payment:basic:read y member:email:read).
async function completarDesdeWhop(p) {
  const key = env("WHOP_API_KEY");
  if (!key || !p.id) return p;
  const get = async (path) => { try { const r = await fetch("https://api.whop.com/api/v1/" + path, { headers: { authorization: `Bearer ${key}` } }); return r.ok ? await r.json() : null; } catch { return null; } };
  const pago = await get("payments/" + encodeURIComponent(p.id));
  let out = pago ? { ...p, ...pago } : p;
  const memberId = txt(out.member?.id) || txt(out.member_id) || txt(out.membership?.member?.id);
  if (!correoDe(out) && memberId) { const m = await get("members/" + encodeURIComponent(memberId)); if (m) out = { ...out, member: { ...(out.member || {}), ...m } }; }
  return out;
}

async function ventaDirecta(p, req) {
  const permitidos = [env("WHOP_PRODUCT_ID"), ...env("WHOP_PRODUCTOS_DIRECTOS").split(",")].map((x) => x.trim()).filter(Boolean);
  const prodLibros = env("WHOP_PRODUCTO_LIBROS").trim();
  const prod = productoDe(p);
  const soloLibros = !!(prod && prodLibros && prod === prodLibros);
  if (prod && !soloLibros && permitidos.length && !permitidos.includes(prod)) return json({ ok: true, note: "Pago de otro producto de Whop: no es PLENA." });
  const pagoId = txt(p.id);
  if (!pagoId) return json({ ok: true, note: "Pago sin id." });
  const marcas = db().marcas;
  // Un mismo pago de Whop solo crea un pedido, aunque Whop reenvíe el aviso o mande pago y membresía por la misma compra.
  const memId = p._membresia ? pagoId : txt(p.membership?.id) || txt(p.membership_id);
  const clave = memId ? "whop-m-" + memId : "whop-" + pagoId;
  if (!(await marcas.tomar(clave.replace(/[^A-Za-z0-9_-]/g, ""), { at: Date.now() }))) return json({ ok: true, already: true });
  if (!correoDe(p) && !p._membresia) p = await completarDesdeWhop(p);
  const email = correoDe(p), now = new Date().toISOString();
  const paidCents = p._membresia ? 0 : toCents(p.usd_total) ?? toCents(p.total) ?? toCents(p.subtotal) ?? 0;
  const ORIGIN = origen(null, req.url);
  const rec = {
    v: 2, id: "", createdAt: now, name: nombreDe(p) || (email ? email.split("@")[0] : "Compra en Whop"), email, phone: telefonoDe(p),
    items: soloLibros ? ["libros"] : ["todo"], cents: paidCents, paidCents, currency: CURRENCY, mode: "whop-directo", paymentId: pagoId, origin: ORIGIN,
    status: email ? "pagado" : "revisar", paidAt: email ? now : undefined,
    note: email ? "" : "Whop no envió el correo de la compradora. Búscalo en Whop (Pagos), ponlo con «Poner correo» y marca el pedido como pagado.",
  };
  await db().orders.create(rec);
  if (email) await avisarPagado(rec, ORIGIN);
  return json({ ok: true, status: rec.status, pedido: rec.id, directa: true });
}

export { handler as POST, handler as GET };
