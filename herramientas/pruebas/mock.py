import http.server, json, re, sys, os
from urllib.parse import urlparse, parse_qs
ROOT = sys.argv[1]; DB = {}
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s, *a, **k): super().__init__(*a, directory=ROOT, **k)
    def log_message(s, *a): pass
    def _id(s):
        q = parse_qs(urlparse(s.path).query); i = (q.get('id') or [''])[0]
        return i if re.fullmatch(r'[0-9a-f]{64}', i) else None
    def _json(s, code, obj):
        b = json.dumps(obj).encode(); s.send_response(code); s.send_header('content-type','application/json'); s.send_header('content-length',str(len(b))); s.end_headers(); s.wfile.write(b)
    def do_GET(s):
        if s.path.startswith('/api/sync'):
            i = s._id()
            if not i: return s._json(400, {'error':'id'})
            return s._json(200, {'data': DB.get(i)})
        return super().do_GET()
    def do_PUT(s):
        if not s.path.startswith('/api/sync'): return s._json(405, {})
        i = s._id()
        if not i: return s._json(400, {'error':'id'})
        n = int(s.headers.get('content-length', 0)); body = s.rfile.read(n)
        DB[i] = json.loads(body); return s._json(200, {'ok': True})
http.server.ThreadingHTTPServer(('127.0.0.1', 8765), H).serve_forever()
