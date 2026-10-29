import asyncio, sys, os, json, re
from playwright.async_api import async_playwright

BASE = sys.argv[1].rstrip('/')
OUT = sys.argv[2] if len(sys.argv) > 2 else '.'
live = BASE.startswith('https://')
results = []
def ok(name, cond, extra=''):
    results.append((name, bool(cond), extra)); print(('PASS' if cond else 'FAIL'), name, extra)

async def new_ctx(b, mobile=True):
    kw = dict(viewport={'width': 390, 'height': 844} if mobile else {'width': 1280, 'height': 900}, accept_downloads=True)
    if live: kw['ignore_https_errors'] = True
    ctx = await b.new_context(**kw)
    acc = os.environ.get('E2E_ACC', '')
    if acc: await ctx.add_init_script("try{localStorage.setItem('me.acc','%s')}catch(e){}" % acc)
    return ctx

async def main():
    async with async_playwright() as p:
        lk = {}
        if live and os.environ.get('HTTPS_PROXY'): lk['proxy'] = {'server': os.environ['HTTPS_PROXY']}
        b = await p.chromium.launch(**lk)
        errs = []
        # ---------- Device A ----------
        A = await new_ctx(b); pa = await A.new_page()
        pa.on('pageerror', lambda e: errs.append('A:' + str(e)))
        pa.on('console', lambda m: errs.append('A console:' + m.text) if m.type == 'error' else None)
        await pa.goto(BASE + '/#hoy'); await pa.wait_for_timeout(1500)
        ok('welcome visible first time', await pa.is_visible('#welcome'))
        ok('consent checkbox shown unchecked', await pa.is_visible('#cloudOk') and not await pa.is_checked('#cloudOk'))
        await pa.check('#cloudOk', force=True)
        await pa.click('[data-act=welcomeOk]')
        await pa.click('[data-act=flPlus]'); await pa.click('[data-act=flPlus]'); await pa.click('[data-act=flPlus]')
        await pa.click('[data-act=waPlus]'); await pa.click('[data-act=waPlus]')
        await pa.check('#energy_2', force=True)
        await pa.check('#s_calores_3', force=True)
        await pa.fill('#sleepH', '6.5'); await pa.dispatch_event('#sleepH', 'change')
        await pa.fill('#note', 'Nota de prueba A')
        await pa.wait_for_timeout(300)
        # plan30
        await pa.goto(BASE + '/#plan30'); await pa.wait_for_timeout(400)
        await pa.click('[data-act=planStart]'); await pa.wait_for_timeout(200)
        for hb in ['agua', 'mov', 'luz', 'prot']:
            await pa.check('#hb_' + hb, force=True); await pa.wait_for_timeout(120)
        # template edit
        await pa.goto(BASE + '/#plantillas/menu'); await pa.wait_for_timeout(400)
        await pa.fill('#tc_menu_0_0', 'Avena con yogur y fresas')
        await pa.goto(BASE + '/#plantillas/compras'); await pa.wait_for_timeout(300)
        await pa.fill('#ai_0', 'Espinaca'); await pa.press('#ai_0', 'Enter'); await pa.wait_for_timeout(300)
        # wait for sync
        await pa.goto(BASE + '/#cuenta'); await pa.wait_for_timeout(500)
        await pa.click('[data-act=syncNow]'); await pa.wait_for_timeout(3500)
        link = (await pa.inner_text('#myLink')).strip()
        ok('personal link shown', '#cuenta?c=' in link, link)
        ok('QR rendered', await pa.locator('#qr canvas, #qr img').count() > 0)
        st = await pa.inner_text('#syncStatus'); ok('A synced', 'Última sincronización' in st, st)
        enc = await pa.evaluate('''async () => { const c = localStorage.getItem('me.code'); const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('menopausia-equilibrada:v1:' + c));
          const id = [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
          const r = await fetch('/api/sync?id=' + id, { headers: { 'x-me-acc': localStorage.getItem('me.acc') || '' } }); const t = await r.text(); return [t.includes('"enc":"aes-gcm"'), t.includes('Nota de prueba'), t.length]; }''')
        ok('server copy is encrypted (no readable notes)', enc[0] and not enc[1], str(enc))
        await pa.screenshot(path=OUT + '/A_cuenta.png', full_page=True)
        # ---------- Device B ----------
        B = await new_ctx(b, mobile=False); pb = await B.new_page()
        pb.on('pageerror', lambda e: errs.append('B:' + str(e)))
        pb.on('console', lambda m: errs.append('B console:' + m.text) if m.type == 'error' else None)
        linkB = link.replace('https://menopausia-equilibrada.vercel.app', BASE) if not live else link
        await pb.goto(linkB); await pb.wait_for_timeout(4500)
        await pb.goto(BASE + '/#progreso'); await pb.wait_for_timeout(800)
        txt = await pb.inner_text('#view')
        ok('B sees A check-in (history)', 'sofocos 3' in txt and 'Nota de prueba A' in txt, '')
        await pb.goto(BASE + '/#plan30'); await pb.wait_for_timeout(500)
        txt = await pb.inner_text('#view'); ok('B sees A plan (4 de 6)', '4 de 6' in txt)
        await pb.goto(BASE + '/#plantillas/menu'); await pb.wait_for_timeout(500)
        v = await pb.input_value('#tc_menu_0_0'); ok('B sees A template', v == 'Avena con yogur y fresas', v)
        await pb.goto(BASE + '/#plantillas/compras'); await pb.wait_for_timeout(400)
        ok('B sees A shopping item', 'Espinaca' in await pb.inner_text('#view'))
        # edit in B
        await pb.goto(BASE + '/#plantillas/menu'); await pb.wait_for_timeout(300)
        await pb.fill('#tc_menu_1_1', 'Lentejas con verduras (desde B)')
        await pb.goto(BASE + '/#hoy'); await pb.wait_for_timeout(400)
        await pb.click('[data-act=flPlus]')
        await pb.goto(BASE + '/#cuenta'); await pb.wait_for_timeout(300)
        await pb.click('[data-act=syncNow]'); await pb.wait_for_timeout(3500)
        # ---------- reload A ----------
        await pa.goto(BASE + '/#plantillas/menu'); await pa.reload(); await pa.wait_for_timeout(4000)
        v = await pa.input_value('#tc_menu_1_1'); ok('A sees B edit after reload', v == 'Lentejas con verduras (desde B)', v)
        await pa.goto(BASE + '/#hoy'); await pa.wait_for_timeout(500)
        fl = await pa.inner_text('#flOut'); ok('A sees B sofoco count 4', fl.strip() == '4', fl)
        # routes direct open (fresh context C)
        C = await new_ctx(b); pc = await C.new_page()
        pc.on('pageerror', lambda e: errs.append('C:' + str(e)))
        expect = {'hoy': 'Registro diario', 'progreso': 'Progreso', 'ciclo': 'Ciclo', 'plan30': 'Plan de 30 días', 'plantillas': 'Plantillas', 'consulta': 'Mi consulta', 'alarma': 'Señales de alarma', 'cuenta': 'Mi cuenta'}
        for r, kick in expect.items():
            await pc.goto(BASE + '/#' + r); await pc.wait_for_timeout(700)
            k = await pc.inner_text('.hero .kick')
            cur = await pc.get_attribute('nav.tabs a[aria-current=page]', 'data-v')
            sw = await pc.evaluate('document.documentElement.scrollWidth')
            ok('route #' + r, k.strip().lower() == kick.lower() and cur == r and sw <= 390, f'kick={k} nav={cur} sw={sw}')
            await pc.screenshot(path=OUT + f'/route_{r}.png', full_page=False)
        for r in ['nada', '']:
            await pc.goto(BASE + '/#' + r); await pc.wait_for_timeout(500)
            ok('unknown #' + r + ' -> hoy', (await pc.get_attribute('nav.tabs a[aria-current=page]', 'data-v')) == 'hoy')
        await pc.goto(BASE + '/#plantillas/consulta'); await pc.wait_for_timeout(500)
        ok('deep #plantillas/consulta', 'Hoja de consulta' in await pc.inner_text('#view'))
        # prefill + downloads
        await pa.goto(BASE + '/#plantillas/consulta'); await pa.wait_for_timeout(500)
        await pa.click('[data-tplact=prefill]'); await pa.wait_for_timeout(300)
        sv = await pa.input_value('#tf_consulta_sintomas'); ok('prefill consulta', 'Calores' in sv, sv[:60])
        async with pa.expect_download(timeout=90000) as d: await pa.click('[data-tplact=pdf]')
        ok('template pdf', (await d.value).suggested_filename.endswith('.pdf'))
        await pa.goto(BASE + '/#consulta'); await pa.wait_for_timeout(400)
        async with pa.expect_download(timeout=90000) as d: await pa.click('[data-act=pdfSum]')
        ok('summary pdf', (await d.value).suggested_filename.startswith('resumen-consulta-') and (await d.value).suggested_filename.endswith('.pdf'))
        await pa.goto(BASE + '/#cuenta'); await pa.wait_for_timeout(400)
        async with pa.expect_download(timeout=120000) as d: await pa.click('[data-act=pdfFull]')
        ok('full report pdf', (await d.value).suggested_filename.startswith('mi-informe-'))
        await pa.goto(BASE + '/#progreso'); await pa.wait_for_timeout(500)
        await pa.screenshot(path=OUT + '/A_progreso.png', full_page=True)
        await pa.goto(BASE + '/#hoy'); await pa.wait_for_timeout(300)
        await pa.screenshot(path=OUT + '/A_hoy.png', full_page=True)
        await pa.goto(BASE + '/#plan30'); await pa.wait_for_timeout(300)
        await pa.screenshot(path=OUT + '/A_plan30.png', full_page=True)
        await pa.goto(BASE + '/#plantillas'); await pa.wait_for_timeout(300)
        await pa.screenshot(path=OUT + '/A_plantillas.png', full_page=True)
        ok('no console/page errors', not errs, ' | '.join(errs[:5]))
        if live:
            sw = await pa.evaluate("navigator.serviceWorker.getRegistration().then(r=>!!r)"); ok('service worker registered', sw)
            r = await pa.evaluate("fetch('/api/sync?id=xyz').then(r=>r.status)"); ok('server rejects bad id', r == 400, str(r))
            r = await pa.evaluate("fetch('/api/sync?id='+'a'.repeat(64),{method:'POST'}).then(r=>r.status)"); ok('server rejects POST', r in (401, 405), str(r))
        # delete all on B propagates to A
        await pb.goto(BASE + '/#cuenta'); await pb.wait_for_timeout(500)
        await pb.click('[data-act=delAsk]'); await pb.click('[data-act=delYes]'); await pb.wait_for_timeout(3500)
        await pa.goto(BASE + '/#progreso'); await pa.reload(); await pa.wait_for_timeout(4000)
        ok('delete-all propagates to other device', 'Todavía no hay registros' in await pa.inner_text('#view'))
        # ---------- Acceso privado ----------
        L = await b.new_context(viewport={'width': 390, 'height': 844}); pl = await L.new_page()
        await pl.goto(BASE + '/#hoy'); await pl.wait_for_timeout(1500)
        ok('lock shown without access', await pl.is_visible('#lock'))
        await pl.fill('#lockIn', '00000000000000-0000000000'); await pl.click('#lockBtn'); await pl.wait_for_timeout(1500)
        ok('lock rejects bad code', await pl.is_visible('#lockErr') and await pl.is_visible('#lock'))
        if os.environ.get('E2E_ACC'):
            await pl.goto(BASE + '/#acceso?k=' + os.environ['E2E_ACC']); await pl.wait_for_timeout(2500)
            ok('access link unlocks', not await pl.is_visible('#lock') and 'Registro' in (await pl.inner_text('#view')).title() or not await pl.is_visible('#lock'))
        await L.close()
        await b.close()
    print('SUMMARY', sum(1 for r in results if r[1]), '/', len(results))
asyncio.run(main())
