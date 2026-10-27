// Menopausia Equilibrada — sincronización entre dispositivos.
// Guarda el documento JSON completo de cada usuaria en Netlify Blobs,
// con la clave = SHA-256 (calculado en el navegador) de su código privado.
// El código nunca llega al servidor; solo su hash.
// Solo sincronizan las compradoras: la petición debe llevar su código de acceso a la app (cabecera x-me-acc),
// que se comprueba con la firma (sin leer la base de datos, para que sea barato con miles de usuarias).
import { getStore } from "@netlify/blobs";
import { hmac, envGet as env } from "../lib/catalog.mjs";

const MAX_BYTES = 1024 * 1024; // 1 MB

function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      ...extra,
    },
  });
}

export default async (req) => {
  const url = new URL(req.url);
  const id = (url.searchParams.get("id") || "").toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(id)) {
    return json({ error: "Identificador no válido." }, 400);
  }

  const key = env("ADMIN_KEY");
  const acc = (req.headers.get("x-me-acc") || "").toLowerCase().match(/^([0-9a-f]{14})-([0-9a-f]{10})$/);
  if (!key || !acc || acc[2] !== (await hmac(key, "app:" + acc[1], 10))) {
    return json({ error: "Se necesita un acceso válido a la app." }, 401);
  }

  const store = getStore({ name: "me-sync", consistency: "strong" });

  if (req.method === "GET") {
    try {
      const data = await store.get(id, { type: "json" });
      return json({ data: data ?? null });
    } catch (err) {
      console.error("sync GET failed", err);
      return json({ error: "No se pudo leer." }, 500);
    }
  }

  if (req.method === "PUT") {
    const ct = (req.headers.get("content-type") || "").toLowerCase();
    if (!ct.startsWith("application/json")) {
      return json({ error: "Solo se acepta JSON." }, 415);
    }
    const declared = Number(req.headers.get("content-length") || 0);
    if (declared > MAX_BYTES) return json({ error: "Demasiado grande." }, 413);
    const text = await req.text();
    if (new TextEncoder().encode(text).length > MAX_BYTES) {
      return json({ error: "Demasiado grande." }, 413);
    }
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      return json({ error: "JSON no válido." }, 400);
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return json({ error: "Formato no válido." }, 400);
    }
    try {
      await store.setJSON(id, body);
      return json({ ok: true, savedAt: Date.now() });
    } catch (err) {
      console.error("sync PUT failed", err);
      return json({ error: "No se pudo guardar." }, 500);
    }
  }

  return json({ error: "Método no permitido." }, 405, { allow: "GET, PUT" });
};

export const config = { path: "/api/sync" };
