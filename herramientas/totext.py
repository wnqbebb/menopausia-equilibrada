import re,sys
for f in sys.argv[1:]:
    t=open(f).read()
    t=re.search(r'<x-dc>(.*)</x-dc>',t,re.S).group(1)
    t=re.sub(r'<helmet>.*?</helmet>','',t,flags=re.S)
    t=re.sub(r'<svg.*?</svg>','[svg]',t,flags=re.S)
    t=re.sub(r'<img[^>]*src="/_blob/([0-9a-f]+)"[^>]*alt="([^"]*)"[^>]*>',r'[IMG \1: \2]',t)
    t=re.sub(r'<br\s*/?>',' / ',t)
    t=re.sub(r'</(div|p|h\d|li|tr)>','\n',t)
    t=re.sub(r'<[^>]+>','',t)
    t=re.sub(r'[ \t]+',' ',t); t=re.sub(r'\n\s*\n+','\n',t)
    print('=== '+f); print(t.strip())
