// Cuentas de PLENA (correo + contraseña, con Supabase Auth).
//  POST   /api/cuenta                 crear la cuenta de un pedido pagado (desde gracias.html; firma del pedido o código antiguo)
//  GET    /api/cuenta                 mi perfil (nombre, correo, foto firmada, clave envuelta del diario)   [sesión]
//  PATCH  /api/cuenta                 cambiar nombre o la clave envuelta (al cambiar la contraseña)          [sesión]
//  PUT    /api/cuenta?foto=1          subir la foto de perfil (WebP/JPG/PNG, máx. 2 MB)                       [sesión]
//  DELETE /api/cuenta?foto=1          quitar la foto                                                          [sesión]
//  DELETE /api/cuenta                 borrar mi cuenta y todos mis datos (pide la contraseña)                 [sesión]
// La contraseña solo pasa por aquí para crear la cuenta en Supabase (que la guarda cifrada); nunca se guarda ni se registra.
import { db } from "../lib/store.js";
import { json } from "../lib/catalog.js";
import * as supa from "../lib/supa.js";
import { verifyAccess, forget } from "../lib/acceso.js";
import { pedidoFirmado, tienePack, origen, correoBienvenida, reflejarEnCuenta } from "../lib/cuentas.js";

const B64 = /^[A-Za-z0-9+/=_-]+$/;
export function claveValida(c) {
  if (!c || typeof c !== "object" || Array.isArray(c)) return null;
  const { v, kid, salt, iter, iv, ct } = c;
  if (v !== 1 || typeof kid !== "string" || !/^[a-z0-9]{8,40}$/.test(kid)) return null;
  if (![salt, iv, ct].every((x) => typeof x === "string" && B64.test(x) && x.length <= 200)) return null;
  if (!Number.isInteger(iter) || iter < 150000 || iter > 2000000) return null;
  return { v, kid, salt, iter, iv, ct };
}
const passOk = (p) => typeof p === "string" && p.length >= 8 && p.length <= 72;

async function crear(req) {
  let b; try { b = await req.json(); } catch { return json({ error: "Datos no válidos." }, 400); }
  const rec = await pedidoFirmado({ pedido: b.pedido, t: b.t, k: b.k });
  if (!rec) return json({ error: "Este enlace no es válido. Usa el enlace de tu correo de compra." }, 403);
  if (rec.status !== "pagado") return json({ error: "Tu pago aún no aparece confirmado. Espera un minuto y vuelve a intentarlo." }, 409);
  if (rec.revoked) return json({ error: "Este acceso no está activo. Escríbenos a cristinaaguilarrojas1@gmail.com." }, 403);
  if (rec.userId) return json({ existe: true, email: rec.email, error: "Ya creaste tu cuenta. Inicia sesión con tu correo y tu contraseña." }, 409);
  if (b.acepta !== true) return json({ error: "Para crear tu cuenta, acepta la política de privacidad." }, 400);
  if (!passOk(b.password)) return json({ error: "La contraseña debe tener al menos 8 caracteres." }, 400);
  const clave = claveValida(b.clave);
  if (!clave) return json({ error: "Tu navegador no pudo preparar el cifrado. Actualízalo e inténtalo de nuevo." }, 400);
  const email = String(rec.email || "").trim().toLowerCase();
  if (!email) return json({ error: "Este pedido no tiene correo. Escríbenos a cristinaaguilarrojas1@gmail.com." }, 400);
  const nombre = String(b.nombre || rec.name || "").trim().slice(0, 80);
  const store = db().orders;

  const r = await supa.createUser({ email, password: b.password, nombre, orderId: rec.id });
  if (!r.ok) {
    const code = String(r.data?.error_code || r.data?.code || "") + " " + String(r.data?.msg || r.data?.message || "");
    if (r.status === 422 && /exist|registered/i.test(code)) {
      // Ya tiene cuenta (por ejemplo, de otra compra): se le suma este pedido y entra con su contraseña de siempre.
      const prof = await supa.selectOne("profiles", { email: "eq." + email }).catch(() => null);
      if (prof) { rec.userId = prof.id; rec.cuentaAt = new Date().toISOString(); await store.save(rec); await reflejarEnCuenta(rec); }
      return json({ existe: true, email, error: "Ya tienes una cuenta con este correo. Inicia sesión con tu contraseña (si no la recuerdas, usa «¿Olvidaste tu contraseña?»)." }, 409);
    }
    if (r.status === 422 && /password|weak/i.test(code)) return json({ error: "Esa contraseña es muy débil. Usa al menos 8 caracteres, con letras y números." }, 400);
    console.error("cuenta: crear usuaria", r.status, JSON.stringify(r.data).slice(0, 300));
    return json({ error: "No se pudo crear tu cuenta. Inténtalo de nuevo en un momento." }, 502);
  }
  const uid = r.data.id || r.data.user?.id;
  try {
    await supa.insert("profiles", { id: uid, nombre, email, order_id: rec.id, pack: tienePack(rec), revocado: false, clave });
  } catch (e) {
    console.error("cuenta: perfil", e.message);
    await supa.deleteUser(uid).catch(() => {});
    return json({ error: "No se pudo crear tu cuenta. Inténtalo de nuevo en un momento." }, 502);
  }
  rec.userId = uid; rec.cuentaAt = new Date().toISOString(); rec.cuentaNombre = nombre;
  await store.save(rec);
  // El correo de bienvenida: si falla, la cuenta queda creada igual y el error se ve en el panel para reenviarlo.
  const mail = await correoBienvenida(rec, origen(rec, req.url));
  await store.save(rec);
  return json({ ok: true, email, correo: mail.ok });
}

function tipoImagen(u8) {
  if (u8[0] === 0xff && u8[1] === 0xd8 && u8[2] === 0xff) return "image/jpeg";
  if (u8[0] === 0x89 && u8[1] === 0x50 && u8[2] === 0x4e && u8[3] === 0x47) return "image/png";
  if (String.fromCharCode(...u8.slice(0, 4)) === "RIFF" && String.fromCharCode(...u8.slice(8, 12)) === "WEBP") return "image/webp";
  return "";
}

async function handler(req) {
  if (!supa.configured()) return json({ error: "Las cuentas aún no están configuradas." }, 503);
  const url = new URL(req.url);
  try {
    if (req.method === "POST") return await crear(req);
    const a = await verifyAccess(req);
    if (!a.ok) return json({ ok: false, motivo: a.motivo, error: a.error }, a.status);
    const p = a.profile;
    const foto = url.searchParams.has("foto");

    if (req.method === "GET") {
      return json({ ok: true, id: a.uid, nombre: p.nombre, email: p.email || a.user.email, pack: !!p.pack, creado: p.creado, clave: p.clave || null, foto: await supa.signAvatar(p.avatar_url, a.token) });
    }
    if (req.method === "PATCH") {
      let b; try { b = await req.json(); } catch { return json({ error: "Datos no válidos." }, 400); }
      const patch = {};
      if (typeof b.nombre === "string") patch.nombre = b.nombre.trim().slice(0, 80);
      if (b.clave !== undefined) { const c = claveValida(b.clave); if (!c) return json({ error: "Clave no válida." }, 400); patch.clave = c; }
      if (!Object.keys(patch).length) return json({ error: "Nada que cambiar." }, 400);
      await supa.update("profiles", { id: "eq." + a.uid }, patch, a.token);
      forget(req);
      return json({ ok: true });
    }
    if (req.method === "PUT" && foto) {
      const len = Number(req.headers.get("content-length") || 0);
      if (len > 2 * 1024 * 1024) return json({ error: "La foto pesa más de 2 MB." }, 413);
      const bytes = new Uint8Array(await req.arrayBuffer());
      if (!bytes.length || bytes.length > 2 * 1024 * 1024) return json({ error: "La foto pesa más de 2 MB." }, 413);
      const type = tipoImagen(bytes);
      if (!type) return json({ error: "Solo se aceptan fotos JPG, PNG o WebP." }, 415);
      const path = `${a.uid}/foto-${Date.now().toString(36)}.${type.split("/")[1].replace("jpeg", "jpg")}`;
      await supa.deleteAvatars(a.uid, a.token).catch(() => {});
      await supa.uploadAvatar(path, bytes, type, a.token);
      await supa.update("profiles", { id: "eq." + a.uid }, { avatar_url: path }, a.token);
      forget(req);
      return json({ ok: true, foto: await supa.signAvatar(path, a.token) });
    }
    if (req.method === "DELETE" && foto) {
      await supa.deleteAvatars(a.uid, a.token);
      await supa.update("profiles", { id: "eq." + a.uid }, { avatar_url: null }, a.token);
      forget(req);
      return json({ ok: true });
    }
    if (req.method === "DELETE") {
      // Derecho de supresión: borra la cuenta, el perfil, el progreso, el diario cifrado y la foto.
      let b = {}; try { b = await req.json(); } catch {}
      if (!passOk(b.password) || !(await supa.passwordOk(p.email || a.user.email, b.password))) return json({ error: "La contraseña no es correcta." }, 403);
      await supa.deleteAvatars(a.uid).catch((e) => console.error("borrar fotos", e.message));
      for (const [t, col] of [["diario", "user_id"], ["progreso", "user_id"], ["profiles", "id"]]) await supa.remove(t, { [col]: "eq." + a.uid });
      await supa.deleteUser(a.uid);
      forget(req);
      const store = db().orders;
      for (const rec of await store.all()) {
        if (rec.userId !== a.uid) continue;
        delete rec.userId; delete rec.cuentaNombre; rec.cuentaBorrada = new Date().toISOString();
        await store.save(rec);
      }
      return json({ ok: true, borrada: true });
    }
    return json({ error: "Método no permitido." }, 405);
  } catch (e) {
    console.error("cuenta", e?.message || e);
    return json({ error: "Algo salió mal. Inténtalo de nuevo en un momento." }, 500);
  }
}

export { handler as GET, handler as POST, handler as PATCH, handler as PUT, handler as DELETE };
