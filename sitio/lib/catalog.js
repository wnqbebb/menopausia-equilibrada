// Catálogo y precios (fuente única para el servidor). Precios en centavos de USD.
// Para cambiar precios: edita aquí Y el arreglo CAT en public/oferta/index.html.
export const CURRENCY = "usd";
export const DELIVERY_DIR = "/entrega-f92e9c4d594a8499f33676e3c3fd18c8/";

// Oferta de bienvenida: «Todo junto» a precio especial solo durante una ventana corta por visitante.
// El servidor firma la hora de inicio (token) y la verifica al cobrar; fuera de la ventana se cobra el precio regular.
export const OFFER_WINDOW_MS = 15 * 60 * 1000;
// Las 2 ofertas de la página de ventas:
//   «todo»   = PLENA completa: los 13 libros + la academia PLENA + Mi diario (app) + videos, logros y certificado.
//   «libros» = Biblioteca PAUSA: solo los 13 libros en PDF (sin PLENA ni app).
export const BUNDLE_LAUNCH = 1900;          // PLENA completa, oferta de bienvenida
export const BUNDLE_REGULAR = 3700;         // PLENA completa, precio normal
export const LIBROS_LAUNCH = 1200;          // Biblioteca PAUSA, oferta de bienvenida
export const LIBROS_REGULAR = 2400;         // Biblioteca PAUSA, precio normal
export const bundleCents = (offerActive) => (offerActive ? BUNDLE_LAUNCH : BUNDLE_REGULAR);
export const librosCents = (offerActive) => (offerActive ? LIBROS_LAUNCH : LIBROS_REGULAR);
export async function makeOffer(key, issuedAt) { return `${issuedAt}.${await hmac(key, "oferta:" + issuedAt, 20)}`; }
export async function checkOffer(key, token, now = Date.now()) {
  const m = String(token || "").match(/^(\d{13})\.([0-9a-f]{20})$/);
  if (!m || !key || m[2] !== (await hmac(key, "oferta:" + m[1], 20))) return { ok: false };
  const issuedAt = +m[1], expiresAt = issuedAt + OFFER_WINDOW_MS;
  return { ok: true, issuedAt, expiresAt, active: now <= expiresAt && issuedAt <= now + 60000 };
}

// Productos por separado
export const ITEMS = {
  pausa: { name: "PAUSA · El manual de la menopausia (60 páginas)", cents: 1400, files: [["PAUSA · El manual de la menopausia (60 páginas)", "PAUSA_Libro_60_paginas.pdf"]] },
  guia: { name: "Guía Integral Menopausia Equilibrada (38 páginas)", cents: 1200, files: [["Guía Integral Menopausia Equilibrada (38 páginas)", "01_Guia_Integral_Menopausia_Equilibrada.pdf"]] },
  recetario: { name: "Recetario: 20 recetas", cents: 700, files: [["Recetario (20 recetas)", "02_Bono1_Recetario.pdf"]] },
  plan30: { name: "Plan de 30 días para recuperar energía", cents: 600, files: [["Plan de 30 días para recuperar energía", "03_Bono2_Plan_30_dias.pdf"]] },
  vitaminas: { name: "Guía de vitaminas y suplementos", cents: 500, files: [["Guía de vitaminas y suplementos", "04_Bono3_Vitaminas_y_suplementos.pdf"]] },
  diario: { name: "Diario de síntomas y progreso", cents: 400, files: [["Diario de síntomas y progreso", "05_Bono4_Diario_de_sintomas.pdf"]] },
  yoga: { name: "Yoga en calma", cents: 500, files: [["Yoga en calma", "06_Bono5_Yoga_en_calma.pdf"]] },
  aroma: { name: "Aromaterapia", cents: 400, files: [["Aromaterapia", "07_Bono6_Aromaterapia.pdf"]] },
  plantillas: { name: "3 plantillas rellenables", cents: 500, files: [["3 plantillas rellenables (consulta, rastreador 30 días, conversación)", "PAUSA_3_Plantillas_rellenables.pdf"]] },
  k1: { name: "Kit Noches frescas (sofocos e insomnio)", cents: 900, files: [["Kit Noches frescas (sofocos e insomnio)", "PAUSA_Upsell1_Noches_frescas.pdf"]] },
  k2: { name: "Kit Intimidad sin dolor", cents: 800, files: [["Kit Intimidad sin dolor", "PAUSA_Upsell2_Intimidad_sin_dolor.pdf"]] },
  k3: { name: "Kit Menopausia en el trabajo", cents: 700, files: [["Kit Menopausia en el trabajo", "PAUSA_Upsell3_Menopausia_en_el_trabajo.pdf"]] },
  k4: { name: "Kit Fuerte después de los 45", cents: 900, files: [["Kit Fuerte después de los 45", "PAUSA_Upsell4_Fuerte_despues_de_los_45.pdf"]] },
  app: { name: "App Menopausia Equilibrada (acceso de por vida)", cents: 2900, files: [], app: true },
};
export const ORDER = Object.keys(ITEMS);
export const LIBROS = ORDER.filter((k) => !ITEMS[k].app);                  // los 13 libros en PDF
export const VALUE_CENTS = ORDER.reduce((a, k) => a + ITEMS[k].cents, 0); // valor si se compra todo por separado
export const LIBROS_VALUE_CENTS = LIBROS.reduce((a, k) => a + ITEMS[k].cents, 0);

export function cleanItems(list) {
  const ids = Array.isArray(list) ? list.filter((k) => k === "todo" || k === "libros" || ITEMS[k]) : [];
  const set = [...new Set(ids)];
  if (set.includes("todo")) return ["todo"];
  if (set.includes("libros")) return set.includes("app") ? ["todo"] : ["libros"];
  return ORDER.filter((k) => set.includes(k));
}

// Devuelve { items, cents, lines, upgraded } — si la suma por separado iguala o supera «Todo junto», cobra «Todo junto».
export function quote(items, { upgradeFromCents = 0, offerActive = false } = {}) {
  const b = upgradeFromCents ? BUNDLE_LAUNCH : bundleCents(offerActive);
  if (items.includes("todo")) {
    const cents = upgradeFromCents ? Math.max(500, b - upgradeFromCents) : b;
    return { items: ["todo"], cents, lines: [{ name: upgradeFromCents ? "Completa tu pack: PLENA y todo lo que te falta" : "PLENA completa · 13 libros + academia PLENA + Mi diario (app)", cents }], upgraded: false };
  }
  if (items.includes("libros")) {
    const cents = librosCents(offerActive);
    return { items: ["libros"], cents, lines: [{ name: "Biblioteca PAUSA · 13 libros (PAUSA, Guía Integral, 6 bonos, 3 plantillas y 4 kits)", cents }], upgraded: false };
  }
  const sum = items.reduce((a, k) => a + ITEMS[k].cents, 0);
  if (!upgradeFromCents && sum >= b) return { ...quote(["todo"], { offerActive }), upgraded: true };
  return { items, cents: sum, lines: items.map((k) => ({ name: ITEMS[k].name, cents: ITEMS[k].cents })), upgraded: false };
}

export function hasApp(items) { return items.includes("todo") || items.includes("app"); }
export const esLibros = (items) => items.includes("libros");

// FILES_BASE (opcional): otra carpeta o CDN para los PDF. Vacía = se sirven desde el propio sitio (Vercel)
// (https://github.com/USUARIO/REPO/releases/download/v1/). Así las descargas no gastan el ancho de banda del hosting.
export function filesFor(items, filesBase = "") {
  const base = String(filesBase || "").trim() ? String(filesBase).trim().replace(/\/?$/, "/") : DELIVERY_DIR;
  const keys = items.includes("todo") ? ORDER : items.includes("libros") ? LIBROS : items;
  const out = [];
  keys.forEach((k) => (ITEMS[k]?.files || []).forEach(([t, f]) => out.push({ item: k, title: t, url: base + f })));
  return out;
}

// Identificador de pedido: 14 caracteres hex que empiezan por la hora (orden cronológico al listar).
export function newId() {
  const r = crypto.getRandomValues(new Uint8Array(2));
  return (Date.now().toString(16).padStart(11, "0") + [...r].map((b) => b.toString(16).padStart(2, "0")).join("")).slice(0, 14);
}

export function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" },
  });
}

export async function hmac(key, msg, len = 32) {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(msg));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, len);
}

export const envGet = (k) => (typeof process !== "undefined" && process.env ? process.env[k] : "") || "";

// Código de acceso a la app: <id del pedido>-<firma>. Se valida en /api/acceso.
export async function accessCode(key, id) { return `${id}-${await hmac(key, "app:" + id, 10)}`; }

// Pedidos antiguos (versión 1: pack + kits) → artículos de la versión 2
export function itemsOf(rec) {
  if (Array.isArray(rec.items)) return rec.items;
  if (rec.pack) return ["todo"];
  return Array.isArray(rec.kits) ? rec.kits : [];
}
