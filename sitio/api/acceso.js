// Comprueba la sesión de PLENA y devuelve si la cuenta está activa y si tiene el pack completo.
// (Antes validaba códigos de acceso; ahora usa la sesión de Supabase: «Authorization: Bearer <JWT>».)
import { json } from "../lib/catalog.js";
import { verifyAccess } from "../lib/acceso.js";

async function handler(req) {
  const a = await verifyAccess(req);
  if (!a.ok) return json({ ok: false, motivo: a.motivo, error: a.error }, a.status);
  return json({ ok: true, name: String(a.profile.nombre || "").split(" ")[0], pack: !!a.profile.pack });
}

export { handler as GET, handler as POST };
