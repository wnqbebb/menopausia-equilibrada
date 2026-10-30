// Plataforma PLENA: guarda el progreso del curso en la cuenta (tabla «progreso» de Supabase, protegida con RLS)
// para verlo igual en el celular y en el computador.
// No contiene datos de salud legibles: identificadores de lecciones, respuestas del quiz, páginas leídas, videos vistos,
// días con actividad y si hizo el recorrido. La etapa y los objetivos de la bienvenida van CIFRADOS («pf») con la clave del diario.
import { json } from "../lib/catalog.js";
import * as supa from "../lib/supa.js";
import { verifyAccess } from "../lib/acceso.js";

const MAX = 32 * 1024;
const ID = /^[a-z0-9-]{1,40}$/;
const num = (v) => Number.isFinite(+v) ? +v : null;
function mapOf(o, keyRe, max, val) {
  const out = {};
  if (o && typeof o === "object") for (const [k, v] of Object.entries(o).slice(0, max)) { if (!keyRe.test(k)) continue; const x = val(v); if (x !== null && x !== undefined) out[k] = x; }
  return out;
}

function sellado(o) {
  if (!o || typeof o !== "object") return null;
  const ok = (x, n) => typeof x === "string" && /^[A-Za-z0-9+/=]+$/.test(x) && x.length <= n;
  return o.enc === "aes-gcm" && ok(o.iv, 40) && ok(o.ct, 4000) && /^[a-z0-9]{0,40}$/.test(o.kid || "") ? { enc: "aes-gcm", kid: o.kid || "", iv: o.iv, ct: o.ct } : null;
}

export function limpiar(b) {
  b = b && typeof b === "object" ? b : {};
  return {
    done: mapOf(b.done, ID, 400, num),                                   // lección → fecha
    tasks: mapOf(b.tasks, ID, 400, num),                                 // tarea hecha → fecha
    quiz: mapOf(b.quiz, ID, 400, (v) => (v === 1 || v === 0 ? v : null)), // 1 acierto, 0 fallo
    mitos: mapOf(b.mitos, ID, 400, num),                                 // mito descubierto → fecha
    vid: mapOf(b.vid, /^[A-Za-z0-9_-]{11}$/, 300, num),                  // video completado → fecha
    read: mapOf(b.read, /^[a-z0-9]{1,20}$/, 40, (v) => (typeof v === "string" && /^[01]{1,200}$/.test(v) ? v : null)), // páginas vistas por libro
    days: mapOf(b.days, /^\d{4}-\d{2}-\d{2}$/, 400, (v) => { const n = num(v); return n === null ? null : Math.max(0, Math.min(255, n | 0)); }),
    last: typeof b.last === "string" && /^[a-z0-9/-]{1,60}$/.test(b.last) ? b.last : "",
    tour: b.tour === 1 ? 1 : 0,                                          // hizo el recorrido guiado
    pf: sellado(b.pf),                                                   // bienvenida (nombre, etapa, objetivos) cifrada
    pfAt: num(b.pfAt) || 0,
    at: Date.now(),
  };
}

async function handler(req) {
  const a = await verifyAccess(req, { pack: true });
  if (!a.ok) return json({ ok: false, motivo: a.motivo, error: a.error }, a.status);
  try {
    if (req.method === "GET") {
      const row = await supa.selectOne("progreso", { user_id: "eq." + a.uid }, a.token);
      return json({ ok: true, progreso: (row && row.datos) || { done: {} } });
    }
    if (req.method === "PUT") {
      const t = await req.text();
      if (t.length > MAX) return json({ error: "Demasiado grande." }, 413);
      let b; try { b = JSON.parse(t); } catch { return json({ error: "JSON no válido." }, 400); }
      const out = limpiar(b);
      await supa.upsert("progreso", { user_id: a.uid, datos: out }, "user_id", a.token);
      return json({ ok: true, progreso: out });
    }
  } catch (e) { console.error("progreso", e.message); return json({ error: "No se pudo guardar tu progreso." }, 500); }
  return json({ error: "Método no permitido." }, 405);
}

export { handler as GET, handler as PUT };
