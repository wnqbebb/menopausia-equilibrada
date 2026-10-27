# Reglas comunes para cada fork (léelas antes de empezar)

1. Diseño: sigue /tmp/claude-0/-home-claude/1d3418f7-0129-5a71-a48c-76d42de217dd/scratchpad/brand/BRAND.md
   al pie de la letra (helmet idéntico, legibilidad, paleta, stickers). Modelos de referencia ya aprobados:
   canvas_eq/project/Main.dc.html (portada) y canvas_eq/project/G07-Sofocos.dc.html (página de contenido).
   Varía las composiciones: collage femenino, divertido, hermoso, tipo Instagram/Pinterest rosa (cutouts con
   class="stk", etiquetas, notas inclinadas, script gigante detrás de títulos, papel rayado, bloques negros
   con texto rosa, páginas-cita rosas). NADA serio-editorial. Texto SIEMPRE fácil de leer.
2. Imágenes: AHORA hay 108 imágenes nuevas Soul 2.0 (recortes de mujeres 50+, objetos rosas, escenas, 20 fotos
   reales de las recetas). Lista con ids por canvas, proporciones y descripción en
   /tmp/claude-0/-home-claude/1d3418f7-0129-5a71-a48c-76d42de217dd/scratchpad/brand/IMAGES.md (y en brand/blobs.json).
   Usa el id del canvas correcto (EQ o PAUSA). Las imágenes son el CORAZÓN del rediseño: collages con recortes
   (class="stk"), fotos tipo polaroid con cinta, stickers SVG alrededor. Varía: no repitas la misma imagen en
   páginas seguidas del mismo producto. Las fotos viejas p1–p14/cut_* pueden quedarse solo si encajan; prioriza las
   nuevas. No generes imágenes nuevas.
3. Contenido: español neutro latinoamericano, tú, cálido, empático, con humor suave; copy con gancho.
   Cada cifra/afirmación de salud con fuente identificable (línea de fuente ≥11px). Investiga con
   WebSearch/WebFetch (OMS, NIH/ODS, CDC, NHS, NICE, The Menopause Society, ACOG, Cochrane, EFSA,
   revisiones revisadas por pares). Sin estadísticas inventadas, sin testimonios, sin promesas de resultados,
   sin dosis de medicamentos. Para suplementos: cantidades de referencia (RDA/UL) solo si vienen de NIH/EFSA.
   Ejemplos/escenarios inventados se marcan como «ejemplo».
4. Formato: páginas A4 794×1123 fijas (root .pg). Nada fuera de la página; márgenes ≥44px. Pie con número de
   página = el número/orden del board en canvas.json de ese canvas.
5. Enlaces a la app: https://menopausia-equilibrada.netlify.app/#ruta (rutas: hoy, progreso, ciclo, plan30,
   plantillas, consulta, alarma, cuenta). Siempre como <a href> con el texto visible de la URL.
6. Campos rellenables (plantillas, diarios, checklists): marca cada campo con data-fill="text|multi|check" y
   data-name único (ver BRAND.md).
7. Escribe cada archivo con la herramienta Write en <canvas>/project/<Nombre>.dc.html (nombres EXACTOS de
   canvas.json). Nunca edites ni publiques canvas.json.
8. Revisión visual obligatoria: renderiza por lotes con
   `cd scratchpad/build && CANVAS_DIR=<ruta absoluta del canvas> python3 build.py page <pageId> <tuTag> <filtro1,filtro2>`
   (canvas PAUSA: CANVAS_DIR=.../scratchpad/canvas; nuevo: .../scratchpad/canvas_eq) y mira los PNG en
   build/png_<tuTag>/. Corrige solapes, textos cortados, huecos feos, contraste. Repite hasta que esté bien.
9. Publicación (hay muchos forks a la vez): cuando tengas TODOS tus archivos listos y revisados, haz una lectura
   completa del artefacto (action read, url, sin path) y en el SIGUIENTE turno publica todos tus archivos en una
   sola llamada (url, root=<canvas>, file_path=uno, files={resto}). Si se rechaza, vuelve a leer completo y
   reintenta (hasta 6 veces). URLs: PAUSA https://claude.ai/artifact/RK9CgmPXX96HfyT2gYErqU ·
   Menopausia Equilibrada https://claude.ai/artifact/9WCrJ6KbisKgtc3yQmT7KB
10. Fuentes: guarda las que usaste en scratchpad/sources2/<tuTag>.json como lista
    {"title","org","date","url","pages":[...]}.
11. Respuesta final: lista corta de páginas hechas y problemas. Nada más.
