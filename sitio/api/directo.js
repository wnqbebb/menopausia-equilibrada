// Enlaces de acceso directo para ventas por WhatsApp (la clienta ya te pagó por banco, Nequi o efectivo).
//  GET  /api/directo?tipo=libros&k=CLAVE  → su Biblioteca PAUSA (lista de PDF para la estantería 3D de gracias.html).
//  POST /api/directo {tipo:"plena", k, name, email, phone, acepta} → crea su pedido pagado de PLENA,
//       le envía «Crea tu cuenta de PLENA» y devuelve el enlace para crearla ya mismo.
// Las claves viven solo en Vercel: ACCESO_LIBROS y ACCESO_PLENA. Si un enlace se filtra, cambia la clave y redespliega:
// el enlace viejo deja de servir al instante (las cuentas ya creadas siguen funcionando).
import { db } from "../lib/store.js";
import { filesFor, json, hmac, CURRENCY, BUNDLE_LAUNCH, LIBROS_LAUNCH, envGet as env } from "../lib/catalog.js";
import { avisarPagado, correoCrearCuenta, enlaceCuenta, origen } from "../lib/cuentas.js";

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
function claveOk(tipo, k) {
  const c = env(tipo === "libros" ? "ACCESO_LIBROS" : "ACCESO_PLENA");
  if (!c || c.length < 12 || typeof k !== "string" || k.length !== c.length) return false;
  let r = 0;
  for (let i = 0; i < c.length; i++) r |= c.charCodeAt(i) ^ k.charCodeAt(i);
  return r === 0;
}

async function handler(req) {
  const url = new URL(req.url);
  const ORIGIN = origen(null, req.url);
  if (req.method === "GET") {
    if (url.searchParams.get("tipo") !== "libros" || !claveOk("libros", url.searchParams.get("k") || "")) return json({ paid: false, error: "Este enlace no es válido o ya cambió. Pide uno nuevo por WhatsApp." }, 403);
    return json({ paid: true, directo: true, libros: true, plena: false, cuenta: false, name: "", items: ["libros"], files: filesFor(["libros"], env("FILES_BASE")), cents: LIBROS_LAUNCH, bundleCents: BUNDLE_LAUNCH });
  }
  if (req.method !== "POST") return json({ error: "Método no permitido." }, 405);
  let b = {}; try { b = await req.json(); } catch { return json({ error: "Datos no válidos." }, 400); }
  if (b.tipo !== "plena" || !claveOk("plena", String(b.k || ""))) return json({ error: "Este enlace no es válido o ya cambió. Pide uno nuevo por WhatsApp." }, 403);
  const email = String(b.email || "").trim().toLowerCase().slice(0, 254);
  const name = String(b.name || "").trim().slice(0, 80);
  if (!name) return json({ error: "Escribe tu nombre." }, 400);
  if (!EMAIL.test(email)) return json({ error: "Revisa tu correo: ahí te llega tu acceso." }, 400);
  if (b.acepta !== true) return json({ error: "Para continuar, acepta la política de privacidad." }, 400);
  const store = db().orders, marcas = db().marcas;
  const marca = "directo-plena-" + (await hmac(env("ADMIN_KEY") || "x", email, 24));
  // Mismo correo otra vez: no se crea otro pedido; se reenvía el enlace (o se avisa que ya tiene cuenta).
  const previo = await marcas.get(marca);
  if (previo && previo.id) {
    const rec = await store.get(previo.id);
    if (rec) {
      if (rec.userId) return json({ ok: true, yaTiene: true, email });
      const r = await correoCrearCuenta(rec, ORIGIN); await store.save(rec);
      return json({ ok: true, email, enviado: !!r.ok, crear: await enlaceCuenta(rec, ORIGIN), reenviado: true });
    }
  }
  const now = new Date().toISOString();
  const rec = { v: 2, id: "", createdAt: now, name, email, phone: String(b.phone || "").trim().slice(0, 30), items: ["todo"], cents: BUNDLE_LAUNCH, currency: CURRENCY, mode: "manual", metodo: "whatsapp-enlace", status: "pagado", paidAt: now, origin: ORIGIN, note: "Acceso por el enlace directo de WhatsApp (pago por fuera de la web).", consent: { at: now, policy: "privacidad-2026-10-30", via: "enlace-directo" } };
  await store.create(rec);
  await marcas.tomar(marca, { id: rec.id, at: Date.now() });
  const r = await avisarPagado(rec, ORIGIN);
  await store.save(rec);
  return json({ ok: true, email, enviado: !!(r && r.ok), crear: await enlaceCuenta(rec, ORIGIN) });
}

export { handler as GET, handler as POST };
