// Servidor local para probar TODO sin Vercel: páginas, PLENA, cuentas y /api/*.
// Uso:  cd sitio && npm install && node pruebas/servidor-local.mjs   → http://localhost:3000
// - Sin SUPABASE_URL usa un doble de Supabase en memoria (pruebas/supabase-falso.mjs) y no envía correos de verdad:
//   los correos quedan en http://localhost:3000/__test/correos.
// - Con SUPABASE_URL, SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY usa tu proyecto real de Supabase.
// - Aplica las redirecciones y cabeceras (incluida la CSP) de vercel.json, como en Vercel.
// Crea un pedido de prueba pagado («todo») e imprime su enlace para crear la cuenta.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { crearSupabaseFalso, ANON, SERVICE } from "./supabase-falso.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = +process.env.PORT || 3000;
const ORIGIN = `http://localhost:${PORT}`;
process.env.ME_STORE = process.env.ME_STORE || "memory";
process.env.ADMIN_KEY = process.env.ADMIN_KEY || "clave-local-de-prueba";
process.env.PUBLIC_URL = process.env.PUBLIC_URL || ORIGIN;
let falso = null;
if (!process.env.SUPABASE_URL) {
  falso = crearSupabaseFalso({ prefijo: "/__supa", origen: ORIGIN });
  Object.assign(process.env, { SUPABASE_URL: ORIGIN + "/__supa", SUPABASE_ANON_KEY: ANON, SUPABASE_SERVICE_ROLE_KEY: SERVICE });
  process.env.ME_MAIL = process.env.ME_MAIL || "memory";
}

const { db } = await import(path.join(ROOT, "lib/store.js"));
const { hmac } = await import(path.join(ROOT, "lib/catalog.js"));
const rec = { v: 2, id: "", createdAt: new Date().toISOString(), name: "Laura Prueba", email: "laura@example.com", items: ["todo"], cents: 1900, status: "pagado", mode: "cortesia", origin: ORIGIN };
await db().orders.create(rec);
const crear = `${ORIGIN}/oferta/gracias.html?pedido=${rec.id}&t=${await hmac(process.env.ADMIN_KEY, rec.id)}`;

// vercel.json: redirecciones y cabeceras (subconjunto: rutas fijas y «(.*)»; condición «missing» de query)
const VJ = JSON.parse(fs.readFileSync(path.join(ROOT, "vercel.json"), "utf8"));
const re = (src) => new RegExp("^" + src.replace(/[.+?^${}|[\]\\]/g, "\\$&").replace(/\\\(\.\*\\\)|\(\.\*\)/g, ".*") + "$");
function redireccion(url) {
  for (const r of VJ.redirects || []) {
    if (!re(r.source).test(url.pathname)) continue;
    if ((r.missing || []).some((c) => c.type === "query" && url.searchParams.has(c.key))) continue;
    return r.destination;
  }
  return null;
}
function cabeceras(url) {
  const out = {};
  for (const h of VJ.headers || []) if (re(h.source).test(url.pathname)) for (const x of h.headers) out[x.key.toLowerCase()] = x.value;
  return out;
}

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "application/javascript; charset=utf-8", ".css": "text/css", ".json": "application/json", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".pdf": "application/pdf", ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".woff2": "font/woff2" };

export const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, ORIGIN);
    if (falso && (await falso.http(req, res, url))) return;
    if (url.pathname === "/__test/correos") {
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify({ correos: globalThis.__meCorreos || [], auth: falso ? falso.correos : [] }));
    }
    const m = url.pathname.match(/^\/api\/([a-z-]+)$/);
    if (m) {
      const file = path.join(ROOT, "api", m[1] + ".js");
      if (!fs.existsSync(file)) { res.writeHead(404); return res.end(); }
      const mod = await import(file);
      const fn = mod[req.method];
      if (!fn) { res.writeHead(405); return res.end(); }
      const body = ["GET", "HEAD"].includes(req.method) ? undefined : await new Promise((ok) => { const c = []; req.on("data", (d) => c.push(d)); req.on("end", () => ok(Buffer.concat(c))); });
      const r = await fn(new Request(url, { method: req.method, headers: req.headers, body }));
      res.writeHead(r.status, Object.fromEntries(r.headers));
      return res.end(Buffer.from(await r.arrayBuffer()));
    }
    const dest = redireccion(url);
    if (dest) { res.writeHead(308, { location: dest }); return res.end(); }
    let p = path.join(ROOT, "public", decodeURIComponent(url.pathname));
    if (!p.startsWith(path.join(ROOT, "public"))) { res.writeHead(403); return res.end(); }
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, "index.html");
    if (!fs.existsSync(p)) { res.writeHead(404); return res.end("No encontrado"); }
    res.writeHead(200, { "content-type": TYPES[path.extname(p)] || "application/octet-stream", ...cabeceras(url) });
    fs.createReadStream(p).pipe(res);
  } catch (e) { console.error(e); res.writeHead(500); res.end("Error"); }
});

export const prueba = { pedido: rec, crear, origin: ORIGIN };
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  server.listen(PORT, () => {
    console.log(`Servidor local en ${ORIGIN}  (Supabase: ${falso ? "doble en memoria" : process.env.SUPABASE_URL})`);
    console.log(`Crear la cuenta del pedido de prueba: ${crear}`);
    console.log(`PLENA: ${ORIGIN}/plena/`);
    console.log(`Panel: ${ORIGIN}/oferta/admin.html  (clave: ${process.env.ADMIN_KEY})`);
    if (falso) console.log(`Correos enviados (simulados): ${ORIGIN}/__test/correos`);
  });
}
