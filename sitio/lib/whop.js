// Conexión automática con Whop: con solo WHOP_API_KEY en Vercel, el sitio crea su propio webhook en Whop
// (POST /api/v1/webhooks, permiso developer:manage_webhook) y guarda el secreto de firma en la base de datos.
// Así no hace falta copiar WHOP_WEBHOOK_SECRET a mano (si está en Vercel, se usa ese).
import { db } from "./store.js";
import { envGet as env } from "./catalog.js";

const EVENTOS = ["payment.succeeded", "membership.activated"];

export async function secretoWebhook() {
  if (env("WHOP_WEBHOOK_SECRET")) return env("WHOP_WEBHOOK_SECRET");
  const s = await db().marcas.get("whop-secreto").catch(() => null);
  return (s && s.secret) || "";
}

// Crea el webhook una sola vez. forzar=true (botón del panel) lo intenta aunque ya se haya intentado esta hora.
export async function conectarWhop(origin, { forzar = false } = {}) {
  const key = env("WHOP_API_KEY");
  if (!key) return { ok: false, error: "Falta WHOP_API_KEY en Vercel." };
  if (await secretoWebhook()) return { ok: true, ya: true };
  const marcas = db().marcas;
  if (!forzar && !(await marcas.tomar("whop-intento3-" + Math.floor(Date.now() / 600000), { at: Date.now() }))) return { ok: false, pendiente: true };
  const body = { url: origin.replace(/\/$/, "") + "/api/whop-webhook", events: EVENTOS, api_version_date: "2026-10-28", enabled: true };
  if (env("WHOP_COMPANY_ID")) body.resource_id = env("WHOP_COMPANY_ID");
  let r, d;
  try {
    r = await fetch("https://api.whop.com/api/v1/webhooks", { method: "POST", headers: { authorization: `Bearer ${key}`, "content-type": "application/json" }, body: JSON.stringify(body) });
    d = await r.json().catch(() => ({}));
  } catch (e) { return { ok: false, error: "No se pudo hablar con Whop: " + (e?.message || e) }; }
  const secret = d.webhook_secret || d.secret || "";
  if (!r.ok || !secret) { console.error("whop webhook", r.status, JSON.stringify(d).slice(0, 400)); return { ok: false, error: `Whop respondió ${r.status}: ${(d.error && (d.error.message || d.error)) || d.message || "sin detalle"}. Revisa que la clave tenga el permiso «developer:manage_webhook» (o rol Admin).` }; }
  await marcas.tomar("whop-secreto", { secret, id: d.id || "", at: Date.now() });
  return { ok: true, creado: true, id: d.id || "" };
}

// ---------- Sin webhook: el sitio le pregunta a Whop por los pagos (permiso payment:basic:read) ----------
// Se usa al terminar el pago incrustado (con el id del pago) y cada 2 minutos para los pagos nuevos.
const api = async (path) => {
  const key = env("WHOP_API_KEY");
  if (!key) return null;
  try { const r = await fetch("https://api.whop.com/api/v1/" + path, { headers: { authorization: `Bearer ${key}` } }); return r.ok ? await r.json() : null; } catch { return null; }
};
const pagado = (p) => p && p.status === "paid" && (!p.substatus || p.substatus === "succeeded");

// Entrega un pago de Whop (crea el pedido y envía el correo) si aún no se había entregado.
export async function entregarPago(p, origin) {
  if (!pagado(p)) return null;
  const { pagarPedido, ventaDirecta } = await import("../api/whop-webhook.js");
  const pid = String(p.metadata?.pedido || "").replace(/[^a-z0-9]/gi, "");
  if (pid) return pagarPedido(pid, p, origin);
  const r = await ventaDirecta(p, null, origin);
  return r && r.json ? r.json() : r;
}

// Un pago concreto (después del pago incrustado): se pide a Whop y se entrega al momento.
export async function entregarPagoPorId(id, origin) {
  if (!/^pay_[A-Za-z0-9]+$/.test(id)) return null;
  return entregarPago(await api("payments/" + id), origin);
}

// Revisa los últimos pagos de Whop y entrega los que falten (como máximo una vez cada 2 minutos).
export async function sincronizarPagos(origin, { forzar = false } = {}) {
  const cuenta = env("WHOP_COMPANY_ID");
  if (!env("WHOP_API_KEY") || !cuenta) return { ok: false };
  if (!forzar && !(await db().marcas.tomar("whop-sync-" + Math.floor(Date.now() / 120000), { at: Date.now() }))) return { ok: true, saltado: true };
  const d = await api(`payments?account_id=${encodeURIComponent(cuenta)}&first=25`);
  let nuevos = 0;
  for (const p of (d && d.data) || []) {
    if (!pagado(p)) continue;
    // La lista no siempre trae el correo: se pide el pago completo.
    const full = p.customer_email ? p : (await api("payments/" + p.id)) || p;
    const r = await entregarPago(full, origin).catch((e) => { console.error("sync whop", p.id, e.message); return null; });
    if (r && (r.directa || r.status === "pagado") && !r.already) nuevos++;
  }
  return { ok: true, nuevos };
}
