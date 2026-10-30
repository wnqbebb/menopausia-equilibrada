# 2 · Cobrar con Whop

Hay dos formas de usar Whop. Se pueden combinar.

| | **Opción A: embudo propio + Whop como pasarela** (recomendada) | **Opción B: todo dentro de Whop** |
|---|---|---|
| Dónde compra la clienta | En nuestra página `/oferta/` (oferta de 15 min, carrito, precios por separado) | En tu tienda de Whop |
| Quién cobra | Whop (tarjeta, Apple Pay, Google Pay…) | Whop |
| Entrega | Automática: Whop avisa a `/api/whop-webhook` y la clienta vuelve a la página de descargas | Automática: Whop avisa a `/api/whop-webhook` y a la clienta le llega «Crea tu cuenta de PLENA» |
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
   `checkout_configuration:create`, `checkout_configuration:basic:read`, `plan:create`, `access_pass:create`, `access_pass:update`, `payment:basic:read`, **`member:email:read`** (para leer el correo de quien compra directamente en Whop).
5. **Webhook:** Dashboard → **Developer** → **Webhooks** → **Create webhook**:
   - URL: `https://TU-DOMINIO/api/whop-webhook`
   - Evento: `payment.succeeded`
   - Si te pide permisos, marca también **`member:email:read`**: así el aviso trae el correo de la compradora (`data.user.email`). Sin él, Whop lo manda vacío.
   - Copia el **secreto** (`ws_…`). Solo se muestra una vez.

### 2. Pon las variables en Vercel

| Variable | Valor |
|---|---|
| `WHOP_API_KEY` | tu API key |
| `WHOP_COMPANY_ID` | `biz_…` |
| `WHOP_PRODUCT_ID` | `prod_…` |
| `WHOP_PRODUCTO_LIBROS` | `prod_…` (opcional) del producto «Biblioteca PAUSA» si vendes los 13 libros solos con un enlace de Whop: esas compras reciben solo los libros, sin PLENA. |
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

## Opción B: ventas directas en Whop (tienda de Whop o enlace de pago por WhatsApp) — automáticas

Cuando alguien paga **directamente en Whop** (no desde `/oferta/`), Whop avisa igual a `/api/whop-webhook`. Ese pago no trae número de pedido, así que el sistema:

1. Comprueba la firma del aviso y que el pago sea del producto de PLENA (`WHOP_PRODUCT_ID`, o los ids de `WHOP_PRODUCTOS_DIRECTOS`, separados por comas).
2. Crea solo un pedido **pagado** con el pack completo, el nombre, el correo y el WhatsApp que trae Whop y el importe cobrado (modo **«Whop directo»** en el panel).
3. Le envía el correo **«Crea tu cuenta de PLENA»**. Ella crea su cuenta, le llega la bienvenida y entra.
4. Si Whop reenvía el mismo pago, no se duplica (se recuerda el id `pay_…`).
5. Si el aviso llega **sin correo** (falta el permiso `member:email:read`), lo pide a la API de Whop. Si aun así no hay correo, el pedido queda en **«revisar»** con una nota: búscalo en Whop → **Payments**, pulsa **Poner correo** en el panel y se envía el enlace solo.

### Enlace de pago para enviar por WhatsApp

1. En Whop: **Dashboard → Checkout links → + Create checkout link**.
2. Elige el producto de PLENA (el mismo de `WHOP_PRODUCT_ID`), **One-time**, el precio (por ejemplo 19 USD) y deja sin marcar **Show on store page** si no quieres que salga en tu tienda pública.
3. **Create checkout link** y copia el enlace.
4. Mándalo por WhatsApp. Cuando la clienta paga con tarjeta, todo lo demás pasa solo: a su correo le llega «Crea tu cuenta de PLENA».

> Si el enlace es de **otro** producto de Whop, añade su id `prod_…` en la variable `WHOP_PRODUCTOS_DIRECTOS` de Vercel y vuelve a desplegar.

### Pago local (transferencia, Nequi, efectivo)

Whop no se entera de estos pagos. En el panel `/oferta/admin.html` usa **Venta manual**: nombre, correo, WhatsApp, valor en USD y método. Se registra con su valor real (sale en el CSV) y le llega sola «Crea tu cuenta de PLENA». El enlace también queda copiado para mandarlo por WhatsApp.

### Probar

```bash
cd sitio && npm run prueba-whop     # avisos firmados de Whop sin pedido, duplicados, sin correo, otro producto y venta manual
```

## Documentación oficial

- Webhooks: https://docs.whop.com/developer/guides/webhooks
- Checkout configurations: https://docs.whop.com/api-reference/checkout-configurations/create-checkout-configuration
