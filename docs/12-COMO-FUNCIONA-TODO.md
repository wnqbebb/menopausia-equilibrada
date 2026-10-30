# 12 · Cómo funciona todo (guía rápida)

Esta guía explica en palabras sencillas el recorrido completo: qué ve la clienta, qué compra, qué le llega y qué haces tú. Los detalles técnicos están en las demás guías.

## 1. Las direcciones importantes

| Dirección | Para qué |
|---|---|
| `https://menopausia-equilibrada.vercel.app/oferta/` | **Página de ventas** (la que pones en anuncios, bio y WhatsApp). |
| `/oferta/?oferta=libros` | Abre directo el pedido de la Biblioteca PAUSA. |
| `/oferta/?oferta=todo` | Abre directo el pedido de Libros + PLENA. |
| `/plena/` | PLENA, la academia. Las clientas entran con su correo y su contraseña. |
| `/oferta/admin.html` | **Tu panel de pedidos** (pide tu `ADMIN_KEY`). |
| `/oferta/gracias.html` | Después de pagar: con la Biblioteca PAUSA es **su biblioteca 3D** (leer y descargar cada libro); con PLENA es **solo crear su cuenta**. |

## 2. Lo que ve la clienta en la página de ventas

1. **La biblioteca en 3D.** Desliza los 13 libros; con el mouse aparece el cursor redondo y la portada se inclina. Al tocar la portada **no se abre el libro** (eso es para quien compra): la lleva a las 2 ofertas.
2. **El video de la biblioteca** a todo lo ancho, justo debajo: en el celular el vertical (9:16) y en el computador el horizontal (16:9). Empieza a cargar en cuanto abre la página y se reproduce solo, sin sonido; tiene botón «Activar sonido» y pausa. Usa una versión liviana (2 MB en celular).
3. Los dolores, las cifras, los 3 caminos y **los 13 libros con su valor**.
4. **PLENA**: su video de lanzamiento a todo lo ancho y qué hay dentro.
5. **Las 2 ofertas**, una al lado de la otra, con contador de 15 minutos y una tabla para comparar.
6. Cómo funciona, para quién es, fuentes, preguntas frecuentes y el cierre.

Los videos están en Cloudinary (cuenta `qff0gu4u`). Para cambiarlos, sube los nuevos y reemplaza las direcciones `data-src` y `data-poster` en `sitio/public/oferta/index.html` (busca `cloudinary`). Usa siempre la versión liviana `…/video/upload/q_auto:eco,w_720,vc_h264/…` (celular) o `w_1280` (computador) y la miniatura `…/video/upload/so_2,w_720,q_auto:eco/….jpg`.

## 3. Las 2 ofertas

| | Biblioteca PAUSA | Libros + PLENA |
|---|---|---|
| Qué recibe | Los 13 libros en PDF | Los 13 libros + PLENA (10 módulos, 132 videos) + Mi diario + logros y certificado |
| Precio de bienvenida (15 min) | 12 USD | 19 USD |
| Precio normal | 24 USD | 37 USD |
| Correo que le llega | «Tu Biblioteca PAUSA está lista» → abre su biblioteca 3D | «Crea tu cuenta de PLENA» → crea su contraseña |
| Página después de pagar | Su biblioteca 3D: toca un libro, lo lee completo y lo descarga | Solo el registro de su cuenta (los libros están dentro de PLENA) |

- La oferta de 15 minutos la controla el servidor: no se puede trucar cambiando la hora del celular.
- Quien compró solo los libros ve en su página de descargas el botón **«Sumar PLENA»** y paga solo la diferencia.
- Precios: se cambian en `sitio/lib/catalog.js` (ver [04 · Productos y precios](04-PRODUCTOS-Y-PRECIOS.md)).

## 4. Qué pasa después de pagar

**Por la web (con Whop configurado):**

1. La clienta elige la oferta, escribe su nombre, correo y WhatsApp, y paga en Whop.
2. Whop avisa al sitio (webhook) y el pedido queda **pagado**.
3. Le llega el correo que corresponde a su oferta. Además, vuelve a la página de gracias:
   - **Biblioteca PAUSA:** ve su biblioteca 3D; toca un libro, lo lee completo y lo descarga.
   - **Libros + PLENA:** crea su cuenta (correo + contraseña) y entra a PLENA. Nunca le enviamos la contraseña por correo. Al crearla le llega «Tu cuenta de PLENA está lista».

**Directo en Whop (enlace de pago de Whop, sin pasar por la web):** el sitio crea el pedido solo y envía el correo. El producto de Whop decide qué recibe: el de PLENA (`WHOP_PRODUCT_ID`) da todo; el de libros (`WHOP_PRODUCTO_LIBROS`) da solo los libros. Ver [02 · Whop](02-WHOP.md).

**Por WhatsApp (sin página web).** Tienes dos caminos, y en los dos el acceso le llega solo por correo:

*A) Le mandas el enlace de pago de Whop (automático, recomendado).* Copia y pega en el chat:

| Oferta | Enlace de pago |
|---|---|
| Libros + PLENA (19 USD) | https://whop.com/checkout/plan_DsdwKF5WepIjn |
| Biblioteca PAUSA (12 USD) | https://whop.com/checkout/plan_lXm2MW9MtlVRs |

Mensaje sugerido: «¡Hola! Aquí puedes pagar con tarjeta, Nequi, PSE o PayPal: [enlace]. Escribe bien tu correo: ahí te llega tu acceso en cuanto pagues.» Ella paga en Whop, Whop avisa al sitio y le llega el correo correcto (crear cuenta o su biblioteca). Tú no haces nada más. En el panel aparece como «whop-directo».

*B) Te paga por transferencia, Nequi o efectivo.*

1. Confirmas el pago en tu banco.
2. Entras al panel → **Venta manual** → escribes nombre, correo y WhatsApp, eliges la oferta (**PLENA completa** o **Biblioteca PAUSA**), el monto y el método.
3. Al guardar, el sistema le envía el correo correcto. El enlace queda copiado por si también quieres mandárselo por WhatsApp.

Si el correo no llega: pídele que mire **Spam** o **Promociones**. Desde el panel puedes reenviarlo o corregir el correo con **Poner correo**.

## 5. Tu panel (`/oferta/admin.html`)

- Lista de pedidos con búsqueda y filtros, columna **Cuenta** (si ya creó su cuenta de PLENA) y exportar a CSV.
- **Venta manual** (WhatsApp), **Poner correo**, reenviar correos, dar **cortesías** y **revocar** o reactivar accesos.
- Ver [05 · Panel y claves](05-PANEL-Y-CLAVES.md).

## 6. Probar sin cobrar (enlace privado)

Mientras exista la variable `PRUEBA_GRATIS` en Vercel, el enlace `https://menopausia-equilibrada.vercel.app/oferta/?prueba=<VALOR_DE_PRUEBA_GRATIS>` registra la compra a 0 USD y envía los correos reales. Sirve para las dos ofertas: elige la que quieras probar.

**Cuando termines de probar, borra `PRUEBA_GRATIS` en Vercel** (Settings → Environment Variables) y vuelve a desplegar. Sin esa variable, el enlace de prueba deja de funcionar.

## 7. Whop (tu pasarela de pago)

Ya está creado en Whop:

| Qué | Id |
|---|---|
| Negocio «Academia PLENA · Menopausia sin tabú» | `biz_qWn8dWaHUeNR9L` |
| Producto «Libros + PLENA» (plan 19 USD `plan_DsdwKF5WepIjn`) | `prod_ldIPX7rlybDda` |
| Producto «Biblioteca PAUSA · 13 libros» (plan 12 USD `plan_lXm2MW9MtlVRs`) | `prod_7Dd9oVgYJtlYU` |

Y en Vercel ya están `WHOP_COMPANY_ID`, `WHOP_PRODUCT_ID` y `WHOP_PRODUCTO_LIBROS`. **Faltan 2 claves que solo tú puedes crear** en Whop (por seguridad no se pueden crear desde aquí):

1. **Clave de API.** Whop → negocio «Academia PLENA» → **Developer** → **API keys** → **Create**. Dale los permisos `payment:basic:read`, `member:basic:read`, `member:email:read`, `member:phone:read`, `plan:create`, `checkout_configuration:create`, `access_pass:basic:read` y `webhook_receive:payments`. Cópiala en Vercel como `WHOP_API_KEY` (tipo *Sensitive*).
2. **Webhook.** Whop → **Developer** → **Webhooks** → **Create webhook**: URL `https://menopausia-equilibrada.vercel.app/api/whop-webhook`, evento `payment.succeeded` (versión API v1). Copia el secreto `ws_…` en Vercel como `WHOP_WEBHOOK_SECRET` (*Sensitive*).
3. Vuelve a desplegar (Vercel → Deployments → Redeploy). Desde ese momento la web cobra sola con Whop (tarjeta, Nequi, PSE, PayPal, Apple Pay…) y los enlaces de WhatsApp entregan solos.

Termina también la verificación del negocio en Whop (Settings → Payouts) para poder retirar el dinero.

## 8. Correo profesional (que no llegue a spam)

Hoy los correos salen de tu Gmail con el nombre **«Academia PLENA»**. Para que salgan de una dirección como **hola@academiamenopausia.com** (más confianza y menos spam):

1. Compra el dominio `academiamenopausia.com` (está libre: 11,25 USD al año en Vercel → Domains).
2. Crea una cuenta en un servicio de envío (por ejemplo **Resend**, gratis hasta 3.000 correos al mes), agrega el dominio y copia los registros DNS que te da (SPF y DKIM) en Vercel → Domains → DNS.
3. En Vercel pon: `SMTP_HOST=smtp.resend.com`, `SMTP_PORT=465`, `SMTP_USER=resend`, `SMTP_PASS=<tu clave de Resend>` (*Sensitive*) y `MAIL_FROM=hola@academiamenopausia.com`. Redespliega. El sitio deja de usar Gmail solo.

**La foto de perfil en Gmail:** Gmail muestra la foto de tu cuenta de Google solo si es pública: myaccount.google.com → Información personal → Foto → «Quién puede ver tu foto» → **Cualquier persona**. Puede tardar 1–2 días en verse y solo aparece en Gmail (Outlook y el correo del iPhone no muestran fotos). Con dominio propio, la foto requiere BIMI y un certificado de marca (caro); no hace falta para vender.

## 9. Privacidad (lo que puedes decirle a una clienta)

- Su cuenta es personal: correo y contraseña. Nadie más conoce su contraseña.
- Lo que escribe en Mi diario se guarda **cifrado** con su contraseña.
- Puede descargar sus datos o borrar su cuenta desde su perfil en PLENA.
- Política completa: `/privacidad.html`.
