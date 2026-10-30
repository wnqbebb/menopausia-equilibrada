// Panel de pedidos (solo administradora, con la clave ADMIN_KEY). Vercel Function: /api/pedidos
// GET  /api/pedidos?page=0&size=100&estado=pagado&q=texto   → página de pedidos (más recientes primero)
// GET  /api/pedidos?csv=1                                   → todos los pedidos en CSV (para Excel / Google Sheets)
// POST /api/pedidos {action, id}                            → pagado | pendiente | borrar | revocar | reactivar | cortesia
//                                                              | enlaceCuenta (reenviar el enlace para crear la cuenta) | bienvenida
import { db } from "../lib/store.js";
import { json, hmac, hasApp, itemsOf, CURRENCY, envGet as env } from "../lib/catalog.js";
import { reflejarEnCuenta, correoBienvenida, correoCrearCuenta, enlaceCuenta } from "../lib/cuentas.js";

const PAGE_MAX = 200;

const csvCell = (v) => { const s = String(v ?? ""); return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

async function handler(req) {
  const key = env("ADMIN_KEY");
  if (!key || req.headers.get("x-admin-key") !== key) return json({ error: "Clave incorrecta." }, 401);
  const url = new URL(req.url);
  const ORIGIN = (env("PUBLIC_URL") || url.origin).replace(/\/$/, "");
  const store = db().orders;
  const extra = async (r) => {
    r.items = itemsOf(r);
    r.entrega = `${ORIGIN}/oferta/gracias.html?pedido=${r.id}&t=${await hmac(key, r.id)}`;
    r.plena = hasApp(r.items);
    r.cuenta = r.userId ? "creada" : r.cuentaBorrada ? "borrada" : "sin cuenta";
    if (r.plena) r.crearCuenta = await enlaceCuenta(r, ORIGIN);
    const ult = (r.correos || []).slice(-1)[0];
    r.correo = ult ? { tipo: ult.tipo, ok: ult.ok, at: ult.at, error: ult.error || "" } : null;
    delete r.userId; delete r.correos;
    return r;
  };

  if (req.method === "GET") {
    if (url.searchParams.get("csv")) {
      const recs = await store.all();
      const head = ["fecha", "id", "estado", "nombre", "correo", "telefono", "productos", "total_usd", "modo", "pago_id", "entrega", "cuenta", "revocado"];
      const rows = [head.join(",")];
      for (const r of recs) {
        await extra(r);
        rows.push([r.createdAt, r.id, r.status, r.name, r.email, r.phone, r.items.join(" + "), (r.cents / 100).toFixed(2), r.mode, r.paymentId || r.sessionId || "", r.entrega, r.plena ? r.cuenta : "", r.revoked ? "sí" : ""].map(csvCell).join(","));
      }
      return new Response("\ufeff" + rows.join("\n"), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="pedidos-${new Date().toISOString().slice(0, 10)}.csv"`, "cache-control": "no-store" } });
    }
    const page = Math.max(0, parseInt(url.searchParams.get("page") || "0", 10) || 0);
    const size = Math.min(PAGE_MAX, Math.max(10, parseInt(url.searchParams.get("size") || "100", 10) || 100));
    const estado = url.searchParams.get("estado") || "";
    const q = (url.searchParams.get("q") || "").trim().toLowerCase();
    let recs, total;
    if (estado || q) {
      const hit = (await store.all()).filter((r) => (!estado || r.status === estado) && (!q || [r.id, r.name, r.email, r.phone].join(" ").toLowerCase().includes(q)));
      total = hit.length; recs = hit.slice(page * size, page * size + size);
    } else {
      ({ recs, total } = await store.page(page * size, size));
    }
    recs.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    for (const r of recs) await extra(r);
    return json({ pedidos: recs, total, page, size, pages: Math.max(1, Math.ceil(total / size)) });
  }

  if (req.method === "POST") {
    let b; try { b = await req.json(); } catch { return json({ error: "Datos no válidos." }, 400); }
    if (b.action === "cortesia") {
      // Regalar acceso: crea un pedido pagado de 0 USD con todo incluido y envía el enlace para crear la cuenta.
      const email = String(b.email || "").trim().toLowerCase().slice(0, 254);
      if (!/^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(email)) return json({ error: "Escribe el correo de la clienta: ahí le llega el enlace para crear su cuenta." }, 400);
      const rec = { v: 2, id: "", createdAt: new Date().toISOString(), name: String(b.name || "Cortesía").slice(0, 80), email, phone: "", items: ["todo"], cents: 0, currency: CURRENCY, mode: "cortesia", status: "pagado", paidAt: new Date().toISOString(), origin: ORIGIN };
      await store.create(rec);
      const mail = await correoCrearCuenta(rec, ORIGIN);
      await store.save(rec);
      return json({ ok: true, correo: mail.ok, ...(await extra(rec)) });
    }
    const id = String(b.id || "").replace(/[^a-z0-9]/gi, "");
    const rec = await store.get(id);
    if (!rec) return json({ error: "No existe." }, 404);
    if (b.action === "borrar") { await store.remove(id); return json({ ok: true }); }
    if (b.action === "pagado" || b.action === "pendiente") {
      rec.status = b.action; if (b.action === "pagado") rec.paidAt = new Date().toISOString();
      await store.save(rec);
      if (b.action === "pagado") await reflejarEnCuenta(rec).catch((e) => console.error("panel cuenta", e.message));
      return json({ ok: true, ...(await extra(rec)) });
    }
    if (b.action === "revocar" || b.action === "reactivar") {
      // Revocar bloquea también la cuenta de PLENA (perfil «revocado» + inicio de sesión bloqueado en Supabase).
      rec.revoked = b.action === "revocar"; await store.save(rec);
      try { await reflejarEnCuenta(rec); } catch (e) { console.error("panel revocar", e.message); return json({ ok: true, aviso: "El pedido quedó " + (rec.revoked ? "revocado" : "activo") + ", pero no se pudo actualizar la cuenta en Supabase. Inténtalo de nuevo." }); }
      return json({ ok: true });
    }
    if (b.action === "enlaceCuenta" || b.action === "bienvenida") {
      if (rec.status !== "pagado") return json({ error: "El pedido aún no está pagado." }, 400);
      if (!rec.email) return json({ error: "Este pedido no tiene correo." }, 400);
      if (b.action === "bienvenida" && !rec.userId) return json({ error: "Esta clienta aún no creó su cuenta: envíale el enlace para crearla." }, 400);
      if (b.action === "enlaceCuenta" && rec.userId) return json({ error: "Esta clienta ya tiene cuenta: reenvíale la bienvenida." }, 400);
      const mail = b.action === "bienvenida" ? await correoBienvenida(rec, ORIGIN) : await correoCrearCuenta(rec, ORIGIN);
      await store.save(rec);
      return mail.ok ? json({ ok: true }) : json({ error: "No se pudo enviar el correo: " + (mail.error || "error desconocido") }, 502);
    }
    return json({ error: "Acción no válida." }, 400);
  }
  return json({ error: "Método no permitido." }, 405);
}

export { handler as GET, handler as POST };
