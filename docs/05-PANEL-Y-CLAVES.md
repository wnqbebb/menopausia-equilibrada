# 5 · Panel, claves y accesos

## El panel (`/oferta/admin.html`)

Entra con tu `ADMIN_KEY`. Puedes:

- Ver los pedidos del más nuevo al más antiguo, de 100 en 100 por página.
- **Buscar** por nombre, correo, teléfono o número de pedido, y **filtrar** por estado: pagado, pendiente o por revisar.
- **Descargar todo en CSV** para abrirlo en Excel o Google Sheets. Incluye los enlaces de entrega y de la app.
- **Marcar pagado**: copia el enlace de entrega para enviarlo a la clienta.
- Copiar el **enlace de entrega** de cada pedido.
- Ver si la clienta ya creó su **cuenta de PLENA** (creada / sin cuenta / borrada) y si su último correo se envió o falló.
- **Reenviar enlace para crear cuenta**, **copiar enlace de cuenta** y **reenviar bienvenida** (guía 11).
- **Revocar** o reactivar el acceso, por ejemplo tras un contracargo. Revocar bloquea también su cuenta de PLENA.
- **Regalar acceso completo (cortesía)**: crea un pedido pagado de 0 USD con todo incluido y envía al correo el enlace para crear la cuenta.
- **Borrar** pedidos de prueba.

Estados:

| Estado | Significado |
|---|---|
| `pendiente` | Pedido creado, pago no confirmado. |
| `pagado` | Puede descargar y crear su cuenta de PLENA. |
| `revisar` | Whop confirmó un pago por un importe menor (por ejemplo, con un cupón). Revisa y márcalo pagado si está bien. |

## Claves

| Clave | Dónde vive | Qué protege |
|---|---|---|
| `ADMIN_KEY` | Variable de entorno de Vercel | Entrada al panel. También firma (HMAC-SHA256) los enlaces de entrega (que sirven para crear la cuenta) y la oferta de 15 min. |
| `WHOP_*`, `STRIPE_SECRET_KEY` | Variables de entorno | Cobros. |
| `SUPABASE_SERVICE_ROLE_KEY` | Variable de entorno de Vercel | Crear, bloquear y borrar cuentas. Es la llave maestra de Supabase: **solo** en Vercel. |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | Variables de entorno | Dirección y clave pública de Supabase (el navegador las recibe en `/api/config`). |
| `GMAIL_USER`, `GMAIL_APP_PASSWORD` | Variables de entorno | Envío de los correos. Si alguien ve la contraseña de aplicación, bórrala en https://myaccount.google.com/apppasswords y crea otra. |

Reglas:

- **Nunca** pongas claves reales en el código ni en GitHub. Usa siempre las variables de entorno del hosting.
- Para **cambiar la `ADMIN_KEY`**: cámbiala en Vercel (**Settings → Environment Variables**) y vuelve a desplegar. Todos los enlaces de entrega anteriores dejan de valer (los nuevos salen del panel). Las cuentas ya creadas siguen funcionando.
- Si crees que alguien vio tu clave, cámbiala.

## Enlaces que genera el sistema

- **Entrega y crear cuenta:** `/oferta/gracias.html?pedido=ID&t=FIRMA`. Solo funciona si el pedido está pagado. Ahí descarga sus archivos y crea su cuenta de PLENA.
- **Códigos antiguos de la app** (`/#acceso?k=ID-FIRMA`): ya no abren nada. Llevan a crear la cuenta de su pedido una sola vez.

El enlace de entrega se genera solo tras el pago (Whop o Stripe) y también en el panel.

## Base de datos

La elige sola `sitio/lib/store.js`:

- **Upstash Redis** (recomendada): cada pedido es la clave `ped:<id>` y el índice ordenado es `ped:idx`.
- **Vercel Blob privado**: archivos `pedidos/<id>.json`.
- Las **cuentas**, el progreso, el diario cifrado y las fotos están en **Supabase** (guía 11). Las claves antiguas `sync:<hash>` y `prog:<id>` de la versión con códigos ya no se usan; puedes borrarlas.

Cada pedido guarda también cuándo la clienta aceptó la política de privacidad (`consent`), como prueba de autorización (Ley 1581).

Exporta el CSV desde el panel con frecuencia como copia de seguridad.

## Privacidad (Ley 1581 de Colombia)

- Política pública: `/privacidad.html`. Contacto: cristinaaguilarrojas1@gmail.com.
- El checkout exige aceptar la política (casilla obligatoria; el servidor también lo verifica).
- Los datos de salud del diario solo salen del dispositivo si la usuaria lo autoriza, y siempre **cifrados** con una clave que solo se abre con su contraseña.
- Solicitudes de borrado: la usuaria borra su cuenta y todos sus datos en PLENA → Perfil → **Borrar mi cuenta** (o tú, desde Supabase; guía 11). Los datos de compra se borran con **Borrar** en el panel (si no hay obligación contable de conservarlos).
- Supabase y Gmail son **encargados del tratamiento** y están nombrados en la política de privacidad.
- Plazos legales de respuesta: consultas en 10 días hábiles y reclamos en 15 días hábiles.
