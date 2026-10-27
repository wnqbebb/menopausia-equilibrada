"""Exporta una página del canvas a PDF A4 con campos rellenables reales (AcroForm).
uso: python3 make_pdf.py <CANVAS_DIR> <pageId> <out.pdf> [filtro1,filtro2]
Los elementos con data-fill="text|multi|check" y data-name se convierten en campos editables.
"""
import sys, os, json, asyncio
os.environ['CANVAS_DIR'] = sys.argv[1]
sys.path.insert(0, os.path.dirname(__file__))
import build as B
import pymupdf

canvas_dir, pid, out = sys.argv[1], sys.argv[2], sys.argv[3]
flt = sys.argv[4] if len(sys.argv) > 4 else None
canvas = json.load(open(f'{canvas_dir}/project/canvas.json'))
names = [n for n in canvas['order'] if canvas['boards'][n].get('page') == pid]
if flt:
    names = [n for n in names if any(k in n for k in flt.split(','))]
names = [n for n in names if os.path.exists(f'{canvas_dir}/project/{n}')]
w = canvas['boards'][names[0]]['w']; h = canvas['boards'][names[0]]['h']
tag = os.path.basename(out).replace('.pdf', '')
html = f'{B.S}/build/tmp_pdf_{tag}.html'
B.build(names, html, w, h)
base = f'{B.S}/build/tmp_pdf_{tag}_base.pdf'

async def run():
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': w, 'height': h})
        await pg.goto('file://' + html)
        await pg.evaluate('document.fonts.ready')
        await pg.wait_for_timeout(900)
        fields = await pg.evaluate('''() => {
          const out = [];
          document.querySelectorAll('section.sheet').forEach((sec, i) => {
            const r0 = sec.getBoundingClientRect();
            sec.querySelectorAll('[data-fill]').forEach(el => {
              const r = el.getBoundingClientRect();
              out.push({page: i, kind: el.getAttribute('data-fill'), name: el.getAttribute('data-name') || '',
                        x: r.left - r0.left, y: r.top - r0.top, w: r.width, h: r.height});
            });
          });
          return out;
        }''')
        await pg.pdf(path=base, width=f'{w}px', height=f'{h}px', print_background=True, prefer_css_page_size=True)
        await b.close()
        return fields

fields = asyncio.run(run())
doc = pymupdf.open(base)
k = 72 / 96
used = set()
n = 0
for f in fields:
    if f['w'] < 4 or f['h'] < 4 or f['page'] >= len(doc):
        continue
    page = doc[f['page']]
    nm = f['name'] or f'campo_{f["page"]+1}_{n}'
    base_nm = nm; j = 2
    while nm in used:
        nm = f'{base_nm}_{j}'; j += 1
    used.add(nm)
    x, y, ww, hh = f['x'] * k, f['y'] * k, f['w'] * k, f['h'] * k
    wd = pymupdf.Widget()
    wd.field_name = nm
    if f['kind'] == 'check':
        s = min(ww, hh)
        wd.field_type = pymupdf.PDF_WIDGET_TYPE_CHECKBOX
        wd.rect = pymupdf.Rect(x, y, x + s, y + s)
        wd.field_value = False
        wd.border_width = 0
    else:
        wd.field_type = pymupdf.PDF_WIDGET_TYPE_TEXT
        if f['kind'] == 'text' and hh < 14:
            y = y + hh - 14; hh = 14
        wd.rect = pymupdf.Rect(x, y, x + ww, y + hh)
        wd.text_font = 'Helv'
        wd.text_fontsize = 0 if f['kind'] == 'multi' else min(11, max(7, hh * 0.6))
        wd.text_color = (0.17, 0.11, 0.14)
        wd.border_width = 0
        if f['kind'] == 'multi':
            wd.field_flags |= pymupdf.PDF_TX_FIELD_IS_MULTILINE
    page.add_widget(wd)
    n += 1
doc.save(out, garbage=3, deflate=True)
print(f'{out}: {len(doc)} páginas, {n} campos rellenables')
