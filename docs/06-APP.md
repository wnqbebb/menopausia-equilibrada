# 6 · La app Menopausia Equilibrada

Aplicación web en `sitio/public/index.html` + `sitio/public/app.js` (+ `sw.js` para usarla sin conexión).

**Ya no es una app suelta:** vive solo dentro de PLENA, en **Mi diario** (`/plena/#diario`, que carga `/?embed=1`). Abrir `/` directamente lleva a `/plena/`. La app instalable es PLENA (`/manifest.webmanifest`, inicio en `/plena/`).

## Acceso solo para compradoras

- Usa la **sesión de la cuenta de PLENA** (correo + contraseña, guía 11): la toma de la página de PLENA que la contiene (mismo origen). No tiene pantalla de bloqueo propia.
- `/api/sync` exige la sesión (`Authorization: Bearer <JWT de Supabase>`), una cuenta no revocada y el pack completo.
- Los códigos antiguos (`/#acceso?k=…`) ya no abren la app: llevan a crear la cuenta de su pedido.

## Datos, privacidad y sincronización

- Todo se guarda primero **en el propio dispositivo** y funciona sin internet.
- **La copia en la nube está desactivada hasta que la usuaria la autoriza** de forma expresa:
  - con la casilla de la bienvenida;
  - con el botón «Activar copia cifrada» (en Hoy o en «Mi cuenta»);
  - o al vincular otro dispositivo con su enlace personal.
- **Cifrado en el dispositivo:** antes de salir, los registros se cifran con **AES-256-GCM** usando la **clave de datos** de la usuaria: una clave aleatoria que se guarda en su cuenta solo envuelta con su contraseña (PBKDF2-SHA256, 310.000 iteraciones; `plena/cuenta.js`). El servidor solo recibe texto cifrado (tabla `diario` de Supabase). Nadie, ni la administradora, puede leer los datos de salud.
- El servidor **rechaza** cualquier copia que no venga cifrada (`api/sync.js`).
- Si la copia de la nube se cifró con otra clave (contraseña recuperada en otro dispositivo), PLENA pide la contraseña una vez para abrir el diario.
- En «Mi cuenta» la usuaria puede:
  - desactivar la sincronización;
  - **borrar su copia en la nube** (`DELETE /api/sync`, derecho de supresión);
  - borrar todos sus datos.
- La sincronización es moderada (al cambiar algo, al volver a la app si pasó más de 1 minuto, y cada 5 minutos) y solo funciona con una sesión de PLENA válida.
- Si la usuaria olvida la contraseña y la recupera por correo en un dispositivo que no tenía su clave, la copia antigua de la nube no se puede abrir: se reemplaza con los registros de ese dispositivo y se le avisa.

Política de privacidad (Ley 1581 de 2012, Colombia): `sitio/public/privacidad.html`, publicada en `/privacidad.html`. Contacto de privacidad: cristinaaguilarrojas1@gmail.com. Para cambiarlo, busca ese correo en `sitio/public/` y reemplázalo.

## Informe PDF

Botón «Descargar mi informe»: genera en el teléfono un PDF con el diseño de la marca (jsPDF + html2canvas, en `sitio/public/vendor/`). Hay un ejemplo en `productos/Ejemplo_informe_PDF_de_la_app.pdf`.

## Cambiar textos o diseño

- Los textos están en `app.js`.
- Los estilos, en el `<style>` de `index.html`.
- Si cambias archivos de la app, sube la versión de caché en `sw.js` (por ejemplo `me-v3-8` → `me-v3-9`) para que los teléfonos descarguen la nueva versión.
