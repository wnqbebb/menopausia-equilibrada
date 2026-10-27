import os
import sys,re
ids=dict(l.split() for l in open(os.environ.get("ME_WORK", ".")+'/hf/pa_up.txt'))
for f in sys.argv[1:]:
  s=open(f).read(); n=0
  def r(m):
    global n; n+=1; return '/_blob/'+ids[m.group(1)]
  s=re.sub(r'/_blob/@@([a-z0-9]+)',r,s); open(f,'w').write(s); print(f,n)
