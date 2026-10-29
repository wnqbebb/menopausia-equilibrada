# 10 · PLENA · Academia de Menopausia y Psicomenopausia

La plataforma del curso vive en **`/plena/`** (también `/academia`). Está **incluida en el pack completo**: se entra con el mismo código de acceso de la app. Quien solo compró la app ve una invitación a completar su pack.

## Qué tiene

| Sección | Qué hace |
|---|---|
| **Bienvenida (3 preguntas)** | Nombre, etapa (peri, pos, inducida o no lo sé) y lo que más le pesa (hasta 3). Las respuestas se quedan en el dispositivo. |
| **Inicio** | Saludo con su nombre y un texto según su etapa, anillo de progreso, «continúa donde lo dejaste», tarea del día y su ruta personal. |
| **Mi ruta** | Los 10 módulos ordenados según sus prioridades. Los suyos llevan la marca «Para ti». |
| **Módulo** | Portada con foto y recorte Soul 2.0, frase real del avatar y respuesta, y la lista de lecciones con su progreso. |
| **Lección** | Video de YouTube (carga solo al pulsar «play»), texto, «lo esencial», mito vs. verdad, tarea, recursos (PDF y app) y botón de completar con confeti. |
| **Biblioteca** | Los 13 PDF con portada, listos para abrir o descargar. |
| **Mi diario** | Enlace directo a la app Menopausia Equilibrada. |
| **Perfil y certificado** | Edita sus respuestas. Al completar la ruta se desbloquea un certificado de graduación imprimible con su nombre. |

El progreso (qué lecciones completó) se guarda en el dispositivo y en la base de datos con su acceso, así se ve igual en el celular y en el computador. No incluye datos de salud.

## Editar el contenido: `sitio/contenido/curso.json`

Todo el curso está en ese archivo. Después de editarlo, haz `git push` y Vercel lo publica solo.

- **Módulo:** `id`, `num`, `titulo`, `subtitulo`, `frase` (lo que dice la mujer), `respuesta`, `foto` y `recorte` (nombres de las imágenes de `sitio/public/plena/img/`, sin extensión), `color` y `lecciones`.
- **Lección:**
  - `id`: único, por ejemplo `m4-2`.
  - `titulo` y `min` (duración en minutos).
  - `video`: el enlace o el ID de YouTube.
  - `texto`: párrafos.
  - `claves`: lista de puntos esenciales.
  - `mito` (opcional): `{ "mito", "verdad" }`.
  - `tarea`: la acción del día.
  - `recursos`: PDF con `{ "tipo": "pdf", "item": "pausa", "texto" }`, o la app con `{ "tipo": "app", "ruta": "hoy", "texto" }`.
- **Objetivos de la bienvenida:** la lista `objetivos`. Cada uno apunta al módulo que se prioriza.
- **Biblioteca:** la lista `biblioteca` (`item` = ID del producto, `portada` = imagen de `sitio/public/oferta/img/`).

### Añadir un video de YouTube

1. Sube el video a YouTube como **Oculto** (no listado) para que solo lo vean las alumnas.
2. Copia el enlace (por ejemplo `https://youtu.be/AbCdEfGhIjK`).
3. Pégalo en `"video": "…"` de la lección.

Mientras `video` esté vacío, la lección muestra «Video en camino» con el texto completo debajo.

> No cambies el `id` de una lección ya publicada: es la clave del progreso de cada alumna.

## Seguridad

El contenido del curso no es público: lo entrega `/api/curso` solo a quien tiene un acceso válido de un pedido pagado con el pack completo. Los videos ocultos de YouTube los ve quien tenga el enlace, así que no los compartas fuera de la plataforma.

## Probar en tu computador

```bash
cd sitio && npm install
node pruebas/servidor-local.mjs      # abre la URL que imprime (incluye un código de prueba)
```
