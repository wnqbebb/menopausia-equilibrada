// Oferta de bienvenida: entrega (o confirma) el token firmado con la hora de inicio de la visitante.
import { json, makeOffer, checkOffer, OFFER_WINDOW_MS, BUNDLE_LAUNCH, BUNDLE_REGULAR, envGet as env } from "../lib/catalog.js";

async function handler(req) {
  if (req.method !== "POST") return json({ error: "Método no permitido." }, 405);
  const key = env("ADMIN_KEY");
  let b = {}; try { b = await req.json(); } catch {}
  const now = Date.now();
  let c = await checkOffer(key, b.token, now);
  let token = b.token;
  if (!c.ok) { token = await makeOffer(key, now); c = await checkOffer(key, token, now); }
  return json({ token, issuedAt: c.issuedAt, expiresAt: c.expiresAt, active: c.active, now, windowMs: OFFER_WINDOW_MS, launchCents: BUNDLE_LAUNCH, regularCents: BUNDLE_REGULAR });
}

export { handler as POST, handler as GET };
