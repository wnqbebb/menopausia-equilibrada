import sys
from PIL import Image, ImageDraw, ImageFont
d,a,b,out=sys.argv[1],int(sys.argv[2]),int(sys.argv[3]),sys.argv[4]
cols=int(sys.argv[5]) if len(sys.argv)>5 else 5
F=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',20)
ims=[Image.open(f'{d}/pg{i:02d}.png') for i in range(a,b)]
w=380; h=int(w*1123/794)
rows=(len(ims)+cols-1)//cols
S=Image.new('RGB',(cols*w,rows*h),'white'); D=ImageDraw.Draw(S)
for k,im in enumerate(ims):
  im=im.convert('RGB').resize((w,h)); S.paste(im,((k%cols)*w,(k//cols)*h)); D.text(((k%cols)*w+4,(k//cols)*h+4),str(a+k),fill='blue',font=F)
S.save(out,quality=80)
