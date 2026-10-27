import subprocess, sys, os, pymupdf, shutil
S=os.environ.get("ME_WORK", ".")
EQ=S+'/canvas_eq'; PA=S+'/canvas'
jobs=[(EQ,'guia','EQ/01_Guia_Integral_Menopausia_Equilibrada.pdf'),(EQ,'recetario','EQ/02_Bono1_Recetario.pdf'),(EQ,'plan30','EQ/03_Bono2_Plan_30_dias.pdf'),
 (EQ,'vitaminas','EQ/04_Bono3_Vitaminas_y_suplementos.pdf'),(EQ,'diario','EQ/05_Bono4_Diario_de_sintomas.pdf'),(EQ,'yoga','EQ/06_Bono5_Yoga_en_calma.pdf'),(EQ,'aroma','EQ/07_Bono6_Aromaterapia.pdf'),
 (PA,'libro','PA/PAUSA_Libro_60_paginas.pdf'),(PA,'plantillas','PA/PAUSA_3_Plantillas_rellenables.pdf'),(PA,'upsell1','PA/PAUSA_Upsell1_Noches_frescas.pdf'),(PA,'upsell2','PA/PAUSA_Upsell2_Intimidad_sin_dolor.pdf'),
 (PA,'upsell3','PA/PAUSA_Upsell3_Menopausia_en_el_trabajo.pdf'),(PA,'upsell4','PA/PAUSA_Upsell4_Fuerte_despues_de_los_45.pdf')]
sel=sys.argv[1:] 
for c,pid,out in jobs:
  if sel and pid not in sel: continue
  o=f'{S}/final/{out}'; os.makedirs(os.path.dirname(o),exist_ok=True); raw=o.replace('.pdf','_raw.pdf')
  r=subprocess.run(['python3',f'{S}/build/make_pdf.py',c,pid,raw],capture_output=True,text=True,timeout=900)
  print(r.stdout.strip()[-200:], r.stderr.strip()[-300:])
  d=pymupdf.open(raw); nf=sum(len(list(p.widgets())) for p in d)
  d.rewrite_images(dpi_threshold=170, dpi_target=150, quality=82, lossy=True, lossless=True)
  d.save(o,garbage=3,deflate=True); d.close(); os.remove(raw)
  d=pymupdf.open(o); nf2=sum(len(list(p.widgets())) for p in d)
  print(out, len(d),'pág', round(os.path.getsize(o)/1e6,1),'MB campos',nf,'->',nf2)
