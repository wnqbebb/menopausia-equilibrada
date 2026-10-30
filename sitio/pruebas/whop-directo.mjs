// Pruebas de las ventas que no pasan por la página web: compras hechas directamente en Whop (webhook sin pedido)
// y ventas manuales del panel (WhatsApp o pago local). Base de datos y correos en memoria.
// Uso: cd sitio && npm run prueba-whop
import crypto from "node:crypto";
process.env.ME_STORE = "memory"; process.env.ME_MAIL = "memory";
process.env.ADMIN_KEY = "clave-prueba"; process.env.PUBLIC_URL = "https://ejemplo.test";
process.env.WHOP_WEBHOOK_SECRET = "ws_secretodeprueba"; process.env.WHOP_PRODUCT_ID = "prod_PLENA";
delete process.env.WHOP_API_KEY;
const hook = (await import("../api/whop-webhook.js")).POST;
const panel = await import("../api/pedidos.js");
const { db } = await import("../lib/store.js");
let fallos = 0;
const ok = (n, c, x = "") => { console.log((c ? "PASS " : "FAIL ") + n + (x ? " · " + x : "")); if (!c) fallos++; };
const correos = () => globalThis.__meCorreos || [];

async function aviso(data, { firma = true, tipo = "payment.succeeded" } = {}) {
  const body = JSON.stringify({ id: "msg_" + crypto.randomUUID(), type: tipo, api_version: "v1", data });
  const id = "msg_" + Date.now(), ts = String(Math.floor(Date.now() / 1000));
  const sig = crypto.createHmac("sha256", process.env.WHOP_WEBHOOK_SECRET).update(`${id}.${ts}.${body}`).digest("base64");
  const r = await hook(new Request("https://ejemplo.test/api/whop-webhook", { method: "POST", headers: { "webhook-id": id, "webhook-timestamp": ts, "webhook-signature": "v1," + (firma ? sig : "falsa") }, body }));
  return { s: r.status, d: await r.json() };
}
const adm = async (body) => { const r = await panel.POST(new Request("https://ejemplo.test/api/pedidos", { method: "POST", headers: { "x-admin-key": "clave-prueba", "content-type": "application/json" }, body: JSON.stringify(body) })); return { s: r.status, d: await r.json() }; };
const pedidos = async () => (await db().orders.all());

// 1. Compra directa en Whop con correo
const pago = { id: "pay_111", status: "paid", total: 19, usd_total: 19, currency: "usd", metadata: null, user: { id: "user_1", name: "Ana Pérez", username: "ana", email: "Ana@Example.com" }, member: { id: "mber_1", phone: "+573001112233" }, product: { id: "prod_PLENA", title: "PLENA" }, plan: { id: "plan_1" } };
let r = await aviso(pago);
ok("webhook firmado sin pedido: crea el pedido", r.s === 200 && r.d.directa && r.d.status === "pagado", JSON.stringify(r.d));
let rec = (await pedidos()).find((x) => x.paymentId === "pay_111");
ok("pedido pagado con pack, correo, nombre, teléfono e importe", rec && rec.status === "pagado" && rec.items[0] === "todo" && rec.email === "ana@example.com" && rec.name === "Ana Pérez" && rec.phone === "+573001112233" && rec.cents === 1900 && rec.mode === "whop-directo");
const m1 = correos().filter((c) => c.to === "ana@example.com");
ok("le llega «Crea tu cuenta de PLENA» con su enlace", m1.length === 1 && /Crea tu cuenta/.test(m1[0].subject) && m1[0].html.includes(`/oferta/gracias.html?pedido=${rec.id}&amp;t=`) || (m1[0] && m1[0].text.includes(`gracias.html?pedido=${rec.id}&t=`)));
ok("el pedido registra el correo enviado", rec.correos && rec.correos[0].ok === true);

// 2. Whop reenvía el mismo pago
r = await aviso(pago);
ok("pago duplicado: no crea otro pedido ni otro correo", r.d.already === true && (await pedidos()).filter((x) => x.paymentId === "pay_111").length === 1 && correos().filter((c) => c.to === "ana@example.com").length === 1);

// 3. Firma falsa
r = await aviso({ ...pago, id: "pay_falso" }, { firma: false });
ok("firma falsa: rechazado", r.s === 401 && !(await pedidos()).some((x) => x.paymentId === "pay_falso"));

// 4. Otro producto de la empresa
r = await aviso({ ...pago, id: "pay_222", product: { id: "prod_OTRO" } });
ok("pago de otro producto: se ignora", !(await pedidos()).some((x) => x.paymentId === "pay_222"), r.d.note);

// 5. Sin correo (permiso member:email:read no dado)
r = await aviso({ ...pago, id: "pay_333", user: { id: "user_3", name: "Luz", username: "luz", email: null } });
rec = (await pedidos()).find((x) => x.paymentId === "pay_333");
ok("sin correo: pedido en «revisar» con nota", rec && rec.status === "revisar" && /no envió el correo/.test(rec.note));
r = await adm({ action: "correo", id: rec.id, email: "luz@example.com" });
rec = await db().orders.get(rec.id);
ok("panel «Poner correo»: queda pagado y se envía el enlace", r.d.ok && r.d.correo === true && rec.status === "pagado" && correos().some((c) => c.to === "luz@example.com"));

// 6. Venta manual (WhatsApp / pago local)
r = await adm({ action: "manual", name: "Rosa Díaz", email: "rosa@example.com", phone: "3001234567", usd: "19.50", metodo: "nequi" });
ok("venta manual: pedido pagado con su valor real", r.d.ok && r.d.cents === 1950 && r.d.mode === "manual" && r.d.metodo === "nequi" && r.d.status === "pagado");
ok("venta manual: le llega «Crea tu cuenta de PLENA» y el panel da el enlace", r.d.enviado === true && correos().some((c) => c.to === "rosa@example.com") && /gracias\.html\?pedido=/.test(r.d.crearCuenta));
r = await adm({ action: "manual", name: "X", email: "malo", usd: "19" });
ok("venta manual sin correo válido: error claro", r.s === 400 && /correo/.test(r.d.error));
r = await adm({ action: "manual", name: "X", email: "x@example.com", usd: "abc" });
ok("venta manual sin valor: error claro", r.s === 400 && /valor/.test(r.d.error));

// 6b. Cupón del 100 % en Whop: llega como membresía activada (0 USD) y como pago de 0; un solo pedido y un solo correo
process.env.WHOP_PRODUCTO_LIBROS = "prod_LIBROS";
const memb = { id: "mem_900", product: { id: "prod_LIBROS" }, user: { id: "user_9", name: "Gloria Gratis", email: "gloria@example.com" }, metadata: null };
r = await aviso(memb, { tipo: "membership.activated" });
ok("cupón 100 %: la membresía activada crea el pedido de libros", r.d.directa && r.d.status === "pagado", JSON.stringify(r.d));
r = await aviso({ id: "pay_900", total: 0, usd_total: 0, membership: { id: "mem_900" }, product: { id: "prod_LIBROS" }, user: { email: "gloria@example.com" } });
ok("cupón 100 %: el pago de 0 de la misma compra no duplica", r.d.already === true && correos().filter((c) => c.to === "gloria@example.com").length === 1);
ok("cupón 100 %: le llega «Tu Biblioteca PAUSA está lista»", correos().some((c) => c.to === "gloria@example.com" && /Biblioteca PAUSA/.test(c.subject)));
const recWeb = { v: 2, id: "", createdAt: new Date().toISOString(), name: "Web", email: "web@example.com", items: ["todo"], cents: 1900, status: "pendiente", mode: "whop" };
await db().orders.create(recWeb);
r = await aviso({ id: "pay_901", total: 0, usd_total: 0, metadata: { pedido: recWeb.id } });
ok("pedido de la web pagado con cupón: queda pagado y avisa", r.d.status === "pagado" && correos().some((c) => c.to === "web@example.com"));

// 7. CSV con el valor real y el método
const csv = await (await panel.GET(new Request("https://ejemplo.test/api/pedidos?csv=1", { headers: { "x-admin-key": "clave-prueba" } }))).text();
const fila = csv.split("\n").find((l) => l.includes("rosa@example.com")) || "";
ok("CSV: la venta manual sale con 19.50 y nequi", fila.includes("19.50") && fila.includes("nequi") && fila.includes("manual"));
ok("CSV: la venta de Whop sale como whop-directo", csv.split("\n").some((l) => l.includes("ana@example.com") && l.includes("whop-directo") && l.includes("pay_111")));

console.log(fallos ? `\n${fallos} prueba(s) fallaron.` : "\nTodas las pruebas pasaron.");
process.exit(fallos ? 1 : 0);
