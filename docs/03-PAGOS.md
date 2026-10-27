# 3 · Otras pasarelas de pago

El modo de cobro se elige solo según las variables de entorno, en este orden:

| Prioridad | Modo | Variables | Entrega |
|---|---|---|---|
| 1 | `whop` | `WHOP_API_KEY` + `WHOP_COMPANY_ID` + `WHOP_PRODUCT_ID` (+ `WHOP_WEBHOOK_SECRET`) | Automática (webhook) |
| 2 | `stripe` | `STRIPE_SECRET_KEY` | Automática (al volver de Stripe) |
| 3 | `link` | `PAY_LINK_TODO` y, opcionalmente, `PAY_LINK_<ID>` | Manual: se marca pagado en el panel |
| 4 | `pedido` | ninguna | Manual: envías el enlace de pago por correo o WhatsApp |

Puedes ver el modo activo en `GET /api/checkout`.

## Stripe

1. En https://dashboard.stripe.com, en **Developers → API keys**, copia la **Secret key** (`sk_live_…`; para pruebas, `sk_test_…`).
2. Créala en Vercel (**Settings → Environment Variables**) como `STRIPE_SECRET_KEY` y vuelve a desplegar.
3. El sistema crea una sesión de Stripe Checkout con el importe exacto del carrito. Al pagar, la clienta vuelve a `gracias.html?session_id=…`, el servidor consulta a Stripe y marca el pedido como pagado.

## Hotmart, Mercado Pago, PayPal u otro enlace de pago

1. Crea en tu plataforma un enlace de pago para el **pack completo** y ponlo en `PAY_LINK_TODO`.
2. Si quieres, crea uno por producto suelto: `PAY_LINK_PAUSA`, `PAY_LINK_GUIA`, `PAY_LINK_K1`, etc. (el ID en mayúsculas; lista en la guía 04).
3. Si alguien compra una combinación sin enlace propio, el pedido queda registrado y le envías el enlace a mano.
4. Cuando veas el pago en tu plataforma, abre el panel, pulsa **Marcar pagado** y envía el **enlace de entrega** a la clienta.

> Con enlaces externos no hay confirmación automática. Para automatizarla habría que añadir el webhook de esa plataforma siguiendo el modelo de `sitio/api/whop-webhook.js`.

## Sin pasarela (modo «pedido»)

La clienta reserva su pedido y tú le envías el enlace de pago. Cuando pague, márcalo como pagado en el panel y envíale su enlace de entrega.
