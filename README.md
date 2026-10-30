# Menopausia sin tabú · negocio digital completo (Vercel)

Todo lo necesario para vender, entregar y dar soporte a dos productos digitales para mujeres de 40 a 60 años. Funciona **100% en Vercel**.

- **PAUSA**: libro de 60 páginas, 3 plantillas rellenables y 4 kits.
- **Menopausia Equilibrada**: Guía Integral y 6 bonos.
- **App Menopausia Equilibrada** («Mi diario», dentro de PLENA):
  - diario, plan de 30 días, plantillas e informe PDF;
  - copia cifrada entre dispositivos;
  - acceso solo para compradoras, con su cuenta.
- **Página de ventas única**:
  - oferta de 15 minutos;
  - carrito y venta por separado;
  - mejora a «Todo junto»;
  - página de descargas.
- **Cuentas personales** (correo + contraseña, Supabase) y correo de bienvenida desde Gmail.
- **PLENA · Academia de Menopausia y Psicomenopausia** (`/plena/`): academia de 10 módulos con ruta personal, videoteca de 132 clases, libros que se hojean como un libro de verdad, la app integrada como «Mi diario», gamificación (XP, niveles, insignias, rachas y misiones) y certificado. Incluida en el pack.
- **Panel de pedidos**: búsqueda, filtros, CSV, cortesías y revocación de accesos.
- **Pagos**: Whop (automático), Stripe, enlaces de Hotmart o Mercado Pago, o cobro manual.

Sitio en vivo de referencia: https://menopausia-equilibrada.vercel.app/oferta/

---

## Carpetas

| Carpeta | Qué contiene |
|---|---|
| `sitio/` | **El proyecto de Vercel.** `public/` (páginas, app, imágenes, PDF), `api/` (funciones del servidor), `lib/` (catálogo, precios y base de datos), `vercel.json` y `pruebas/`. |
| `productos/` | Portadas, capturas de las páginas de venta y ejemplo del informe de la app. Los PDF de venta están en `sitio/public/entrega-…/`. |
| `disenos/` | Diseños originales página por página, guía de marca y fuentes. |
| `imagenes-soul/` | Imágenes de Higgsfield Soul 2.0: originales (4 por prompt), editadas y prompts. |
| `herramientas/` | Scripts para exportar los diseños a PDF rellenables y pruebas de la app en el navegador. |
| `docs/` | Guías paso a paso. |

## Guías

1. [Desplegar en Vercel](docs/01-DESPLEGAR.md): de cero a sitio en vivo.
2. [Cobrar con Whop](docs/02-WHOP.md)
3. [Otras pasarelas](docs/03-PAGOS.md)
4. [Productos, precios y oferta](docs/04-PRODUCTOS-Y-PRECIOS.md)
5. [Panel, claves y base de datos](docs/05-PANEL-Y-CLAVES.md)
6. [La app](docs/06-APP.md)
7. [Escala: 1.000+ compras y límites](docs/07-ESCALA-Y-LIMITES.md)
8. [Embudo y píxeles](docs/08-EMBUDO-Y-PIXEL.md)
9. [Diseños, imágenes y PDF](docs/09-DISENOS-E-IMAGENES.md)
10. [PLENA: la plataforma del curso](docs/10-PLENA.md): editar módulos, lecturas, quiz e insignias.
11. [Cuentas de PLENA, Supabase y Gmail](docs/11-CUENTAS-Y-SUPABASE.md): lo que tienes que configurar tú, paso a paso.

## Arranque rápido

```bash
git clone https://github.com/wnqbebb/menopausia-equilibrada.git
cd menopausia-equilibrada/sitio
npm install
npm run prueba-carga     # simula 1.000 compras con las funciones reales
```

Pasos en Vercel (detalle en la guía 01):

1. **Import** del repositorio con **Root Directory** `sitio`.
2. Conecta la base de datos en **Storage**: Upstash Redis (recomendada) o Blob privado.
3. Crea las variables `ADMIN_KEY` y `PUBLIC_URL`.
4. Añade las variables de tu pasarela (Whop, Stripe o enlaces).
5. Haz **Redeploy**.

## Variables de entorno

| Variable | Obligatoria | Para qué |
|---|---|---|
| `ADMIN_KEY` | Sí | Clave del panel y firma de enlaces, códigos de la app y ofertas. |
| `PUBLIC_URL` | Recomendada | Dominio público, usado en los enlaces de entrega. |
| `FILES_BASE` | Opcional | Otra carpeta o CDN para los PDF. Si no se pone, salen del propio Vercel (recomendado). |
| `KV_REST_API_URL` + `KV_REST_API_TOKEN` (o `UPSTASH_REDIS_REST_*`) | Una base de datos | Upstash Redis. Se crean solas al conectarla en Storage. |
| `BLOB_READ_WRITE_TOKEN` | Una base de datos | Vercel Blob privado. Se crea sola al conectarlo en Storage. |
| `WHOP_API_KEY`, `WHOP_COMPANY_ID`, `WHOP_PRODUCT_ID`, `WHOP_WEBHOOK_SECRET` | Para Whop | Cobro y entrega automática. |
| `STRIPE_SECRET_KEY` | Para Stripe | Cobro con Stripe. |
| `PAY_LINK_TODO`, `PAY_LINK_<ID>` | Para enlaces | Hotmart, Mercado Pago, etc. |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Sí (PLENA) | Cuentas, progreso, diario cifrado y fotos (guía 11). La secreta solo en Vercel. |
| `GMAIL_USER`, `GMAIL_APP_PASSWORD` | Sí (correos) | Correo de bienvenida y enlace para crear la cuenta (guía 11). |

Plantilla: [`sitio/.env.example`](sitio/.env.example).

## Seguridad

- **Nunca** subas tu `ADMIN_KEY` real ni las claves de pago al repositorio. Van solo en **Vercel → Settings → Environment Variables**.
- El repositorio es público: cualquiera puede ver el código y descargar los PDF. Si eso te importa, usa un repositorio privado.
- Los enlaces de descarga (y para crear la cuenta) van firmados con `ADMIN_KEY`. Si la cambias, los enlaces antiguos dejan de funcionar.
- La `SUPABASE_SERVICE_ROLE_KEY` y la contraseña de aplicación de Gmail van **solo** en Vercel.
- Vercel Hobby es solo para uso no comercial: para vender, usa **Vercel Pro**.

## Aviso

El contenido es informativo y no sustituye la consulta médica. Las imágenes fueron generadas con IA (Higgsfield Soul 2.0).

© 2026 DisierTECH
