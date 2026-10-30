// Vínculo entre pedidos y cuentas de PLENA (lo usan /api/cuenta, el panel, el webhook y la entrega).
import { db } from "./store.js";
import { hmac, itemsOf, hasApp, envGet as env } from "./catalog.js";
import * as supa from "./supa.js";
import * as correo from "./correo.js";

export const tienePack = (rec) => itemsOf(rec).includes("todo");
export const origen = (rec, url) => (env("PUBLIC_URL") || rec?.origin || (url ? new URL(url).origin : "")).replace(/\/$/, "");
export async function enlaceCuenta(rec, origin) { return `${origin}/oferta/gracias.html?pedido=${rec.id}&t=${await hmac(env("ADMIN_KEY"), rec.id)}#cuenta`; }

// Pedido a partir de la firma de la página de gracias (pedido + t) o del código antiguo de la app («ID-FIRMA»).
export async function pedidoFirmado({ pedido, t, k }) {
  const key = env("ADMIN_KEY");
  if (!key) return null;
  if (k) {
    const m = String(k).trim().toLowerCase().match(/^([0-9a-f]{14})-([0-9a-f]{10})$/);
    if (!m || m[2] !== (await hmac(key, "app:" + m[1], 10))) return null;
    return db().orders.get(m[1]);
  }
  const id = String(pedido || "").replace(/[^a-z0-9]/gi, "");
  if (!id || String(t || "") !== (await hmac(key, id))) return null;
  return db().orders.get(id);
}

// Cuando un pedido pasa a pagado, se revoca o se reactiva: refleja el cambio en la cuenta (pack, revocado, bloqueo).
// Una mejora a «Todo junto» hereda la cuenta del pedido anterior.
export async function reflejarEnCuenta(rec) {
  if (!supa.configured()) return;
  const store = db().orders;
  if (!rec.userId && rec.upgradeFrom) {
    const prev = await store.get(rec.upgradeFrom);
    if (prev?.userId) { rec.userId = prev.userId; await store.save(rec); }
  }
  if (!rec.userId) return;
  const patch = {};
  if (rec.status === "pagado" && tienePack(rec)) patch.pack = true;
  if (typeof rec.revoked === "boolean") patch.revocado = rec.revoked;
  if (Object.keys(patch).length) await supa.update("profiles", { id: "eq." + rec.userId }, patch);
  if (typeof rec.revoked === "boolean") await supa.banUser(rec.userId, rec.revoked);
}

export async function correoBienvenida(rec, origin) {
  return correo.enviarYRegistrar(rec, "bienvenida", correo.bienvenida({ origin, nombre: rec.cuentaNombre || rec.name, email: rec.email }));
}
// Al confirmarse el pago de una compra con PLENA, se le envía una vez el enlace para crear la cuenta
// (por si cierra la página de gracias sin crearla).
export async function avisarPagado(rec, origin) {
  if (rec.status !== "pagado" || rec.userId || !rec.email || !hasApp(itemsOf(rec))) return null;
  if ((rec.correos || []).some((c) => c.tipo === "crear-cuenta" && c.ok)) return null;
  const r = await correoCrearCuenta(rec, origin);
  await db().orders.save(rec);
  return r;
}
export async function correoCrearCuenta(rec, origin) {
  return correo.enviarYRegistrar(rec, "crear-cuenta", correo.crearCuenta({ origin, nombre: rec.name, link: await enlaceCuenta(rec, origin) }));
}
export { hasApp };
