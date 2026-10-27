# Marca rosa — kit de diseño (PAUSA rediseñado + Menopausia Equilibrada)

Dirección: femenina, alegre, collage rosa tipo revista de Instagram (referencias del usuario: recortes con borde
blanco, stickers de corazones/estrellas/labios, etiquetas tipo cinta, notas de papel inclinadas, papel rayado,
palabras en script gigante rosa detrás de un titular, rosa + negro, etiquetas pixel tipo «MUSE.»).
MENOS editorial y serio, MÁS hermoso y llamativo, pero SIEMPRE FÁCIL DE LEER.

## Reglas de legibilidad (obligatorias)
- Texto corrido: Poppins 14px (nunca menos de 13.5px), line-height 1.7, color #2B1B24, sobre fondo claro
  (#FFF5F8 crema rosada, #FFFFFF, #FCE4EC). Columnas de 300–420px de ancho. Párrafos cortos (2–4 líneas).
- Nunca texto corrido sobre foto, sobre rosa fuerte (#E0337A) ni en script. Sobre negro/berry: blanco ≥14px.
- Great Vibes (script) SOLO para 1–3 palabras decorativas, ≥44px. Nunca información en script.
- Playfair Display para títulos (≥26px), 700–900, se permite itálica.
- Silkscreen (pixel) solo para micro-etiquetas de ≤3 palabras, mayúsculas, 12–16px.
- Contraste: texto pequeño en #2B1B24, #6B4E5C (notas/fuentes) o #9B1B4F (énfasis). #E0337A solo ≥24px.
- Fuente (source line) ≥11px. Pie de página ≥11px.
- Máx. ~5 elementos decorativos por página; nunca tapan texto. Respeta márgenes de 44px.

## Paleta
--crema #FFF5F8 (fondo base) · --blanco #FFFFFF · --blush #FCE4EC · --rosa #F7A8C7 (etiquetas, bloques)
--chicle #F48FB1 · --fucsia #E0337A (display grande, stickers) · --berry #9B1B4F (énfasis texto, títulos)
--tinta #2B1B24 (texto) · --negro #1E1419 (bloques oscuros) · --gris-rosa #6B4E5C (notas)
--cielo #CFE3F7 (cinta azul y líneas de papel) · --mantequilla #FFD95A (estrellas)

## Helmet (copiar tal cual en cada artboard A4)
```html
<helmet>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&amp;family=Great+Vibes&amp;family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,600&amp;family=Silkscreen:wght@400;700&amp;display=swap" rel="stylesheet">
<style>
body{margin:0;background:#FFF5F8}
.pg{width:794px;height:1123px;position:relative;overflow:hidden;background:#FFF5F8;color:#2B1B24;font-family:'Poppins',Arial,sans-serif;box-sizing:border-box}
.ser{font-family:'Playfair Display',Georgia,serif}
.scr{font-family:'Great Vibes',cursive;font-weight:400}
.px{font-family:'Silkscreen',monospace;text-transform:uppercase}
.bd{font-size:14px;line-height:1.7;margin:0 0 10px 0;color:#2B1B24}
.lead{font-size:16px;line-height:1.6;font-weight:500;margin:0}
.tag{display:inline-block;background:#F7A8C7;color:#2B1B24;font-weight:800;font-size:12px;letter-spacing:.08em;text-transform:uppercase;padding:6px 12px}
.tagk{display:inline-block;background:#1E1419;color:#FFD3E3;font-weight:800;font-size:12px;letter-spacing:.08em;text-transform:uppercase;padding:6px 12px}
.hl{background:linear-gradient(transparent 58%,#FFC2D9 58%)}
.note{background:#FFFFFF;padding:16px 18px;box-shadow:0 10px 26px rgba(155,27,79,.14)}
.stk{filter:drop-shadow(5px 0 0 #fff) drop-shadow(-5px 0 0 #fff) drop-shadow(0 5px 0 #fff) drop-shadow(0 -5px 0 #fff) drop-shadow(0 14px 18px rgba(120,20,60,.22))}
.lined{background-color:#FFFDFB;background-image:repeating-linear-gradient(transparent 0 31px,#D7E5F4 31px 32px)}
.src{font-size:11px;line-height:1.45;color:#6B4E5C}
.rh{position:absolute;top:22px;left:44px;right:44px;display:flex;justify-content:space-between;align-items:center;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#9B1B4F}
.ft{position:absolute;bottom:20px;left:44px;right:44px;display:flex;justify-content:space-between;align-items:center;font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#9B1B4F}
.ck{display:grid;grid-template-columns:20px 1fr;column-gap:10px;align-items:start;font-size:13.5px;line-height:1.5;padding:7px 0;border-bottom:1px dashed #F2B8CD}
.bx{width:16px;height:16px;border:2px solid #9B1B4F;border-radius:4px;box-sizing:border-box;margin-top:2px;background:#fff}
.fld{border-bottom:1.5px solid #C98AA5;height:30px}
a{color:#9B1B4F}a:hover{color:#E0337A}
</style>
</helmet>
```
(En portadas de bonos o tienda puedes añadir clases propias, pero mantén estas.)

## Cabecera y pie (en todas las páginas interiores)
`<div class="rh"><span>NOMBRE DEL LIBRO</span><span class="px" style="font-size:11px">sección</span></div>`
`<div class="ft"><span>Sección o capítulo</span><span>NN</span></div>` (NN = número de página del board title)

## Stickers SVG (inline, aria-hidden="true", nunca emoji)
Corazón: `<svg width="34" height="32" viewBox="0 0 32 30" aria-hidden="true"><path d="M16 29S2 20 2 10.5C2 5.8 5.6 2 10 2c2.6 0 4.8 1.3 6 3.4C17.2 3.3 19.4 2 22 2c4.4 0 8 3.8 8 8.5C30 20 16 29 16 29z" fill="#E0337A"/></svg>`
Estrella: `<svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true"><path d="M20 2l5.3 11.6 12.7 1.4-9.5 8.6 2.7 12.5L20 29.8 8.8 36.1l2.7-12.5L2 15l12.7-1.4z" fill="#FFD95A" stroke="#2B1B24" stroke-width="1.5" stroke-linejoin="round"/></svg>`
Destello: `<svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 0C17 10 22 15 32 16 22 17 17 22 16 32 15 22 10 17 0 16 10 15 15 10 16 0z" fill="#F48FB1"/></svg>`
Labios: `<svg width="60" height="34" viewBox="0 0 60 34" aria-hidden="true"><path d="M2 17C10 5 20 3 30 10 40 3 50 5 58 17 48 31 12 31 2 17z" fill="#E0337A"/><path d="M5 17C16 19 44 19 55 17" stroke="#9B1B4F" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>`
Moño: `<svg width="56" height="36" viewBox="0 0 56 36" aria-hidden="true"><path d="M28 18C20 6 6 2 4 8s4 16 24 10zM28 18C36 6 50 2 52 8s-4 16-24 10z" fill="#F7A8C7" stroke="#9B1B4F" stroke-width="1.6"/><path d="M26 19l-8 15M30 19l8 15" stroke="#9B1B4F" stroke-width="2" stroke-linecap="round"/><circle cx="28" cy="18" r="4.5" fill="#E0337A"/></svg>`
Garabato subrayado: `<svg width="160" height="14" viewBox="0 0 160 14" aria-hidden="true"><path d="M2 8c20-8 30 6 50-1s30 6 52-1 32 6 54-1" stroke="#E0337A" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`
Cinta adhesiva: `<div style="position:absolute;width:110px;height:26px;background:rgba(207,227,247,.85);transform:rotate(-6deg)"></div>`

## Recursos visuales permitidos
- Fotos subidas (ver blobs.json; usa los ids del canvas correcto: "pausa" o "equilibrada").
- Recortes PNG transparentes (cut_*): úsalos con class="stk" (borde blanco de sticker) para el collage.
- Iconos de línea SVG simples (trazo #9B1B4F 1.8px).
- Ilustraciones SVG simples (figuras de yoga/ejercicio de línea, platos, gotas de agua, frascos).
- Sin texto dentro de imágenes; sin emoji; sin marcas reales.

## Patrones de página
1. PORTADA: fondo rosa (#F7A8C7 o #FCE4EC), palabra script gigante fucsia detrás (opacity .9), titular Playfair
   negro enorme encima, recorte sticker grande, 3–5 etiquetas (.tag/.tagk) inclinadas ±3°, stickers, @marca.
2. APERTURA DE SECCIÓN: mitad rosa con número gigante Playfair (01) + palabra script, recorte sticker, lista de
   lo que aprenderás en una nota blanca inclinada.
3. CONTENIDO: fondo crema; título Playfair 40px con una palabra en .hl; entrada .lead; 2 columnas .bd;
   1 recuadro "Dato" (número Playfair grande berry + fuente); 1 sticker.
4. HERRAMIENTA / PLANTILLA: papel .lined con cinta; casillas .bx; líneas .fld; marcar campos rellenables.
5. CITA / PAUSA: fondo rosa liso, frase corta Playfair centrada (estilo «Be the STANDARD»), script encima.
6. RECETA: foto o ilustración, etiqueta de tiempo y porciones, ingredientes con casillas, pasos numerados,
   «por qué ayuda» en nota.

## Campos rellenables (para PDF editable)
En plantillas y diarios marca cada campo editable:
- texto de una línea: `data-fill="text" data-name="nombre_unico"` en el elemento .fld (o una caja).
- texto multilínea: `data-fill="multi" data-name="..."` en una caja con alto.
- casilla: `data-fill="check" data-name="..."` en el .bx.
data-name único por página (ej. "d03_lun_sueno"). El script de exportación convierte estas cajas en campos.

## Honestidad
Cada cifra con su fuente debajo (≥11px). Sin estadísticas inventadas, sin testimonios, sin promesas de
resultados. Semáforo de evidencia (verde = buena evidencia, amarillo = evidencia limitada/mixta, rojo = no
recomendado) cuando se hable de suplementos, aromaterapia, yoga o remedios.

## App
URL: https://menopausia-equilibrada.vercel.app
Rutas: #hoy (registro diario) · #progreso (gráficas e historial) · #ciclo · #plan30 · #plantillas (editables)
· #consulta (resumen para la médica) · #alarma · #cuenta (sincronizar celular y computador).
Enlaza con <a href="https://menopausia-equilibrada.vercel.app/#ruta">menopausia-equilibrada.vercel.app/#ruta</a>.
