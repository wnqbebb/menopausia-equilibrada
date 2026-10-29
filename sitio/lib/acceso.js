// Comprueba el código de acceso (cabecera x-me-acc = «<pedido>-<firma>») y devuelve el pedido si está pagado y activo.
import { db } from "./store.js";
import { hmac, itemsOf, envGet as env } from "./catalog.js";

export async function verifyAccess(req) {
  const key = env("ADMIN_KEY");
  const m = (req.headers.get("x-me-acc") || "").trim().toLowerCase().match(/^([0-9a-f]{14})-([0-9a-f]{10})$/);
  if (!key || !m || m[2] !== (await hmac(key, "app:" + m[1], 10))) return { ok: false, status: 401, error: "Se necesita un acceso válido." };
  const rec = await db().orders.get(m[1]);
  if (!rec || rec.status !== "pagado" || rec.revoked) return { ok: false, status: 403, error: "Ese acceso no está activo." };
  return { ok: true, id: m[1], rec, items: itemsOf(rec) };
}
