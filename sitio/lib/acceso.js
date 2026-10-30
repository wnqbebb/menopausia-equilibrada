// Comprueba la sesión de PLENA (cabecera «Authorization: Bearer <JWT de Supabase>») y devuelve la usuaria y su perfil.
// Bloquea las cuentas revocadas. Con { pack: true } exige además el pack completo.
import * as supa from "./supa.js";

const CACHE = new Map(); // token → { at, val } (unos segundos, para no consultar Supabase en cada petición seguida)
const TTL = 20000;

export function bearer(req) {
  const m = (req.headers.get("authorization") || "").match(/^Bearer\s+([A-Za-z0-9._-]{20,4096})$/);
  return m ? m[1] : "";
}

export async function verifyAccess(req, { pack = false } = {}) {
  if (!supa.configured()) return { ok: false, status: 503, error: "Las cuentas aún no están configuradas." };
  const token = bearer(req);
  if (!token) return { ok: false, status: 401, error: "Inicia sesión para continuar." };
  let hit = CACHE.get(token);
  if (!hit || Date.now() - hit.at > TTL) {
    const user = await supa.userFromToken(token);
    const profile = user ? await supa.selectOne("profiles", { id: "eq." + user.id }, token) : null;
    hit = { at: Date.now(), val: { user, profile } };
    if (CACHE.size > 500) CACHE.clear();
    CACHE.set(token, hit);
  }
  const { user, profile } = hit.val;
  if (!user) return { ok: false, status: 401, error: "Tu sesión terminó. Vuelve a iniciar sesión." };
  if (!profile || profile.revocado) return { ok: false, status: 403, motivo: "revocado", error: "Tu acceso no está activo. Escríbenos a cristinaaguilarrojas1@gmail.com." };
  if (pack && !profile.pack) return { ok: false, status: 403, motivo: "mejora", error: "La plataforma PLENA está incluida en el pack completo." };
  return { ok: true, token, user, profile, uid: user.id };
}

export function forget(req) { CACHE.delete(bearer(req)); }
