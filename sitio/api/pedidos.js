// Panel de pedidos (solo administradora, con la clave ADMIN_KEY). Vercel Function: /api/pedidos
// GET  /api/pedidos?page=0&size=100&estado=pagado&q=texto   → página de pedidos (más recientes primero)
// GET  /api/pedidos?csv=1                                   → todos los pedidos en CSV (para Excel / Google Sheets)
// POST /api/pedidos {action, id}                            → pagado | pendiente | borrar | revocar | reactivar | cortesia
import { db } from "../lib/store.js";
import { json, hmac, accessCode, hasApp, itemsOf, CURRENCY, envGet as env } from "../lib/catalog.js";

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
    if (hasApp(r.items)) r.acceso = `${ORIGIN}/#acceso?k=${await accessCode(key, r.id)}`;
    return r;
  };

  if (req.method === "GET") {
    if (url.searchParams.get("csv")) {
      const recs = await store.all();
      const head = ["fecha", "id", "estado", "nombre", "correo", "telefono", "productos", "total_usd", "modo", "pago_id", "entrega", "acceso_app"];
      const rows = [head.join(",")];
      for (const r of recs) {
        await extra(r);
        rows.push([r.createdAt, r.id, r.status, r.name, r.email, r.phone, r.items.join(" + "), (r.cents / 100).toFixed(2), r.mode, r.paymentId || r.sessionId || "", r.entrega, r.acceso || ""].map(csvCell).join(","));
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
      const rec = { v: 2, id: "", createdAt: new Date().toISOString(), name: String(b.name || "Cortesía").slice(0, 80), email: String(b.email || "").slice(0, 254), phone: "", items: ["todo"], cents: 0, currency: CURRENCY, mode: "cortesia", status: "pagado", paidAt: new Date().toISOString() };
      await store.create(rec);
      return json({ ok: true, ...(await extra(rec)) });
    }
    const id = String(b.id || "").replace(/[^a-z0-9]/gi, "");
    const rec = await store.get(id);
    if (!rec) return json({ error: "No existe." }, 404);
    if (b.action === "borrar") { await store.remove(id); return json({ ok: true }); }
    if (b.action === "pagado" || b.action === "pendiente") {
      rec.status = b.action; if (b.action === "pagado") rec.paidAt = new Date().toISOString();
      await store.save(rec);
      return json({ ok: true, ...(await extra(rec)) });
    }
    if (b.action === "revocar" || b.action === "reactivar") {
      rec.revoked = b.action === "revocar"; await store.save(rec); return json({ ok: true });
    }
    return json({ error: "Acción no válida." }, 400);
  }
  return json({ error: "Método no permitido." }, 405);
}

export { handler as GET, handler as POST };
