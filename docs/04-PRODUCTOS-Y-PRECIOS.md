# 4 · Productos, precios y oferta

## Las 2 ofertas de la página de ventas

La página `/oferta/` vende solo dos cosas (la tienda «por separado» ya no se muestra):

| Oferta | ID | Qué incluye | Bienvenida (15 min) | Después |
|---|---|---|---|---|
| **Biblioteca PAUSA** | `libros` | Los 13 libros en PDF (PAUSA, Guía Integral, 6 bonos, 3 plantillas y 4 kits). Sin PLENA. Valor 95 USD. | **12 USD** | **24 USD** |
| **Libros + PLENA** (recomendada) | `todo` | Los 13 libros + academia PLENA (10 módulos, 132 videos) + Mi diario + logros y certificado. Valor 124 USD. | **19 USD** | **37 USD** |

- Quien compra `libros` recibe el correo «Tu Biblioteca PAUSA está lista» con el botón de descarga. Quien compra `todo` recibe «Crea tu cuenta de PLENA».
- Quien compró `libros` puede sumar PLENA desde su página de descargas pagando la diferencia (19 − 12 = 7 USD; mínimo 5 USD).
- Enlaces directos: `/oferta/?oferta=libros` y `/oferta/?oferta=todo` abren el pedido de esa oferta (útil en anuncios y WhatsApp).
- Para cambiar los precios: `LIBROS_LAUNCH`, `LIBROS_REGULAR`, `BUNDLE_LAUNCH` y `BUNDLE_REGULAR` en `sitio/lib/catalog.js` (en centavos). La página los toma sola del servidor (`/api/oferta`); los números del HTML son solo el valor inicial.

## Catálogo (productos individuales)

| ID | Producto | Precio suelto | Archivo entregado |
|---|---|---|---|
| `pausa` | PAUSA · El manual de la menopausia (60 págs.) | 14 USD | `PAUSA_Libro_60_paginas.pdf` |
| `guia` | Guía Integral Menopausia Equilibrada (38 págs.) | 12 USD | `01_Guia_Integral_Menopausia_Equilibrada.pdf` |
| `recetario` | Recetario: 20 recetas | 7 USD | `02_Bono1_Recetario.pdf` |
| `plan30` | Plan de 30 días para recuperar energía | 6 USD | `03_Bono2_Plan_30_dias.pdf` |
| `vitaminas` | Guía de vitaminas y suplementos | 5 USD | `04_Bono3_Vitaminas_y_suplementos.pdf` |
| `diario` | Diario de síntomas y progreso | 4 USD | `05_Bono4_Diario_de_sintomas.pdf` |
| `yoga` | Yoga en calma | 5 USD | `06_Bono5_Yoga_en_calma.pdf` |
| `aroma` | Aromaterapia | 4 USD | `07_Bono6_Aromaterapia.pdf` |
| `plantillas` | 3 plantillas rellenables | 5 USD | `PAUSA_3_Plantillas_rellenables.pdf` |
| `k1` | Kit Noches frescas (sofocos e insomnio) | 9 USD | `PAUSA_Upsell1_Noches_frescas.pdf` |
| `k2` | Kit Intimidad sin dolor | 8 USD | `PAUSA_Upsell2_Intimidad_sin_dolor.pdf` |
| `k3` | Kit Menopausia en el trabajo | 7 USD | `PAUSA_Upsell3_Menopausia_en_el_trabajo.pdf` |
| `k4` | Kit Fuerte después de los 45 | 9 USD | `PAUSA_Upsell4_Fuerte_despues_de_los_45.pdf` |
| `app` | App Menopausia Equilibrada (de por vida) | 29 USD | cuenta (ver nota) |
| `libros` | **Biblioteca PAUSA** (los 13 PDF, valor 95 USD) | **12 USD** durante la oferta · **24 USD** después | los 13 PDF |
| `todo` | **Libros + PLENA** (valor 124 USD) | **19 USD** durante la oferta de 15 min · **37 USD** después | todo lo anterior |

Los PDF están en `sitio/public/entrega-f92e9c4d594a8499f33676e3c3fd18c8/`.

> **Nota sobre `app` suelta:** desde las cuentas de PLENA, el diario vive solo dentro de PLENA, y PLENA es solo para el pack completo. Quien compre únicamente `app` puede crear su cuenta, pero verá la pantalla para completar su pack. Si vas a seguir vendiéndola suelta, decide si la quitas de la tienda o si le das acceso a Mi diario.

## Reglas de precio (las aplica el servidor; el navegador solo las muestra)

- **Oferta de bienvenida:** en la primera visita, el servidor firma la hora de inicio (`/api/oferta`). Durante 15 minutos la Biblioteca PAUSA cuesta 12 USD y «Libros + PLENA» 19 USD. Si la clienta se va y vuelve, o se acaba el tiempo, pasan a 24 y 37 USD. No se puede trucar desde el navegador.
- **Mejora automática:** si la suma de lo que eligió por separado es igual o mayor que el precio de «Todo junto», se le cobra «Todo junto».
- **Mejora después de comprar:** en la página de descargas se ofrece completar el pack pagando la diferencia hasta 19 USD (mínimo 5 USD). Requiere la firma de su pedido.

## Cambiar precios o productos

Hay que tocar **dos sitios** y mantenerlos iguales:

1. **Servidor**, en `sitio/lib/catalog.js`:
   - `ITEMS`: nombre, precio en centavos (`cents: 1400` = 14 USD) y archivos.
   - `BUNDLE_LAUNCH` (1900) y `BUNDLE_REGULAR` (3700): precios de «Libros + PLENA».
   - `LIBROS_LAUNCH` (1200) y `LIBROS_REGULAR` (2400): precios de la Biblioteca PAUSA.
   - `OFFER_WINDOW_MS`: duración de la oferta (15 min = `15 * 60 * 1000`).
2. **Página**, en `sitio/public/oferta/index.html`, en el arreglo `CAT` (busca `var CAT=`): la lista de los 13 libros con su valor por separado. Cada fila es:
   `[id, nombre, subtítulo, descripción, valor_en_USD, portada, grupo]`.
3. **Biblioteca 3D** (`sitio/public/oferta/biblioteca3d.js`): título, colores del lomo y número de páginas de cada libro. El lector muestra solo un adelanto (hasta 4 páginas) de `/plena/libros/<id>/`.

Si añades un producto nuevo:

1. Agrega su PDF a la carpeta de entrega.
2. Crea la entrada en `ITEMS` y la fila en `CAT`, con el mismo `id`.
3. Añade su portada en `sitio/public/oferta/img/c-<id>.webp`.
4. Añade su nombre corto en `KN` dentro de `sitio/public/oferta/admin.html`.

## Moneda

`CURRENCY = "usd"` en `catalog.mjs`. Si cambias de moneda, revisa también los textos «USD» de las páginas.
