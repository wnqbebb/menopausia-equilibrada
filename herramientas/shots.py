import os, sys, json, asyncio
S=os.environ.get("ME_WORK", ".")
from playwright.async_api import async_playwright
jobs=[(S+'/canvas_eq','S01-PortadaTienda.dc.html',S+'/final/EQ/Portada_tienda_Menopausia_Equilibrada.png',1080,1350,False),
      (S+'/canvas_eq','S02-PaginaVenta.dc.html',S+'/final/EQ/Pagina_de_venta_Menopausia_Equilibrada.png',1280,8900,True),
      (S+'/canvas_eq','Main.dc.html',S+'/final/EQ/Portada_Guia_Menopausia_Equilibrada.png',794,1123,False),
      (S+'/canvas','T01-PortadaTienda.dc.html',S+'/final/PA/Portada_tienda_PAUSA.png',1080,1350,False),
      (S+'/canvas','T02-PaginaTienda.dc.html',S+'/final/PA/Pagina_de_venta_PAUSA.png',1280,7300,True),
      (S+'/canvas','Main.dc.html',S+'/final/PA/Portada_libro_PAUSA.png',794,1123,False)]
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch()
    for c,n,out,w,h,full in jobs:
      os.environ['CANVAS_DIR']=c
      import importlib, build as B; importlib.reload(B)
      html=f'{S}/build/tmp_shot.html'; B.build([n],html,w,h)
      pg=await b.new_page(viewport={'width':w,'height':min(h,1400)},device_scale_factor=2 if not full else 1.5)
      await pg.goto('file://'+html); await pg.evaluate('document.fonts.ready'); await pg.wait_for_timeout(1200)
      el=await pg.query_selector('section.sheet')
      if full:
        # altura real del contenido
        hh=await pg.evaluate('''()=>{const s=document.querySelector('section.sheet');let m=0;s.querySelectorAll('*').forEach(e=>{const r=e.getBoundingClientRect();if(r.height>0&&r.bottom>m)m=r.bottom});return Math.ceil(m-s.getBoundingClientRect().top)}''')
        await pg.screenshot(path=out,clip={'x':0,'y':0,'width':w,'height':min(hh,h)},full_page=True)
      else: await el.screenshot(path=out)
      print(out, (await pg.evaluate('[innerWidth]')))
      await pg.close()
    await b.close()
asyncio.run(main())
