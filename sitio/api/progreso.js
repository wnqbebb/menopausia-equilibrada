// Plataforma PLENA: guarda el progreso del curso para verlo en cualquier dispositivo.
// No contiene datos de salud: solo identificadores de lecciones, respuestas del quiz, páginas leídas y días con actividad.
import { db } from "../lib/store.js";
import { json } from "../lib/catalog.js";
import { verifyAccess } from "../lib/acceso.js";

const MAX = 20 * 1024;
const ID = /^[a-z0-9-]{1,40}$/;
const num = (v) => Number.isFinite(+v) ? +v : null;
function mapOf(o, keyRe, max, val) {
  const out = {};
  if (o && typeof o === "object") for (const [k, v] of Object.entries(o).slice(0, max)) { if (!keyRe.test(k)) continue; const x = val(v); if (x !== null && x !== undefined) out[k] = x; }
  return out;
}

export function limpiar(b) {
  b = b && typeof b === "object" ? b : {};
  return {
    done: mapOf(b.done, ID, 400, num),                                   // lección → fecha
    tasks: mapOf(b.tasks, ID, 400, num),                                 // tarea hecha → fecha
    quiz: mapOf(b.quiz, ID, 400, (v) => (v === 1 || v === 0 ? v : null)), // 1 acierto, 0 fallo
    mitos: mapOf(b.mitos, ID, 400, num),                                 // mito descubierto → fecha
    read: mapOf(b.read, /^[a-z0-9]{1,20}$/, 40, (v) => (typeof v === "string" && /^[01]{1,200}$/.test(v) ? v : null)), // páginas vistas por libro
    days: mapOf(b.days, /^\d{4}-\d{2}-\d{2}$/, 400, (v) => { const n = num(v); return n === null ? null : Math.max(0, Math.min(255, n | 0)); }),
    last: typeof b.last === "string" && /^[a-z0-9/-]{1,60}$/.test(b.last) ? b.last : "",
    at: Date.now(),
  };
}

async function handler(req) {
  const a = await verifyAccess(req);
  if (!a.ok) return json({ ok: false, error: a.error }, a.status);
  const store = db().prog;
  if (req.method === "GET") return json({ ok: true, progreso: (await store.get(a.id)) || { done: {} } });
  if (req.method === "PUT") {
    const t = await req.text();
    if (t.length > MAX) return json({ error: "Demasiado grande." }, 413);
    let b; try { b = JSON.parse(t); } catch { return json({ error: "JSON no válido." }, 400); }
    const out = limpiar(b);
    await store.put(a.id, out);
    return json({ ok: true, progreso: out });
  }
  return json({ error: "Método no permitido." }, 405);
}

export { handler as GET, handler as PUT };
