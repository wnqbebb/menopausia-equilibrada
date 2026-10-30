// Prueba de punta a punta de las cuentas de PLENA, con el servidor local, el doble de Supabase en memoria
// y los correos simulados. Necesita Playwright con Chromium:
//   cd sitio && npm install && npm i --no-save playwright && npx playwright install chromium
//   node pruebas/e2e-cuentas.mjs            (capturas en pruebas/capturas/, o la carpeta que indiques: node … <carpeta>)
// Recorre: compra pagada → crear cuenta → correo de bienvenida (sin contraseña) → celular (390 px): bienvenida,
// primera insignia, recorrido, progreso, diario y foto → PC (1366 px) con la misma cuenta: mismo progreso, diario y foto →
// cerrar sesión → recuperar contraseña → pedido revocado no entra → enlace antiguo con código → / lleva a /plena/ →
// sin pack ve la mejora → borrar la cuenta → revisión responsive. Falla si hay errores en la consola o «pageerror».
import { createRequire } from "node:module";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const DIR = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(process.argv[2] || path.join(DIR, "capturas"));
fs.mkdirSync(OUT, { recursive: true });
process.env.PORT = process.env.PORT || "3322";
const { server, prueba } = await import("./servidor-local.mjs");
await new Promise((ok) => server.listen(+process.env.PORT, ok));
const BASE = prueba.origin, KEY = process.env.ADMIN_KEY;

let fallos = 0;
const ok = (n, c, extra = "") => { console.log((c ? "PASS " : "FAIL ") + n + (extra ? " · " + extra : "")); if (!c) fallos++; };
const errores = [], PAGINAS = [];
// Respuestas de error que la prueba provoca a propósito (contraseña equivocada, cuenta revocada…): el navegador
// siempre anota en la consola un «Failed to load resource» para cualquier 4xx; esas no cuentan como fallo.
let esperado = null;
const espera = async (re, fn) => { esperado = re; try { return await fn(); } finally { await new Promise((r) => setTimeout(r, 300)); esperado = null; } };
const sig = (id) => crypto.createHmac("sha256", KEY).update(id).digest("hex").slice(0, 32);
const code = (id) => id + "-" + crypto.createHmac("sha256", KEY).update("app:" + id).digest("hex").slice(0, 10);
const admin = (body) => fetch(BASE + "/api/pedidos", { method: body ? "POST" : "GET", headers: { "x-admin-key": KEY, "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined }).then((r) => r.json());
const correos = () => fetch(BASE + "/__test/correos").then((r) => r.json());
async function pedido(items, email, name = "Marta Gómez") {
  const r = await fetch(BASE + "/api/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, email, items, acepta: true }) }).then((r) => r.json());
  await admin({ action: "pagado", id: r.id });
  return r.id;
}

const browser = await chromium.launch();
async function dispositivo(nombre, viewport, mobile) {
  const ctx = await browser.newContext({ viewport, isMobile: !!mobile, hasTouch: !!mobile, deviceScaleFactor: 1, serviceWorkers: "block" });
  // Sin internet en las pruebas: lo externo (fuentes, miniaturas de YouTube) se responde vacío para no ensuciar la consola.
  await ctx.route((u) => !u.href.startsWith(BASE), (route) => route.fulfill({ status: 200, contentType: route.request().resourceType() === "stylesheet" ? "text/css" : "text/plain", body: "" }));
  const p = await ctx.newPage(); PAGINAS.push([nombre, p]);
  p.on("pageerror", (e) => errores.push(nombre + " pageerror: " + e.message));
  p.on("console", (m) => { if (m.type() !== "error") return; const u = m.location().url || ""; if (esperado && /Failed to load resource/.test(m.text()) && esperado.test(u)) return; errores.push(nombre + " consola: " + m.text() + " @ " + u); });
  p.on("dialog", (d) => d.accept());
  return { ctx, p };
}
const shot = (p, n) => p.screenshot({ path: path.join(OUT, n + ".png"), fullPage: false });
async function cerrarCelebraciones(p) { for (let i = 0; i < 8; i++) { const b = p.locator(".cel [data-act=cerrarCel]").first(); if (await b.count()) { await b.click(); await p.waitForTimeout(400); } else break; } }
// Primera vez en el diario: salta la guía, autoriza la copia cifrada (consentimiento expreso) y empieza.
async function diarioEmpezar(fr) { await fr.locator("[data-act=gSkip]").click(); await fr.locator("#cloudOk").check(); await fr.locator("[data-act=welcomeOk]").click(); }
async function sinDesborde(p, nombre) {
  const r = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, w: innerWidth }));
  ok(`${nombre}: sin desborde horizontal`, r.sw <= r.w + 1, `${r.sw} ≤ ${r.w}`);
}

const EMAIL = "marta@example.com", PASS = "Lunas-de-marzo-24", PASS2 = "Nuevo-camino-2026", PASS3 = "Tercera-vez-2026";
async function recuperar(pg, pass) {
  await pg.goto(BASE + "/plena/"); await pg.waitForSelector("#lgF");
  await pg.click("[data-act=authV][data-v=olvido]"); await pg.fill("#rcE", EMAIL); await pg.click("#rcF button"); await pg.waitForSelector("#rcOk:not([hidden])");
  const link = (await correos()).auth.filter((c) => c.to === EMAIL).pop();
  await pg.goto(link.link); await pg.waitForSelector("#ncF", { timeout: 10000 });
  await pg.fill("#ncP", pass); await pg.fill("#ncR", pass); await pg.click("#ncF button.btn-p");
  await pg.waitForSelector("#main .view, [data-act=obNext]", { timeout: 15000 }); await pg.waitForTimeout(800);
}
try {
  // ---------- 1. Compra pagada → crear la cuenta (celular) ----------
  const id = await pedido(["todo"], EMAIL);
  const cel = await dispositivo("celular", { width: 390, height: 844 }, true);
  let p = cel.p;
  await p.goto(`${BASE}/oferta/gracias.html?pedido=${id}&t=${sig(id)}#cuenta`);
  await p.waitForSelector("#cuenta:not([hidden])");
  ok("gracias: muestra «Crea tu cuenta de PLENA»", await p.isVisible("#acF"));
  ok("gracias: correo prellenado y bloqueado", (await p.inputValue("#acE")) === EMAIL && (await p.getAttribute("#acE", "readonly")) !== null);
  ok("gracias: ya no muestra el código de acceso", !(await p.locator("#accCode").count()));
  await p.fill("#acP", "corta"); await p.fill("#acP2", "corta"); await p.check("#acA"); await p.click("#acB");
  ok("crear cuenta: rechaza contraseña corta", (await p.textContent("#acErr")).includes("8 caracteres"));
  await p.fill("#acP", PASS);
  ok("crear cuenta: indicador de fuerza", /fuerte/i.test(await p.textContent("#acM")));
  await p.click("[data-ver=acP]"); ok("crear cuenta: ver/ocultar contraseña", (await p.getAttribute("#acP", "type")) === "text"); await p.click("[data-ver=acP]");
  await p.fill("#acP2", PASS + "x"); await p.click("#acB");
  ok("crear cuenta: contraseñas distintas", (await p.textContent("#acErr")).includes("no coinciden"));
  await p.fill("#acP2", PASS); await shot(p, "01-crear-cuenta-390");
  await p.click("#acB");
  await p.waitForURL(/\/plena\//, { timeout: 20000 });
  ok("crear cuenta: entra sola a /plena/", true);
  const m = await correos();
  const bienv = m.correos.find((c) => c.to === EMAIL && /lista/.test(c.subject));
  ok("correo de bienvenida generado", !!bienv);
  ok("correo de bienvenida sin la contraseña", bienv && !bienv.html.includes(PASS) && !bienv.text.includes(PASS));
  ok("correo de bienvenida con usuario y botón", bienv && bienv.html.includes(EMAIL) && bienv.html.includes("/plena/") && bienv.html.includes("plena-correo.png"));
  fs.writeFileSync(path.join(OUT, "correo-bienvenida.html"), bienv ? bienv.html : "");
  const otra = await fetch(BASE + "/api/cuenta", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ pedido: id, t: sig(id), password: "OtraClave123", acepta: true, clave: { v: 1, kid: "abcdefgh12", salt: "AA==", iter: 310000, iv: "AA==", ct: "AA==" } }) });
  ok("el mismo pedido no crea una segunda cuenta", otra.status === 409);

  // ---------- 2. Bienvenida de 4 pasos → primera insignia → recorrido ----------
  await p.waitForSelector("[data-act=obNext]", { timeout: 15000 }); await shot(p, "02-bienvenida-390");
  await p.click("[data-act=obNext]");
  await p.fill("#pfN", "Marta"); await p.click("#pf button[type=submit]");
  await p.click("label.opt:has(input[value=peri])"); await p.click("#pf button[type=submit]");
  await p.click("label.opt:has(input[value=sofocos])"); await p.click("label.opt:has(input[value=sueno])"); await p.click("#pf button[type=submit]");
  await p.waitForSelector(".cel", { timeout: 10000 });
  ok("primera insignia antes del recorrido", (await p.textContent(".cel")).includes("Hola, PLENA") && !(await p.locator(".tour").count()));
  await cerrarCelebraciones(p);
  await p.waitForSelector(".tour", { timeout: 8000 });
  ok("recorrido guiado después de la insignia", true);
  await p.click(".tour [data-act=tourSkip]"); await p.waitForTimeout(600); await cerrarCelebraciones(p);
  await shot(p, "03-inicio-390");

  // ---------- 3. Progreso: pregunta rápida de una lección ----------
  await p.goto(BASE + "/plena/#l/m0/m0-1"); await p.waitForSelector("[data-act=quiz]");
  await p.click("[data-act=quiz][data-i='0']"); await p.waitForTimeout(1500); await cerrarCelebraciones(p);
  const xpCel = await p.textContent("#me .xpchip .tx");

  // ---------- 4. Mi diario integrado (sin bloqueo propio) + copia cifrada ----------
  await p.goto(BASE + "/plena/#diario/hoy"); await p.waitForSelector("#appf");
  const fr = p.frameLocator("#appf");
  await fr.locator("#view").waitFor();
  ok("diario: sin pantalla de bloqueo propia", !(await fr.locator("#lock").count()));
  ok("diario: sin tarjeta «Incluida en tu pack»", !(await fr.locator(".plena-cta").count()));
  await diarioEmpezar(fr);
  await fr.locator("[data-act=flPlus]").click(); await fr.locator("[data-act=flPlus]").click(); await fr.locator("[data-act=flPlus]").click();
  await p.waitForTimeout(3000);
  const tok = await p.evaluate(() => PlenaCuenta.token());
  const sync = await fetch(BASE + "/api/sync", { headers: { authorization: "Bearer " + tok } }).then((r) => r.json());
  ok("diario: copia en la nube cifrada (sin datos legibles)", sync.data && sync.data.enc === "aes-gcm" && !JSON.stringify(sync.data).includes("flashes"));

  // ---------- 5. Foto de perfil ----------
  await p.goto(BASE + "/plena/#perfil"); await p.waitForSelector("#fIn", { state: "attached" });
  const png = await p.evaluate(() => { const c = document.createElement("canvas"); c.width = 900; c.height = 600; const g = c.getContext("2d"); g.fillStyle = "#FF1A5D"; g.fillRect(0, 0, 900, 600); g.fillStyle = "#fff"; g.beginPath(); g.arc(450, 300, 200, 0, 7); g.fill(); return c.toDataURL("image/png").split(",")[1]; });
  await p.setInputFiles("#fIn", { name: "yo.png", mimeType: "image/png", buffer: Buffer.from(png, "base64") });
  await p.waitForSelector("#fNueva:not([hidden])"); await p.click("[data-act=fotoGuardar]");
  await p.waitForSelector("#me .ava.ph img", { timeout: 10000 });
  ok("foto: aparece en la cabecera", true);
  const dim = await p.evaluate(() => new Promise((ok) => { const i = new Image(); i.onload = () => ok([i.naturalWidth, i.naturalHeight]); i.onerror = () => ok([0, 0]); i.src = document.querySelector("#fPrev img").src; }));
  ok("foto: recortada a 512×512", dim[0] === 512 && dim[1] === 512, dim.join("×"));
  await shot(p, "04-perfil-foto-390");
  await sinDesborde(p, "perfil 390");

  // ---------- 6. PC (1366 px) con la misma cuenta ----------
  const pc = await dispositivo("pc", { width: 1366, height: 900 });
  let q = pc.p;
  await q.goto(BASE + "/plena/"); await q.waitForSelector("#lgF"); await shot(q, "05-login-1366");
  await espera(/auth\/v1\/token/, async () => { await q.fill("#lgE", EMAIL); await q.fill("#lgP", "malamala1"); await q.click("#lgB"); await q.waitForSelector("#lgErr:not([hidden])"); });
  ok("login: error claro sin revelar si el correo existe", (await q.textContent("#lgErr")).includes("Correo o contraseña incorrectos"));
  await q.fill("#lgP", PASS); await q.click("#lgB");
  await q.waitForSelector("#me .xpchip", { timeout: 15000 });
  await q.waitForTimeout(800); await cerrarCelebraciones(q);
  ok("PC: no repite la bienvenida (perfil recuperado)", !(await q.locator("[data-act=obNext]").count()) && !(await q.locator("#pf[data-step]").count()));
  ok("PC: mismo progreso (XP)", (await q.textContent("#me .xpchip .tx")) === xpCel, xpCel);
  ok("PC: misma foto en la cabecera", await q.locator("#me .ava.ph img").count() === 1);
  ok("PC: no repite el recorrido", !(await q.locator(".tour").count()));
  await q.goto(BASE + "/plena/#diario/hoy"); const fq = q.frameLocator("#appf"); await fq.locator("#view").waitFor();
  await diarioEmpezar(fq); await q.waitForTimeout(2500);
  ok("PC: el diario recupera los registros del celular", (await fq.locator("#flOut").textContent()) === "3");
  await shot(q, "06-diario-1366");
  await q.goto(BASE + "/plena/#perfil"); await q.waitForSelector("#cuentaP"); await shot(q, "07-perfil-1366"); await sinDesborde(q, "perfil 1366");

  // ---------- 7. Cerrar sesión y recuperar la contraseña ----------
  await q.click("[data-act=salir]"); await q.waitForSelector("#lgF");
  ok("cerrar sesión: vuelve a iniciar sesión", true);
  await q.click("[data-act=authV][data-v=olvido]"); await q.fill("#rcE", EMAIL); await q.click("#rcF button"); await q.waitForSelector("#rcOk:not([hidden])");
  await shot(q, "08-recuperar-1366");
  const link = (await correos()).auth.filter((c) => c.to === EMAIL).pop();
  ok("recuperar: se envía el enlace", !!link);
  await q.goto(link.link); await q.waitForSelector("#ncF", { timeout: 10000 });
  ok("recuperar: abre /plena/#nueva-clave", q.url().endsWith("/plena/#nueva-clave"));
  await shot(q, "09-nueva-clave-1366");
  await q.fill("#ncP", PASS2); await q.fill("#ncR", PASS2); await q.click("#ncF button.btn-p");
  await q.waitForSelector("#me .xpchip", { timeout: 15000 }); await q.waitForTimeout(600);
  ok("recuperar: entra con la nueva contraseña", true);
  await q.click(".modal [data-act=cerrarModal] >> nth=-1").catch(() => {});
  await q.goto(BASE + "/plena/#diario/hoy"); await q.frameLocator("#appf").locator("#view").waitFor(); await q.waitForTimeout(2000);
  ok("recuperar: el diario sigue abriéndose (clave re-envuelta)", (await q.frameLocator("#appf").locator("#flOut").textContent()) === "3");
  const viejo = await fetch(BASE + "/__supa/auth/v1/token?grant_type=password", { method: "POST", headers: { apikey: "anon-local-de-prueba", "content-type": "application/json" }, body: JSON.stringify({ email: EMAIL, password: PASS }) });
  ok("recuperar: la contraseña anterior ya no sirve", viejo.status === 400);
  // El celular tenía la sesión anterior: al recuperar se cierran las otras sesiones.
  await new Promise((r) => setTimeout(r, 21000)); // el servidor recuerda una sesión válida hasta 20 s
  await espera(/\/api\/|auth\/v1\//, async () => { await p.goto(BASE + "/plena/#inicio"); await p.reload(); await p.waitForSelector("#lgF", { timeout: 15000 }); });
  ok("recuperar: cierra la sesión en el otro dispositivo", true);
  await p.fill("#lgE", EMAIL); await p.fill("#lgP", PASS2); await p.click("#lgB"); await p.waitForSelector("#me .xpchip", { timeout: 15000 });
  await p.goto(BASE + "/plena/#diario/hoy"); await p.frameLocator("#appf").locator("#view").waitFor(); await p.waitForTimeout(1500);
  ok("celular: entra con la nueva contraseña y abre su diario", (await p.frameLocator("#appf").locator("#flOut").textContent()) === "3");

  // ---------- 7b. Recuperar en un dispositivo NUEVO (sin la clave del diario): clave nueva y aviso claro ----------
  const nuevo = await dispositivo("nuevo", { width: 390, height: 844 }, true);
  await recuperar(nuevo.p, PASS3);
  ok("dispositivo nuevo: avisa que la copia del diario se reemplazó", (await nuevo.p.textContent("body")).includes("se reemplazó"));
  await new Promise((r) => setTimeout(r, 21000));
  await espera(/\/api\/|auth\/v1\//, async () => { await p.goto(BASE + "/plena/#diario/hoy"); await p.reload(); await p.waitForSelector("#lgF", { timeout: 15000 }); });
  await p.fill("#lgE", EMAIL); await p.fill("#lgP", PASS3); await p.click("#lgB"); await p.waitForSelector("#me .xpchip", { timeout: 15000 });
  await p.goto(BASE + "/plena/#diario/hoy"); await p.frameLocator("#appf").locator("#view").waitFor(); await p.waitForTimeout(2500);
  ok("celular: con la clave nueva sigue su diario y lo vuelve a subir", (await p.frameLocator("#appf").locator("#flOut").textContent()) === "3");
  const tk3 = await p.evaluate(() => PlenaCuenta.token());
  const s3 = await fetch(BASE + "/api/sync", { headers: { authorization: "Bearer " + tk3 } }).then((r) => r.json());
  const kidNuevo = await p.evaluate(() => PlenaCuenta.claveDatos().then((d) => d.kid));
  ok("la copia de la nube usa la clave nueva", s3.data && s3.data.kid === kidNuevo);

  // ---------- 8. Pedido revocado no entra ----------
  await admin({ action: "revocar", id });
  await espera(/\/api\/|auth\/v1\//, async () => { await q.click("[data-act=salir]").catch(() => {}); await q.goto(BASE + "/plena/"); await q.waitForSelector("#lgF"); });
  await espera(/auth\/v1\/token/, async () => { await q.fill("#lgE", EMAIL); await q.fill("#lgP", PASS3); await q.click("#lgB"); await q.waitForSelector("#lgErr:not([hidden])"); });
  ok("revocado: no puede iniciar sesión", (await q.textContent("#lgErr")).includes("no está activo"));
  const tokCel = await p.evaluate(() => PlenaCuenta.token());
  await new Promise((r) => setTimeout(r, 21000)); // caché de sesión del servidor (20 s)
  const cursoRev = await fetch(BASE + "/api/curso", { headers: { authorization: "Bearer " + tokCel } });
  ok("revocado: la sesión abierta ya no recibe el curso", cursoRev.status === 403);
  const lista = await admin();
  ok("panel: muestra «creada» y revocada", lista.pedidos.some((x) => x.id === id && x.cuenta === "creada" && x.revoked));
  await admin({ action: "reactivar", id });

  // ---------- 9. Enlace antiguo con código → crear cuenta (una sola vez) ----------
  const id2 = await pedido(["todo"], "ana@example.com", "Ana Ruiz");
  const v = await dispositivo("codigo", { width: 390, height: 844 }, true);
  await v.p.goto(`${BASE}/plena/#acceso?k=${code(id2)}`);
  await v.p.waitForSelector("#acF", { timeout: 10000 });
  ok("código antiguo: lleva a «Crea tu cuenta»", v.p.url().includes("gracias.html?k="));
  await v.p.fill("#acP", "Ana-segura-2026"); await v.p.fill("#acP2", "Ana-segura-2026"); await v.p.check("#acA"); await v.p.click("#acB");
  await v.p.waitForURL(/\/plena\//, { timeout: 20000 });
  ok("código antiguo: cuenta creada y dentro", true);
  await v.p.goto(`${BASE}/oferta/gracias.html?k=${code(id2)}`); await v.p.waitForSelector("#acHas:not([hidden])");
  ok("código antiguo: después ya no sirve (solo indica iniciar sesión)", !(await v.p.locator("#files a").count()) && (await v.p.textContent("#acHas")).includes("ya está creada"));

  // ---------- 10. / lleva a /plena/ ----------
  await v.p.goto(BASE + "/"); ok("/ redirige a /plena/", new URL(v.p.url()).pathname === "/plena/");
  await v.p.goto(BASE + "/#hoy"); ok("/#hoy redirige a /plena/", new URL(v.p.url()).pathname === "/plena/");

  // ---------- 11. Sin pack completo → pantalla de mejora ----------
  // Pedido antiguo de «app» suelta (hoy ya no se vende: 29 USD > 19 USD, se cobra el pack completo).
  const { db } = await import("../lib/store.js");
  const appSuelta = { v: 2, id: "", createdAt: new Date().toISOString(), name: "Lucía", email: "lucia@example.com", items: ["app"], cents: 2900, status: "pagado", mode: "cortesia" };
  await db().orders.create(appSuelta); const id3 = appSuelta.id;
  const w = await dispositivo("sinpack", { width: 768, height: 1024 }, true);
  await w.p.goto(`${BASE}/oferta/gracias.html?pedido=${id3}&t=${sig(id3)}`); await w.p.waitForSelector("#acF");
  await w.p.fill("#acP", "Lucia-clave-77"); await w.p.fill("#acP2", "Lucia-clave-77"); await w.p.check("#acA"); await w.p.click("#acB");
  await espera(/\/api\/curso/, async () => { await w.p.waitForURL(/\/plena\//, { timeout: 20000 }); await w.p.waitForSelector("text=pack completo", { timeout: 10000 }); });
  ok("sin pack: ve la pantalla de mejora", (await w.p.textContent("#main")).includes("PLENA está en el"));
  await shot(w.p, "10-mejora-768");

  // ---------- 12. Regalar acceso desde el panel ----------
  const reg = await admin({ action: "cortesia", name: "Regalo", email: "regalo@example.com" });
  ok("panel: regalar acceso crea el pedido y envía el enlace", reg.ok && reg.enviado && (await correos()).correos.some((c) => c.to === "regalo@example.com" && /Crea tu cuenta/.test(c.subject)));

  // ---------- 13. Borrar la cuenta ----------
  // Al revocar se cerró su sesión; tras reactivar vuelve a entrar.
  await espera(/\/api\/|auth\/v1\//, async () => { await p.goto(BASE + "/plena/#perfil"); await p.reload(); await p.waitForSelector("#lgF"); });
  ok("revocado: también cerró la sesión abierta del celular", true);
  await p.fill("#lgE", EMAIL); await p.fill("#lgP", PASS3); await p.click("#lgB"); await p.waitForSelector("#me .xpchip", { timeout: 15000 });
  ok("reactivado: vuelve a entrar", true);
  await p.goto(BASE + "/plena/#perfil"); await p.waitForSelector("#dlF", { state: "attached" });
  await p.click("details.danger summary"); await espera(/\/api\/cuenta/, async () => { await p.fill("#dlP", "equivocada1"); await p.click("#dlF .btn-danger"); await p.waitForSelector("#dlErr:not([hidden])"); });
  ok("borrar cuenta: pide la contraseña correcta", (await p.textContent("#dlErr")).includes("no es correcta"));
  await p.fill("#dlP", PASS3); await p.click("#dlF .btn-danger"); await p.waitForSelector("text=Hasta pronto", { timeout: 15000 });
  const tras = await fetch(BASE + "/__supa/auth/v1/token?grant_type=password", { method: "POST", headers: { apikey: "anon-local-de-prueba", "content-type": "application/json" }, body: JSON.stringify({ email: EMAIL, password: PASS3 }) });
  ok("borrar cuenta: ya no existe", tras.status === 400);
  ok("panel: el pedido queda «borrada»", (await admin()).pedidos.some((x) => x.id === id && x.cuenta === "borrada"));

  // ---------- 14. Responsive: login, crear cuenta, recuperar, perfil con foto y cabecera ----------
  const id4 = await pedido(["todo"], "rosa@example.com", "Rosa Díaz");
  const R = await dispositivo("responsive", { width: 390, height: 844 }, true);
  const rp = R.p;
  await rp.goto(`${BASE}/oferta/gracias.html?pedido=${id4}&t=${sig(id4)}`); await rp.waitForSelector("#acF");
  await rp.fill("#acP", "Rosa-clave-2026"); await rp.fill("#acP2", "Rosa-clave-2026"); await rp.check("#acA"); await rp.click("#acB");
  await rp.waitForURL(/\/plena\//, { timeout: 20000 }); await rp.waitForSelector("[data-act=obNext]");
  await rp.click("[data-act=obNext]"); await rp.click("#pf button[type=submit]"); await rp.click("label.opt:has(input[value=post])"); await rp.click("#pf button[type=submit]"); await rp.click("label.opt:has(input[value=mente])"); await rp.click("#pf button[type=submit]");
  await rp.waitForSelector(".cel"); await cerrarCelebraciones(rp); await rp.waitForSelector(".tour"); await rp.click(".tour [data-act=tourSkip]"); await rp.waitForTimeout(500); await cerrarCelebraciones(rp);
  await rp.goto(BASE + "/plena/#perfil"); await rp.waitForSelector("#fIn", { state: "attached" });
  await rp.setInputFiles("#fIn", { name: "yo.png", mimeType: "image/png", buffer: Buffer.from(png, "base64") }); await rp.waitForSelector("#fNueva:not([hidden])"); await rp.click("[data-act=fotoGuardar]"); await rp.waitForSelector("#me .ava.ph img");
  const sizes = [[360, 740], [390, 844], [768, 1024], [1024, 768], [1366, 900], [1920, 1080], [740, 360], [844, 390]];
  for (const [W, H] of sizes) {
    await rp.setViewportSize({ width: W, height: H });
    await rp.goto(BASE + "/plena/#perfil"); await rp.waitForSelector("#cuentaP"); await rp.waitForTimeout(300);
    await sinDesborde(rp, `perfil ${W}×${H}`);
    const hdr = await rp.evaluate(() => { const a = document.querySelector("#me .ava"), r = a.getBoundingClientRect(); return r.right <= innerWidth && r.width >= 30 && r.left >= 0; });
    ok(`cabecera con foto visible ${W}×${H}`, hdr);
    await shot(rp, `r-perfil-${W}x${H}`);
  }
  const L = await dispositivo("responsive-login", { width: 360, height: 740 }, true);
  for (const [W, H] of sizes) {
    await L.p.setViewportSize({ width: W, height: H });
    await L.p.goto(BASE + "/plena/"); await L.p.waitForSelector("#lgF"); await sinDesborde(L.p, `login ${W}×${H}`); await shot(L.p, `r-login-${W}x${H}`);
    // Teclado del celular: el campo enfocado sigue visible al reducirse la pantalla.
    if (W < 900) {
      await L.p.setViewportSize({ width: W, height: Math.round(H * 0.55) }); await L.p.focus("#lgP"); await L.p.waitForTimeout(400);
      const vis = await L.p.evaluate(() => { const r = document.querySelector("#lgP").getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; });
      ok(`login con teclado ${W}px: el campo se ve`, vis);
    }
    await L.p.click("[data-act=authV][data-v=olvido]"); await sinDesborde(L.p, `recuperar ${W}×${H}`); await shot(L.p, `r-recuperar-${W}x${H}`);
    await L.p.goto(`${BASE}/oferta/gracias.html?pedido=${id2}&t=${sig(id2)}`); await L.p.waitForSelector("#cuenta:not([hidden])"); await sinDesborde(L.p, `gracias ${W}×${H}`);
  }
  const id5 = await pedido(["todo"], "eva@example.com", "Eva");
  for (const [W, H] of sizes) {
    await L.p.setViewportSize({ width: W, height: H });
    await L.p.goto(`${BASE}/oferta/gracias.html?pedido=${id5}&t=${sig(id5)}#cuenta`); await L.p.waitForSelector("#acF"); await L.p.waitForTimeout(400);
    await sinDesborde(L.p, `crear cuenta ${W}×${H}`); await L.p.locator("#cuenta").screenshot({ path: path.join(OUT, `r-crear-${W}x${H}.png`) });
  }
} catch (e) {
  console.error(e); fallos++;
  for (const [n, pg] of PAGINAS) { try { await pg.screenshot({ path: path.join(OUT, "error-" + n + ".png") }); console.error("  [" + n + "] " + pg.url() + " · " + ((await pg.textContent("#main").catch(() => "")) || "").replace(/\s+/g, " ").slice(0, 300)); } catch {} }
} finally {
  const err = errores.filter((e) => !/favicon/.test(e));
  ok("sin errores en la consola ni pageerror", err.length === 0, err.slice(0, 8).join("\n   "));
  await browser.close(); server.close();
  console.log(fallos ? `\n${fallos} prueba(s) fallaron.` : "\nTodas las pruebas pasaron."); console.log("Capturas: " + OUT);
  process.exit(fallos ? 1 : 0);
}
