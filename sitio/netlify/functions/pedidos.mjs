// Panel de pedidos (solo administradora, con la clave ADMIN_KEY).
// GET  /api/pedidos?page=0&size=100&estado=pagado&q=texto   → página de pedidos (más recientes primero)
// GET  /api/pedidos?csv=1                                   → todos los pedidos en CSV (para Excel / Google Sheets)
// POST /api/pedidos {action, id}                            → pagado | pendiente | borrar | revocar | reactivar | cortesia
import { getStore } from "@netlify/blobs";
import { json, hmac, accessCode, hasApp, itemsOf, CURRENCY, createOrder, envGet as env } from "../lib/catalog.mjs";

const PAGE_MAX = 200;

// Lee muchos pedidos con concurrencia limitada (evita saturar el almacenamiento con miles de lecturas a la vez).
async function readMany(store, keys, limit = 24) {
  const out = new Array(keys.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(limit, keys.length) }, async () => {
    while (i < keys.length) { const n = i++; out[n] = await store.get(keys[n], { type: "json" }).catch(() => null); }
  }));
  return out.filter(Boolean);
}
async function allKeys(store) {
  const keys = [];
  for await (const page of store.list({ paginate: true })) for (const b of page.blobs) keys.push(b.key);
  // Los id nuevos empiezan por la hora en hex → el orden alfabético inverso es «más reciente primero».
  return keys.sort().reverse();
}
const csvCell = (v) => { const s = String(v ?? ""); return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

export default async (req) => {
  const key = env("ADMIN_KEY");
  if (!key || req.headers.get("x-admin-key") !== key) return json({ error: "Clave incorrecta." }, 401);
  const url = new URL(req.url);
  const ORIGIN = (env("PUBLIC_URL") || url.origin).replace(/\/$/, "");
  const store = getStore({ name: "me-pedidos", consistency: "strong" });
  const extra = async (r) => {
    r.items = itemsOf(r);
    r.entrega = `${ORIGIN}/oferta/gracias.html?pedido=${r.id}&t=${await hmac(key, r.id)}`;
    if (hasApp(r.items)) r.acceso = `${ORIGIN}/#acceso?k=${await accessCode(key, r.id)}`;
    return r;
  };

  if (req.method === "GET") {
    const keys = await allKeys(store);
    if (url.searchParams.get("csv")) {
      const recs = await readMany(store, keys);
      const head = ["fecha", "id", "estado", "nombre", "correo", "telefono", "productos", "total_usd", "modo", "pago_id", "entrega", "acceso_app"];
      const rows = [head.join(",")];
      for (const r of recs) {
        await extra(r);
        rows.push([r.createdAt, r.id, r.status, r.name, r.email, r.phone, r.items.join(" + "), (r.cents / 100).toFixed(2), r.mode, r.paymentId || r.sessionId || "", r.entrega, r.acceso || ""].map(csvCell).join(","));
      }
      return new Response("﻿" + rows.join("\n"), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="pedidos-${new Date().toISOString().slice(0, 10)}.csv"`, "cache-control": "no-store" } });
    }
    const page = Math.max(0, parseInt(url.searchParams.get("page") || "0", 10) || 0);
    const size = Math.min(PAGE_MAX, Math.max(10, parseInt(url.searchParams.get("size") || "100", 10) || 100));
    const estado = url.searchParams.get("estado") || "";
    const q = (url.searchParams.get("q") || "").trim().toLowerCase();
    let recs, total;
    if (estado || q) {
      // Búsqueda: recorre todos (con concurrencia limitada) y filtra.
      const all = await readMany(store, keys);
      const hit = all.filter((r) => (!estado || r.status === estado) && (!q || [r.id, r.name, r.email, r.phone].join(" ").toLowerCase().includes(q)));
      total = hit.length; recs = hit.slice(page * size, page * size + size);
    } else {
      total = keys.length; recs = await readMany(store, keys.slice(page * size, page * size + size));
    }
    recs.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    for (const r of recs) await extra(r);
    return json({ pedidos: recs, total, page, size, pages: Math.max(1, Math.ceil(total / size)) });
  }

  if (req.method === "POST") {
    let b; try { b = await req.json(); } catch { return json({ error: "Datos no válidos." }, 400); }
    if (b.action === "cortesia") {
      const rec = { v: 2, id: "", createdAt: new Date().toISOString(), name: String(b.name || "Cortesía").slice(0, 80), email: String(b.email || "").slice(0, 254), phone: "", items: ["todo"], cents: 0, currency: CURRENCY, mode: "cortesia", status: "pagado", paidAt: new Date().toISOString() };
      await createOrder(store, rec);
      return json({ ok: true, ...(await extra(rec)) });
    }
    const id = String(b.id || "").replace(/[^a-z0-9]/gi, "");
    const rec = await store.get(id, { type: "json" });
    if (!rec) return json({ error: "No existe." }, 404);
    if (b.action === "borrar") { await store.delete(id); return json({ ok: true }); }
    if (b.action === "pagado" || b.action === "pendiente") {
      rec.status = b.action; if (b.action === "pagado") rec.paidAt = new Date().toISOString();
      await store.setJSON(id, rec);
      return json({ ok: true, ...(await extra(rec)) });
    }
    if (b.action === "revocar" || b.action === "reactivar") {
      rec.revoked = b.action === "revocar"; await store.setJSON(id, rec); return json({ ok: true });
    }
    return json({ error: "Acción no válida." }, 400);
  }
  return json({ error: "Método no permitido." }, 405);
};

export const config = { path: "/api/pedidos" };
