# 10 · PLENA · Academia de Menopausia y Psicomenopausia

La academia vive en **`/plena/`** (también `/academia`). Está **incluida en el pack completo**: se entra con el mismo código de acceso de la app. Quien solo compró la app ve una invitación a completar su pack.

Todo pasa dentro de la misma página: los libros se leen ahí mismo y la app está integrada. No hay videos: el curso se arma con el texto de cada lección y las páginas exactas de los libros del pack.

## Qué tiene

| Sección | Qué hace |
|---|---|
| **Bienvenida (3 pasos)** | Nombre, etapa (peri, pos, inducida o no lo sé) y lo que más le pesa (hasta 3). Las respuestas se quedan en el dispositivo. |
| **Inicio** | Banner tipo collage, nivel y XP, racha, misiones del día, «continúa donde lo dejaste», lectura de hoy, mapa de su ruta y resumen de su diario. |
| **Mi ruta** | Mapa tipo juego con los 10 módulos ordenados según sus prioridades («Para ti»), progreso de cada uno e insignias ganadas. |
| **Módulo** | Cada módulo tiene su propio diseño (estilo collage, póster o revista, con su paleta y su patrón), la frase real del avatar, la respuesta, sus lecciones, su insignia y sus lecturas. |
| **Lección** | Texto, «lo esencial» en notas adhesivas, **lecturas** (abren el libro en las páginas exactas), carta «¿mito o realidad?», pregunta rápida, tarea con «¡La hice!», herramientas de la app y botón de completar. |
| **Biblioteca** | Los 13 libros en estanterías 3D. Se abren **dentro de la página como un libro de verdad**: se pasan las hojas (con sonido opcional), miniaturas, zoom, barra para saltar de página, «sigue leyendo» y descarga del PDF. |
| **Mi diario** | La app Menopausia Equilibrada integrada (no es un enlace aparte). Lo que se registra en la app suma XP y cumple la misión del día al momento. |
| **Logros** | Nivel (10 niveles: de Curiosa a Plena), álbum de 24 insignias, calendario de racha y el detalle de los XP. |
| **Perfil y certificado** | Edita sus respuestas, sonidos y sesión. Al completar la ruta se desbloquea un certificado imprimible con su nombre. |

### Gamificación

| Acción | XP |
|---|---|
| Completar una lección | 100 |
| Hacer la tarea | 40 |
| Pregunta rápida (acierto / intento) | 30 / 10 |
| Descubrir un mito | 20 |
| Completar una lectura de lección | 25 |
| Cada página nueva leída | 2 |
| Completar un módulo | 200 |
| Cada día registrado en Mi diario | 10 |
| Día perfecto (las 3 misiones) | 50 |

Misiones del día: completar una lección, leer 5 páginas y registrar el día en Mi diario. La racha cuenta los días seguidos con alguna actividad.

El progreso (lecciones, tareas, respuestas, páginas leídas y días con actividad) se guarda en el dispositivo y en la base de datos con su acceso, así se ve igual en el celular y en el computador. **No incluye datos de salud.** Los datos de la app siguen en el dispositivo (y, si ella lo autoriza, en su copia cifrada): PLENA solo cuenta cuántos días registró.

## Editar el contenido: `sitio/contenido/curso.json`

Todo el curso está en ese archivo. Después de editarlo, haz `git push` y Vercel lo publica solo.

- **Módulo:** `id`, `num`, `titulo`, `subtitulo`, `frase`, `respuesta`, `foto` y `recorte` (imágenes de `sitio/public/plena/img/`, sin extensión), `lecciones` y `tema`:
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

## Si cambias un PDF

El lector usa una imagen por página en `sitio/public/plena/libros/<item>/` (`p001.webp` grande y `t001.webp` miniatura) y el número de páginas de `sitio/contenido/libros.json`. Para regenerarlas:

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
