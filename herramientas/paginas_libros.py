# Genera las páginas de los libros para el lector de PLENA (una imagen por página + miniatura).
import pymupdf, json, os
from PIL import Image
from concurrent.futures import ProcessPoolExecutor
import sys, os
BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "sitio")
D = BASE + "/public/entrega-f92e9c4d594a8499f33676e3c3fd18c8/"
OUT = BASE + "/public/plena/libros/"
M={'pausa':'PAUSA_Libro_60_paginas.pdf','guia':'01_Guia_Integral_Menopausia_Equilibrada.pdf','recetario':'02_Bono1_Recetario.pdf','plan30':'03_Bono2_Plan_30_dias.pdf','vitaminas':'04_Bono3_Vitaminas_y_suplementos.pdf','diario':'05_Bono4_Diario_de_sintomas.pdf','yoga':'06_Bono5_Yoga_en_calma.pdf','aroma':'07_Bono6_Aromaterapia.pdf','plantillas':'PAUSA_3_Plantillas_rellenables.pdf','k1':'PAUSA_Upsell1_Noches_frescas.pdf','k2':'PAUSA_Upsell2_Intimidad_sin_dolor.pdf','k3':'PAUSA_Upsell3_Menopausia_en_el_trabajo.pdf','k4':'PAUSA_Upsell4_Fuerte_despues_de_los_45.pdf'}
def job(item):
    doc=pymupdf.open(D+M[item]); o=OUT+item+'/'; os.makedirs(o,exist_ok=True)
    for i,pg in enumerate(doc,1):
        z=1400/pg.rect.width; pix=pg.get_pixmap(matrix=pymupdf.Matrix(z,z),alpha=False)
        im=Image.frombytes('RGB',(pix.w,pix.h),pix.samples)
        im.save(o+'p%03d.webp'%i,'WEBP',quality=78,method=5)
        t=im.copy(); t.thumbnail((180,260)); t.save(o+'t%03d.webp'%i,'WEBP',quality=70)
    return item
with ProcessPoolExecutor(6) as ex: print(list(ex.map(job,M)))
# número de páginas para la academia
import json
man = {}
for item, f in M.items():
    doc = pymupdf.open(D + f); man[item] = {"n": doc.page_count, "w": 1000, "h": round(1000 * doc[0].rect.height / doc[0].rect.width)}
json.dump(man, open(BASE + "/contenido/libros.json", "w"), indent=1)
print("libros.json actualizado")
