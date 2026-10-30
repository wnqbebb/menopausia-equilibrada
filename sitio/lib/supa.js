// Supabase desde el servidor (solo funciones de /api; la clave secreta NUNCA llega al navegador).
//   SUPABASE_URL               https://<proyecto>.supabase.co
//   SUPABASE_ANON_KEY          clave pública (anon o «publishable»): la usa el navegador para iniciar sesión
//   SUPABASE_SERVICE_ROLE_KEY  clave secreta (service_role o «secret»): crear y borrar cuentas, panel
// Las lecturas y escrituras de la usuaria se hacen con SU sesión (JWT), así las reglas RLS de la base de datos
// también la protegen. La clave secreta solo se usa para lo que la usuaria no puede hacer por sí misma.
import { envGet as env } from "./catalog.js";

export const configured = () => !!(env("SUPABASE_URL") && env("SUPABASE_ANON_KEY") && env("SUPABASE_SERVICE_ROLE_KEY"));
const base = () => env("SUPABASE_URL").replace(/\/+$/, "");
const isJwt = (k) => /^eyJ/.test(k);

// Cabeceras: con la sesión de la usuaria, o con la clave secreta (las claves nuevas sb_secret_ van solo en «apikey»).
function hdr(token, extra = {}) {
  if (token) return { apikey: env("SUPABASE_ANON_KEY"), authorization: `Bearer ${token}`, ...extra };
  const k = env("SUPABASE_SERVICE_ROLE_KEY");
  return { apikey: k, ...(isJwt(k) ? { authorization: `Bearer ${k}` } : {}), ...extra };
}

async function call(path, { method = "GET", token = "", body, headers = {}, raw = false } = {}) {
  const h = hdr(token, headers);
  let payload = body;
  if (body !== undefined && !raw) { payload = JSON.stringify(body); h["content-type"] = h["content-type"] || "application/json"; }
  const r = await fetch(base() + path, { method, headers: h, body: payload });
  const text = await r.text();
  let data = null; try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { ok: r.ok, status: r.status, data };
}
const fail = (what, r) => { const e = new Error(`${what}: ${r.status} ${JSON.stringify(r.data).slice(0, 300)}`); e.status = r.status; e.data = r.data; return e; };

// ---------- Auth ----------
export async function userFromToken(token) {
  if (!token) return null;
  const r = await call("/auth/v1/user", { token });
  return r.ok && r.data && r.data.id ? r.data : null;
}
export async function createUser({ email, password, nombre, orderId }) {
  return call("/auth/v1/admin/users", { method: "POST", body: { email, password, email_confirm: true, user_metadata: { nombre }, app_metadata: { order_id: orderId } } });
}
export async function deleteUser(id) {
  const r = await call(`/auth/v1/admin/users/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!r.ok && r.status !== 404) throw fail("borrar usuaria", r);
}
// Revocar = bloquear el inicio de sesión (y la renovación de la sesión) en Supabase Auth.
export async function banUser(id, banned) {
  const r = await call(`/auth/v1/admin/users/${encodeURIComponent(id)}`, { method: "PUT", body: { ban_duration: banned ? "876000h" : "none" } });
  if (!r.ok && r.status !== 404) throw fail("bloquear usuaria", r);
}
// Inicio de sesión con contraseña (solo para comprobar la contraseña actual antes de borrar la cuenta).
export async function passwordOk(email, password) {
  const r = await fetch(base() + "/auth/v1/token?grant_type=password", { method: "POST", headers: { apikey: env("SUPABASE_ANON_KEY"), "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
  return r.ok;
}

// ---------- Tablas (PostgREST) ----------
const q = (o) => Object.entries(o).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
export async function selectOne(table, filter, token = "") {
  const r = await call(`/rest/v1/${table}?${q({ ...filter, select: "*" })}`, { token, headers: { accept: "application/json" } });
  if (!r.ok) throw fail(`leer ${table}`, r);
  return Array.isArray(r.data) ? r.data[0] || null : null;
}
export async function insert(table, row, token = "") {
  const r = await call(`/rest/v1/${table}`, { method: "POST", token, body: row, headers: { prefer: "return=representation" } });
  if (!r.ok) throw fail(`crear ${table}`, r);
  return Array.isArray(r.data) ? r.data[0] : r.data;
}
export async function upsert(table, row, conflict, token = "") {
  const r = await call(`/rest/v1/${table}?on_conflict=${conflict}`, { method: "POST", token, body: row, headers: { prefer: "resolution=merge-duplicates,return=minimal" } });
  if (!r.ok) throw fail(`guardar ${table}`, r);
}
export async function update(table, filter, patch, token = "") {
  const r = await call(`/rest/v1/${table}?${q(filter)}`, { method: "PATCH", token, body: patch, headers: { prefer: "return=representation" } });
  if (!r.ok) throw fail(`actualizar ${table}`, r);
  return Array.isArray(r.data) ? r.data[0] || null : null;
}
export async function remove(table, filter, token = "") {
  const r = await call(`/rest/v1/${table}?${q(filter)}`, { method: "DELETE", token });
  if (!r.ok) throw fail(`borrar ${table}`, r);
}

// ---------- Storage (bucket privado «avatars») ----------
const enc = (p) => p.split("/").map(encodeURIComponent).join("/");
export async function uploadAvatar(path, bytes, type, token) {
  const r = await call(`/storage/v1/object/avatars/${enc(path)}`, { method: "POST", token, body: bytes, raw: true, headers: { "content-type": type, "x-upsert": "true", "cache-control": "3600" } });
  if (!r.ok) throw fail("subir foto", r);
}
export async function signAvatar(path, token = "", seconds = 7 * 24 * 3600) {
  if (!path) return "";
  const r = await call(`/storage/v1/object/sign/avatars/${enc(path)}`, { method: "POST", token, body: { expiresIn: seconds } });
  const u = r.ok && r.data && (r.data.signedURL || r.data.signedUrl);
  return u ? base() + "/storage/v1" + (u.startsWith("/") ? u : "/" + u) : "";
}
export async function deleteAvatars(uid, token = "") {
  const r = await call("/storage/v1/object/list/avatars", { method: "POST", token, body: { prefix: uid, limit: 100 } });
  const names = r.ok && Array.isArray(r.data) ? r.data.map((o) => `${uid}/${o.name}`) : [];
  if (!names.length) return;
  const d = await call("/storage/v1/object/avatars", { method: "DELETE", token, body: { prefixes: names } });
  if (!d.ok) throw fail("borrar foto", d);
}
