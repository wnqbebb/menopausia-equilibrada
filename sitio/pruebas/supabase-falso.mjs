// Doble de Supabase EN MEMORIA, solo para pruebas locales (servidor-local.mjs y e2e-cuentas.mjs).
// Imita lo que usa PLENA: Auth (GoTrue: contraseña, renovar sesión, usuaria, cerrar sesión, recuperar contraseña,
// admin: crear / bloquear / borrar), PostgREST (profiles, progreso, diario con las mismas reglas RLS que la migración)
// y Storage (bucket privado «avatars»: subir, listar, borrar y enlaces firmados).
// No es Supabase: sirve para probar el flujo completo sin conexión ni cuentas reales.
import crypto from "node:crypto";

export const ANON = "anon-local-de-prueba", SERVICE = "service-local-de-prueba";

export function crearSupabaseFalso({ prefijo = "/__supa", origen }) {
  const U = new Map();      // id → { id, email, password, banned, user_metadata, app_metadata, created_at }
  const AT = new Map();     // access_token → { uid, exp }
  const RT = new Map();     // refresh_token → uid
  const T = { profiles: new Map(), progreso: new Map(), diario: new Map() };
  const S = new Map();      // «uid/archivo» → { type, bytes }
  const SIG = new Map();    // token firmado → ruta
  const correos = [];       // correos de Auth (recuperar contraseña)
  const intentos = new Map();
  const now = () => Math.floor(Date.now() / 1000);
  const rid = () => crypto.randomBytes(24).toString("base64url");
  const userJson = (u) => ({ id: u.id, aud: "authenticated", role: "authenticated", email: u.email, email_confirmed_at: u.created_at, phone: "", app_metadata: { provider: "email", providers: ["email"], ...u.app_metadata }, user_metadata: u.user_metadata || {}, identities: [], created_at: u.created_at, updated_at: u.created_at, banned_until: u.banned ? "2126-01-01T00:00:00Z" : null, is_anonymous: false });
  function sesion(u) {
    const access_token = "eyJ" + rid(), refresh_token = rid();
    AT.set(access_token, { uid: u.id, exp: now() + 3600, rt: refresh_token }); RT.set(refresh_token, u.id);
    return { access_token, token_type: "bearer", expires_in: 3600, expires_at: now() + 3600, refresh_token, user: userJson(u) };
  }
  function quien(h) {
    const key = h.apikey || "";
    const auth = (h.authorization || "").replace(/^Bearer\s+/i, "");
    if (key === SERVICE || auth === SERVICE) return { service: true };
    if (key !== ANON) return { malo: true };
    const t = AT.get(auth);
    if (t && t.exp > now() && U.has(t.uid)) return { uid: t.uid };
    return { anon: true };
  }
  const err = (status, error_code, msg) => ({ status, body: { code: status, error_code, msg } });
  const activa = (uid) => { const p = T.profiles.get(uid); return !!p && !p.revocado; };

  function filtro(q) { // «col=eq.valor»
    const out = {};
    for (const [k, v] of q) if (/^eq\./.test(v)) out[k] = v.slice(3);
    return out;
  }

  async function manejar(method, path, q, h, raw) {
    const who = quien(h);
    const firmado = method === "GET" && /^\/(storage\/v1\/object\/sign\/|auth\/v1\/verify$)/.test(path); // enlaces firmados y del correo: sin clave
    if (who.malo && !firmado) return { status: 401, body: { message: "Invalid API key" } };
    const body = () => { try { return JSON.parse(raw.toString() || "null"); } catch { return null; } };

    // ---------------- Auth ----------------
    if (path === "/auth/v1/token" && method === "POST") {
      const b = body() || {};
      if (q.get("grant_type") === "password") {
        const k = String(b.email || "").toLowerCase(), n = (intentos.get(k) || 0) + 1; intentos.set(k, n);
        if (n > 30) return err(429, "over_request_rate_limit", "Request rate limit reached");
        const u = [...U.values()].find((x) => x.email === k);
        if (!u || u.password !== b.password) return err(400, "invalid_credentials", "Invalid login credentials");
        if (u.banned) return err(400, "user_banned", "User is banned");
        intentos.delete(k);
        return { status: 200, body: sesion(u) };
      }
      if (q.get("grant_type") === "refresh_token") {
        const uid = RT.get(b.refresh_token); const u = uid && U.get(uid);
        if (!u) return err(400, "refresh_token_not_found", "Invalid Refresh Token: Refresh Token Not Found");
        if (u.banned) return err(400, "user_banned", "User is banned");
        RT.delete(b.refresh_token);
        return { status: 200, body: sesion(u) };
      }
      return err(400, "validation_failed", "grant_type");
    }
    if (path === "/auth/v1/user") {
      if (!who.uid) return err(401, "no_authorization", "This endpoint requires a valid Bearer token");
      const u = U.get(who.uid);
      if (method === "GET") return { status: 200, body: userJson(u) };
      if (method === "PUT") { const b = body() || {}; if (b.password) { if (String(b.password).length < 8) return err(422, "weak_password", "Password should be at least 8 characters."); u.password = b.password; } return { status: 200, body: userJson(u) }; }
    }
    if (path === "/auth/v1/logout" && method === "POST") {
      const auth = (h.authorization || "").replace(/^Bearer\s+/i, ""); const t = AT.get(auth);
      if (t) { const scope = q.get("scope") || "global"; for (const [k, v] of AT) if (v.uid === t.uid && (scope === "global" || (scope === "local" ? k === auth : k !== auth))) { AT.delete(k); RT.delete(v.rt); } }
      return { status: 204, body: null };
    }
    if (path === "/auth/v1/recover" && method === "POST") {
      const b = body() || {}; const u = [...U.values()].find((x) => x.email === String(b.email || "").toLowerCase());
      if (u) { const token = rid(); RT.set("rec:" + token, u.id); const redirect = q.get("redirect_to") || origen + "/plena/"; correos.push({ tipo: "recuperar", to: u.email, link: `${origen}${prefijo}/auth/v1/verify?token=${token}&type=recovery&redirect_to=${encodeURIComponent(redirect)}`, at: Date.now() }); }
      return { status: 200, body: {} };
    }
    if (path === "/auth/v1/verify" && method === "GET") {
      const uid = RT.get("rec:" + q.get("token")); const u = uid && U.get(uid);
      const to = q.get("redirect_to") || origen + "/plena/";
      if (!u) return { status: 303, headers: { location: to + "#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired" } };
      RT.delete("rec:" + q.get("token"));
      const s = sesion(u);
      return { status: 303, headers: { location: `${to}#access_token=${s.access_token}&expires_at=${s.expires_at}&expires_in=3600&refresh_token=${s.refresh_token}&token_type=bearer&type=recovery` } };
    }
    if (path === "/auth/v1/admin/users" && method === "POST") {
      if (!who.service) return err(403, "not_admin", "User not allowed");
      const b = body() || {}; const email = String(b.email || "").toLowerCase();
      if ([...U.values()].some((x) => x.email === email)) return err(422, "email_exists", "A user with this email address has already been registered");
      if (String(b.password || "").length < 8) return err(422, "weak_password", "Password should be at least 8 characters.");
      const u = { id: crypto.randomUUID(), email, password: b.password, banned: false, user_metadata: b.user_metadata || {}, app_metadata: b.app_metadata || {}, created_at: new Date().toISOString() };
      U.set(u.id, u);
      return { status: 200, body: userJson(u) };
    }
    let m = path.match(/^\/auth\/v1\/admin\/users\/([0-9a-f-]{36})$/);
    if (m) {
      if (!who.service) return err(403, "not_admin", "User not allowed");
      const u = U.get(m[1]); if (!u) return err(404, "user_not_found", "User not found");
      if (method === "PUT") { const b = body() || {}; if (b.ban_duration) { u.banned = b.ban_duration !== "none"; if (u.banned) for (const [k, v] of RT) if (v === u.id) RT.delete(k); } return { status: 200, body: userJson(u) }; }
      if (method === "DELETE") { U.delete(u.id); for (const t of Object.values(T)) t.delete(u.id); for (const k of [...S.keys()]) if (k.startsWith(u.id + "/")) S.delete(k); return { status: 200, body: {} }; }
    }

    // ---------------- PostgREST ----------------
    m = path.match(/^\/rest\/v1\/(profiles|progreso|diario)$/);
    if (m) {
      const tabla = m[1], tb = T[tabla], pk = tabla === "profiles" ? "id" : "user_id";
      const f = filtro(q); const id = f[pk] || null;
      const puede = (uid) => who.service || (who.uid && who.uid === uid && (tabla === "profiles" || activa(uid)));
      if (!who.service && !who.uid) return { status: 401, body: { message: "JWT required" } };
      if (method === "GET") {
        let rows = [...tb.values()].filter((r) => Object.entries(f).every(([k, v]) => String(r[k] ?? "").toLowerCase() === String(v).toLowerCase()));
        rows = rows.filter((r) => puede(r[pk]));
        return { status: 200, body: rows };
      }
      if (method === "POST") {
        const b = body(); const row = Array.isArray(b) ? b[0] : b;
        if (!row || !puede(row[pk])) return { status: 403, body: { code: "42501", message: "new row violates row-level security policy" } };
        if (tabla === "profiles" && !who.service) return { status: 403, body: { code: "42501", message: "permission denied for table profiles" } };
        const merge = /merge-duplicates/.test(h.prefer || "");
        if (tb.has(row[pk]) && !merge) return { status: 409, body: { code: "23505", message: "duplicate key value" } };
        const nuevo = { ...(tb.get(row[pk]) || {}), ...row, actualizado: new Date().toISOString() };
        if (tabla === "profiles" && !tb.has(row[pk])) nuevo.creado = nuevo.actualizado;
        tb.set(row[pk], nuevo);
        return { status: 201, body: /representation/.test(h.prefer || "") ? [nuevo] : null };
      }
      if (method === "PATCH") {
        const r = id && tb.get(id); const b = body() || {};
        if (!r || !puede(id)) return { status: 200, body: [] };
        if (tabla === "profiles" && !who.service && Object.keys(b).some((k) => !["nombre", "avatar_url", "clave"].includes(k))) return { status: 403, body: { code: "42501", message: "permission denied for table profiles" } };
        Object.assign(r, b, { actualizado: new Date().toISOString() });
        return { status: 200, body: [r] };
      }
      if (method === "DELETE") { if (id && puede(id)) tb.delete(id); return { status: 204, body: null }; }
    }

    // ---------------- Storage ----------------
    if (path === "/storage/v1/object/list/avatars" && method === "POST") {
      const b = body() || {}; const pre = String(b.prefix || "");
      if (!who.service && who.uid !== pre) return { status: 200, body: [] };
      return { status: 200, body: [...S.keys()].filter((k) => k.startsWith(pre + "/")).map((k) => ({ name: k.slice(pre.length + 1) })) };
    }
    if (path === "/storage/v1/object/avatars" && method === "DELETE") {
      const b = body() || {}; const out = [];
      for (const p of b.prefixes || []) if ((who.service || p.startsWith(who.uid + "/")) && S.delete(p)) out.push({ name: p });
      return { status: 200, body: out };
    }
    m = path.match(/^\/storage\/v1\/object\/sign\/avatars\/(.+)$/);
    if (m && method === "POST") {
      const p = decodeURIComponent(m[1]);
      if (!S.has(p) || !(who.service || p.startsWith(who.uid + "/"))) return { status: 400, body: { statusCode: "404", error: "not_found", message: "Object not found" } };
      const tok = rid(); SIG.set(tok, p);
      return { status: 200, body: { signedURL: `/object/sign/avatars/${m[1]}?token=${tok}` } };
    }
    if (m && method === "GET") {
      const p = SIG.get(q.get("token")); const o = p && S.get(p);
      if (!o) return { status: 400, body: { error: "InvalidJWT" } };
      return { status: 200, raw: o.bytes, headers: { "content-type": o.type, "cache-control": "max-age=3600" } };
    }
    m = path.match(/^\/storage\/v1\/object\/avatars\/(.+)$/);
    if (m && (method === "POST" || method === "PUT")) {
      const p = decodeURIComponent(m[1]); const type = h["content-type"] || "";
      if (!who.service && !(who.uid && p.startsWith(who.uid + "/") && activa(who.uid))) return { status: 403, body: { statusCode: "403", error: "Unauthorized", message: "new row violates row-level security policy" } };
      if (raw.length > 2097152) return { status: 413, body: { statusCode: "413", error: "Payload too large", message: "The object exceeded the maximum allowed size" } };
      if (!["image/jpeg", "image/png", "image/webp"].includes(type)) return { status: 415, body: { statusCode: "415", error: "invalid_mime_type", message: "mime type not supported" } };
      S.set(p, { type, bytes: Buffer.from(raw) });
      return { status: 200, body: { Key: "avatars/" + p } };
    }
    return { status: 404, body: { message: "No existe en el doble de Supabase: " + method + " " + path } };
  }

  // Manejador para http.createServer: devuelve true si atendió la petición.
  async function http(req, res, url) {
    if (!url.pathname.startsWith(prefijo + "/")) return false;
    const cors = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS" };
    if (req.method === "OPTIONS") { res.writeHead(204, cors); res.end(); return true; }
    const raw = await new Promise((ok) => { const c = []; req.on("data", (d) => c.push(d)); req.on("end", () => ok(Buffer.concat(c))); });
    const r = await manejar(req.method, url.pathname.slice(prefijo.length), url.searchParams, req.headers, raw);
    const headers = { ...cors, ...(r.headers || {}) };
    if (r.raw) { res.writeHead(r.status, headers); res.end(r.raw); return true; }
    if (r.body === null || r.body === undefined) { res.writeHead(r.status, headers); res.end(); return true; }
    res.writeHead(r.status, { ...headers, "content-type": "application/json" }); res.end(JSON.stringify(r.body)); return true;
  }
  return { http, correos, datos: { U, T, S } };
}
