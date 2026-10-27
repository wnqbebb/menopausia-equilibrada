# Herramientas

| Archivo | Para qué |
|---|---|
| `build.py` | Dibuja las páginas de los diseños con Playwright (Chromium) y genera imágenes y PDF. |
| `make_pdf.py` | Convierte los campos `data-fill` en campos rellenables del PDF (AcroForm). |
| `export_all.py` | Exporta los 13 PDF finales y los comprime con PyMuPDF. |
| `totext.py`, `sheet.py`, `shots.py`, `fillpa.py` | Utilidades: extraer texto, hojas de contacto, capturas y relleno de diseños. |
| `pruebas/e2e.py` | Prueba de punta a punta de la app y la tienda en el navegador (Playwright). Uso: `python pruebas/e2e.py https://TU-DOMINIO` (revisa los argumentos al inicio del script). |
| `pruebas/mock.py` | Servidor de pruebas local para la app. |

La prueba de carga de 1.000 compras está en `../sitio/pruebas/` (`npm run prueba-carga`).

Los scripts usan la variable `ME_WORK` (carpeta de trabajo). Ver [`../docs/09-DISENOS-E-IMAGENES.md`](../docs/09-DISENOS-E-IMAGENES.md).
