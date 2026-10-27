# 6 · La app Menopausia Equilibrada

Aplicación web instalable (PWA) en `sitio/public/index.html` + `sitio/public/app.js` (+ `sw.js` para usarla sin conexión).

## Acceso solo para compradoras

- Sin código válido, la app muestra una pantalla de bloqueo.
- El código (`ID-FIRMA`) se entrega tras el pago, en la página de descargas y en el enlace `/#acceso?k=…`.
- La app valida el código con `POST /api/acceso`. El pedido tiene que estar pagado, incluir la app o «Todo junto» y no estar revocado.
- Cada vez que se abre vuelve a comprobarlo: si revocas el acceso en el panel, la app se bloquea.

## Datos y sincronización

- Todo se guarda primero en el propio teléfono. Funciona sin internet.
- Para usarla en varios dispositivos, la app crea un **código personal de 4 palabras y 2 números** (sección «Mi cuenta»). El servidor guarda los datos bajo el **hash SHA-256** de ese código; el código en sí nunca llega al servidor.
- Para cuidar el plan del hosting con miles de usuarias, la sincronización es eficiente:
  - al cambiar algo (1–2 s después);
  - al volver a la app, si pasó más de 1 minuto;
  - cada 5 minutos con la app abierta.
- Solo sincroniza quien tiene un código de acceso válido (cabecera `x-me-acc`).

## Informe PDF

Botón «Descargar mi informe»: genera en el teléfono un PDF con el diseño de la marca (jsPDF + html2canvas, en `sitio/public/vendor/`). Hay un ejemplo en `productos/Ejemplo_informe_PDF_de_la_app.pdf`.

## Cambiar textos o diseño

- Los textos están en `app.js`.
- Los estilos, en el `<style>` de `index.html`.
- Si cambias archivos de la app, sube la versión de caché en `sw.js` (`me-v3-5` → `me-v3-6`) para que los teléfonos descarguen la nueva versión.
