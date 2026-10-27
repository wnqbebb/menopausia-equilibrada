// Valida el código de acceso a la app (solo compras pagadas que incluyen la app).
import { db } from "../lib/store.js";
import { json, hmac, hasApp, itemsOf, envGet as env } from "../lib/catalog.js";

async function handler(req) {
  if (req.method !== "POST") return json({ ok: false, error: "Método no permitido." }, 405);
  let b; try { b = await req.json(); } catch { return json({ ok: false }, 400); }
  const code = String(b.code || "").trim().toLowerCase();
  const m = code.match(/^([0-9a-f]{14})-([0-9a-f]{10})$/);
  const key = env("ADMIN_KEY");
  if (!m || !key) return json({ ok: false, error: "Ese código no es válido." });
  if (m[2] !== (await hmac(key, "app:" + m[1], 10))) return json({ ok: false, error: "Ese código no es válido." });
  const store = db().orders;
  const rec = await store.get(m[1]);
  if (!rec || rec.status !== "pagado" || !hasApp(itemsOf(rec)) || rec.revoked) return json({ ok: false, error: "Ese código no está activo." });
  return json({ ok: true, name: (rec.name || "").split(" ")[0] });
}

export { handler as POST, handler as GET };
