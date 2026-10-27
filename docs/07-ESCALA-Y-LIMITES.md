# 7 · Escala: ¿qué pasa con 1.000 (o 5.000) compras?

## Lo que se probó

`npm run prueba-carga` (archivo `sitio/pruebas/carga-1000-compras.mjs`) ejecuta las funciones reales contra una base de datos local:

| Prueba | 1.000 compras | 5.000 compras |
|---|---|---|
| Pedidos creados (40 a la vez) | 1,6 s, 0 errores | 9 s, 0 errores, 0 duplicados |
| Panel, página 1 (100 pedidos) | 0,25 s | 0,6 s |
| Webhooks de Whop (50% pagados) | 500 pagados | 2.500 pagados |
| Filtro «pagados» | 0,7 s | 3 s |
| Exportar CSV completo | 0,7 s | 3,5 s |
| Entrega, app, sincronización, mejora con firma | correctos | correctos |

Medidas para que aguante:

- Los números de pedido empiezan por la hora, así que el panel lista los más recientes **sin leer toda la base**.
- Se crean con escritura condicional (`onlyIfNew`): nunca se pisan dos pedidos aunque lleguen en el mismo milisegundo.
- Las lecturas se hacen en paralelo con un límite (24 a la vez).
- La app sincroniza de forma moderada (ver guía 06) y solo con un código de acceso válido.
- Los precios se calculan siempre en el servidor y los enlaces van firmados.

## El verdadero límite: los planes gratis del hosting

El código aguanta. Lo que se acaba antes es el **plan gratis**.

### Ancho de banda de los PDF (lo más pesado)

El pack completo pesa unos **50 MB**. Con 1.000 compradoras que lo bajan todo, son unos **50 GB**.

| Hosting | Gratis | ¿Alcanza para 1.000 packs? |
|---|---|---|
| Netlify (plan gratis nuevo, por créditos) | 300 créditos/mes (≈ 15 GB si todo fuera ancho de banda). Al agotarse, **el sitio se pausa** hasta el mes siguiente. Cada despliegue gasta 15 créditos. | **No** |
| Vercel Hobby | 100 GB de transferencia, pero **solo para uso no comercial** | No es para vender |
| **jsDelivr (CDN de GitHub)** | Gratis, sin límite práctico de tráfico | **Sí** |
| Whop (opción B, archivos en Whop) | Incluido en Whop | **Sí** |

**Solución incluida:** pon la variable `FILES_BASE` para que las descargas salgan de un CDN gratis y no de tu hosting:

```
FILES_BASE=https://cdn.jsdelivr.net/gh/wnqbebb/menopausia-equilibrada@main/sitio/public/entrega-f92e9c4d594a8499f33676e3c3fd18c8/
```

jsDelivr sirve archivos de hasta 20 MB; el PDF más grande pesa 15,8 MB.

### Peticiones y funciones (barato)

Por compradora: unas 10–20 llamadas al comprar, más la sincronización de la app. Con 1.000 usuarias activas, del orden de 150.000 peticiones al mes. Esto entra en el plan gratis de Netlify, pero comparte créditos con el ancho de banda y los despliegues.

## Recomendación según volumen

| Ventas al mes | Configuración |
|---|---|
| Hasta ~100 | Netlify gratis + `FILES_BASE` en jsDelivr. Vercel solo si no te importa el aviso de uso no comercial. |
| 100–2.000 | **Netlify Personal/Pro** (o Vercel Pro como frontal) + `FILES_BASE` en jsDelivr + Whop para cobrar. Unos 9–20 USD/mes. |
| 2.000+ | Lo anterior, revisando el uso cada mes. Cambia la oferta de 15 min a otro valor si la conversión lo pide. |

## Vigilar

- Netlify → **Usage / Billing**: créditos usados.
- Panel → **Descargar CSV** cada semana como copia de seguridad.
- Whop → **Developer → Webhooks**: entregas fallidas.
