# 8 · Embudo y píxeles

## El embudo

```
Anuncio / redes / correo
   ▼
/oferta/  (oferta de bienvenida de 15 min: 19 USD en lugar de 37)
   ├─ «Lo quiero todo» ───────────────┐
   └─ Tienda: productos por separado  ┤ (si la suma ≥ pack → se cobra el pack)
                                      ▼
                 Checkout (Whop / Stripe / enlace / pedido)
                                      ▼
/oferta/gracias.html  →  descargas + código de la app
   └─ Si no compró todo: «Completa tu pack» pagando la diferencia (upsell)
                                      ▼
App (/#acceso?k=…) → uso diario y fidelización
```

Atajos que llevan a la oferta: `/comprar` y `/pack`.

Los parámetros UTM (`?utm_source=…`) se conservan en la URL; tu píxel o Google Analytics los recogen.

## Píxeles (Meta, TikTok, Google)

Los eventos ya están programados. Solo falta pegar el código base de cada plataforma.

1. Abre `sitio/public/oferta/index.html` y `sitio/public/oferta/gracias.html`.
2. Busca el comentario `EMBUDO / MEDICIÓN` justo antes de `</head>`.
3. Pega encima el código base de tu píxel (Meta `fbq`, TikTok `ttq` o Google `gtag`).

Eventos que se envían solos:

| Evento | Cuándo | Datos |
|---|---|---|
| `ViewContent` | Al abrir la oferta | — |
| `AddToCart` | Al añadir un producto o «Todo junto» | valor en USD |
| `InitiateCheckout` | Al pulsar pagar | valor del carrito |
| `Purchase` | En la página de descargas, una sola vez por pedido | valor pagado, ID del pedido |

En TikTok, `Purchase` se envía como `CompletePayment`. En Google se usan `view_item`, `add_to_cart`, `begin_checkout` y `purchase`.

Además se emite un evento del navegador `me:<Evento>` (por ejemplo, `window.addEventListener('me:Purchase', …)`) por si quieres conectar otra herramienta.

## Ideas para escalar el embudo

- Usa las portadas de `productos/imagenes/` y las fotos de `imagenes-soul/` para los anuncios.
- Prueba la duración de la oferta (`OFFER_WINDOW_MS`) y el precio del pack (guía 04).
- Envía por correo o WhatsApp el enlace de mejora a quien compró solo una parte.
