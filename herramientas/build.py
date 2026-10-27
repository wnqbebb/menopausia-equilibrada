import json, re, sys, os, asyncio
S = os.environ.get("ME_WORK", ".")
P = os.environ.get('CANVAS_DIR', S + '/canvas') + '/project'
BLOBS = {}
_bj = json.load(open(S + '/brand/blobs.json'))
for _k in ('pausa', 'equilibrada'):
    for _name, _id in _bj[_k].items():
        BLOBS[_id] = _name

def extract(name):
    t = open(f'{P}/{name}', encoding='utf-8').read()
    body = re.search(r'<x-dc>(.*)</x-dc>', t, re.S).group(1)
    helm = re.search(r'<helmet>(.*?)</helmet>', body, re.S).group(1)
    body = body.replace(re.search(r'<helmet>.*?</helmet>', body, re.S).group(0), '')
    style = re.search(r'<style>(.*?)</style>', helm, re.S).group(1)
    for b, p in BLOBS.items():
        body = body.replace(f'/_blob/{b}', f'file://{S}/img/{p}' + ('.png' if p.startswith('cut') else '.jpg'))
        style = style.replace(f'/_blob/{b}', f'file://{S}/img/{p}' + ('.png' if p.startswith('cut') else '.jpg'))
    # scope page css by wrapping in a section
    return style, body

def build(names, out_html, w, h):
    fonts = open(f'{S}/fonts/fonts.css').read()
    fonts = re.sub(r'url\(([0-9a-f]+\.woff2)\)', lambda m: f'url(file://{S}/fonts/{m.group(1)})', fonts)
    parts = []
    styles = []
    for i, n in enumerate(names):
        st, bd = extract(n)
        sid = f's{i}'
        # prefix every selector with section id
        def pref(css):
            out = []
            for rule in re.findall(r'([^{}]+)\{([^{}]*)\}', css):
                sels = ','.join(f'#{sid} ' + s.strip() if s.strip() not in ('body',) else f'#{sid}' for s in rule[0].split(','))
                out.append(sels + '{' + rule[1] + '}')
            return '\n'.join(out)
        styles.append(pref(st))
        parts.append(f'<section id="{sid}" class="sheet">{bd}</section>')
    html = f'''<!doctype html><html lang="es"><head><meta charset="utf-8"><style>{fonts}
@page {{ size: {w}px {h}px; margin: 0 }}
html,body{{margin:0;padding:0}}
.sheet{{width:{w}px;height:{h}px;overflow:hidden;position:relative;page-break-after:always;break-after:page}}
{chr(10).join(styles)}
</style></head><body>{''.join(parts)}</body></html>'''
    open(out_html, 'w', encoding='utf-8').write(html)

async def render(out_html, pdf=None, pngs=None, w=794, h=1123, n=0, scale=1):
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': w, 'height': h}, device_scale_factor=scale)
        await pg.goto('file://' + out_html)
        await pg.evaluate('document.fonts.ready')
        await pg.wait_for_timeout(800)
        if pdf:
            await pg.pdf(path=pdf, width=f'{w}px', height=f'{h}px', print_background=True, prefer_css_page_size=True)
        if pngs:
            secs = await pg.query_selector_all('section.sheet')
            for i, s in enumerate(secs):
                await s.screenshot(path=pngs % i)
        await b.close()

if __name__ == '__main__':
    mode = sys.argv[1]
    canvas = json.load(open(f'{P}/canvas.json'))
    if mode == 'page':
        # usage: build.py page <canvasPageId> <tag> [filter1,filter2] [--pdf out.pdf]
        pid, tag = sys.argv[2], sys.argv[3]
        flt = sys.argv[4] if len(sys.argv) > 4 and not sys.argv[4].startswith('--') else None
        pdf = sys.argv[sys.argv.index('--pdf') + 1] if '--pdf' in sys.argv else None
        names = [n for n in canvas['order'] if canvas['boards'][n].get('page') == pid]
        if flt:
            names = [n for n in names if any(k in n for k in flt.split(','))]
        names = [n for n in names if os.path.exists(f'{P}/{n}')]
        w = canvas['boards'][names[0]]['w']; h = canvas['boards'][names[0]]['h']
        out = f'{S}/build/tmp_{tag}.html'
        build(names, out, w, h)
        os.makedirs(f'{S}/build/png_{tag}', exist_ok=True)
        for f in os.listdir(f'{S}/build/png_{tag}'):
            os.remove(f'{S}/build/png_{tag}/{f}')
        asyncio.run(render(out, pdf=pdf, pngs=f'{S}/build/png_{tag}/pg%02d.png', w=w, h=h))
        print('rendered', names, '->', f'{S}/build/png_{tag}/')
        sys.exit(0)
    if mode == 'book':
        names = [n for n in canvas['order'] if canvas['boards'][n].get('page') == 'libro']
        if len(sys.argv) > 2:
            names = [n for n in names if any(k in n for k in sys.argv[2].split(','))]
        names = [n for n in names if os.path.exists(f'{P}/{n}')]
        out = S + '/build/book.html'
        build(names, out, 794, 1123)
        os.makedirs(S + '/build/png', exist_ok=True)
        pdf = S + '/build/book.pdf' if len(sys.argv) <= 2 else None
        asyncio.run(render(out, pdf=pdf, pngs=S + '/build/png/pg%02d.png'))
        print('rendered', names)
