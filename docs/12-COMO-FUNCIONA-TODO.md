# 12 · Cómo funciona todo (guía rápida)

Esta guía explica en palabras sencillas el recorrido completo: qué ve la clienta, qué compra, qué le llega y qué haces tú. Los detalles técnicos están en las demás guías.

## 1. Las direcciones importantes

| Dirección | Para qué |
|---|---|
| `https://menopausia-equilibrada.vercel.app/oferta/` | **Página de ventas** (la que pones en anuncios, bio y WhatsApp). |
| **`/mis-libros?k=CLAVE`** | **Acceso directo a los libros (ya te pagó por fuera).** Abre su biblioteca 3D: leer, descargar cada libro o los 13 en ZIP. Sin pago ni registro. |
| **`/bienvenida?k=CLAVE`** | **Acceso directo a PLENA (ya te pagó por fuera).** Bienvenida + video + escribe su correo → le llega «Crea tu cuenta» (con aviso de revisar Spam) y puede crearla ahí mismo. |
| `/oferta/comprar.html?o=libros` · `?o=todo` | Pago directo con Whop (nombre + correo → paga en su moneda → acceso). |
| `/oferta/?oferta=libros` | Abre directo el pedido de la Biblioteca PAUSA. |
| `/oferta/?oferta=todo` | Abre directo el pedido de Libros + PLENA. |
| `/plena/` | PLENA, la academia. Las clientas entran con su correo y su contraseña. |
| `/oferta/admin.html` | **Tu panel de pedidos** (pide tu `ADMIN_KEY`). |
| `/oferta/gracias.html` | Después de pagar: con la Biblioteca PAUSA es **su biblioteca 3D** (leer y descargar cada libro); con PLENA es **solo crear su cuenta**. |

## 2. Lo que ve la clienta en la página de ventas

1. **La biblioteca en 3D.** Desliza los 13 libros; con el mouse aparece el cursor redondo y la portada se inclina. Al tocar la portada **no se abre el libro** (eso es para quien compra): la lleva a las 2 ofertas.
2. **El video de la biblioteca** a todo lo ancho, justo debajo: en el celular el vertical (9:16) y en el computador el horizontal (16:9). Empieza a cargar en cuanto abre la página y se reproduce solo, sin sonido. En el centro tiene el botón grande **«Ver con sonido»**: al tocarlo el video vuelve a empezar desde el principio con sonido. Tocar el video lo vuelve a silenciar. Usa una versión liviana (2 MB en celular).
3. Los dolores, las cifras, los 3 caminos y **los 13 libros con su valor**.
4. **PLENA**: su video de lanzamiento a todo lo ancho y qué hay dentro.
5. **Las 2 ofertas**, una al lado de la otra, con contador de 15 minutos y una tabla para comparar.
6. Cómo funciona, para quién es, fuentes, preguntas frecuentes y el cierre.

Los videos están en Cloudinary (cuenta `qff0gu4u`). Para cambiarlos, sube los nuevos y reemplaza las direcciones `data-src` y `data-poster` en `sitio/public/oferta/index.html` (busca `cloudinary`). Usa siempre la versión liviana `…/video/upload/q_auto:eco,w_720,vc_h264/…` (celular) o `w_1280` (computador) y la miniatura `…/video/upload/so_2,w_720,q_auto:eco/….jpg`.

## 3. Las 2 ofertas

| | Biblioteca PAUSA | Libros + PLENA |
|---|---|---|
| Qué recibe | Los 13 libros en PDF | Los 13 libros + PLENA (10 módulos, 132 videos) + Mi diario + logros y certificado |
| Precio (fijo, en la moneda de su país) | 12 USD | 19 USD |
| Correo que le llega | «Tu Biblioteca PAUSA está lista» → abre su biblioteca 3D | «Crea tu cuenta de PLENA» → crea su contraseña |
| Página después de pagar | Su biblioteca 3D: toca un libro, lo lee completo y lo descarga | Solo el registro de su cuenta (los libros están dentro de PLENA) |

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

*A) Ya te pagó por banco, Nequi o efectivo → le mandas su enlace de acceso (lo más rápido).*

| Qué compró | Enlace para mandar por WhatsApp |
|---|---|
| Solo los libros | `https://menopausia-equilibrada.vercel.app/mis-libros?k=` + el valor de `ACCESO_LIBROS` |
| Libros + PLENA | `https://menopausia-equilibrada.vercel.app/bienvenida?k=` + el valor de `ACCESO_PLENA` |

(Las claves están solo en Vercel → Settings → Environment Variables, nunca en GitHub. Guarda los dos enlaces completos en tus respuestas rápidas de WhatsApp.)

- **Libros:** abre su biblioteca 3D al instante. Toca un libro, lo lee completo y lo descarga; abajo puede bajar los 13 en un solo ZIP o uno por uno.
- **PLENA:** ve «¡Bienvenida! Ya estás aquí», el video de PLENA (con el botón «Ver con sonido»), escribe su nombre y su correo, y le llega «Crea tu cuenta de PLENA». La página le dice que revise Spam o Promociones y le da el botón «Crear mi cuenta ahora» para no esperar el correo. Su pedido aparece en tu panel como «whatsapp-enlace».
- Si escribe el mismo correo dos veces, no se duplica: se le reenvía el enlace (o se le dice que ya tiene cuenta).
- **Cuida estos enlaces:** quien los tenga entra. Si uno se filtra, cambia `ACCESO_LIBROS` o `ACCESO_PLENA` en Vercel (12 o más letras y números) y redespliega: el enlace viejo deja de funcionar. Las cuentas ya creadas siguen funcionando.

*C) Quieres que pague con tarjeta desde el celular.* Mándale `https://menopausia-equilibrada.vercel.app/oferta/comprar.html?o=libros` (12 USD) o `?o=todo` (19 USD): escribe su correo, paga en Whop en su moneda y recibe su acceso.

*B) Te paga por transferencia, Nequi o efectivo.*

1. Confirmas el pago en tu banco.
2. Entras al panel → **Venta manual** → escribes nombre, correo y WhatsApp, eliges la oferta (**PLENA completa** o **Biblioteca PAUSA**), el monto y el método.
3. Al guardar, el sistema le envía el correo correcto. El enlace queda copiado por si también quieres mandárselo por WhatsApp.

Si el correo no llega: pídele que mire **Spam** o **Promociones**. Desde el panel puedes reenviarlo o corregir el correo con **Poner correo**.

## 5. Tu panel (`/oferta/admin.html`)

- Lista de pedidos con búsqueda y filtros, columna **Cuenta** (si ya creó su cuenta de PLENA) y exportar a CSV.
- **Venta manual** (WhatsApp), **Poner correo**, reenviar correos, dar **cortesías** y **revocar** o reactivar accesos.
- Ver [05 · Panel y claves](05-PANEL-Y-CLAVES.md).

## 6. Probar sin cobrar

**Códigos de 100 % en Whop** (5 usos cada uno, hasta el 31-12-2026): `PLENAPRUEBA1`, `PLENAPRUEBA2`, `PLENAPRUEBA3`. Ponlos en la pantalla de pago de Whop. El sitio entrega igual (aunque pague 0) y lo anota en el pedido. Bórralos en Whop → Promo codes cuando termines.

**Enlace privado**

Mientras exista la variable `PRUEBA_GRATIS` en Vercel, el enlace `https://menopausia-equilibrada.vercel.app/oferta/?prueba=<VALOR_DE_PRUEBA_GRATIS>` registra la compra a 0 USD y envía los correos reales. Sirve para las dos ofertas: elige la que quieras probar.

**Cuando termines de probar, borra `PRUEBA_GRATIS` en Vercel** (Settings → Environment Variables) y vuelve a desplegar. Sin esa variable, el enlace de prueba deja de funcionar.

## 7. Whop (tu pasarela de pago)

### El pago dentro de la página
En la página de ventas, al elegir una oferta se abre el panel «Tu pedido» con **el pago de Whop dentro de la misma página** (en español y en la moneda de cada país). No sale de la web.

- **Oferta irresistible al pagar:** si eligió solo los libros, arriba del pago aparece «Sí, súmame PLENA por solo USD 7 más». Al tocarlo, el pago cambia solo a Libros + PLENA (19 USD).
- **Al terminar de pagar:** confeti, «¡Tu pago está listo!», el aviso de revisar Spam o Promociones y, en cuanto Whop avisa al sitio, el botón **«Abrir mi biblioteca»** o **«Crear mi cuenta de PLENA»**.
- **Última oferta:** si compró solo los libros, en esa misma pantalla le aparece «Suma PLENA por solo USD 7» con su propio pago (plan «Mejora a PLENA», `plan_fbPqZmH1WSsQS`, solo por enlace).
- Si paga con un método que sale a otra página (PSE, Nequi…), vuelve a `/oferta/gracias.html?whop=1` y ahí recibe el mismo botón.

### Dentro de Whop (solo un acceso simple)
Whop se usa como **procesador de pagos**. Dentro de cada producto hay un solo acceso:

| Producto de Whop | Lo que ve al pagar |
|---|---|
| Biblioteca PAUSA · 13 libros | **📚 Biblioteca PAUSA** → botón «Abrir mis 13 libros» (su biblioteca 3D) |
| Libros + PLENA | **💗 App PLENA** → botón «Entrar a PLENA» y el aviso de buscar el correo «Crea tu cuenta de PLENA» (o en Spam) |

### ¿A dónde va el dinero?
Cada pago entra al **saldo del negocio «Academia PLENA · Menopausia sin tabú» en Whop** (Whop → Balance). Ya puede recibir pagos con tarjeta y banco. Para **retirarlo** a tu cuenta falta, en Whop:
1. **Verificar tu identidad** (Balance → Verify now).
2. **Activar 2FA** para el equipo (Team → Require 2FA).
3. **Agregar tu método de retiro** (cuenta bancaria) en Balance → Payout methods. Los retiros son manuales: tú decides cuándo.

### Imágenes
Ya están puestos el logo, la portada del negocio y las galerías de los dos productos.

### Ids
| Qué | Id |
|---|---|
| Negocio «Academia PLENA · Menopausia sin tabú» | `biz_qWn8dWaHUeNR9L` |
| Producto «Libros + PLENA» (plan 19 USD `plan_DsdwKF5WepIjn`; mejora 7 USD `plan_fbPqZmH1WSsQS`) | `prod_ldIPX7rlybDda` |
| Producto «Biblioteca PAUSA · 13 libros» (plan 12 USD `plan_lXm2MW9MtlVRs`) | `prod_7Dd9oVgYJtlYU` |

### Conectar Whop con el sitio (un solo paso)
1. Entra a **https://whop.com/dashboard/developer** (arriba elige el negocio «Academia PLENA · Menopausia sin tabú»).
2. En **Account API Keys** toca **Create**, ponle de nombre «Sitio PLENA» y dale el rol **Admin**. Copia la clave (empieza por `whop_`).
3. En Vercel → proyecto → **Settings → Environment Variables** crea `WHOP_API_KEY` con esa clave (tipo **Sensitive**, Production y Preview) y vuelve a desplegar (Deployments → ⋯ → Redeploy).
4. Abre la página de ventas una vez (o toca **«Conectar Whop»** en tu panel `/oferta/admin.html`): **el sitio crea solo el webhook en Whop** y guarda su secreto. No hay que copiar nada más.

Desde ese momento cada pago (también con cupón del 100 %) crea el pedido en tu panel, envía el correo y muestra el botón de acceso al terminar de pagar.

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
