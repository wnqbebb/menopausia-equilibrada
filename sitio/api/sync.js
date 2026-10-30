// Mi diario (app Menopausia Equilibrada dentro de PLENA) — copia entre dispositivos.
// Guarda la copia CIFRADA en el dispositivo (AES-256-GCM con la clave de datos de la usuaria, que solo se abre con su
// contraseña) en la tabla «diario» de Supabase, protegida con RLS. El servidor nunca ve datos de salud legibles.
// Solo funciona con una sesión de PLENA válida («Authorization: Bearer <JWT>») y una cuenta no revocada.
import { json } from "../lib/catalog.js";
import * as supa from "../lib/supa.js";
import { verifyAccess } from "../lib/acceso.js";

const MAX_BYTES = 900 * 1024; // 900 KB

async function handler(req) {
  const a = await verifyAccess(req, { pack: true });
  if (!a.ok) return json({ ok: false, motivo: a.motivo, error: a.error }, a.status);
  const filtro = { user_id: "eq." + a.uid };

  if (req.method === "GET") {
    try {
      const row = await supa.selectOne("diario", filtro, a.token);
      let data = null; try { data = row ? JSON.parse(row.cifrado) : null; } catch { data = null; }
      return json({ data, at: row ? row.actualizado : null });
    } catch (err) { console.error("sync GET", err.message); return json({ error: "No se pudo leer." }, 500); }
  }

  if (req.method === "PUT") {
    if (!(req.headers.get("content-type") || "").toLowerCase().startsWith("application/json")) return json({ error: "Solo se acepta JSON." }, 415);
    if (Number(req.headers.get("content-length") || 0) > MAX_BYTES) return json({ error: "Demasiado grande." }, 413);
    const text = await req.text();
    if (new TextEncoder().encode(text).length > MAX_BYTES) return json({ error: "Demasiado grande." }, 413);
    let body; try { body = JSON.parse(text); } catch { return json({ error: "JSON no válido." }, 400); }
    // Solo se aceptan copias cifradas en el dispositivo: el servidor nunca guarda datos de salud legibles.
    if (!body || typeof body !== "object" || Array.isArray(body) || body.enc !== "aes-gcm" || typeof body.iv !== "string" || typeof body.ct !== "string" ||
        Object.keys(body).some((k) => !["v", "enc", "kid", "iv", "ct"].includes(k))) {
      return json({ error: "La copia debe ir cifrada. Actualiza la app." }, 400);
    }
    try {
      await supa.upsert("diario", { user_id: a.uid, cifrado: JSON.stringify(body) }, "user_id", a.token);
      return json({ ok: true, savedAt: Date.now() });
    } catch (err) { console.error("sync PUT", err.message); return json({ error: "No se pudo guardar." }, 500); }
  }

  if (req.method === "DELETE") {
    // Derecho de supresión: borra la copia del diario en la nube.
    try { await supa.remove("diario", filtro, a.token); return json({ ok: true, deleted: true }); }
    catch (err) { console.error("sync DELETE", err.message); return json({ error: "No se pudo borrar." }, 500); }
  }

  return json({ error: "Método no permitido." }, 405);
}

export { handler as GET, handler as PUT, handler as DELETE };
