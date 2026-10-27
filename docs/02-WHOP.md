# 2 · Cobrar con Whop

Hay dos formas de usar Whop. Se pueden combinar.

| | **Opción A: embudo propio + Whop como pasarela** (recomendada) | **Opción B: todo dentro de Whop** |
|---|---|---|
| Dónde compra la clienta | En nuestra página `/oferta/` (oferta de 15 min, carrito, precios por separado) | En tu tienda de Whop |
| Quién cobra | Whop (tarjeta, Apple Pay, Google Pay…) | Whop |
| Entrega | Automática: Whop avisa a `/api/whop-webhook` y la clienta vuelve a la página de descargas | Whop entrega los PDF con su app «Files» |
| Precio dinámico por carrito | Sí | No (un precio fijo por producto) |
| Código | Ya está hecho; solo poner 4 variables | Ninguno |

---

## Opción A: embudo propio con pago en Whop

### 1. Prepara Whop

1. Crea tu cuenta y tu empresa en https://whop.com (Dashboard).
2. **Crea un producto** (por ejemplo «Menopausia sin tabú»). Será el contenedor de todas las ventas; el sistema crea un precio a medida en cada pedido.
3. Copia los identificadores:
   - **Company ID** (`biz_…`): en la URL del dashboard o en **Settings**.
   - **Product ID** (`prod_…`): abre el producto; aparece en la URL o en sus detalles.
4. **API key:** Dashboard → **Developer** → **API keys** → crear. Dale como mínimo estos permisos:
   `checkout_configuration:create`, `checkout_configuration:basic:read`, `plan:create`, `access_pass:create`, `access_pass:update`, `payment:basic:read`.
5. **Webhook:** Dashboard → **Developer** → **Webhooks** → **Create webhook**:
   - URL: `https://TU-DOMINIO/api/whop-webhook`
   - Evento: `payment.succeeded`
   - Copia el **secreto** (`ws_…`). Solo se muestra una vez.

### 2. Pon las variables en Vercel

| Variable | Valor |
|---|---|
| `WHOP_API_KEY` | tu API key |
| `WHOP_COMPANY_ID` | `biz_…` |
| `WHOP_PRODUCT_ID` | `prod_…` |
| `WHOP_WEBHOOK_SECRET` | `ws_…` |

En Vercel: **Settings → Environment Variables**, añade las 4 y vuelve a desplegar (**Deployments → ⋯ → Redeploy**). Desde ese momento el botón de pago abre Whop automáticamente: el modo `whop` tiene prioridad sobre Stripe, enlaces y pedido manual.

### 3. Cómo funciona por dentro

1. La clienta pulsa pagar en `/oferta/`. `POST /api/checkout` calcula el precio real en el servidor (incluida la oferta de 15 minutos firmada) y guarda el pedido como `pendiente`.
2. Llama a la API de Whop `POST /api/v1/checkout_configurations` con un plan de pago único por ese importe exacto y `metadata.pedido = ID`.
3. Redirige a la página de pago de Whop. Al pagar, Whop devuelve a la clienta a `/oferta/gracias.html?pedido=ID&t=FIRMA`.
4. En paralelo, Whop envía `payment.succeeded` a `/api/whop-webhook`. El sistema verifica la firma (estándar *Standard Webhooks*) y comprueba el importe. Si cuadra, marca el pedido como `pagado`.
5. La página de gracias reintenta sola durante unos 2 minutos hasta ver el pago. Entonces muestra las descargas y el código de la app.
6. Si Whop cobró menos de lo esperado (por ejemplo, por un cupón), el pedido queda en **«revisar»** en el panel para que lo apruebes a mano.

### 4. Probar

> La integración se verificó con webhooks firmados simulados (firma, importe, pedidos duplicados, 1.000 y 5.000 pagos) en `sitio/pruebas/`. Todavía no se probó con una cuenta real de Whop, así que **haz una compra real de prueba antes de lanzar**.


- Whop tiene un entorno de pruebas (*sandbox*). Para usarlo, cambia `https://api.whop.com` por `https://sandbox-api.whop.com` en `sitio/api/checkout.js`.
- Haz una compra de prueba y comprueba en el panel que el pedido pasa a «pagado» con su `pago_id`.
- Si no pasa a pagado, en Whop → Developer → Webhooks revisa los intentos de entrega. Las causas habituales son una URL mal escrita o un secreto mal copiado.

---

## Opción B: tienda 100% en Whop (sin código)

1. Crea en Whop un producto por oferta. Por ejemplo:
   - **Pack completo:** 19 USD de lanzamiento / 37 USD regular.
   - **PAUSA:** 14 USD.
   - **Guía Integral:** 12 USD.
   - **Kits:** 7–9 USD.
2. Añade la app **Files** (o «Downloads») a cada producto y sube los PDF de `sitio/public/entrega-…/` (lista en [04-PRODUCTOS-Y-PRECIOS.md](04-PRODUCTOS-Y-PRECIOS.md)).
3. Para dar acceso a la app, en el panel `/oferta/admin.html` usa **«Regalar acceso completo (cortesía)»** con el nombre y el correo de la compradora. Copia el enlace y envíalo, o pégalo en el mensaje de bienvenida del producto en Whop.
4. Usa las imágenes de `productos/imagenes/` y `sitio/public/oferta/img/` como portadas.

> También puedes mezclar las dos: vender en Whop con la Opción B y usar nuestra página como embudo que manda tráfico a la Opción A.

## Documentación oficial

- Webhooks: https://docs.whop.com/developer/guides/webhooks
- Checkout configurations: https://docs.whop.com/api-reference/checkout-configurations/create-checkout-configuration
