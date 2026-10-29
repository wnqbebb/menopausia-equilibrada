// Plataforma PLENA: guarda el progreso del curso (lecciones completadas) para verlo en cualquier dispositivo.
// No contiene datos de salud: solo identificadores de lecciones y fechas.
import { db } from "../lib/store.js";
import { json } from "../lib/catalog.js";
import { verifyAccess } from "../lib/acceso.js";

const MAX = 20 * 1024;

async function handler(req) {
  const a = await verifyAccess(req);
  if (!a.ok) return json({ ok: false, error: a.error }, a.status);
  const store = db().prog;
  if (req.method === "GET") return json({ ok: true, progreso: (await store.get(a.id)) || { done: {} } });
  if (req.method === "PUT") {
    const t = await req.text();
    if (t.length > MAX) return json({ error: "Demasiado grande." }, 413);
    let b; try { b = JSON.parse(t); } catch { return json({ error: "JSON no válido." }, 400); }
    const done = {};
    if (b && typeof b.done === "object") for (const [k, v] of Object.entries(b.done).slice(0, 400)) if (/^[a-z0-9-]{1,40}$/.test(k) && Number.isFinite(+v)) done[k] = +v;
    const out = { done, last: typeof b.last === "string" && /^[a-z0-9/-]{1,60}$/.test(b.last) ? b.last : "", at: Date.now() };
    await store.put(a.id, out);
    return json({ ok: true, progreso: out });
  }
  return json({ error: "Método no permitido." }, 405);
}

export { handler as GET, handler as PUT };
