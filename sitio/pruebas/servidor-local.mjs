// Servidor local para probar TODO sin Vercel ni base de datos: páginas, app, plataforma PLENA y /api/*.
// Uso:  cd sitio && npm install && node pruebas/servidor-local.mjs   → http://localhost:3000
// Crea un pedido de prueba pagado («todo») e imprime su código de acceso.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.env.ME_STORE = process.env.ME_STORE || "memory";
process.env.ADMIN_KEY = process.env.ADMIN_KEY || "clave-local-de-prueba";
const PORT = +process.env.PORT || 3000;
process.env.PUBLIC_URL = process.env.PUBLIC_URL || `http://localhost:${PORT}`;

const { db } = await import(path.join(ROOT, "lib/store.js"));
const { accessCode } = await import(path.join(ROOT, "lib/catalog.js"));
const rec = { v: 2, id: "", createdAt: new Date().toISOString(), name: "Laura Prueba", email: "laura@example.com", items: ["todo"], cents: 1900, status: "pagado", mode: "cortesia" };
await db().orders.create(rec);
const code = await accessCode(process.env.ADMIN_KEY, rec.id);

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "application/javascript; charset=utf-8", ".css": "text/css", ".json": "application/json", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".pdf": "application/pdf", ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml" };

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const m = url.pathname.match(/^\/api\/([a-z-]+)$/);
    if (m) {
      const mod = await import(path.join(ROOT, "api", m[1] + ".js"));
      const fn = mod[req.method];
      if (!fn) { res.writeHead(405); return res.end(); }
      const body = ["GET", "HEAD"].includes(req.method) ? undefined : await new Promise((ok) => { const c = []; req.on("data", (d) => c.push(d)); req.on("end", () => ok(Buffer.concat(c))); });
      const r = await fn(new Request(url, { method: req.method, headers: req.headers, body }));
      res.writeHead(r.status, Object.fromEntries(r.headers));
      return res.end(Buffer.from(await r.arrayBuffer()));
    }
    let p = path.join(ROOT, "public", decodeURIComponent(url.pathname));
    if (!p.startsWith(path.join(ROOT, "public"))) { res.writeHead(403); return res.end(); }
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, "index.html");
    if (!fs.existsSync(p)) { res.writeHead(404); return res.end("No encontrado"); }
    res.writeHead(200, { "content-type": TYPES[path.extname(p)] || "application/octet-stream" });
    fs.createReadStream(p).pipe(res);
  } catch (e) { console.error(e); res.writeHead(500); res.end("Error"); }
}).listen(PORT, () => {
  console.log(`Servidor local en http://localhost:${PORT}`);
  console.log(`Código de acceso de prueba: ${code}`);
  console.log(`Plataforma PLENA: http://localhost:${PORT}/plena/#acceso?k=${code}`);
  console.log(`App:              http://localhost:${PORT}/#acceso?k=${code}`);
});
