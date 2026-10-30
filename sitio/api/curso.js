// Plataforma PLENA: entrega el contenido del curso (módulos, lecciones, lecturas, videos y recursos) solo a quien tiene una sesión válida con el pack completo y no está revocada.
// El contenido se edita en contenido/curso.json.
import { json, ITEMS, DELIVERY_DIR, envGet as env } from "../lib/catalog.js";
import { verifyAccess } from "../lib/acceso.js";
import curso from "../contenido/curso.json" with { type: "json" };
import libros from "../contenido/libros.json" with { type: "json" };
import videos from "../contenido/videos.json" with { type: "json" };

async function handler(req) {
  if (req.method !== "GET") return json({ error: "Método no permitido." }, 405);
  const a = await verifyAccess(req, { pack: true });
  if (!a.ok) return json({ ok: false, motivo: a.motivo, error: a.error }, a.status);
  const nombre = String(a.profile.nombre || "").trim().split(/\s+/)[0] || "";
  const base = String(env("FILES_BASE") || "").trim() ? String(env("FILES_BASE")).trim().replace(/\/?$/, "/") : DELIVERY_DIR;
  const archivos = Object.entries(ITEMS).filter(([, v]) => v.files && v.files.length).map(([item, v]) => ({ item, url: base + v.files[0][1], paginas: libros[item]?.n || 0, dir: libros[item] ? "/plena/libros/" + item + "/" : "" }));
  return json({ ok: true, nombre, curso, archivos, videos });
}

export { handler as GET };
