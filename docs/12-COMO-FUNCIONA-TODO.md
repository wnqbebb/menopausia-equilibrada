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
| `/oferta/gracias.html` | Página de descargas y de crear cuenta (llega sola después de pagar). |

## 2. Lo que ve la clienta en la página de ventas

1. **La biblioteca en 3D.** Desliza los 13 libros, toca una portada y lee un adelanto (hasta 4 páginas). Al final del adelanto la invitamos a ver las ofertas. Los PDF completos solo se entregan después de pagar.
2. **El video de la biblioteca** a todo lo ancho: en el celular se ve el vertical (9:16) y en el computador el horizontal (16:9). Empieza sin sonido; tiene botón «Activar sonido» y botón de pausa. Solo se descarga el video que se ve, y solo cuando la clienta llega a esa parte.
3. Los dolores, las cifras, los 3 caminos y **los 13 libros con su valor**.
4. **PLENA**: su video de lanzamiento a todo lo ancho y qué hay dentro.
5. **Las 2 ofertas**, una al lado de la otra, con contador de 15 minutos y una tabla para comparar.
6. Cómo funciona, para quién es, fuentes, preguntas frecuentes y el cierre.

Los videos están en Cloudinary (cuenta `qff0gu4u`). Para cambiarlos, sube los nuevos y reemplaza las direcciones `data-src` y `data-poster` en `sitio/public/oferta/index.html` (busca `cloudinary`). Usa siempre la versión ligera `…/video/upload/q_auto/…` y la miniatura `…/video/upload/so_2/….jpg`.

## 3. Las 2 ofertas

| | Biblioteca PAUSA | Libros + PLENA |
|---|---|---|
| Qué recibe | Los 13 libros en PDF | Los 13 libros + PLENA (10 módulos, 132 videos) + Mi diario + logros y certificado |
| Precio de bienvenida (15 min) | 12 USD | 19 USD |
| Precio normal | 24 USD | 37 USD |
| Correo que le llega | «Tus libros de PAUSA están listos» → botón para descargar | «Crea tu cuenta de PLENA» → crea su contraseña |

- La oferta de 15 minutos la controla el servidor: no se puede trucar cambiando la hora del celular.
- Quien compró solo los libros ve en su página de descargas el botón **«Sumar PLENA»** y paga solo la diferencia.
- Precios: se cambian en `sitio/lib/catalog.js` (ver [04 · Productos y precios](04-PRODUCTOS-Y-PRECIOS.md)).

## 4. Qué pasa después de pagar

**Por la web (con Whop configurado):**

1. La clienta elige la oferta, escribe su nombre, correo y WhatsApp, y paga en Whop.
2. Whop avisa al sitio (webhook) y el pedido queda **pagado**.
3. Le llega el correo que corresponde a su oferta. Además, vuelve a la página de gracias:
   - **Biblioteca PAUSA:** ve sus 13 descargas.
   - **Libros + PLENA:** crea su cuenta (correo + contraseña) y entra a PLENA. Nunca le enviamos la contraseña por correo.

**Directo en Whop (enlace de pago de Whop, sin pasar por la web):** el sitio crea el pedido solo y envía el correo. El producto de Whop decide qué recibe: el de PLENA (`WHOP_PRODUCT_ID`) da todo; el de libros (`WHOP_PRODUCTO_LIBROS`) da solo los libros. Ver [02 · Whop](02-WHOP.md).

**Por WhatsApp (te pagan por transferencia, Nequi, etc.):**

1. Confirmas el pago en tu banco.
2. Entras al panel → **Venta manual** → escribes nombre, correo y WhatsApp, eliges la oferta (**PLENA completa** o **Biblioteca PAUSA**), el monto y el método.
3. Al guardar, el sistema le envía el correo correcto. Tú no tienes que mandar archivos.

Si el correo no llega: pídele que mire **Spam** o **Promociones**. Desde el panel puedes reenviarlo o corregir el correo con **Poner correo**.

## 5. Tu panel (`/oferta/admin.html`)

- Lista de pedidos con búsqueda y filtros, columna **Cuenta** (si ya creó su cuenta de PLENA) y exportar a CSV.
- **Venta manual** (WhatsApp), **Poner correo**, reenviar correos, dar **cortesías** y **revocar** o reactivar accesos.
- Ver [05 · Panel y claves](05-PANEL-Y-CLAVES.md).

## 6. Probar sin cobrar (enlace privado)

Mientras exista la variable `PRUEBA_GRATIS` en Vercel, el enlace `https://menopausia-equilibrada.vercel.app/oferta/?prueba=<VALOR_DE_PRUEBA_GRATIS>` registra la compra a 0 USD y envía los correos reales. Sirve para las dos ofertas: elige la que quieras probar.

**Cuando termines de probar, borra `PRUEBA_GRATIS` en Vercel** (Settings → Environment Variables) y vuelve a desplegar. Sin esa variable, el enlace de prueba deja de funcionar.

## 7. Lo que falta para cobrar solo (Whop)

Hoy la web está en modo **pedido**: registra el pedido y te avisa, pero no cobra. Para cobrar automáticamente con Whop hace falta, en Vercel:

- `WHOP_API_KEY` (con el permiso de leer el correo del miembro), `WHOP_COMPANY_ID`, `WHOP_PRODUCT_ID` y `WHOP_WEBHOOK_SECRET`;
- opcional: `WHOP_PRODUCTO_LIBROS` si también vendes los libros con un enlace directo de Whop.

Los pasos están en [02 · Whop](02-WHOP.md).

## 8. Privacidad (lo que puedes decirle a una clienta)

- Su cuenta es personal: correo y contraseña. Nadie más conoce su contraseña.
- Lo que escribe en Mi diario se guarda **cifrado** con su contraseña.
- Puede descargar sus datos o borrar su cuenta desde su perfil en PLENA.
- Política completa: `/privacidad.html`.
