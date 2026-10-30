// Entrega: enlaces de descarga y «Crea tu cuenta de PLENA» solo si el pago está confirmado
// (sesión de Stripe pagada, o pedido marcado «pagado» por el webhook o la administradora).
// También acepta el código antiguo de la app (?k=ID-FIRMA): sirve UNA sola vez, para crear la cuenta de su pedido.
import { db } from "../lib/store.js";
import { cleanItems, filesFor, hasApp, json, hmac, itemsOf, BUNDLE_LAUNCH, VALUE_CENTS, envGet as env } from "../lib/catalog.js";
import { pedidoFirmado, reflejarEnCuenta } from "../lib/cuentas.js";

async function payload(rec, items) {
  const key = env("ADMIN_KEY");
  const out = { paid: true, id: rec.id, name: rec.name || "", email: rec.email || "", items, files: filesFor(items, env("FILES_BASE")), cents: rec.cents || 0, bundleCents: BUNDLE_LAUNCH, valueCents: VALUE_CENTS };
  if (key && rec.id) out.t = await hmac(key, rec.id); // permite la mejora a «Todo junto» desde gracias.html
  out.plena = hasApp(items);              // puede crear su cuenta de PLENA
  out.pack = items.includes("todo");
  out.cuenta = !!rec.userId;              // ya creó su cuenta
  return out;
}

async function handler(req) {
  const url = new URL(req.url);
  const store = db().orders;
  const sid = url.searchParams.get("session_id") || "";
  const pid = (url.searchParams.get("pedido") || "").replace(/[^a-z0-9]/gi, "");
  const t = url.searchParams.get("t") || "";
  const k = url.searchParams.get("k") || "";
  try {
    if (k) {
      const rec = await pedidoFirmado({ k });
      if (!rec) return json({ paid: false, error: "Ese código no es válido." }, 403);
      if (rec.status !== "pagado" || rec.revoked) return json({ paid: false, pending: rec.status !== "pagado" });
      // Con cuenta ya creada, el código deja de servir: solo indica que inicie sesión.
      if (rec.userId) return json({ paid: true, viaCodigo: true, cuenta: true, email: rec.email || "", items: [], files: [] });
      return json({ ...(await payload(rec, itemsOf(rec))), viaCodigo: true });
    }
    if (sid && env("STRIPE_SECRET_KEY")) {
      if (!/^cs_[A-Za-z0-9_]+$/.test(sid)) return json({ paid: false }, 400);
      const r = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sid}`, { headers: { authorization: `Bearer ${env("STRIPE_SECRET_KEY")}` } });
      const s = await r.json();
      if (!r.ok || s.payment_status !== "paid") return json({ paid: false });
      const id = s.metadata?.pedido;
      let rec = id ? await store.get(id) : null;
      const items = cleanItems(String(s.metadata?.items || "").split(","));
      if (!rec) rec = { id: id || sid.slice(-14), name: s.customer_details?.name || "", email: s.customer_details?.email || "", items, cents: s.amount_total || 0 };
      if (rec.status !== "pagado") { rec.status = "pagado"; rec.paidAt = new Date().toISOString(); if (id) { await store.save(rec); await reflejarEnCuenta(rec).catch((e) => console.error("entrega cuenta", e.message)); } }
      return json(await payload(rec, items));
    }
    if (pid && t && env("ADMIN_KEY")) {
      if (t !== (await hmac(env("ADMIN_KEY"), pid))) return json({ paid: false }, 403);
      const rec = await store.get(pid);
      if (!rec || rec.status !== "pagado") return json({ paid: false, pending: !!rec, review: rec?.status === "revisar" });
      return json(await payload(rec, itemsOf(rec)));
    }
    return json({ paid: false });
  } catch (err) {
    console.error("entrega", err);
    return json({ paid: false, error: "No se pudo verificar el pago." }, 500);
  }
}

export { handler as GET };
