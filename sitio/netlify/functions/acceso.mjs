// Valida el código de acceso a la app (solo compras pagadas que incluyen la app).
import { getStore } from "@netlify/blobs";
import { json, hmac, hasApp, itemsOf, envGet as env } from "../lib/catalog.mjs";

export default async (req) => {
  if (req.method !== "POST") return json({ ok: false, error: "Método no permitido." }, 405);
  let b; try { b = await req.json(); } catch { return json({ ok: false }, 400); }
  const code = String(b.code || "").trim().toLowerCase();
  const m = code.match(/^([0-9a-f]{14})-([0-9a-f]{10})$/);
  const key = env("ADMIN_KEY");
  if (!m || !key) return json({ ok: false, error: "Ese código no es válido." });
  if (m[2] !== (await hmac(key, "app:" + m[1], 10))) return json({ ok: false, error: "Ese código no es válido." });
  const store = getStore({ name: "me-pedidos", consistency: "strong" });
  const rec = await store.get(m[1], { type: "json" });
  if (!rec || rec.status !== "pagado" || !hasApp(itemsOf(rec)) || rec.revoked) return json({ ok: false, error: "Ese código no está activo." });
  return json({ ok: true, name: (rec.name || "").split(" ")[0] });
};

export const config = { path: "/api/acceso" };
