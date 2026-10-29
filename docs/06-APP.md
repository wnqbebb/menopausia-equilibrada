# 6 · La app Menopausia Equilibrada

Aplicación web instalable (PWA) en `sitio/public/index.html` + `sitio/public/app.js` (+ `sw.js` para usarla sin conexión).

## Acceso solo para compradoras

- Sin código válido, la app muestra una pantalla de bloqueo.
- El código (`ID-FIRMA`) se entrega tras el pago, en la página de descargas y en el enlace `/#acceso?k=…`.
- La app valida el código con `POST /api/acceso`. El pedido tiene que estar pagado, incluir la app o «Todo junto» y no estar revocado.
- Cada vez que se abre vuelve a comprobarlo: si revocas el acceso en el panel, la app se bloquea.

## Datos, privacidad y sincronización

- Todo se guarda primero **en el propio dispositivo** y funciona sin internet.
- **La copia en la nube está desactivada hasta que la usuaria la autoriza** de forma expresa:
  - con la casilla de la bienvenida;
  - con el botón «Activar copia cifrada» (en Hoy o en «Mi cuenta»);
  - o al vincular otro dispositivo con su enlace personal.
- **Cifrado en el dispositivo:** antes de salir, los registros se cifran con **AES-256-GCM**. La clave se deriva del código personal (PBKDF2-SHA256, 150.000 iteraciones). El servidor solo recibe texto cifrado bajo una huella SHA-256 del código. Nadie, ni la administradora, puede leer los datos de salud.
- El servidor **rechaza** cualquier copia que no venga cifrada (`api/sync.js`).
- En «Mi cuenta» la usuaria puede:
  - desactivar la sincronización;
  - **borrar su copia en la nube** (`DELETE /api/sync`, derecho de supresión);
  - borrar todos sus datos.
- La sincronización es moderada (al cambiar algo, al volver a la app si pasó más de 1 minuto, y cada 5 minutos) y solo funciona con un código de acceso válido.
- Si se pierde el código personal, la copia cifrada no se puede recuperar.

Política de privacidad (Ley 1581 de 2012, Colombia): `sitio/public/privacidad.html`, publicada en `/privacidad.html`. Contacto de privacidad: cristinaaguilarrojas1@gmail.com. Para cambiarlo, busca ese correo en `sitio/public/` y reemplázalo.

## Informe PDF

Botón «Descargar mi informe»: genera en el teléfono un PDF con el diseño de la marca (jsPDF + html2canvas, en `sitio/public/vendor/`). Hay un ejemplo en `productos/Ejemplo_informe_PDF_de_la_app.pdf`.

## Cambiar textos o diseño

- Los textos están en `app.js`.
- Los estilos, en el `<style>` de `index.html`.
- Si cambias archivos de la app, sube la versión de caché en `sw.js` (por ejemplo `me-v3-8` → `me-v3-9`) para que los teléfonos descarguen la nueva versión.
