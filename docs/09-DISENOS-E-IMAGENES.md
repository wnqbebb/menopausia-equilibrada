# 9 · Diseños, imágenes y PDF

## Diseños (`disenos/`)

- `disenos/pausa/`: las 60 páginas del libro (`B01…B60`), las páginas `P…`, las 3 plantillas (`PL1–PL3`), los 4 kits (`U1–U4`) y las páginas de tienda (`T…`).
- `disenos/menopausia-equilibrada/`: la Guía Integral y los 6 bonos.

Cada archivo `.dc.html` es una página en HTML+CSS (tamaño carta), hecha con Claude Design. Se pueden abrir en el navegador. Las imágenes que usan están en `imagenes-soul/editadas/` con el mismo nombre de archivo (`f40.jpg`, `cut02a.png`, etc.).

Los campos rellenables de las plantillas se marcan con `data-fill` en el HTML. El script `herramientas/make_pdf.py` los convierte en campos de formulario del PDF (AcroForm).

## Volver a generar los PDF

Necesitas Python 3 con `playwright` y `pymupdf`:

```bash
pip install playwright pymupdf
python -m playwright install chromium
```

- `herramientas/build.py`: dibuja cada página con Chromium (Playwright).
- `herramientas/make_pdf.py`: une las páginas y crea los campos rellenables.
- `herramientas/export_all.py`: exporta los 13 PDF y los comprime (imágenes a 150 ppp, calidad 82).

Estos scripts se hicieron para la carpeta de trabajo original. Antes de usarlos, define la variable `ME_WORK` con la carpeta donde tengas los diseños y las imágenes, y revisa las rutas del principio de cada script.

Después de regenerar, copia los PDF a `sitio/public/entrega-…/` con **los mismos nombres de archivo**.

## Imágenes (`imagenes-soul/`)

- `originales/`: todas las generaciones de Higgsfield **Soul 2.0**, 4 por prompt (`P01_0.jpg` … `P01_3.jpg`).
- `editadas/`: versiones usadas en los diseños (`f…` fotos encuadradas, `cut…` recortes sin fondo, `p…` páginas, `raw…` fuentes).
- `PROMPTS_Soul2_Menopausia.txt`: los prompts usados, por si quieres generar más con el mismo estilo.

La página de ventas usa versiones optimizadas (WebP) en `sitio/public/oferta/img/`.
