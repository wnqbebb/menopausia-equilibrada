// Checkout. Modo según las variables de entorno (en este orden):
//  1) whop   → WHOP_API_KEY + WHOP_COMPANY_ID + WHOP_PRODUCT_ID: crea un checkout de Whop con el precio exacto del carrito;
//              el webhook /api/whop-webhook marca el pedido como pagado y la clienta vuelve a gracias.html.
//  2) stripe → STRIPE_SECRET_KEY.
//  3) link   → PAY_LINK_TODO / PAY_LINK_<ID> (Hotmart, Mercado Pago, etc.; se marca pagado a mano en el panel).
//  4) pedido → sin pasarela: registra el pedido y la administradora envía el enlace de pago.
import { db } from "../lib/store.js";
import { cleanItems, quote, json, CURRENCY, BUNDLE_LAUNCH, BUNDLE_REGULAR, VALUE_CENTS, OFFER_WINDOW_MS, itemsOf, checkOffer, hmac, envGet as env } from "../lib/catalog.js";

function mode() {
  if (env("WHOP_API_KEY") && env("WHOP_COMPANY_ID") && env("WHOP_PRODUCT_ID")) return "whop";
  if (env("STRIPE_SECRET_KEY")) return "stripe";
  if (env("PAY_LINK_TODO")) return "link";
  return "pedido";
}
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;

async function handler(req) {
  const url = new URL(req.url);
  const ORIGIN = (env("PUBLIC_URL") || url.origin).replace(/\/$/, "");
  if (req.method === "GET") return json({ mode: mode(), launchCents: BUNDLE_LAUNCH, regularCents: BUNDLE_REGULAR, windowMs: OFFER_WINDOW_MS, valueCents: VALUE_CENTS, now: Date.now() });
  if (req.method !== "POST") return json({ error: "Método no permitido." }, 405);
  let b;
  try { b = await req.json(); } catch { return json({ error: "Datos no válidos." }, 400); }
  const name = String(b.name || "").trim().slice(0, 80);
  const email = String(b.email || "").trim().toLowerCase().slice(0, 254);
  const phone = String(b.phone || "").trim().slice(0, 30);
  let items = cleanItems(b.items);
  if (!name) return json({ error: "Escribe tu nombre." }, 400);
  if (!EMAIL.test(email)) return json({ error: "Revisa tu correo: así te llega tu compra." }, 400);
  if (!items.length) return json({ error: "Tu carrito está vacío." }, 400);

  const store = db().orders;
  // Mejora a «Todo junto» desde una compra anterior pagada: pagas solo la diferencia
  let upgradeFromCents = 0, upgradeFrom = "";
  if (b.upgradeFrom) {
    const upId = String(b.upgradeFrom).replace(/[^a-z0-9]/gi, "");
    if (!env("ADMIN_KEY") || String(b.upgradeT || "") !== (await hmac(env("ADMIN_KEY"), upId))) return json({ error: "Este enlace de mejora no es válido." }, 403);
    const prev = await store.get(upId);
    if (prev && prev.status === "pagado" && !itemsOf(prev).includes("todo")) { upgradeFromCents = prev.cents || 0; upgradeFrom = prev.id; items = ["todo"]; }
  }
  const offer = await checkOffer(env("ADMIN_KEY"), b.offer);
  const q = quote(items, { upgradeFromCents, offerActive: !!(offer.ok && offer.active) });
  const m = mode();
  const rec = { v: 2, id: "", createdAt: new Date().toISOString(), name, email, phone, items: q.items, cents: q.cents, currency: CURRENCY, mode: m, status: "pendiente", upgradeFrom, offer: !!(offer.ok && offer.active), origin: ORIGIN };

  let id;
  try { id = await store.create(rec); } catch (err) { console.error("checkout id", err); return json({ error: "No se pudo registrar tu pedido. Inténtalo de nuevo." }, 500); }
  try {
    if (m === "whop") {
      const t = await hmac(env("ADMIN_KEY"), id);
      const body = {
        mode: "payment",
        redirect_url: `${ORIGIN}/oferta/gracias.html?pedido=${id}&t=${t}`,
        metadata: { pedido: id, items: q.items.join(","), email },
        plan: {
          company_id: env("WHOP_COMPANY_ID"),
          product_id: env("WHOP_PRODUCT_ID"),
          currency: CURRENCY,
          plan_type: "one_time",
          initial_price: q.cents / 100,
          title: q.lines.length === 1 ? q.lines[0].name.slice(0, 80) : `Pedido ${id} (${q.lines.length} productos)`,
          visibility: "hidden",
        },
      };
      const r = await fetch("https://api.whop.com/api/v1/checkout_configurations", {
        method: "POST",
        headers: { authorization: `Bearer ${env("WHOP_API_KEY")}`, "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const c = await r.json().catch(() => ({}));
      if (!r.ok || !c.purchase_url) { console.error("whop", r.status, JSON.stringify(c).slice(0, 500)); return json({ error: "No se pudo abrir el pago. Inténtalo de nuevo en un momento." }, 502); }
      rec.checkoutId = c.id;
      await store.save(rec);
      const u = new URL(c.purchase_url, "https://whop.com");
      if (!u.searchParams.has("email")) u.searchParams.set("email", email);
      return json({ mode: m, url: u.toString(), id, cents: q.cents, items: q.items, upgraded: q.upgraded });
    }
    if (m === "stripe") {
      const p = new URLSearchParams();
      p.set("mode", "payment");
      p.set("customer_email", email);
      p.set("client_reference_id", id);
      p.set("success_url", `${ORIGIN}/oferta/gracias.html?session_id={CHECKOUT_SESSION_ID}`);
      p.set("cancel_url", `${ORIGIN}/oferta/?pago=cancelado`);
      p.set("allow_promotion_codes", "true");
      p.set("metadata[pedido]", id);
      p.set("metadata[items]", q.items.join(","));
      q.lines.forEach((it, i) => {
        p.set(`line_items[${i}][quantity]`, "1");
        p.set(`line_items[${i}][price_data][currency]`, CURRENCY);
        p.set(`line_items[${i}][price_data][unit_amount]`, String(it.cents));
        p.set(`line_items[${i}][price_data][product_data][name]`, it.name.slice(0, 250));
      });
      const r = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: { authorization: `Bearer ${env("STRIPE_SECRET_KEY")}`, "content-type": "application/x-www-form-urlencoded" },
        body: p,
      });
      const s = await r.json();
      if (!r.ok || !s.url) { console.error("stripe", s); return json({ error: "No se pudo abrir el pago. Inténtalo de nuevo en un momento." }, 502); }
      rec.sessionId = s.id;
      await store.save(rec);
      return json({ mode: m, url: s.url, id, cents: q.cents, items: q.items, upgraded: q.upgraded });
    }
    if (m === "link") {
      const key = q.items.length === 1 ? "PAY_LINK_" + q.items[0].toUpperCase() : "";
      const link = (key && env(key)) || env("PAY_LINK_TODO");
      await store.save(rec);
      if (q.items[0] !== "todo" && !(key && env(key))) {
        // sin enlace para esta combinación: se registra como pedido y se envía el enlace a mano
        return json({ mode: "pedido", ok: true, id, cents: q.cents, items: q.items, upgraded: q.upgraded });
      }
      const u = new URL(link);
      if (!u.searchParams.has("email")) u.searchParams.set("email", email);
      return json({ mode: m, url: u.toString(), id, cents: q.cents, items: q.items, upgraded: q.upgraded });
    }
    await store.save(rec);
    return json({ mode: m, ok: true, id, cents: q.cents, items: q.items, upgraded: q.upgraded });
  } catch (err) {
    console.error("checkout", err);
    return json({ error: "No se pudo registrar tu pedido. Inténtalo de nuevo." }, 500);
  }
}

export { handler as GET, handler as POST };
