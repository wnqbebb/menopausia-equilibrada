// Oferta de bienvenida: entrega (o confirma) el token firmado con la hora de inicio de la visitante.
import { json, makeOffer, checkOffer, OFFER_WINDOW_MS, BUNDLE_LAUNCH, BUNDLE_REGULAR, LIBROS_LAUNCH, LIBROS_REGULAR, envGet as env } from "../lib/catalog.js";

async function handler(req) {
  if (req.method !== "POST") return json({ error: "Método no permitido." }, 405);
  const key = env("ADMIN_KEY");
  let b = {}; try { b = await req.json(); } catch {}
  const now = Date.now();
  let c = await checkOffer(key, b.token, now);
  let token = b.token;
  if (!c.ok) { token = await makeOffer(key, now); c = await checkOffer(key, token, now); }
  return json({ token, issuedAt: c.issuedAt, expiresAt: c.expiresAt, active: c.active, now, windowMs: OFFER_WINDOW_MS, launchCents: BUNDLE_LAUNCH, regularCents: BUNDLE_REGULAR, librosLaunchCents: LIBROS_LAUNCH, librosRegularCents: LIBROS_REGULAR,
    // Planes de Whop del pago incrustado: se cambian en Vercel (WHOP_PLAN_*) si se usa otra cuenta de Whop.
    planes: { libros: env("WHOP_PLAN_LIBROS") || "plan_lXm2MW9MtlVRs", todo: env("WHOP_PLAN_TODO") || "plan_DsdwKF5WepIjn", mejora: env("WHOP_PLAN_MEJORA") || "plan_fbPqZmH1WSsQS" } });
}

export { handler as POST, handler as GET };
