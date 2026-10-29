# 10 · PLENA · Academia de Menopausia y Psicomenopausia

La academia vive en **`/plena/`** (también `/academia`). Está **incluida en el pack completo**: se entra con el mismo código de acceso de la app. Quien solo compró la app ve una invitación a completar su pack.

Todo pasa dentro de la misma página: los libros se leen ahí mismo, los videos se reproducen ahí mismo y la app está integrada. Cada lección combina texto, las páginas exactas de los libros del pack y un video para practicar.

## Qué tiene

| Sección | Qué hace |
|---|---|
| **Bienvenida (4 pasos)** | Explica qué es PLENA y sus cinco áreas; luego nombre, etapa y lo que más le pesa (hasta 3). Las respuestas se quedan en el dispositivo. |
| **Recorrido guiado** | Al terminar la bienvenida, un recorrido de 9 pasos ilumina cada parte (siguiente paso, misiones, cursos, videoteca, biblioteca, diario, logros y ayuda). Se repite desde el botón **?** de la cabecera o desde el perfil. Cada sección muestra además un aviso corto la primera vez («Entendido» lo oculta). |
| **Inicio** | Saludo con su nombre, nivel, «tu siguiente paso», misiones de hoy, su ruta en tarjetas, videos recomendados, próximas insignias y su diario. |
| **Cursos** | Los 10 módulos como tarjetas de curso (portada enmarcada, descripción, lecciones, videos, lecturas, minutos y barra de progreso). |
| **Aula del módulo** | A la izquierda, todo el contenido: **Introducción**, **Lecciones**, **Videos**, **Lecturas** y **Cierre**. Lo terminado queda con ✓ y sigue en la lista. A la derecha, el contenido elegido con el botón ✓ arriba. |
| **Introducción** | Portada, la frase del avatar y su respuesta, qué es el módulo, «Al terminar podrás», qué incluye, cómo avanzar y la insignia que se gana. |
| **Lección** | Video para practicar, texto, ideas esenciales, lecturas (abren el libro en las páginas exactas), «¿mito o realidad?», pregunta rápida, tarea con «¡La hice!», herramientas de la app y botón de completar. |
| **Cierre** | Resumen del módulo (lecciones, tareas, aciertos, videos, lecturas), lo que falta y el paso al siguiente módulo. Al completarlo, celebración e insignia. |
| **Videoteca** | 132 videos, podcast, audiolibros y música en 10 cursos de video, con buscador, «sigue viendo» y recomendados. Cada curso abre su aula con la lista de clases (✓ las vistas). Reproductor propio (Plyr). |
| **Biblioteca** | Los 13 libros con su portada. Se abren a pantalla completa como un libro de verdad: se pasan las hojas, miniaturas, lupa, sonido de página, «sigue leyendo» y descarga del PDF. |
| **Mi diario** | La app Menopausia Equilibrada completa, integrada. «Cómo se usa» abre su guía. Lo que se registra suma XP y cumple la misión del día. |
| **Logros** | 15 niveles y 50 insignias coleccionables, cada una con su protagonista Soul 2.0, en cuatro dificultades con su color: **fácil** (rosa), **media** (lavanda), **difícil** (oro) y **legendaria** (iridiscente). |
| **Perfil, guía y certificado** | Edita sus respuestas, repite el recorrido, abre la guía rápida, sonidos y sesión. Al completar el curso se desbloquea el certificado. |

### Gamificación

| Acción | XP |
|---|---|
| Completar una lección | 100 |
| Hacer la tarea | 40 |
| Pregunta rápida (acierto a la primera / intento) | 30 / 10 |
| Descubrir un mito | 20 |
| Completar una lectura de lección | 25 |
| Cada página nueva leída | 2 |
| Cada video completado (60 % o 8 minutos vistos, o ✓) | 15 |
| Completar un módulo | 200 |
| Cada día registrado en Mi diario | 10 |
| Día perfecto (las 4 misiones) | 60 |

- **Niveles (15):** Curiosa, Despierta, Valiente, Consciente (fácil) · Constante, Serena, Fuerte, Sabia (media) · Radiante, Imparable, Inspiradora, Luminosa (difícil) · Maestra, Leyenda, Plena (legendaria). El último pide 13.000 XP: prácticamente todo el curso, la videoteca y meses de diario.
- **Insignias (50):** por ejemplo, rachas de 3, 7, 21 y 60 días; 1, 10, 30 y 75 videos; 50, 150 y todas las páginas; 7, 30 y 90 días de diario; 1, 7 y 21 días perfectos; las 31 tareas o las 31 preguntas acertadas a la primera.
- **Misiones del día:** una lección, un video, 5 páginas y el registro en Mi diario.

El progreso (lecciones, tareas, respuestas, páginas leídas, videos vistos y días con actividad) se guarda en el dispositivo y en la base de datos con su acceso, así se ve igual en el celular y en el computador. **No incluye datos de salud.**

## La app (Mi diario)

La primera vez muestra una **guía de 6 pasos**: qué es, cómo registrar el día, cómo se ve el progreso (con botón para verlo con datos de ejemplo), cómo descargar el informe en PDF (Progreso → «Descargar mi informe en PDF», o Mi cuenta → «Tu informe en PDF» con 30, 90 días o todo el historial), plan de 30 días y plantillas, y privacidad con la copia cifrada. Se vuelve a abrir en `#guia` o desde Mi cuenta.

## Editar el contenido: `sitio/contenido/curso.json`

Todo el curso está en ese archivo. Después de editarlo, haz `git push` y Vercel lo publica solo.

- **Módulo:** `id`, `num`, `titulo`, `subtitulo`, `frase`, `respuesta`, `foto` y `recorte` (imágenes de `sitio/public/plena/img/`, sin extensión), `intro` (`texto`: párrafos de la introducción; `logros`: «Al terminar podrás»), `lecciones` y `tema`:
  - `estilo`: `collage`, `poster` o `revista`.
  - `bg`, `bg2`, `acc`, `deep`, `ink`: colores. `oscuro: true` para fondos oscuros.
  - `icono` (corazon, luna, llama, noche, mente, pesa, hoja, corazones, consulta, corona), `patron` (lineas, puntos, rayos, estrellas, cuadros, diagonal, vichy, corazones, destellos), `insignia` (nombre de la insignia) y `palabra` (la palabra grande del póster).
- **Lección:**
  - `id`: único, por ejemplo `m4-2`. **No lo cambies una vez publicado**: es la clave del progreso.
  - `titulo`, `min`, `texto` (párrafos), `claves` (3 notas), `mito` (opcional: `{ "mito", "verdad" }`) y `tarea`.
  - `lecturas`: `[{ "item": "pausa", "desde": 6, "hasta": 10, "titulo": "…" }]`. `item` es el ID del libro y las páginas son las del PDF.
  - `quiz`: `{ "pregunta", "opciones": [3 textos], "correcta": 0-2, "explica" }`.
  - `recursos`: herramientas de la app con `{ "tipo": "app", "ruta": "hoy", "texto" }` (rutas: hoy, progreso, plan30, plantillas, consulta, ciclo, alarma, cuenta).
- **Biblioteca:** la lista `biblioteca` (`item`, `titulo`, `desc`, `portada` de `sitio/public/oferta/img/`, `categoria` y `lomo`).

## Editar la videoteca: `herramientas/videoteca.py`

La lista de videos está en ese archivo (ID de YouTube, categoría, título, descripción, etiquetas, módulos y si es «opinión de la autora»). También define el video de cada lección. Después de editarlo:

```bash
python herramientas/videoteca.py sitio/contenido/videos.json
```

- Solo funcionan los videos que su canal permite insertar. Dos enlaces del cuaderno no lo permiten y quedaron fuera (`ImDuug_R_OE` y `pvhqPkKgNOk`).
- Los videos marcados como opinión muestran un aviso: algunas ideas de sus autoras no coinciden con la evidencia del curso.
- El logo y el nombre del canal: el reproductor oculta casi toda la interfaz de YouTube, pero las normas de YouTube no permiten taparla del todo. PLENA da el crédito al canal debajo del video.

## Si cambias un PDF

El lector usa una imagen por página en `sitio/public/plena/libros/<item>/` (`p001.webp` de 1400 px y `t001.webp` miniatura) y el número de páginas de `sitio/contenido/libros.json`. Para regenerarlas:

```bash
pip install pymupdf pillow
python herramientas/paginas_libros.py
```

Revisa después que las `lecturas` de `curso.json` sigan apuntando a las páginas correctas.

## Seguridad

El contenido del curso no es público: lo entrega `/api/curso` solo a quien tiene un acceso válido de un pedido pagado con el pack completo.

## Probar en tu computador

```bash
cd sitio && npm install
node pruebas/servidor-local.mjs      # abre la URL que imprime (incluye un código de prueba)
```
