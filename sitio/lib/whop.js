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
  if (!forzar && !(await marcas.tomar("whop-intento2-" + Math.floor(Date.now() / 3600000), { at: Date.now() }))) return { ok: false, pendiente: true };
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
