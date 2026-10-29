# 7 · Escala: ¿qué pasa con 1.000 (o 5.000) compras?

## Lo que se probó

`npm run prueba-carga` (`sitio/pruebas/carga-1000-compras.mjs`) ejecuta las funciones reales de `sitio/api/` con 40 compras a la vez:

| Prueba | Memoria · 1.000 | Memoria · 5.000 | Redis (emulador Upstash) · 2.000 |
|---|---|---|---|
| Pedidos creados | 0 errores | 0 errores, 0 duplicados | 0 errores |
| Panel, página 1 (100 pedidos) | 27 ms | 20 ms | 25 ms |
| Webhooks de Whop (50% pagados) | 500 pagados | 2.500 pagados | 1.000 pagados |
| Filtro «pagados» / CSV completo | correctos | 32 ms / 0,6 s | 39 ms / 0,3 s |
| Entrega, app, sincronización, mejora con firma, rechazo de firmas falsas | correctos | correctos | correctos |

Además se verificó en vivo, en Vercel, el flujo pedido → pagado → descargas → app.

Medidas para que aguante:

- Los números de pedido empiezan por la hora. En Redis hay un índice ordenado, así que el panel lista los más recientes sin leer toda la base.
- Los pedidos se crean con escritura condicional (`SET NX` o sin sobrescribir), así que dos compras simultáneas nunca se pisan.
- La app sincroniza de forma moderada (ver guía 06) y solo con un código de acceso válido.
- Los precios se calculan siempre en el servidor y los enlaces van firmados.
- Los PDF (unos 50 MB por pack) salen del propio Vercel, desde el CDN y con caché.

## Límites que importan

| Recurso | Qué consume | Recomendación |
|---|---|---|
| **Plan de Vercel** | Hobby es solo para uso **no comercial** | **Vercel Pro** (unos 20 USD/mes) en cuanto vendas |
| Transferencia de Vercel | Páginas e imágenes (unos 1–2 MB por visita, con caché) más los PDF | Hobby incluye 100 GB al mes; Pro, bastante más |
| Funciones de Vercel | Unas 10–20 llamadas por compra + sincronización de la app | Sobra con 1.000–5.000 compras al mes |
| **Base de datos** | Cada compra y cada cambio en la app es una escritura | **Upstash Redis** para cientos o miles de ventas. Vercel Blob gratis tiene un cupo de escrituras pequeño: úsalo solo para empezar. |
| Descargas de PDF | 50 MB por pack completo | Hobby: 100 GB al mes (unos 2.000 packs). Pro: bastante más (del orden de 1 TB, unos 20.000 packs; revisa la tabla de precios vigente de Vercel). |

## Recomendación según volumen

| Ventas al mes | Configuración |
|---|---|
| Pruebas | Vercel Hobby + Vercel Blob |
| Desde la primera venta real | **Vercel Pro** + **Upstash Redis** + Whop |
| 2.000+ | Lo mismo. Revisa el uso de Upstash (Storage → tu base de datos → Usage) y sube de plan si se acerca al límite. |

## Vigilar

- Vercel → **Usage**: transferencia, funciones y almacenamiento.
- Vercel → **Logs**: errores de `/api/*`.
- Panel → **Descargar CSV** cada semana como copia de seguridad.
- Whop → **Developer → Webhooks**: entregas fallidas.
