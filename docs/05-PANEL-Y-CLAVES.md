# 5 · Panel, claves y accesos

## El panel (`/oferta/admin.html`)

Entra con tu `ADMIN_KEY`. Puedes:

- Ver los pedidos del más nuevo al más antiguo, de 100 en 100 por página.
- **Buscar** por nombre, correo, teléfono o número de pedido, y **filtrar** por estado: pagado, pendiente o por revisar.
- **Descargar todo en CSV** para abrirlo en Excel o Google Sheets. Incluye los enlaces de entrega y de la app.
- **Marcar pagado**: copia el enlace de entrega para enviarlo a la clienta.
- Copiar el **enlace de entrega** y el **acceso a la app** de cada pedido.
- **Revocar** o reactivar el acceso a la app, por ejemplo tras un contracargo.
- **Regalar acceso completo (cortesía)**: crea un pedido pagado de 0 USD con todo incluido.
- **Borrar** pedidos de prueba.

Estados:

| Estado | Significado |
|---|---|
| `pendiente` | Pedido creado, pago no confirmado. |
| `pagado` | Puede descargar y usar la app. |
| `revisar` | Whop confirmó un pago por un importe menor (por ejemplo, con un cupón). Revisa y márcalo pagado si está bien. |

## Claves

| Clave | Dónde vive | Qué protege |
|---|---|---|
| `ADMIN_KEY` | Variable de entorno de Netlify | Entrada al panel. También firma (HMAC-SHA256) los enlaces de entrega, los códigos de la app y la oferta de 15 min. |
| `WHOP_*`, `STRIPE_SECRET_KEY` | Variables de entorno | Cobros. |

Reglas:

- **Nunca** pongas claves reales en el código ni en GitHub. Usa siempre las variables de entorno del hosting.
- Para **cambiar la `ADMIN_KEY`**: cámbiala en Netlify y vuelve a desplegar. Todos los enlaces de entrega y códigos de la app anteriores dejan de valer, así que los nuevos se generan desde el panel.
- Si crees que alguien vio tu clave, cámbiala.

## Enlaces que genera el sistema

- **Entrega:** `/oferta/gracias.html?pedido=ID&t=FIRMA`. Solo funciona si el pedido está pagado.
- **App:** `/#acceso?k=ID-FIRMA`. Abre la app y la desbloquea en ese dispositivo.

Los dos se generan solos tras el pago (Whop o Stripe) y también en el panel.

## Base de datos

Netlify Blobs, almacén `me-pedidos` (pedidos) y `me-sync` (datos de la app de cada usuaria). Se ven en Netlify → **Blobs**. Exporta el CSV con frecuencia como copia de seguridad.
