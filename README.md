# Menopausia sin tabú · negocio digital completo

Todo lo necesario para vender, entregar y dar soporte a dos productos digitales para mujeres de 40 a 60 años, ya probado en producción:

- **PAUSA**: libro de 60 páginas, 3 plantillas rellenables y 4 kits de venta adicional.
- **Menopausia Equilibrada**: Guía Integral y 6 bonos.
- **App Menopausia Equilibrada**: diario, plan de 30 días, plantillas, informe PDF, sincronización entre dispositivos y acceso solo para compradoras.
- **Página de ventas única** con oferta de 15 minutos, carrito, venta por separado, mejora a «Todo junto» y página de descargas.
- **Panel de administración** de pedidos: búsqueda, filtros, exportación a CSV, cortesías y revocación de accesos.

Sitio en vivo de referencia: https://menopausia-equilibrada.vercel.app/oferta/

---

## Qué hay en cada carpeta

| Carpeta | Qué contiene |
|---|---|
| `sitio/` | **El sistema completo.** Páginas (`public/`), app (`public/index.html` + `public/app.js`), funciones del servidor (`netlify/functions/`), catálogo y precios (`netlify/lib/catalog.mjs`) y los 13 PDF que se entregan (`public/entrega-…/`). Se publica en Netlify. |
| `frontal-vercel/` | Capa opcional que sirve el sitio desde un dominio de Vercel, sin la insignia de Netlify. |
| `productos/` | Portadas, capturas de las páginas de venta y un ejemplo del informe PDF de la app. Los PDF de venta están en `sitio/public/entrega-…/`. |
| `disenos/` | Los diseños originales, página por página (Claude Design), de PAUSA y de Menopausia Equilibrada. Son los que se exportan a PDF. |
| `imagenes-soul/` | Todas las imágenes generadas con Higgsfield Soul 2.0: `originales/` (4 por prompt), `editadas/` (recortes y versiones usadas) y el archivo con los prompts. |
| `herramientas/` | Scripts de Python y Playwright que convierten los diseños en PDF rellenables, y pruebas de la app. |
| `docs/` | Guías paso a paso (ver abajo). |

## Guías

1. [Desplegar el sitio (Netlify + Vercel)](docs/01-DESPLEGAR.md): de cero a sitio en vivo en unos 20 minutos.
2. [Cobrar con Whop](docs/02-WHOP.md): conectar Whop como pasarela, con entrega automática.
3. [Otras pasarelas](docs/03-PAGOS.md): Stripe, Hotmart, Mercado Pago o cobro manual.
4. [Productos, precios y oferta](docs/04-PRODUCTOS-Y-PRECIOS.md): cambiar precios, la oferta de 15 minutos y el pack.
5. [Panel, claves y accesos](docs/05-PANEL-Y-CLAVES.md): administración, claves y seguridad.
6. [La app](docs/06-APP.md): cómo funciona el acceso, la sincronización y el informe PDF.
7. [Escala: 1.000+ compras](docs/07-ESCALA-Y-LIMITES.md): capacidad probada, límites de los planes gratis y costos.
8. [Embudo y píxeles](docs/08-EMBUDO-Y-PIXEL.md): Meta, TikTok y Google; eventos de conversión ya conectados.
9. [Diseños, imágenes y PDF](docs/09-DISENOS-E-IMAGENES.md): editar los productos y volver a exportarlos.

## Arranque rápido (resumen)

```bash
git clone https://github.com/wnqbebb/menopausia-equilibrada.git
cd menopausia-equilibrada/sitio
npm install
npm run prueba-carga        # simula 1.000 compras en local y verifica todo
```

Luego sigue [docs/01-DESPLEGAR.md](docs/01-DESPLEGAR.md). Lo mínimo para tener el sitio en vivo:

1. Sube la carpeta `sitio/` a Netlify.
2. Crea la variable `ADMIN_KEY` con una clave larga inventada por ti.
3. Para cobrar automáticamente, añade las variables de Whop (o de Stripe).

## Variables de entorno (resumen)

| Variable | Obligatoria | Para qué |
|---|---|---|
| `ADMIN_KEY` | Sí | Clave del panel y firma de enlaces, códigos de la app y ofertas. Inventa una larga (32+ caracteres). |
| `PUBLIC_URL` | Recomendada | Dominio público, por ejemplo `https://tudominio.com`. Se usa en los enlaces de entrega. |
| `FILES_BASE` | Recomendada | Dónde están los PDF (CDN gratis, ver guía 07). Si no se pone, se sirven desde el propio sitio. |
| `WHOP_API_KEY`, `WHOP_COMPANY_ID`, `WHOP_PRODUCT_ID`, `WHOP_WEBHOOK_SECRET` | Para Whop | Cobro con Whop y entrega automática. |
| `STRIPE_SECRET_KEY` | Para Stripe | Cobro con Stripe. |
| `PAY_LINK_TODO`, `PAY_LINK_<ID>` | Para enlaces | Enlaces de pago de Hotmart, Mercado Pago, etc. (se confirma a mano). |

Hay una plantilla en [`sitio/.env.example`](sitio/.env.example).

## Seguridad

- **Nunca** subas tu `ADMIN_KEY` real ni las claves de Whop o Stripe al repositorio. Van solo en las variables de entorno del hosting.
- El repositorio es público: cualquiera puede ver el código y descargar los PDF de `sitio/public/entrega-…/`. Si vas a vender en serio, cambia el nombre de esa carpeta (y `DELIVERY_DIR` en `catalog.mjs`) o usa un repositorio privado.
- Los accesos a la app y los enlaces de descarga van firmados con `ADMIN_KEY`. Si la cambias, los enlaces antiguos dejan de funcionar.

## Aviso

El contenido es informativo y no sustituye la consulta médica. Las imágenes fueron generadas con IA (Higgsfield Soul 2.0).

© 2026 DisierTECH
