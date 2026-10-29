/* PLENA · Academia de Menopausia y Psicomenopausia
   Plataforma privada (incluida en el pack completo). Usa el mismo código de acceso que la app.
   - Contenido: /api/curso (se edita en contenido/curso.json).
   - Progreso y logros: este dispositivo + /api/progreso (sin datos de salud).
   - Biblioteca: los libros se leen aquí mismo, pasando las páginas (imágenes en /plena/libros/<libro>/).
   - Mi diario: la app Menopausia Equilibrada integrada (mismo origen: comparte acceso y datos del dispositivo). */
(function () {
'use strict';

/* =========================================================
   Utilidades
   ========================================================= */
var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
function lsJSON(k, d) { try { var v = JSON.parse(ls(k) || 'null'); return v == null ? d : v; } catch (e) { return d; } }
function img(n) { return '/plena/img/' + n + '.webp'; }
function cover(n) { return '/oferta/img/' + n + '.webp'; }
function pad(n) { return (n < 10 ? '0' : '') + n; }
function dk(d) { d = d || new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function addD(k, n) { var p = k.split('-'), d = new Date(+p[0], +p[1] - 1, +p[2] + n); return dk(d); }
function reduced() { return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; }
function toast(m) { var t = $('#toast'); t.textContent = m; t.hidden = false; t.style.animation = 'none'; void t.offsetWidth; t.style.animation = ''; clearTimeout(toast.t); toast.t = setTimeout(function () { t.hidden = true; }, 3000); }
var KEY_ACC = 'me.acc', KEY_PERFIL = 'plena.perfil', KEY_PROG = 'plena.prog', KEY_SEEN = 'plena.vistas', KEY_POS = 'plena.pos', KEY_HOY = 'plena.hoy', KEY_SON = 'plena.sonido', KEY_VPOS = 'plena.vpos';
function findAcc(t) { var m = String(t || '').toLowerCase().match(/[0-9a-f]{14}-[0-9a-f]{10}/); return m ? m[0] : ''; }
var UID = 0;

/* =========================================================
   Arte: corazones de cristal, destellos, iconos y pegatinas
   ========================================================= */
var HEART = 'M60 104C26 80 6 60 6 36 6 19 19 7 34 7c11 0 20 6 26 15C66 13 75 7 86 7c15 0 28 12 28 29 0 24-20 44-54 68z';
function glassHeart(size, face, c1, c2, style, cls) {
  var id = 'gh' + (++UID); c1 = c1 || '#FFD1DC'; c2 = c2 || '#FF1A5D';
  var eyes = face === 'love'
    ? '<path d="M40 50c-4-4-9 0-5 4l5 5 5-5c4-4-1-8-5-4zM80 50c-4-4-9 0-5 4l5 5 5-5c4-4-1-8-5-4z" fill="#9B1B4F"/>'
    : face === 'wink'
      ? '<ellipse cx="42" cy="52" rx="4.5" ry="6" fill="#3A1426"/><circle cx="43.5" cy="49.5" r="1.6" fill="#fff"/><path d="M73 53q5-5 10 0" stroke="#3A1426" stroke-width="3.5" fill="none" stroke-linecap="round"/>'
      : '<ellipse cx="42" cy="52" rx="4.5" ry="6" fill="#3A1426"/><ellipse cx="78" cy="52" rx="4.5" ry="6" fill="#3A1426"/><circle cx="43.5" cy="49.5" r="1.6" fill="#fff"/><circle cx="79.5" cy="49.5" r="1.6" fill="#fff"/>';
  var mouth = face === 'wow' ? '<ellipse cx="60" cy="68" rx="5" ry="6" fill="#3A1426"/>' : '<path d="M50 64q10 10 20 0" stroke="#3A1426" stroke-width="3.5" fill="none" stroke-linecap="round"/>';
  return '<svg class="' + (cls || '') + '" style="' + (style || '') + '" width="' + size + '" height="' + Math.round(size * .92) + '" viewBox="0 0 120 110" aria-hidden="true"><defs>' +
    '<radialGradient id="' + id + '" cx="35%" cy="28%" r="80%"><stop offset="0" stop-color="#fff"/><stop offset=".25" stop-color="' + c1 + '"/><stop offset=".8" stop-color="' + c2 + '"/><stop offset="1" stop-color="#9B1B4F"/></radialGradient>' +
    '<linearGradient id="' + id + 'b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>' +
    '<path d="' + HEART + '" fill="url(#' + id + ')" stroke="rgba(255,255,255,.85)" stroke-width="2.5"/>' +
    '<path d="M22 30c2-10 10-16 19-15-8 3-13 9-14 17z" fill="url(#' + id + 'b)"/><ellipse cx="88" cy="26" rx="7" ry="4" fill="#fff" opacity=".55" transform="rotate(30 88 26)"/>' +
    (face ? eyes + mouth + '<ellipse cx="32" cy="64" rx="7" ry="4" fill="#FF7A9C" opacity=".6"/><ellipse cx="88" cy="64" rx="7" ry="4" fill="#FF7A9C" opacity=".6"/>' : '') + '</svg>';
}
function sparkle(c, s, style, cls) { return '<svg class="' + (cls || 'twk') + '" style="' + (style || '') + '" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0c.8 6.5 4.5 10.6 12 12-7.5 1.4-11.2 5.5-12 12-.8-6.5-4.5-10.6-12-12C7.5 10.6 11.2 6.5 12 0z" fill="' + c + '"/></svg>'; }
var IC = {
  corazon: 'M12 20.5C6.5 16.4 3 13.2 3 9.3 3 6.9 4.9 5 7.3 5c1.9 0 3.6 1.1 4.7 2.7C13.1 6.1 14.8 5 16.7 5 19.1 5 21 6.9 21 9.3c0 3.9-3.5 7.1-9 11.2z',
  luna: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z',
  llama: 'M12 22c4 0 7-2.7 7-6.6 0-4-3-6.4-4.2-9.4-.7 2-1.8 3.1-3 3.6.2-2.9-.9-5.6-3.3-7.6.4 4-4.5 7.4-4.5 12.7C4 19.3 7.6 22 12 22z',
  noche: 'M15 15.5A6.5 6.5 0 1 1 8.5 6a5 5 0 0 0 6.5 9.5zM18 3v4M16 5h4M20 10v2M19 11h2',
  mente: 'M9 4.5a3 3 0 0 0-3 3 3 3 0 0 0-1.8 5 3 3 0 0 0 1.8 4.5 3 3 0 0 0 3 3 3 3 0 0 0 3-3v-9.5a3 3 0 0 0-3-3zM15 4.5a3 3 0 0 1 3 3 3 3 0 0 1 1.8 5 3 3 0 0 1-1.8 4.5 3 3 0 0 1-3 3 3 3 0 0 1-3-3',
  pesa: 'M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11',
  hoja: 'M5 19C5 10 10 5 20 4c-1 10-6 15-15 15zM5 19l8-8',
  corazones: 'M9 18c-4-3-6.5-5.2-6.5-8A3.4 3.4 0 0 1 9 8.4 3.4 3.4 0 0 1 15.5 10M15.5 21c-3-2.2-4.8-3.9-4.8-6a2.5 2.5 0 0 1 4.8-1.3 2.5 2.5 0 0 1 4.8 1.3c0 2.1-1.8 3.8-4.8 6z',
  consulta: 'M6 3v5a4 4 0 0 0 8 0V3M10 12v3a4.5 4.5 0 0 0 9 0v-2M19 11.5a1.5 1.5 0 1 0 0 .01',
  corona: 'M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5zM5 22h14',
  libro: 'M2 5c3-1.3 6.5-1.3 10 1 3.5-2.3 7-2.3 10-1v14c-3-1.3-6.5-1.3-10 1-3.5-2.3-7-2.3-10-1zM12 6v14',
  check: 'M4 12.5l5 5L20 6.5',
  estrella: 'M12 2.5l2.9 6.2 6.6.7-5 4.5 1.4 6.6L12 17.2l-5.9 3.3 1.4-6.6-5-4.5 6.6-.7z',
  chispa: 'M12 2c.6 5 3.5 8.2 9 10-5.5 1.8-8.4 5-9 10-.6-5-3.5-8.2-9-10 5.5-1.8 8.4-5 9-10z',
  diana: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h.01',
  tel: 'M7 2.5h10a2 2 0 0 1 2 2v15a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-15a2 2 0 0 1 2-2zM10 18h4',
  lupa: 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5L21 21',
  trofeo: 'M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 14v4M8 21h8',
  hola: 'M7 11V5.5a1.5 1.5 0 0 1 3 0V10M10 9.5V4a1.5 1.5 0 0 1 3 0v6M13 10V5.5a1.5 1.5 0 0 1 3 0V12M16 11a1.5 1.5 0 0 1 3 0v3a7 7 0 0 1-7 7h-1a6 6 0 0 1-5-3l-2.6-4.2a1.5 1.5 0 0 1 2.4-1.8L7 14',
  rayo: 'M13 2L4 14h7l-1 8 9-12h-7z',
  sol: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
  dl: 'M12 3v12M7 10l5 5 5-5M4 20h16',
  x: 'M6 6l12 12M18 6L6 18',
  izq: 'M15 5l-7 7 7 7', der: 'M9 5l7 7-7 7',
  grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  zoom: 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5L21 21M10.5 7.5v6M7.5 10.5h6',
  son: 'M4 9v6h4l5 4V5L8 9zM16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11',
  mudo: 'M4 9v6h4l5 4V5L8 9zM17 9l5 6M22 9l-5 6',
  play: 'M7 4.5v15l12.5-7.5z',
  candado: 'M7 11V8a5 5 0 0 1 10 0v3M5.5 11h13v9.5h-13zM12 15v2.5',
  video: 'M3 6.5h12.5v11H3zM15.5 10.5L21 7.5v9l-5.5-3',
  auri: 'M4 15v-3a8 8 0 0 1 16 0v3M4 15h3v5H4zM17 15h3v5h-3z',
  nota: 'M9 18V5l11-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM20 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
  bandera: 'M5 21V4M5 4h11l-2 4 2 4H5',
  pantalla: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
  buscar: 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5L21 21',
  regalo: 'M4 11h16v10H4zM2.5 7h19v4h-19zM12 7v14M12 7S10.5 3 8 3.5 6.5 7 12 7zM12 7s1.5-4 4-3.5S17.5 7 12 7z'
};
function ic(n, s, sw) { return '<svg width="' + (s || 22) + '" height="' + (s || 22) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (sw || 2) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + IC[n] + '"/></svg>'; }
function shapePath(shape) {
  if (shape === 'heart') return 'M50 92C18 70 4 52 4 32 4 17 15 6 29 6c9 0 16 5 21 12C55 11 62 6 71 6c14 0 25 11 25 26 0 20-14 38-46 60z';
  var pts = [], n = shape === 'burst' ? 24 : 12, r1 = 48, r2 = shape === 'burst' ? 41 : 44;
  for (var i = 0; i < n * 2; i++) { var a = Math.PI * i / n - Math.PI / 2, r = i % 2 ? r2 : r1; pts.push((50 + r * Math.cos(a)).toFixed(1) + ' ' + (50 + r * Math.sin(a)).toFixed(1)); }
  if (shape === 'circle') return 'M50 3a47 47 0 1 1 0 94 47 47 0 1 1 0-94z';
  return 'M' + pts.join('L') + 'z';
}
function sticker(b, cls) {
  var id = 'sb' + (++UID), p = shapePath(b.shape || 'burst');
  return '<svg class="' + (cls || '') + '" viewBox="-6 -6 112 112" aria-hidden="true"><defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + b.c1 + '"/><stop offset="1" stop-color="' + b.c2 + '"/></linearGradient></defs>' +
    '<path d="' + p + '" fill="#fff" stroke="#fff" stroke-width="12" stroke-linejoin="round" style="filter:drop-shadow(0 6px 8px rgba(120,20,60,.25))"/>' +
    '<path d="' + p + '" fill="url(#' + id + ')"/>' +
    '<circle cx="50" cy="50" r="31" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="2" stroke-dasharray="3 4"/>' +
    '<g transform="translate(26 26) scale(2)" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="' + IC[b.ic || 'estrella'] + '"/></g>' +
    '<ellipse cx="33" cy="22" rx="13" ry="6" fill="#fff" opacity=".35" transform="rotate(-28 33 22)"/></svg>';
}
function stamp(txt, center, style) {
  var id = 'sp' + (++UID);
  return '<div class="stamp" style="' + (style || '') + '"><svg viewBox="0 0 120 120" aria-hidden="true"><defs><path id="' + id + '" d="M60 60m-46 0a46 46 0 1 1 92 0a46 46 0 1 1-92 0"/></defs><circle cx="60" cy="60" r="58" fill="#372937"/><text font-family="Silkscreen,monospace" font-size="10.5" fill="#FFC1CC" letter-spacing="1.5"><textPath href="#' + id + '">' + esc(txt) + '</textPath></text></svg><span class="c">' + center + '</span></div>';
}
function svgURI(s) { return 'url("data:image/svg+xml,' + encodeURIComponent(s) + '")'; }
function pattern(t) {
  var a = t.acc;
  switch (t.patron) {
    case 'lineas': return 'background-image:linear-gradient(90deg,transparent 54px,' + a + '55 54px 56px,transparent 56px),repeating-linear-gradient(transparent 0 31px,#DCE7F5 31px 32px)';
    case 'puntos': return 'background-image:radial-gradient(' + a + '40 2px,transparent 2.5px);background-size:22px 22px';
    case 'rayos': return 'background-image:repeating-conic-gradient(from 0deg at 85% 30%,' + a + '22 0 6deg,transparent 6deg 14deg)';
    case 'estrellas': return 'background-image:' + svgURI('<svg xmlns="http://www.w3.org/2000/svg" width="90" height="90"><path d="M20 8c.5 4 2.8 6.5 7 7-4.2.5-6.5 3-7 7-.5-4-2.8-6.5-7-7 4.2-.5 6.5-3 7-7z" fill="#D2CADF" opacity=".55"/><circle cx="66" cy="60" r="1.6" fill="#fff" opacity=".7"/><circle cx="48" cy="28" r="1" fill="#fff" opacity=".6"/><path d="M70 70c.3 2 1.4 3.2 3.5 3.5-2.1.3-3.2 1.5-3.5 3.5-.3-2-1.4-3.2-3.5-3.5 2.1-.3 3.2-1.5 3.5-3.5z" fill="#FFD95A" opacity=".6"/></svg>');
    case 'cuadros': return 'background-image:linear-gradient(' + a + '22 1px,transparent 1px),linear-gradient(90deg,' + a + '22 1px,transparent 1px);background-size:28px 28px';
    case 'diagonal': return 'background-image:repeating-linear-gradient(45deg,' + a + '18 0 12px,transparent 12px 26px)';
    case 'vichy': return 'background-image:linear-gradient(90deg,' + a + '18 50%,transparent 50%),linear-gradient(' + a + '18 50%,transparent 50%);background-size:36px 36px';
    case 'corazones': return 'background-image:' + svgURI('<svg xmlns="http://www.w3.org/2000/svg" width="70" height="70"><path d="M20 30c-6-4.5-9-7.6-9-11a4.5 4.5 0 0 1 9-1.6 4.5 4.5 0 0 1 9 1.6c0 3.4-3 6.5-9 11z" fill="#FFC1CC" opacity=".22"/><path d="M52 60c-3-2.3-4.5-3.8-4.5-5.5a2.3 2.3 0 0 1 4.5-.8 2.3 2.3 0 0 1 4.5.8c0 1.7-1.5 3.2-4.5 5.5z" fill="#FFC1CC" opacity=".3"/></svg>');
    case 'destellos': return 'background-image:' + svgURI('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><path d="M18 6c.5 4 2.8 6.5 7 7-4.2.5-6.5 3-7 7-.5-4-2.8-6.5-7-7 4.2-.5 6.5-3 7-7z" fill="#FFD95A" opacity=".45"/><path d="M60 50c.3 2.5 1.7 4 4.5 4.5-2.8.5-4.2 2-4.5 4.5-.3-2.5-1.7-4-4.5-4.5 2.8-.5 4.2-2 4.5-4.5z" fill="#FFC1CC" opacity=".4"/></svg>');
  }
  return '';
}
function themeVars(m) { var t = m.tema; return '--m-bg:' + t.bg + ';--m-bg2:' + t.bg2 + ';--m-acc:' + t.acc + ';--m-deep:' + t.deep + ';--m-ink:' + t.ink; }

/* =========================================================
   Estado
   ========================================================= */
var access = (ls(KEY_ACC) || '').toLowerCase();
var C = null, ARCH = {}, NOMBRE = '', VIDS = [], VBY = {}, VCAT = {}, VLEC = {}, VSUB = {};
var perfil = lsJSON(KEY_PERFIL, null);
var prog = normProg(lsJSON(KEY_PROG, {}));
var seen = lsJSON(KEY_SEEN, null);
var APP = { days: 0, today: false, plan: 0, last: '' };
function normProg(p) {
  p = p && typeof p === 'object' ? p : {};
  ['done', 'tasks', 'quiz', 'mitos', 'read', 'days', 'vid'].forEach(function (k) { if (!p[k] || typeof p[k] !== 'object') p[k] = {}; });
  if (typeof p.last !== 'string') p.last = '';
  return p;
}
function api(path, opts) {
  opts = opts || {}; opts.headers = Object.assign({ 'x-me-acc': access }, opts.headers || {});
  return fetch(path, opts).then(function (r) { return r.json().then(function (d) { return { ok: r.ok, status: r.status, d: d }; }); });
}
function mod(id) { return C.modulos.filter(function (x) { return x.id === id; })[0]; }
function libro(item) { return C.biblioteca.filter(function (b) { return b.item === item; })[0]; }
function allLessons() { var o = []; C.modulos.forEach(function (m) { m.lecciones.forEach(function (l) { o.push({ m: m, l: l }); }); }); return o; }
function modPct(m) { var n = m.lecciones.length, d = m.lecciones.filter(function (l) { return prog.done[l.id]; }).length; return { n: n, d: d, p: n ? Math.round(d / n * 100) : 0 }; }
function totalPct() { var a = allLessons(), d = a.filter(function (x) { return prog.done[x.l.id]; }).length; return { n: a.length, d: d, p: a.length ? Math.round(d / a.length * 100) : 0 }; }

/* ---------- progreso: guardar y sincronizar ---------- */
function pruneDays() { var ks = Object.keys(prog.days).sort(); while (ks.length > 120) delete prog.days[ks.shift()]; }
function saveProg(push) {
  pruneDays(); ls(KEY_PROG, JSON.stringify(prog));
  if (push && access) { clearTimeout(saveProg.t); saveProg.t = setTimeout(pushProg, 700); }
}
function pushProg() { api('/api/progreso', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(prog) }).catch(function () {}); }
function orBits(a, b) { var n = Math.max(a.length, b.length), o = ''; for (var i = 0; i < n; i++) o += (a[i] === '1' || b[i] === '1') ? '1' : '0'; return o; }
function mergeProg(r) {
  var changed = false, up = false;
  ['done', 'tasks', 'mitos', 'vid'].forEach(function (k) {
    var R = r[k] || {}; Object.keys(R).forEach(function (id) { if (!prog[k][id]) { prog[k][id] = R[id]; changed = true; } });
    Object.keys(prog[k]).forEach(function (id) { if (!R[id]) up = true; });
  });
  var Q = r.quiz || {}; Object.keys(Q).forEach(function (id) { if (!(id in prog.quiz) || (Q[id] === 1 && prog.quiz[id] !== 1)) { prog.quiz[id] = Q[id]; changed = true; } });
  Object.keys(prog.quiz).forEach(function (id) { if (Q[id] !== prog.quiz[id]) up = true; });
  var RD = r.read || {}; Object.keys(RD).forEach(function (it) { var m = orBits(prog.read[it] || '', RD[it]); if (m !== (prog.read[it] || '')) changed = true; if (m !== RD[it]) up = true; prog.read[it] = m; });
  Object.keys(prog.read).forEach(function (it) { if (!RD[it]) up = true; });
  var D = r.days || {}; Object.keys(D).forEach(function (d) { var m = (prog.days[d] || 0) | D[d]; if (m !== (prog.days[d] || 0)) changed = true; if (m !== D[d]) up = true; prog.days[d] = m; });
  Object.keys(prog.days).forEach(function (d) { if (!(d in D)) up = true; });
  if (!prog.last && r.last) { prog.last = r.last; changed = true; }
  return { changed: changed, up: up };
}
function syncProg() {
  return api('/api/progreso').then(function (x) {
    if (!x.ok || !x.d.progreso) return;
    var res = mergeProg(x.d.progreso);
    if (res.changed || res.up) saveProg(res.up);
    if (res.changed) { markSeenSilently(); render(); }
  }).catch(function () {});
}

/* ---------- datos de la app (Mi diario) ---------- */
function readApp() {
  var d = lsJSON('me.data.v2', null), t = dk();
  var o = { days: 0, today: false, plan: 0, last: '' };
  if (d && d.days) {
    var ks = Object.keys(d.days).filter(function (k) { return d.days[k] && !(d.deleted && d.deleted[k]); }).sort();
    o.days = ks.length; o.today = ks.indexOf(t) >= 0; o.last = ks[ks.length - 1] || '';
  }
  if (d && d.plan && d.plan.days) Object.keys(d.plan.days).forEach(function (k) { var h = d.plan.days[k] && d.plan.days[k].h; if (h && Object.keys(h).some(function (x) { return h[x]; })) o.plan++; });
  return o;
}
function refreshApp(celebrate) {
  var before = celebrate ? snapshot() : null;
  APP = readApp();
  if (APP.today && !((prog.days[dk()] || 0) & 4)) { prog.days[dk()] = (prog.days[dk()] || 0) | 4 | 8; saveProg(true); }
  if (before) afterAward(before, null);
}

/* =========================================================
   Gamificación: XP, niveles, insignias, rachas y misiones
   ========================================================= */
var XP = { leccion: 100, tarea: 40, quizOk: 30, quizNo: 10, mito: 20, lectura: 25, pagina: 2, modulo: 200, diario: 10, perfecto: 60, bienvenida: 50, video: 15 };
var PERF = 1 | 2 | 4 | 32; // lección + 5 páginas + diario + video
var NIV = [0, 150, 400, 800, 1300, 1900, 2700, 3700, 5000, 6600];
var NIVN = ['Curiosa', 'Valiente', 'Consciente', 'Serena', 'Fuerte', 'Sabia', 'Radiante', 'Imparable', 'Inspiradora', 'Plena'];
function pagesRead(item) { var s = prog.read[item] || ''; var n = 0; for (var i = 0; i < s.length; i++) if (s[i] === '1') n++; return n; }
function lecturaOk(r) { var s = prog.read[r.item] || ''; for (var p = r.desde; p <= r.hasta; p++) if (s[p - 1] !== '1') return false; return true; }
function streakInfo() {
  var t = dk(), cur = 0, k = (prog.days[t] & 8) ? t : addD(t, -1);
  while (prog.days[k] & 8) { cur++; k = addD(k, -1); }
  var ks = Object.keys(prog.days).filter(function (x) { return prog.days[x] & 8; }).sort(), best = 0, run = 0, prev = '';
  ks.forEach(function (x) { run = prev && addD(prev, 1) === x ? run + 1 : 1; best = Math.max(best, run); prev = x; });
  return { cur: cur, best: Math.max(best, cur) };
}
function stats() {
  var S = { lessons: 0, tasks: 0, qOk: 0, qNo: 0, mitos: 0, lect: 0, lectN: 0, pages: 0, mods: 0, books: 0, booksFull: 0, perfect: 0, vids: 0, vcat: {} };
  allLessons().forEach(function (x) {
    var id = x.l.id;
    if (prog.done[id]) S.lessons++;
    if (prog.tasks[id]) S.tasks++;
    if (prog.quiz[id] === 1) S.qOk++; else if (prog.quiz[id] === 0) S.qNo++;
    if (prog.mitos[id]) S.mitos++;
    (x.l.lecturas || []).forEach(function (r) { S.lectN++; if (lecturaOk(r)) S.lect++; });
  });
  C.biblioteca.forEach(function (b) { var n = pagesRead(b.item), t = (ARCH[b.item] || {}).n || 0; S.pages += n; if (n) S.books++; if (t && n >= t) S.booksFull++; });
  C.modulos.forEach(function (m) { if (modPct(m).p === 100) S.mods++; });
  Object.keys(prog.days).forEach(function (d) { if ((prog.days[d] & PERF) === PERF) S.perfect++; });
  Object.keys(prog.vid).forEach(function (id) { var v = VBY[id]; if (!v) return; S.vids++; S.vcat[v.cat] = (S.vcat[v.cat] || 0) + 1; });
  S.diario = APP.days; S.streak = streakInfo(); S.total = allLessons().length;
  S.xpParts = [
    ['Lecciones completadas', S.lessons * XP.leccion], ['Tareas hechas', S.tasks * XP.tarea], ['Preguntas acertadas', S.qOk * XP.quizOk + S.qNo * XP.quizNo],
    ['Mitos descubiertos', S.mitos * XP.mito], ['Lecturas de lección', S.lect * XP.lectura], ['Páginas leídas', S.pages * XP.pagina],
    ['Videos completados', S.vids * XP.video], ['Módulos completados', S.mods * XP.modulo], ['Días en tu diario', S.diario * XP.diario],
    ['Días perfectos', S.perfect * XP.perfecto], ['Bienvenida', perfil ? XP.bienvenida : 0]
  ];
  S.xp = S.xpParts.reduce(function (a, b) { return a + b[1]; }, 0);
  var lv = 0; for (var i = 0; i < NIV.length; i++) if (S.xp >= NIV[i]) lv = i;
  S.lv = lv + 1; S.lvName = NIVN[lv]; S.lvFrom = NIV[lv]; S.lvTo = NIV[lv + 1] || null;
  S.lvPct = S.lvTo ? Math.round((S.xp - S.lvFrom) / (S.lvTo - S.lvFrom) * 100) : 100;
  return S;
}
function badges() {
  function bd(id, n, d, ic, c1, c2, t, pr) { return { id: id, n: n, d: d, ic: ic, c1: c1, c2: c2, t: t, pr: pr }; }
  var B = [
    bd('hola', 'Hola, PLENA', 'Creaste tu ruta personal', 'hola', '#FFC1CC', '#FF1A5D', function () { return !!perfil; }),
    bd('primera', 'Primer paso', 'Tu primera lección', 'estrella', '#FFE08A', '#F08C00', function (S) { return S.lessons >= 1; }, function (S) { return [S.lessons, 1]; })
  ];
  C.modulos.forEach(function (m) {
    var t = m.tema;
    B.push(bd('mod-' + m.id, t.insignia, 'Módulo ' + m.num + ' · ' + m.titulo, t.icono, t.oscuro ? t.acc : t.bg, t.oscuro ? t.bg : t.acc, function () { return modPct(m).p === 100; }, function () { var p = modPct(m); return [p.d, p.n]; }));
    B[B.length - 1].mod = m.id;
  });
  B.push(
    bd('racha3', 'Racha de 3', '3 días seguidos', 'llama', '#FFE08A', '#FF6B35', function (S) { return S.streak.best >= 3; }, function (S) { return [S.streak.best, 3]; }),
    bd('racha7', 'Semana encendida', '7 días seguidos', 'llama', '#FFB27A', '#FF1A5D', function (S) { return S.streak.best >= 7; }, function (S) { return [S.streak.best, 7]; }),
    bd('racha21', 'Hábito de hierro', '21 días seguidos', 'rayo', '#FF7A9C', '#92333C', function (S) { return S.streak.best >= 21; }, function (S) { return [S.streak.best, 21]; }),
    bd('video1', 'Primera función', 'Tu primer video completo', 'play', '#D2CADF', '#7B5EA7', function (S) { return S.vids >= 1; }, function (S) { return [S.vids, 1]; }),
    bd('fuerza5', 'Fuerza de acero', '5 rutinas de fuerza', 'pesa', '#F6D2C4', '#D2553F', function (S) { return (S.vcat.fuerza || 0) >= 5; }, function (S) { return [S.vcat.fuerza || 0, 5]; }),
    bd('taichi5', 'Flujo zen', '5 prácticas de taichi', 'chispa', '#E6E0F3', '#7B5EA7', function (S) { return (S.vcat.taichi || 0) >= 5; }, function (S) { return [S.vcat.taichi || 0, 5]; }),
    bd('baile', 'A bailar', 'Un cardio o baile completo', 'nota', '#FFC1CC', '#FF1A5D', function (S) { return (S.vcat.cardio || 0) >= 1; }, function (S) { return [S.vcat.cardio || 0, 1]; }),
    bd('escucha', 'Oído atento', 'Un podcast o audiolibro', 'auri', '#F1E4DB', '#604D53', function (S) { return ((S.vcat.podcast || 0) + (S.vcat.audio || 0)) >= 1; }),
    bd('video10', 'Maratón PLENA', '10 videos completos', 'video', '#FF9FB6', '#372937', function (S) { return S.vids >= 10; }, function (S) { return [S.vids, 10]; }),
    bd('lectora', 'Lectora', '50 páginas leídas', 'libro', '#E6E0F3', '#7B5EA7', function (S) { return S.pages >= 50; }, function (S) { return [S.pages, 50]; }),
    bd('devora', 'Devoralibros', '150 páginas leídas', 'libro', '#C9B6EF', '#372937', function (S) { return S.pages >= 150; }, function (S) { return [S.pages, 150]; }),
    bd('libro1', 'Libro terminado', 'Leíste un libro entero', 'check', '#DCEFE2', '#2F855A', function (S) { return S.booksFull >= 1; }),
    bd('estante', 'Biblioteca abierta', 'Abriste los 13 libros', 'lupa', '#F1E4DB', '#B5838D', function (S) { return S.books >= C.biblioteca.length; }, function (S) { return [S.books, C.biblioteca.length]; }),
    bd('mitos', 'Cazamitos', '5 mitos descubiertos', 'chispa', '#FFC1CC', '#E0337A', function (S) { return S.mitos >= 5; }, function (S) { return [S.mitos, 5]; }),
    bd('sabia', 'Mente brillante', '10 preguntas acertadas', 'diana', '#BFE3F5', '#4A6A8A', function (S) { return S.qOk >= 10; }, function (S) { return [S.qOk, 10]; }),
    bd('tareas', 'Manos a la obra', '10 tareas hechas', 'check', '#C9EED6', '#2F855A', function (S) { return S.tasks >= 10; }, function (S) { return [S.tasks, 10]; }),
    bd('diario7', 'Diario de oro', '7 días en tu diario', 'tel', '#FFE08A', '#D2553F', function (S) { return S.diario >= 7; }, function (S) { return [S.diario, 7]; }),
    bd('perfecto', 'Día perfecto', 'Las 4 misiones de un día', 'sol', '#FFF1A8', '#FFB020', function (S) { return S.perfect >= 1; }),
    bd('graduada', 'Graduada PLENA', 'Toda la ruta completada', 'corona', '#FFE08A', '#372937', function (S) { return S.lessons >= S.total; }, function (S) { return [S.lessons, S.total]; })
  );
  return B;
}
function medal(b, on, cls, S) {
  var pr = !on && b.pr && S ? b.pr(S) : null;
  return '<div class="medal' + (on ? '' : ' off') + ' ' + (cls || '') + '" style="--c1:' + b.c1 + ';--c2:' + b.c2 + '"><div class="md-pop"><span class="md-disc"></span><img src="' + img('b-' + b.id) + '" alt="" loading="lazy"></div>' +
    '<span class="md-em">' + ic(on ? b.ic : 'candado', 15, 2.4) + '</span><span class="md-rib">' + esc(b.n) + '</span>' +
    (pr ? '<span class="md-pr"><i style="width:' + Math.min(100, Math.round(pr[0] / pr[1] * 100)) + '%"></i></span>' : '') + '</div>';
}
function earned(S) { S = S || stats(); return badges().filter(function (b) { return b.t(S); }).map(function (b) { return b.id; }); }
function markSeenSilently() { seen = earned(); ls(KEY_SEEN, JSON.stringify(seen)); }
function snapshot() { var S = stats(); return { xp: S.xp, lv: S.lv, b: earned(S) }; }
function afterAward(before, ev) {
  var S = stats(), now = earned(S), diff = S.xp - before.xp;
  if (diff > 0 && ev) xpFloat(ev, diff);
  var nuevos = now.filter(function (id) { return before.b.indexOf(id) < 0; });
  var B = badges(); var q = nuevos.map(function (id) { return B.filter(function (b) { return b.id === id; })[0]; });
  q.forEach(function (b, i) { setTimeout(function () { badgePop(b); }, 600 + i * 1900); });
  if (nuevos.length) { seen = (seen || []).concat(nuevos); ls(KEY_SEEN, JSON.stringify(seen)); }
  if (S.lv > before.lv) setTimeout(function () { levelUp(S); }, 500 + q.length * 1900);
  paintMe();
}
function award(ev, fn) { var b = snapshot(); fn(); saveProg(true); afterAward(b, ev); }
function markDay(bit) { var k = dk(); prog.days[k] = (prog.days[k] || 0) | bit | 8; }
function hoyPag(n) { var h = lsJSON(KEY_HOY, {}); if (h.d !== dk()) h = { d: dk(), n: 0 }; h.n += n; ls(KEY_HOY, JSON.stringify(h)); if (h.n >= 5) markDay(2); return h.n; }
function pagHoy() { var h = lsJSON(KEY_HOY, {}); return h.d === dk() ? h.n : 0; }
function misiones() {
  var b = prog.days[dk()] || 0, done1 = Object.keys(prog.done).some(function (id) { return dk(new Date(prog.done[id])) === dk(); });
  if (done1 && !(b & 1)) { markDay(1); saveProg(true); b = prog.days[dk()]; }
  var rv = recVideos(1)[0];
  return [
    { ok: !!(b & 1), t: 'Completa una lección', s: 'Tu siguiente paso de la ruta', rw: XP.leccion, href: nextHref(), ic: 'estrella' },
    { ok: !!(b & 32), t: 'Mira un video completo', s: rv ? rv.titulo : 'De tu videoteca', rw: XP.video, href: rv ? '#v/' + rv.id : '#videos', ic: 'play' },
    { ok: !!(b & 2), t: 'Lee 5 páginas', s: Math.min(5, pagHoy()) + ' de 5 páginas hoy', rw: 5 * XP.pagina, href: '#biblioteca', ic: 'libro' },
    { ok: !!(b & 4), t: 'Registra tu día en Mi diario', s: APP.today ? 'Registrado hoy' : 'Dos minutos bastan', rw: XP.diario, href: '#diario/hoy', ic: 'tel' }
  ];
}
/* ---------- celebraciones ---------- */
var AC = null;
function sonidoOn() { return ls(KEY_SON) !== '0'; }
function tone(kind) {
  if (!sonidoOn()) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    var t = AC.currentTime;
    if (kind === 'page') {
      var len = .32, buf = AC.createBuffer(1, AC.sampleRate * len, AC.sampleRate), d = buf.getChannelData(0);
      for (var i = 0; i < d.length; i++) { var x = i / d.length; d[i] = (Math.random() * 2 - 1) * Math.pow(1 - x, 2) * Math.min(1, x * 12); }
      var s = AC.createBufferSource(); s.buffer = buf; var f = AC.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2400; f.Q.value = .7;
      var g = AC.createGain(); g.gain.value = .22; s.connect(f); f.connect(g); g.connect(AC.destination); s.start(t); return;
    }
    var notes = kind === 'level' ? [523, 659, 784, 1047] : kind === 'badge' ? [784, 988, 1319] : [659, 880];
    notes.forEach(function (fr, i) { var o = AC.createOscillator(), g2 = AC.createGain(); o.type = 'triangle'; o.frequency.value = fr; g2.gain.setValueAtTime(0, t + i * .09); g2.gain.linearRampToValueAtTime(.12, t + i * .09 + .02); g2.gain.exponentialRampToValueAtTime(.001, t + i * .09 + .45); o.connect(g2); g2.connect(AC.destination); o.start(t + i * .09); o.stop(t + i * .09 + .5); });
  } catch (e) { }
}
function confetti(n) {
  if (reduced()) return;
  var c = document.createElement('div'); c.className = 'confetti'; var cols = ['#FF1A5D', '#FFC1CC', '#FFD95A', '#D2CADF', '#92333C', '#fff', '#DB7F8E'];
  for (var i = 0; i < (n || 80); i++) { var s = document.createElement('i'); s.style.left = Math.random() * 100 + '%'; s.style.background = cols[i % cols.length]; s.style.borderRadius = i % 3 ? '50%' : i % 2 ? '2px' : '50% 50% 0 50%'; s.style.animationDelay = Math.random() * .7 + 's'; s.style.animationDuration = 2.2 + Math.random() * 1.4 + 's'; c.appendChild(s); }
  document.body.appendChild(c); setTimeout(function () { c.remove(); }, 4200);
}
function xpFloat(ev, n) {
  var x = innerWidth / 2, y = innerHeight / 2;
  if (ev && ev.clientX) { x = ev.clientX; y = ev.clientY; } else if (ev && ev.getBoundingClientRect) { var r = ev.getBoundingClientRect(); x = r.left + r.width / 2; y = r.top; }
  var d = document.createElement('div'); d.className = 'xpfloat'; d.textContent = '+' + n + ' XP'; d.style.left = x + 'px'; d.style.top = (y - 10) + 'px';
  document.body.appendChild(d); setTimeout(function () { d.remove(); }, 1500); tone('xp');
}
function badgePop(b) {
  var d = document.createElement('div'); d.className = 'cel'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true');
  d.innerHTML = '<div class="box bdgbox"><div class="rays"></div>' + medal(b, true, 'big') + '<span class="pill hot">¡Nueva insignia!</span><h2>' + esc(b.n) + '</h2><p>' + esc(b.d) + '</p><button class="btn btn-p" data-act="cerrarCel" style="width:100%">¡Me la llevo!</button></div>';
  document.body.appendChild(d); tone('badge'); confetti(70);
}
function levelUp(S) {
  var d = document.createElement('div'); d.className = 'cel'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true');
  d.innerHTML = '<div class="box"><div class="rays"></div>' + glassHeart(140, 'love', '#FFD1DC', '#FF1A5D', '', 'hero-s') + '<span class="pill gold">Nivel ' + S.lv + '</span><h2>¡Subiste de nivel!<span class="bub">' + esc(S.lvName) + '</span></h2><p>' + esc(nivelFrase(S.lv)) + '</p><button class="btn btn-p" data-act="cerrarCel" style="width:100%">¡Seguir brillando!</button></div>';
  document.body.appendChild(d); tone('level'); confetti(120); setTimeout(function () { var b = $('button', d); if (b) b.focus(); }, 300);
}
function nivelFrase(lv) {
  return ['Empezaste con curiosidad: es el primer paso para entender tu cuerpo.', 'Te atreviste a mirar de frente lo que te pasa. Eso es valentía.', 'Ya sabes lo que pasa en tu cuerpo: el conocimiento quita miedo.', 'Estás encontrando calma en medio del cambio.', 'Tu cuerpo y tu mente se están cuidando de verdad.', 'Lo que sabes ya puede ayudar a otras mujeres.', 'Se nota: estás volviendo a sentirte tú.', 'Nada te detiene: constancia pura.', 'Eres ejemplo para las mujeres que te rodean.', 'Llegaste a PLENA. No es el final de nada: es una graduación.'][lv - 1] || '';
}

/* =========================================================
   Ruta personal
   ========================================================= */
function ruta() {
  var orden = ['m0', 'm1'];
  ((perfil && perfil.objetivos) || []).forEach(function (o) { var ob = C.objetivos.filter(function (x) { return x.id === o; })[0]; if (ob && orden.indexOf(ob.modulo) < 0) orden.push(ob.modulo); });
  C.modulos.forEach(function (m) { if (orden.indexOf(m.id) < 0) orden.push(m.id); });
  return orden.map(mod).filter(Boolean);
}
function paraTi(m) { return ((perfil && perfil.objetivos) || []).some(function (o) { var ob = C.objetivos.filter(function (x) { return x.id === o; })[0]; return ob && ob.modulo === m.id; }); }
function siguiente() {
  if (prog.last) { var p = prog.last.split('/'), mm = mod(p[0]), ll = mm && mm.lecciones.filter(function (l) { return l.id === p[1]; })[0]; if (ll && !prog.done[ll.id]) return { m: mm, l: ll }; }
  var r = ruta(); for (var i = 0; i < r.length; i++) for (var j = 0; j < r[i].lecciones.length; j++) if (!prog.done[r[i].lecciones[j].id]) return { m: r[i], l: r[i].lecciones[j] };
  return null;
}
function nextHref() { var n = siguiente(); return n ? '#l/' + n.m.id + '/' + n.l.id : '#certificado'; }
function nombre() { return (perfil && perfil.nombre) || NOMBRE || ''; }
function saludo() { var h = new Date().getHours(); return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'; }
function etapaTxt() {
  var e = perfil && perfil.etapa;
  if (e === 'peri') return 'Estás en plena transición: tu cuerpo está recalibrando, y aquí vas a entender cada señal.';
  if (e === 'post') return 'Ya pasaste la menopausia: esta etapa es larga y valiosa, y hoy empiezas a cuidarla a tu manera.';
  if (e === 'inducida') return 'Tu menopausia llegó por un tratamiento o una cirugía: mereces información clara y acompañamiento a tu ritmo.';
  return 'En el módulo 1 descubres en qué etapa estás. Saberlo quita mucho miedo.';
}
function latiDice(S) {
  var nm = nombre(), mis = misiones().filter(function (m) { return m.ok; }).length;
  if (S.lessons === 0) return '¡Hola' + (nm ? ', ' + nm : '') + '! Soy Lati. Empecemos con una lección cortita.';
  if (mis === 3) return '¡Día perfecto! Hoy cumpliste tus 3 misiones.';
  if (S.streak.cur >= 2) return '¡' + S.streak.cur + ' días seguidos! No rompas la racha.';
  if (S.lvTo && S.lvTo - S.xp <= 150) return 'Te faltan ' + (S.lvTo - S.xp) + ' XP para ser «' + NIVN[S.lv] + '».';
  return 'Una lección y un registro en tu diario: así se cambia una etapa.';
}

/* =========================================================
   Vistas
   ========================================================= */
function ring(p, size, stroke, txt) {
  var r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return '<svg class="ring" viewBox="0 0 ' + size + ' ' + size + '" aria-hidden="true"><circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="rgba(255,255,255,.85)" stroke-width="' + stroke + '"/><circle class="fg" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="url(#rg)" stroke-width="' + stroke + '" stroke-linecap="round" stroke-dasharray="' + c + '" stroke-dashoffset="' + c + '" data-off="' + (c * (1 - p / 100)) + '" transform="rotate(-90 ' + size / 2 + ' ' + size / 2 + ')" style="transition:stroke-dashoffset 1.2s cubic-bezier(.2,.8,.2,1)"/>' +
    '<defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFC1CC"/><stop offset="1" stop-color="#FF1A5D"/></linearGradient></defs>' +
    (txt ? '<text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-family="Playfair Display" font-weight="900" font-size="' + size * .3 + '" fill="#372937">' + txt + '</text>' : '') + '</svg>';
}
function vInicio() {
  var S = stats(), t = totalPct(), nx = siguiente(), nm = nombre(), mis = misiones(), misOk = mis.filter(function (m) { return m.ok; }).length;
  var h = '<section class="hero"><div class="bgpaper"></div><div class="wrap in">' +
    '<div class="hl-col"><div class="chips"><span class="pill hot">' + ic('corazon', 14) + ' Menopausia</span><span class="pill dk">' + ic('mente', 14) + ' Psicomenopausia</span><span class="pill">Sin tabú</span></div>' +
    '<p class="hi">' + esc(saludo()) + (nm ? ', ' + esc(nm) : '') + '</p>' +
    '<h1>Plena<span class="st">✦</span></h1>' +
    '<p class="sub">' + esc(C.subtitulo) + '</p><p class="lema">«' + esc(C.lema) + '» ' + esc(etapaTxt()) + '</p>' +
    '<div class="cta"><a class="btn btn-p" href="' + nextHref() + '">' + ic('estrella', 18) + (t.d ? ' Continuar mi ruta' : ' Empezar mi ruta') + '</a><a class="btn btn-d" href="#videos">' + ic('play', 18) + ' Videoteca</a></div>' +
    '<a class="lvlbox glass" href="#logros">' + ring(S.lvPct, 58, 7, S.lv) + '<div style="flex:1;min-width:0"><b>Nivel ' + S.lv + ' · ' + esc(S.lvName) + '</b><div class="xbar"><i style="width:' + S.lvPct + '%"></i></div><small>' + S.xp + ' XP' + (S.lvTo ? ' · ' + (S.lvTo - S.xp) + ' para «' + NIVN[S.lv] + '»' : ' · ¡nivel máximo!') + '</small></div></a></div>' +
    '<div class="art" aria-hidden="true">' +
      '<div class="sheet lined"><span class="tape"></span></div>' +
      '<div class="pol"><span class="tape pk"></span><img src="' + img('f37a') + '" alt=""><span>tu momento</span></div>' +
      '<div class="starbg"></div><div class="starph"><img src="' + img('f36a') + '" alt=""></div>' +
      '<img class="woman stk" src="' + img('cut02a') + '" alt="">' +
      '<img class="glasses stk flt" src="' + img('cut67') + '" alt="">' +
      '<img class="flowers stk flt2" src="' + img('cut68') + '" alt="">' +
      stamp('NO ESTÁS ROTA · ESTÁS EN TRANSICIÓN · ', glassHeart(46, 'happy')) +
      glassHeart(70, 'wink', '#FFD1DC', '#FF1A5D', 'left:44%;top:8px;--r:-10deg', 'gh flt') +
      sparkle('#FFD95A', 30, 'left:38%;bottom:46px') +
      '<span class="lbl pill hot" style="left:8%;bottom:118px;transform:rotate(-6deg)">♥ tu ruta personal</span>' +
      '<span class="lbl pill dk" style="right:26%;bottom:22px;transform:rotate(4deg)">' + C.modulos.length + ' módulos · ' + VIDS.length + ' videos</span>' +
    '</div></div></section>';
  h += '<section class="band dk"><div class="wrap sband">' +
    '<a href="#logros"><span class="ic">' + ic('chispa', 24) + '</span><b>' + S.xp + '</b><span>XP totales</span></a>' +
    '<a href="#logros"><span class="ic fire">' + ic('llama', 24) + '</span><b>' + S.streak.cur + '</b><span>' + (S.streak.cur === 1 ? 'día de racha' : 'días de racha') + '</span></a>' +
    '<a href="#ruta"><span class="ic vio">' + ic('diana', 24) + '</span><b>' + t.p + '%</b><span>' + t.d + ' de ' + t.n + ' lecciones</span></a>' +
    '<a href="#logros"><span class="ic gold">' + ic('trofeo', 24) + '</span><b>' + earned(S).length + '<small>/' + badges().length + '</small></b><span>insignias</span></a>' +
    '</div></section>';
  h += '<section class="sec"><div class="wrap today">';
  if (nx) {
    h += '<div class="tcol"><a class="cont2 rv" href="#l/' + nx.m.id + '/' + nx.l.id + '" style="' + themeVars(nx.m) + '"><div class="tx"><span class="pill">' + (t.d ? 'Continúa donde lo dejaste' : 'Empieza aquí') + '</span><h3>' + esc(nx.l.titulo) + '</h3><p>Módulo ' + nx.m.num + ' · ' + esc(nx.m.titulo) + ' · ' + nx.l.min + ' min</p><span class="btn btn-w btn-s">' + ic('der', 16) + ' Ir a la lección · +' + lessonMaxXP(nx.l) + ' XP</span></div><img class="ct" src="' + img(nx.m.recorte) + '" alt=""></a>' +
      '<div class="minis">' + readTodayCard(nx) + videoTodayCard(nx) + '</div></div>';
  } else {
    h += '<div class="tcol"><div class="cont2" style="display:block;text-align:center"><span class="pill">¡Lo lograste!</span><h3>Completaste toda tu ruta</h3><p>' + esc(C.cierre) + '</p><a class="btn btn-w" href="#certificado">Ver mi certificado</a></div></div>';
  }
  h += '<div class="panel mispanel rv"><div class="mh2"><span class="kick">Misiones de hoy</span><span class="mcount"><b>' + misOk + '</b>/4</span></div><div class="mis">' +
    mis.map(function (m) { return '<a class="mi' + (m.ok ? ' ok' : '') + '" href="' + m.href + '"><span class="ck">' + ic(m.ok ? 'check' : m.ic, 22) + '</span><span><b>' + esc(m.t) + '</b><small>' + esc(m.s) + '</small></span><span class="rw">' + (m.ok ? '✓' : '+' + m.rw) + '</span></a>'; }).join('') +
    '</div><div class="bonus"><span>' + ic('regalo', 18) + '</span> Las 4 misiones = día perfecto <b>+' + XP.perfecto + ' XP</b></div>' +
    '<div class="lati">' + glassHeart(58, misOk === 4 ? 'love' : 'happy') + '<span class="bb">' + esc(latiDice(S)) + '</span></div></div>';
  h += '</div></section>';
  h += '<section class="sec" style="padding-top:0"><div class="wrap"><div class="sec-h"><div><span class="kick">Hecha para ti' + (nm ? ', ' + esc(nm) : '') + '</span><h2>Tu ruta <span class="scr">personal</span></h2></div><a class="btn btn-g btn-s" href="#ruta">Ver el mapa completo</a></div>' + mapa(ruta().slice(0, 4), true) + '</div></section>';
  var rec = recVideos(10);
  h += '<section class="band vio"><div class="wrap"><div class="sec-h"><div><span class="kick">Videoteca · ' + VIDS.length + ' clases</span><h2>Para moverte <span class="scr">hoy</span></h2></div><a class="btn btn-d btn-s" href="#videos">Abrir la videoteca</a></div><div class="rail">' + rec.map(vidCard).join('') + '</div></div></section>';
  var B = badges(), got = earned(S), next = B.filter(function (b) { return got.indexOf(b.id) < 0; }).slice(0, 4), last = B.filter(function (b) { return got.indexOf(b.id) >= 0; }).slice(-2);
  h += '<section class="sec"><div class="wrap"><div class="sec-h"><div><span class="kick">' + got.length + ' de ' + B.length + ' insignias</span><h2>Tus <span class="scr">logros</span></h2></div><a class="btn btn-g btn-s" href="#logros">Ver el álbum</a></div><div class="medrow">' +
    last.map(function (b) { return medal(b, true, '', S); }).join('') + next.map(function (b) { return medal(b, false, '', S); }).join('') + '</div></div></section>';
  h += '<section class="sec" style="padding-top:0"><div class="wrap"><div class="card dsum rv"><div><span class="kick" style="color:var(--petal)">Mi diario · integrado</span><h3 class="ser" style="font-size:28px;margin:8px 0 2px">Lo que aprendes aquí, lo registras allí</h3><div class="nums"><div><b>' + APP.days + '</b><span>días registrados</span></div><div><b>' + APP.plan + '/30</b><span>días del plan</span></div><div><b>' + (APP.today ? '✓' : '—') + '</b><span>registro de hoy</span></div></div><a class="btn btn-w" href="#diario/hoy">' + ic('tel', 18) + ' Abrir mi diario</a></div><img class="phone" src="' + cover('app-hoy') + '" alt="" loading="lazy"><img class="dcut stk" src="' + img('cut21b') + '" alt="" loading="lazy"></div></div></section>';
  return h;
}
function readTodayCard(nx) {
  var r = (nx.l.lecturas || []).filter(function (x) { return !lecturaOk(x); })[0] || (nx.l.lecturas || [])[0]; if (!r) return '';
  var b = libro(r.item);
  return '<button class="rcard glass rv" data-act="leer" data-item="' + r.item + '" data-p="' + r.desde + '" data-h="' + r.hasta + '" data-lid="' + nx.l.id + '"><img src="' + cover(b.portada) + '" alt=""><span><span class="kick">Lectura de hoy</span><b style="margin-top:4px">' + esc(r.titulo) + '</b><small>' + esc(b.titulo) + ' · págs. ' + r.desde + (r.hasta > r.desde ? '–' + r.hasta : '') + ' · +' + XP.lectura + ' XP</small></span></button>';
}
function videoTodayCard(nx) {
  var v = VBY[VLEC[nx.l.id]] || recVideos(1)[0]; if (!v) return '';
  var c = VCAT[v.cat] || {};
  return '<a class="rcard glass rv" href="#v/' + v.id + '"><span class="vmini" style="--vc:' + c.color + '"><img src="https://i.ytimg.com/vi/' + v.id + '/mqdefault.jpg" alt="" loading="lazy"><span class="vplay sm">' + ic('play', 16) + '</span></span><span><span class="kick">Video de hoy</span><b style="margin-top:4px">' + esc(v.titulo) + '</b><small>' + esc(c.nombre || '') + ' · +' + XP.video + ' XP</small></span></a>';
}
function lessonMaxXP(l) { return XP.leccion + XP.tarea + XP.quizOk + (l.mito ? XP.mito : 0) + (l.lecturas || []).length * XP.lectura; }

/* mapa tipo juego */
var XS = [50, 26, 50, 74];
var XS = [50, 26, 50, 74];
function mapa(list, mini) {
  var n = list.length, nx = siguiente(), rows = '', H = 200, top = 70, lastDone = -1, S = stats(), B = badges(), got = earned(S);
  list.forEach(function (m, i) { if (modPct(m).p === 100) lastDone = i; });
  var mob = window.innerWidth < 700, xs = mob ? [17, 29, 17, 29] : XS;
  var pts = list.map(function (m, i) { return [xs[i % 4], top + i * H + 84]; });
  var endY = top + n * H + (mini ? 0 : 60);
  var d = 'M50 30 C50 ' + (top + 40) + ' ' + pts[0][0] + ' ' + (pts[0][1] - 70) + ' ' + pts[0][0] + ' ' + pts[0][1], dDone = '';
  pts.forEach(function (p, i) {
    if (!i) return;
    var q = pts[i - 1], seg = ' C' + q[0] + ' ' + (q[1] + H / 2) + ' ' + p[0] + ' ' + (p[1] - H / 2) + ' ' + p[0] + ' ' + p[1];
    d += seg; if (i <= lastDone) dDone += (dDone ? '' : 'M' + q[0] + ' ' + q[1]) + seg;
  });
  if (!mini) { var lp = pts[n - 1]; d += ' C' + lp[0] + ' ' + (lp[1] + 90) + ' 50 ' + (endY - 70) + ' 50 ' + endY; }
  list.forEach(function (m, i) {
    var p = modPct(m), here = nx && nx.m.id === m.id, x = xs[i % 4], right = !mob && x > 60, bx = x < 50 ? 80 : x > 50 ? 20 : 17;
    var b = B.filter(function (q) { return q.id === 'mod-' + m.id; })[0], won = got.indexOf(b.id) >= 0;
    rows += '<div class="row" style="top:' + (top + i * H) + 'px">' +
      '<a class="node rv' + (right ? ' r' : '') + (here ? ' here' : '') + '" href="#m/' + m.id + '" style="left:' + x + '%;--p:' + p.p + ';--c:' + m.tema.bg + '">' +
      '<span class="disc">' + (here ? '<span class="heretag pill hot">' + ic('corazon', 12) + ' Estás aquí</span>' : '') + '<span class="in"><img src="' + img(m.foto) + '" alt="" loading="lazy"></span><span class="num">' + m.num + '</span></span>' +
      '<span class="lab"><b>' + esc(m.titulo) + '</b><small>' + p.d + '/' + p.n + ' lecciones · ' + p.p + '%</small><span class="pills">' + (paraTi(m) ? '<span class="pill hot">♥ Para ti</span>' : '') + (p.p === 100 ? '<span class="pill ok">✓ Completado</span>' : here ? '<span class="pill dk">En curso</span>' : '<span class="pill">+' + XP.modulo + ' XP</span>') + '</span></span></a>' +
      '<div class="prize" style="left:' + bx + '%">' + medal(b, won, 'sm', S) + '<span class="pill ' + (won ? 'gold' : 'dk') + '">' + (won ? '¡Ganada!' : 'Premio del módulo') + '</span></div></div>';
  });
  var fin = mini ? '' : '<a class="mfin" href="#certificado" style="top:' + (endY - 10) + 'px"><span class="crown">' + ic('corona', 34, 2) + '</span><b>Graduación PLENA</b><small>' + (totalPct().p === 100 ? 'Tu certificado te espera' : 'Completa la ruta y recibe tu certificado') + '</small></a>';
  return '<div class="board' + (mini ? ' mini' : '') + '"><div class="map" style="height:' + (endY + (mini ? 20 : 130)) + 'px"><span class="mstart pill gold">' + ic('bandera', 14) + ' Inicio de tu ruta</span>' +
    '<svg class="path" viewBox="0 0 100 ' + (endY + 20) + '" preserveAspectRatio="none" aria-hidden="true" style="height:' + (endY + 20) + 'px"><path d="' + d + '" fill="none" stroke="rgba(255,255,255,.22)" stroke-width="16" vector-effect="non-scaling-stroke" stroke-linecap="round"/><path d="' + d + '" fill="none" stroke="#FFC1CC" stroke-width="4" stroke-dasharray="2 13" vector-effect="non-scaling-stroke" stroke-linecap="round"/>' + (dDone ? '<path d="' + dDone + '" fill="none" stroke="#FFD95A" stroke-width="6" vector-effect="non-scaling-stroke" stroke-linecap="round"/>' : '') + '</svg>' + rows + fin + '</div>' +
    (mini ? '<a class="more" href="#ruta">Ver los ' + C.modulos.length + ' módulos ' + ic('der', 16) + '</a>' : '') + '</div>';
}
function vRuta() {
  var t = totalPct();
  return '<section class="sec"><div class="wrap"><div class="sec-h"><div><span class="kick">' + C.modulos.length + ' módulos · ' + t.n + ' lecciones · ' + t.p + '% completado</span><h2>El mapa de tu <span class="scr">ruta</span></h2><p class="muted" style="margin:8px 0 0;max-width:640px">Ordenada según lo que más te pesa. Cada módulo completado te da su insignia personal y +' + XP.modulo + ' XP. Al final te espera tu graduación.</p></div><a class="btn btn-g btn-s" href="#perfil">Ajustar mis objetivos</a></div>' + mapa(ruta(), false) + '</div></section>';
}
function vModulo(id) {
  var m = mod(id); if (!m) return vRuta();
  var t = m.tema, p = modPct(m), dark = t.oscuro ? ' dark' : '', mins = m.lecciones.reduce(function (a, l) { return a + l.min; }, 0);
  var B = badges().filter(function (b) { return b.id === 'mod-' + m.id; })[0];
  var crumbs = '<div class="crumbs"><a href="#ruta">Mi ruta</a> › <span>Módulo ' + m.num + '</span></div>';
  var meta = '<div class="meta"><span class="pill">' + m.lecciones.length + ' lecciones</span><span class="pill">≈ ' + mins + ' min</span><span class="pill hot">' + p.p + '% hecho</span>' + (paraTi(m) ? '<span class="pill dk">♥ Para ti</span>' : '') + '</div>';
  var cta = '<a class="btn btn-p" href="#l/' + m.id + '/' + ((m.lecciones.filter(function (l) { return !prog.done[l.id]; })[0] || m.lecciones[0]).id) + '">' + ic('estrella', 18) + (p.d ? ' Continuar el módulo' : ' Empezar el módulo') + '</a>';
  var h = '<section class="mh ' + t.estilo + dark + '" style="' + themeVars(m) + '"><div class="pat" style="' + pattern(t) + '"></div>';
  if (t.estilo === 'poster') {
    h += '<div class="big" aria-hidden="true">' + esc(t.palabra) + '</div><div class="wrap in"><div style="position:relative;z-index:2">' + crumbs + '<span class="pill ' + (t.oscuro ? 'gold' : 'dk') + '">Módulo ' + m.num + '</span><h1>' + esc(m.titulo) + '<em>' + esc(m.subtitulo) + '</em></h1><p class="q">«' + esc(m.frase) + '»</p><p class="resp">' + esc(m.respuesta) + '</p>' + meta + cta + '</div>' +
      '<div class="vis" aria-hidden="true"><div class="arch"><img src="' + img(m.foto) + '" alt=""></div><img class="cut stk" src="' + img(m.recorte) + '" alt="">' + sparkle(t.acc, 40, 'right:6%;top:4px') + sparkle('#fff', 24, 'right:76%;top:60px') + sticker({ ic: t.icono, c1: '#fff', c2: t.acc, shape: 'burst' }, 'flt" style="position:absolute;width:84px;height:84px;right:2%;bottom:30px;--r:10deg') + '</div></div>';
  } else if (t.estilo === 'revista') {
    h += '<div class="wrap in"><div class="vtab">' + esc(t.palabra) + '</div><div style="position:relative;z-index:2">' + crumbs + '<div class="no">' + pad(+m.num) + '</div><h1>' + esc(m.titulo) + '</h1><p class="sub">' + esc(m.subtitulo) + '</p><p class="pq">' + esc(m.frase) + '</p><p class="resp">' + esc(m.respuesta) + '</p>' + meta + cta + '</div>' +
      '<div class="vis" aria-hidden="true"><div class="frame"><img src="' + img(m.foto) + '" alt=""></div><img class="cut stk" src="' + img(m.recorte) + '" alt="">' + glassHeart(54, 'happy', '#fff', t.acc, 'right:4%;top:0;--r:8deg', 'flt') + sparkle(t.acc, 30, 'right:30%;bottom:20px') + '</div></div>';
  } else {
    h += '<div class="wrap in"><div style="position:relative;z-index:2">' + crumbs + '<span class="pill hot">Módulo ' + m.num + '</span><h1>' + esc(m.titulo) + '</h1><p class="sub">' + esc(m.subtitulo) + '</p><div class="note"><span class="tape"></span><p class="ser" style="font-size:19px;font-style:italic;margin:0 0 8px">«' + esc(m.frase) + '»</p><p style="margin:0;font-weight:600">' + esc(m.respuesta) + '</p></div>' + meta + cta + '</div>' +
      '<div class="vis" aria-hidden="true"><div class="pol"><span class="tape pk"></span><img src="' + img(m.foto) + '" alt=""><span>' + esc(t.palabra) + '</span></div><img class="cut stk" src="' + img(m.recorte) + '" alt="">' + glassHeart(60, 'wink', '#FFE1E8', t.acc, 'left:0;top:0;--r:-10deg', 'flt') + sparkle('#FFD95A', 34, 'left:58%;top:6px') + sticker({ ic: t.icono, c1: t.bg, c2: t.acc, shape: 'flower' }, 'flt2" style="position:absolute;width:78px;height:78px;left:4%;bottom:20px') + '</div></div>';
  }
  h += '</section>';
  h += '<section class="sec" style="' + themeVars(m) + '"><div class="wrap grid2" style="grid-template-columns:1.3fr 1fr"><div><div class="sec-h"><div><span class="kick">Tus lecciones</span><h2 style="font-size:32px">' + p.d + ' de ' + p.n + ' completadas</h2></div></div><div class="steps">' +
    m.lecciones.map(function (l, i) {
      var ok = !!prog.done[l.id], tags = [l.min + ' min'];
      if ((l.lecturas || []).length) { var nl = (l.lecturas || []).length; tags.push(nl + (nl === 1 ? ' lectura' : ' lecturas')); }
      if (l.mito) tags.push('mito o verdad'); tags.push('quiz'); tags.push('tarea');
      return '<a class="step rv' + (ok ? ' ok' : '') + '" href="#l/' + m.id + '/' + l.id + '"><span class="n">' + (ok ? ic('check', 28, 3) : (i + 1)) + '</span><span><b>' + esc(l.titulo) + '</b><span class="tags">' + tags.map(function (x) { return '<span>' + x + '</span>'; }).join('') + '</span></span><span class="xp">' + (ok ? '✓ Hecha' : '+' + lessonMaxXP(l) + ' XP') + '</span></a>';
    }).join('') + '</div></div><div style="display:grid;gap:16px;align-content:start">' +
    '<div class="mbadge glass">' + medal(B, p.p === 100, 'sm', stats()) + '<div><span class="kick">Insignia del módulo</span><b>' + esc(t.insignia) + '</b><small>' + (p.p === 100 ? '¡Ganada! +' + XP.modulo + ' XP' : 'Completa las ' + p.n + ' lecciones para ganarla (+' + XP.modulo + ' XP)') + '</small></div></div>' +
    modReads(m) + '</div></div></section>';
  var mv = VIDS.filter(function (v) { return v.mods.indexOf(m.id) >= 0; }).sort(function (a, b) { return a.opinion - b.opinion; });
  if (mv.length) h += '<section class="band vio" style="' + themeVars(m) + '"><div class="wrap"><div class="sec-h"><div><span class="kick">Videos del módulo · +' + XP.video + ' XP cada uno</span><h2>Practica y <span class="scr">escucha</span></h2></div><a class="btn btn-d btn-s" href="#videos">Toda la videoteca</a></div><div class="vgrid">' + mv.slice(0, 8).map(vidCard).join('') + '</div></div></section>';
  return h;
}
function modReads(m) {
  var seenR = {}, list = [];
  m.lecciones.forEach(function (l) { (l.lecturas || []).forEach(function (r) { var k = r.item + r.desde; if (!seenR[k]) { seenR[k] = 1; list.push({ r: r, l: l }); } }); });
  if (!list.length) return '';
  return '<div class="panel glass"><span class="kick">Lecturas del módulo</span><div class="reads" style="margin-top:12px">' + list.slice(0, 6).map(function (x) { return readBtn(x.r, x.l.id); }).join('') + '</div></div>';
}
function readBtn(r, lid) {
  var b = libro(r.item), ok = lecturaOk(r), n = r.hasta - r.desde + 1;
  return '<button class="read' + (ok ? ' ok' : '') + '" data-act="leer" data-item="' + r.item + '" data-p="' + r.desde + '" data-h="' + r.hasta + '" data-lid="' + (lid || '') + '"><span class="cv"><img src="' + cover(b.portada) + '" alt="" loading="lazy"></span><span><b>' + esc(r.titulo) + '</b><small>' + esc(b.titulo) + ' · ' + (n > 1 ? 'págs. ' + r.desde + '–' + r.hasta : 'pág. ' + r.desde) + '</small></span><span class="st">' + (ok ? '✓ Leída' : '+' + XP.lectura + ' XP') + '</span></button>';
}

/* lección */
function vLeccion(mid, lid) {
  var m = mod(mid); if (!m) return vRuta();
  var idx = -1; m.lecciones.forEach(function (l, i) { if (l.id === lid) idx = i; }); if (idx < 0) return vModulo(mid);
  var l = m.lecciones[idx], t = m.tema, ok = !!prog.done[l.id];
  if (prog.last !== m.id + '/' + l.id) { prog.last = m.id + '/' + l.id; saveProg(true); }
  var flat = allLessons(), fi = -1; flat.forEach(function (x, i) { if (x.l.id === l.id) fi = i; });
  var prev = flat[fi - 1], next = flat[fi + 1];
  var h = '<div style="' + themeVars(m) + '"><section class="lhead' + (t.oscuro ? ' dark' : '') + '"><div class="pat" style="' + pattern(t) + '"></div><div class="wrap in"><div>' +
    '<div class="crumbs"><a href="#ruta">Mi ruta</a> › <a href="#m/' + m.id + '">Módulo ' + m.num + ' · ' + esc(m.titulo) + '</a></div>' +
    '<div class="chips"><span class="pill ' + (t.oscuro ? 'gold' : 'dk') + '">Lección ' + (idx + 1) + ' de ' + m.lecciones.length + '</span><span class="pill">' + l.min + ' min</span><span class="pill hot">hasta +' + lessonMaxXP(l) + ' XP</span></div>' +
    '<h1>' + esc(l.titulo) + '</h1>' +
    '<div class="lprog">' + m.lecciones.map(function (x, i) { return '<i class="' + (prog.done[x.id] ? 'on' : '') + (i === idx ? ' cur' : '') + '"></i>'; }).join('') + '</div></div>' +
    '<img class="cut stk" src="' + img(m.recorte) + '" alt="" aria-hidden="true"></div></section>';
  h += '<div class="wrap lbody"><div style="display:grid;gap:18px">' +
    '<div class="card blk lectura rv"><span class="kick">La lección</span>' + (l.texto || []).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') +
    (l.claves && l.claves.length ? '<span class="kick" style="margin:10px 0 18px">Lo esencial</span><div class="notes">' + l.claves.map(function (k, i) { return '<div class="note" style="--r:' + [-2, 1.5, -1][i % 3] + 'deg"><span class="pin"></span>' + esc(k) + '</div>'; }).join('') + '</div>' : '') + '</div>';
  if ((l.lecturas || []).length) h += '<div class="card blk rv"><span class="kick">Lee en tus libros</span><h2>Profundiza aquí mismo</h2><p class="muted" style="margin:-4px 0 14px;font-size:14.5px">Se abren como un libro: pasa las hojas. Al ver todas las páginas de una lectura ganas +' + XP.lectura + ' XP.</p><div class="reads">' + l.lecturas.map(function (r) { return readBtn(r, l.id); }).join('') + '</div></div>';
  var lv = VBY[VLEC[l.id]];
  if (lv) h += '<div class="card blk vblock rv"><span class="kick">Practica con este video · +' + XP.video + ' XP</span><h2>' + esc(lv.titulo) + '</h2>' + vPlayerBox(lv, false) + '<p class="muted" style="margin:12px 0 0;font-size:14.5px">' + esc(lv.desc) + '</p>' + (lv.opinion ? opNote() : '') + '<p style="margin:10px 0 0"><a class="btn btn-g btn-s" href="#v/' + lv.id + '">Ver en la videoteca ' + ic('der', 14) + '</a></p></div>';
  if (l.mito) {
    var mo = !!prog.mitos[l.id];
    h += '<div class="flip rv' + (mo ? ' on' : '') + '" id="flip"><div class="card3"><div class="face front"><span class="kick" style="color:var(--petal)">¿Mito o realidad?</span><q>' + esc(l.mito.mito) + '</q><div class="opts"><button data-act="mito" data-id="' + l.id + '" data-r="mito">Es un mito</button><button data-act="mito" data-id="' + l.id + '" data-r="real">Es real</button></div></div>' +
      '<div class="face back"><span class="kick" style="color:var(--ok)">Es un mito · lo que dice la evidencia</span><p class="ser" style="font-size:19px;line-height:1.4;margin:0;font-weight:700">' + esc(l.mito.verdad) + '</p><small class="muted" style="font-weight:600">+' + XP.mito + ' XP por descubrirlo</small></div></div></div>';
  }
  if (l.quiz) {
    var qa = l.id in prog.quiz, q = l.quiz;
    h += '<div class="card blk quiz rv' + (qa ? ' answered' : '') + '" id="quiz"><span class="kick">Pregunta rápida · +' + XP.quizOk + ' XP</span><p class="q">' + esc(q.pregunta) + '</p><div class="ops">' +
      q.opciones.map(function (o, i) { var cls = qa && i === q.correcta ? ' right' : ''; return '<button class="op' + cls + '" data-act="quiz" data-id="' + l.id + '" data-i="' + i + '"><i>' + 'ABC'[i] + '</i>' + esc(o) + '</button>'; }).join('') +
      '</div>' + (qa ? '<div class="fb">' + (prog.quiz[l.id] === 1 ? '✓ ¡Acertaste! ' : 'La respuesta correcta está marcada. ') + esc(q.explica) + '</div>' : '') + '</div>';
  }
  h += '<div class="card finish' + (ok ? ' ok' : '') + '"><div><b>' + (ok ? '¡Lección completada!' : '¿Terminaste la lección?') + '</b><div class="muted" style="font-size:14px;font-weight:600">' + (ok ? 'Puedes volver cuando quieras.' : 'Márcala y gana +' + XP.leccion + ' XP.') + '</div></div><button class="btn ' + (ok ? 'btn-g' : 'btn-p') + '" data-act="done" data-id="' + l.id + '">' + (ok ? '✓ Completada' : ic('check', 18, 3) + ' Completar lección') + '</button></div>' +
    '<div class="pn">' + (prev ? '<a class="btn btn-g btn-s" href="#l/' + prev.m.id + '/' + prev.l.id + '">' + ic('izq', 16) + ' Anterior</a>' : '<span></span>') + (next ? '<a class="btn btn-d btn-s" href="#l/' + next.m.id + '/' + next.l.id + '">Siguiente ' + ic('der', 16) + '</a>' : '<a class="btn btn-p btn-s" href="#certificado">Mi graduación ' + ic('corona', 16) + '</a>') + '</div></div>';
  var td = !!prog.tasks[l.id];
  h += '<aside class="side"><div class="card blk task">' + sparkle('#FFD95A', 26, 'position:absolute;right:16px;top:14px') + '<span class="kick">Tu tarea de hoy</span><h3>' + esc(l.tarea) + '</h3><button class="done' + (td ? ' ok' : '') + '" data-act="tarea" data-id="' + l.id + '"><span class="bx">' + (td ? ic('check', 18, 3) : '') + '</span><span>' + (td ? '¡Hecha! +' + XP.tarea + ' XP' : '¡La hice! (+' + XP.tarea + ' XP)') + '</span></button></div>';
  var apps = (l.recursos || []).filter(function (r) { return r.tipo === 'app'; });
  if (apps.length) h += '<div class="card blk"><span class="kick">Practica en tu diario</span><div class="tools">' + apps.map(function (r) { return '<a class="tool" href="#diario/' + esc(r.ruta) + '"><span class="ic">' + ic('tel', 20) + '</span><span>' + esc(r.texto) + '<small>Se abre aquí, en Mi diario</small></span></a>'; }).join('') + '</div></div>';
  h += '<div class="lati">' + glassHeart(60, 'wink') + '<span class="bb">' + esc(ok ? '¡Qué bien lo haces! Sigue con la siguiente.' : 'Lee, juega el quiz y haz tu tarea: todo suma XP.') + '</span></div>' +
    '<p style="font-size:12.5px;color:var(--muted);margin:0">' + esc(C.aviso) + '</p></aside></div></div>';
  return h;
}

/* biblioteca */
/* ---------- videoteca ---------- */
function vc(v) { return VCAT[v.cat] || {}; }
function durTag(v) { return (v.tags || []).filter(function (t) { return /min$/.test(t); })[0] || ''; }
function opNote() { return '<p class="opnote">' + ic('consulta', 16) + ' Opinión de la autora del video: algunas ideas no coinciden con la evidencia del curso. Ante dudas, coméntalo con tu profesional.</p>'; }
function vPlayerBox(v, big) {
  return '<div class="vplayer' + (big ? ' big' : '') + '" style="--vc:' + vc(v).color + '"><button class="vcov" data-act="play" data-vid="' + v.id + '" aria-label="Reproducir: ' + esc(v.titulo) + '"><img src="https://i.ytimg.com/vi/' + v.id + '/' + (big ? 'sddefault' : 'hqdefault') + '.jpg" onerror="this.onerror=null;this.src=\'https://i.ytimg.com/vi/' + v.id + '/hqdefault.jpg\'" alt="" loading="lazy"><span class="vshade"></span><span class="vplay">' + ic('play', big ? 34 : 28) + '</span><span class="vtt"><span class="pill">' + esc(vc(v).nombre || '') + '</span><b>' + esc(v.titulo) + '</b></span>' + (prog.vid[v.id] ? '<span class="vseen">✓ Visto</span>' : '') + '</button></div>';
}
function vidCard(v) {
  var c = vc(v), dur = durTag(v), seen = !!prog.vid[v.id], p = (lsJSON(KEY_VPOS, {})[v.id] || {});
  var pct = !seen && p.d ? Math.round(p.t / p.d * 100) : 0;
  return '<a class="vcard" href="#v/' + v.id + '" style="--vc:' + c.color + ';--vf:' + c.fondo + '" data-tags="' + esc((v.tags || []).join('|')) + '" data-q="' + esc((v.titulo + ' ' + v.desc + ' ' + (c.nombre || '')).toLowerCase()) + '"><span class="vthumb"><img src="https://i.ytimg.com/vi/' + v.id + '/mqdefault.jpg" alt="" loading="lazy"><span class="vplay sm">' + ic(v.tipo === 'video' ? 'play' : v.tipo === 'musica' ? 'nota' : 'auri', 16) + '</span>' + (dur ? '<span class="vdur">' + dur + '</span>' : '') + (seen ? '<span class="vseen">✓</span>' : '') + (pct ? '<span class="vprog"><i style="width:' + pct + '%"></i></span>' : '') + '</span><span class="vbody"><span class="vcat">' + ic(c.icono || 'play', 13) + ' ' + esc(c.nombre || '') + '</span><b>' + esc(v.titulo) + '</b>' + (v.opinion ? '<small class="op">Opinión de la autora</small>' : '<small>' + esc(v.canal || '') + '</small>') + '</span></a>';
}
function recVideos(n) {
  var mods = [];
  ((perfil && perfil.objetivos) || []).forEach(function (o) { var ob = C.objetivos.filter(function (x) { return x.id === o; })[0]; if (ob) mods.push(ob.modulo); });
  mods.push('m5'); var nx = siguiente(); if (nx) mods.unshift(nx.m.id);
  var out = [], seenIds = {};
  mods.forEach(function (m) { VIDS.forEach(function (v) { if (!v.opinion && v.mods.indexOf(m) >= 0 && !prog.vid[v.id] && !seenIds[v.id]) { seenIds[v.id] = 1; out.push(v); } }); });
  VIDS.forEach(function (v) { if (out.length < n && !v.opinion && !prog.vid[v.id] && !seenIds[v.id] && v.tipo === 'video') { seenIds[v.id] = 1; out.push(v); } });
  return out.slice(0, n);
}
function vVideos(cat) {
  var cats = C.videos.categorias, sel = VCAT[cat] ? cat : '', S = stats(), VP = lsJSON(KEY_VPOS, {});
  var h = '<section class="vhero" style="--vc:' + (sel ? VCAT[sel].color : '#FF1A5D') + ';--vf:' + (sel ? VCAT[sel].fondo : '#FFC1CC') + '"><div class="wrap in"><div><span class="kick">Videoteca PLENA · ' + VIDS.length + ' clases · ' + S.vids + ' completadas</span><h1>' + (sel ? esc(VCAT[sel].nombre) : 'Muévete, escucha y <em>respira</em>') + '</h1><p>' + (sel ? esc(VCAT[sel].desc) : 'Fuerza, taichi, pilates, cardio, meditación, podcast y audiolibros. Todo se reproduce aquí, sin salir de tu academia. Cada video completo suma +' + XP.video + ' XP.') + '</p>' +
    '<label class="vsearch">' + ic('buscar', 18) + '<input id="vq" type="search" placeholder="Busca: fuerza, sin saltos, dormir, soja…" autocomplete="off"></label></div>' +
    '<div class="vart" aria-hidden="true"><img class="a1 stk" src="' + img('cut06b') + '" alt=""><img class="a2 stk" src="' + img('cut18b') + '" alt=""><span class="vring"></span>' + sparkle('#FFD95A', 30, 'position:absolute;right:8%;top:8%') + '</div></div></section>';
  h += '<section class="sec" style="padding-top:18px"><div class="wrap"><div class="ctiles">' +
    '<a class="ct' + (!sel ? ' on' : '') + '" href="#videos" style="--vc:#372937;--vf:#FFE3EA"><span class="i">' + ic('estrella', 20) + '</span><b>Todo</b><small>' + VIDS.length + '</small></a>' +
    cats.map(function (c) { var n = VIDS.filter(function (v) { return v.cat === c.id; }).length; return '<a class="ct' + (sel === c.id ? ' on' : '') + '" href="#videos/' + c.id + '" style="--vc:' + c.color + ';--vf:' + c.fondo + '"><span class="i">' + ic(c.icono, 20) + '</span><b>' + esc(c.nombre) + '</b><small>' + n + '</small></a>'; }).join('') + '</div>';
  if (!sel) {
    var cont = VIDS.filter(function (v) { return VP[v.id] && !prog.vid[v.id] && VP[v.id].t > 20; }).sort(function (a, b) { return VP[b.id].at - VP[a.id].at; }).slice(0, 8);
    h += '<div id="vres" hidden><div class="sec-h"><h2 class="h2" style="font-size:28px">Resultados</h2></div><div class="vgrid" id="vresg"></div></div><div id="vbrowse">';
    if (cont.length) h += vRow('Sigue viendo', cont, '');
    h += vRow('Recomendados para ti', recVideos(8), '');
    cats.forEach(function (c) { var l = VIDS.filter(function (v) { return v.cat === c.id; }); h += vRow(c.nombre, l.slice(0, 8), c.id, l.length); });
    h += '</div>';
  } else {
    var list = VIDS.filter(function (v) { return v.cat === sel; }), tags = {};
    list.forEach(function (v) { (v.tags || []).forEach(function (t) { if (!/min$/.test(t)) tags[t] = (tags[t] || 0) + 1; }); });
    var tk = Object.keys(tags).sort(function (a, b) { return tags[b] - tags[a]; });
    if (tk.length) h += '<div class="vfilt" role="group" aria-label="Filtrar"><button class="on" data-act="vf" data-t="">Todos</button>' + tk.map(function (t) { return '<button data-act="vf" data-t="' + esc(t) + '">' + esc(t) + '</button>'; }).join('') + '</div>';
    if (list.some(function (v) { return v.opinion; })) h += opNote();
    if (sel === 'taichi') Object.keys(C.videos.subcategorias).forEach(function (s) { var l = list.filter(function (v) { return v.sub === s; }); if (l.length) h += '<div class="sec-h" style="margin-top:22px"><h2 class="h2" style="font-size:26px">' + esc(C.videos.subcategorias[s]) + ' <span class="pill">' + l.length + '</span></h2></div><div class="vgrid">' + l.map(vidCard).join('') + '</div>'; });
    else h += '<div class="vgrid" style="margin-top:16px">' + list.map(vidCard).join('') + '</div>';
  }
  h += '<p class="vdisc">Videos públicos de sus autoras y canales en YouTube, seleccionados para acompañar el curso. Son un complemento: no sustituyen la consulta con tu profesional de salud.</p></div></section>';
  return h;
}
function vRow(title, list, cat, total) {
  if (!list.length) return '';
  return '<div class="vrow"><div class="sec-h"><h2 class="h2" style="font-size:26px">' + esc(title) + '</h2>' + (cat ? '<a class="btn btn-g btn-s" href="#videos/' + cat + '">Ver ' + (total || '') + ' ' + ic('der', 14) + '</a>' : '') + '</div><div class="rail">' + list.map(vidCard).join('') + '</div></div>';
}
function vVideo(id) {
  var v = VBY[id]; if (!v) return vVideos('');
  var c = vc(v), seen = !!prog.vid[v.id], same = VIDS.filter(function (x) { return x.cat === v.cat && x.id !== v.id; });
  var i = VIDS.indexOf(v), nexts = same.filter(function (x) { return VIDS.indexOf(x) > i; }).concat(same.filter(function (x) { return VIDS.indexOf(x) < i; })).slice(0, 8);
  var mods = v.mods.map(mod).filter(Boolean);
  return '<section class="vtheater" style="--vc:' + c.color + ';--vf:' + c.fondo + '"><div class="wrap"><div class="crumbs"><a href="#videos">Videoteca</a> › <a href="#videos/' + v.cat + '">' + esc(c.nombre) + '</a></div><div class="vt-grid"><div>' +
    vPlayerBox(v, true) +
    '<div class="vinfo"><div class="chips"><span class="pill" style="background:' + c.color + ';color:#fff">' + ic(c.icono, 14) + ' ' + esc(c.nombre) + '</span>' + (v.tags || []).map(function (t) { return '<span class="pill">' + esc(t) + '</span>'; }).join('') + '</div>' +
    '<h1>' + esc(v.titulo) + '</h1><p>' + esc(v.desc) + '</p>' + (v.opinion ? opNote() : '') +
    '<div class="vact"><button class="btn ' + (seen ? 'btn-g' : 'btn-p') + '" id="vSeen" data-act="visto" data-vid="' + v.id + '">' + (seen ? '✓ Completado' : ic('check', 18, 3) + ' Lo terminé · +' + XP.video + ' XP') + '</button>' +
    mods.map(function (m) { return '<a class="btn btn-g btn-s" href="#m/' + m.id + '">Módulo ' + m.num + ' · ' + esc(m.titulo) + '</a>'; }).join('') + '</div>' +
    (v.canal ? '<p class="credit">Video de <b>' + esc(v.canal) + '</b>. Se reproduce aquí para que no salgas de tu academia.</p>' : '') + '</div></div>' +
    '<aside class="vside"><span class="kick">Sigue con</span><div class="vlist">' + nexts.map(function (x) { return '<a href="#v/' + x.id + '" class="vli' + (prog.vid[x.id] ? ' seen' : '') + '"><span class="th"><img src="https://i.ytimg.com/vi/' + x.id + '/mqdefault.jpg" alt="" loading="lazy">' + (prog.vid[x.id] ? '<i>✓</i>' : '') + '</span><span><b>' + esc(x.titulo) + '</b><small>' + esc(durTag(x) || (x.tags || [])[0] || c.nombre) + '</small></span></a>'; }).join('') + '</div></aside></div></div></section>';
}
var PLAYERS = [];
function destroyPlayers() { PLAYERS.forEach(function (p) { try { p.destroy(); } catch (e) { } }); PLAYERS = []; }
var PLYR_ES = { restart: 'Reiniciar', rewind: 'Retroceder {seektime}s', play: 'Reproducir', pause: 'Pausar', fastForward: 'Adelantar {seektime}s', seek: 'Buscar', seekLabel: '{currentTime} de {duration}', played: 'Reproducido', buffered: 'Cargado', currentTime: 'Tiempo actual', duration: 'Duración', volume: 'Volumen', mute: 'Silenciar', unmute: 'Activar sonido', enableCaptions: 'Activar subtítulos', disableCaptions: 'Desactivar subtítulos', enterFullscreen: 'Pantalla completa', exitFullscreen: 'Salir de pantalla completa', frameTitle: 'Reproductor de {title}', captions: 'Subtítulos', settings: 'Ajustes', speed: 'Velocidad', normal: 'Normal', quality: 'Calidad', loop: 'Repetir' };
function savePos(id, t, d) { var P = lsJSON(KEY_VPOS, {}); P[id] = { t: Math.round(t), d: Math.round(d || 0), at: Date.now() }; var ks = Object.keys(P); if (ks.length > 80) { ks.sort(function (a, b) { return P[a].at - P[b].at; }).slice(0, ks.length - 80).forEach(function (k) { delete P[k]; }); } ls(KEY_VPOS, JSON.stringify(P)); }
function markWatched(id, el) {
  if (prog.vid[id]) return;
  award(el, function () { prog.vid[id] = Date.now(); markDay(32); });
  toast('¡Video completado! +' + XP.video + ' XP'); confetti(40);
  var b = $('#vSeen'); if (b && b.dataset.vid === id) { b.className = 'btn btn-g'; b.innerHTML = '✓ Completado'; }
}
function mountPlayer(box, id) {
  destroyPlayers();
  var start = (lsJSON(KEY_VPOS, {})[id] || {}).t || 0;
  if (!window.Plyr) { box.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3' + (start > 15 ? '&start=' + start : '') + '" title="Video" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen style="width:100%;aspect-ratio:16/9;border:0;display:block"></iframe>'; return; }
  box.classList.add('on'); box.innerHTML = '<div data-plyr-provider="youtube" data-plyr-embed-id="' + id + '"></div>';
  var p = new Plyr(box.firstChild, { autoplay: true, iconUrl: '/plena/vendor/plyr.svg', blankVideo: '', i18n: PLYR_ES, ratio: '16:9', youtube: { noCookie: true, rel: 0, showinfo: 0, iv_load_policy: 3, modestbranding: 1, playsinline: 1 },
    controls: ['play-large', 'play', 'rewind', 'progress', 'current-time', 'duration', 'mute', 'volume', 'settings', 'fullscreen'], settings: ['speed'], speed: { selected: 1, options: [0.75, 1, 1.25, 1.5, 2] }, seekTime: 10, keyboard: { focused: true, global: false } });
  var last = 0, acc = 0, saved = 0, sought = false;
  p.on('playing', function () { if (!sought && start > 15 && p.duration && start < p.duration - 20) { sought = true; try { p.currentTime = start; } catch (e) { } } sought = true; });
  p.on('timeupdate', function () {
    var c = p.currentTime || 0, d = p.duration || 0, dt = c - last; if (dt > 0 && dt < 2.5) acc += dt; last = c;
    if (Date.now() - saved > 4000) { saved = Date.now(); savePos(id, c, d); }
    if (!prog.vid[id] && d && acc >= Math.min(d * 0.6, 480)) markWatched(id, box);
  });
  p.on('ended', function () { savePos(id, 0, p.duration); if (!prog.vid[id]) markWatched(id, box); });
  PLAYERS.push(p);
}
function pos(item) { return lsJSON(KEY_POS, {})[item] || null; }
function vBiblioteca() {
  var S = stats(), cats = ['Libros', 'Bonos', 'Kits', 'Plantillas'], P = lsJSON(KEY_POS, {});
  var leyendo = C.biblioteca.filter(function (b) { var n = (ARCH[b.item] || {}).n || 0; return P[b.item] && pagesRead(b.item) < n; }).sort(function (a, b) { return P[b.item].t - P[a.item].t; }).slice(0, 3);
  var h = '<section class="libhero"><div class="wrap in"><div><span class="kick">Tu pack completo · para leer aquí</span><h1>Tu <span class="scr">biblioteca</span></h1><p>Ábrelos a pantalla completa y pasa las hojas como en un libro de verdad. Siempre vuelves donde lo dejaste. Cada página nueva suma +' + XP.pagina + ' XP.</p>' +
    '<div class="lstats"><div><b>' + S.books + '<small>/' + C.biblioteca.length + '</small></b><span>libros abiertos</span></div><div><b>' + S.pages + '</b><span>páginas leídas</span></div><div><b>' + S.booksFull + '</b><span>terminados</span></div></div></div>' +
    '<div class="lart" aria-hidden="true">' + ['c-pausa', 'c-guia', 'c-k1'].map(function (c, i) { return '<img class="lb' + i + '" src="' + cover(c) + '" alt="">'; }).join('') + '<img class="lcut stk" src="' + img('cut28b') + '" alt=""></div></div></section>';
  h += '<section class="sec" style="padding-top:10px"><div class="wrap">';
  if (leyendo.length) h += '<div class="sec-h"><h2 class="h2" style="font-size:28px">Sigue leyendo</h2></div><div class="reading">' + leyendo.map(function (b) { var n = (ARCH[b.item] || {}).n || 1, pr = Math.round(pagesRead(b.item) / n * 100); return '<button class="rcard glass" data-act="leer" data-item="' + b.item + '" data-p="' + P[b.item].p + '"><img src="' + cover(b.portada) + '" alt=""><span><b>' + esc(b.titulo) + '</b><small>Página ' + P[b.item].p + ' de ' + n + ' · ' + pr + '% leído</small><span class="xbar" style="display:block;height:7px;border-radius:9px;background:#F5D9E1;overflow:hidden;margin-top:8px"><i style="width:' + pr + '%"></i></span></span></button>'; }).join('') + '</div>';
  cats.forEach(function (c) {
    var bs = C.biblioteca.filter(function (b) { return b.categoria === c; }); if (!bs.length) return;
    h += '<div class="sec-h" style="margin-top:30px"><h2 class="h2" style="font-size:28px">' + esc(c) + ' <span class="pill">' + bs.length + '</span></h2></div><div class="libgrid">' + bs.map(function (b, i) {
      var a = ARCH[b.item] || {}, n = a.n || 0, pr = n ? Math.round(pagesRead(b.item) / n * 100) : 0, p = P[b.item] ? P[b.item].p : 1;
      return '<button class="bk2 rv" data-act="leer" data-item="' + b.item + '" data-p="' + p + '" style="transition-delay:' + i * 50 + 'ms;--lomo:' + b.lomo + '" aria-label="Leer ' + esc(b.titulo) + '"><span class="cv2"><img src="' + cover(b.portada) + '" alt="" loading="lazy">' + (!pagesRead(b.item) ? '<span class="pill hot">Nuevo</span>' : pr === 100 ? '<span class="pill ok">✓ Leído</span>' : '') + '<span class="open">' + ic('libro', 18) + ' Leer</span></span><b>' + esc(b.titulo) + '</b><small>' + n + ' páginas · ' + (pr ? pr + '% leído' : esc(b.desc)) + '</small><span class="bar"><i style="width:' + pr + '%"></i></span></button>';
    }).join('') + '</div>';
  });
  h += '</div></section>';
  return h;
}
var APPV = { hoy: 'Hoy', progreso: 'Progreso', plan30: 'Plan 30 días', plantillas: 'Plantillas', consulta: 'Mi consulta', ciclo: 'Ciclo', alarma: 'Señales de alarma', cuenta: 'Mi cuenta' };
function vDiario(sub) {
  sub = APPV[sub] ? sub : 'hoy';
  var mis = misiones()[3];
  return '<section class="dfull"><div class="dpill"><span class="syncdot"><i></i> Conectado con PLENA</span><span id="dkD"><b>' + APP.days + '</b> días registrados</span><span class="dm' + (mis.ok ? ' ok' : '') + '" id="dkM">' + (mis.ok ? '✓ Misión de hoy cumplida' : 'Registrar hoy: +' + XP.diario + ' XP') + '</span></div>' +
    '<div class="appframe"><div class="ld">Abriendo tu diario…</div><iframe id="appf" title="Mi diario · app Menopausia Equilibrada" src="/?embed=1#' + sub + '" allow="clipboard-write"></iframe></div></section>';
}
function vLogros() {
  var S = stats(), B = badges(), got = earned(S), news = (lsJSON('plena.nuevas', []) || []);
  var h = '<section class="sec"><div class="wrap"><div class="card lvhero rv">' + sparkle('#FFD95A', 30, 'position:absolute;right:30px;top:24px') +
    '<div class="big">' + ring(S.lvPct, 150, 12, '') + '<span class="n">' + S.lv + '</span></div><div><span class="kick" style="color:var(--petal)">Tu nivel</span><h2>' + esc(S.lvName) + '</h2><p style="margin:0;color:#F2C9D7">' + esc(nivelFrase(S.lv)) + '</p><div class="xbar"><i style="width:' + S.lvPct + '%"></i></div><small style="font-weight:700;color:#fff">' + S.xp + ' XP' + (S.lvTo ? ' · faltan ' + (S.lvTo - S.xp) + ' XP para nivel ' + (S.lv + 1) : '') + '</small>' +
    '<div class="lvl-steps">' + NIVN.map(function (n, i) { return '<span class="' + (i < S.lv ? 'on' : '') + '">' + (i + 1) + ' · ' + n + '</span>'; }).join('') + '</div></div><img class="lvcut stk" src="' + img('cut22b') + '" alt="" aria-hidden="true"></div></div></section>';
  h += '<section class="sec" style="padding-top:0"><div class="wrap"><div class="sec-h"><div><span class="kick">' + got.length + ' de ' + B.length + ' ganadas</span><h2>Tu álbum de <span class="scr">insignias</span></h2><p class="muted" style="margin:6px 0 0">Cada insignia tiene su propia protagonista. Las bloqueadas muestran cuánto te falta.</p></div></div><div class="album">' +
    B.map(function (b) { var on = got.indexOf(b.id) >= 0; return '<div class="bdg2' + (on ? '' : ' off') + (on && news.indexOf(b.id) >= 0 ? ' new' : '') + '">' + medal(b, on, '', S) + '<small>' + esc(b.d) + '</small></div>'; }).join('') + '</div></div></section>';
  var cells = '', t = dk(), start = addD(t, -34);
  for (var i = 0; i < 35; i++) { var k = addD(start, i), v = prog.days[k] || 0, lvl = !(v & 8) ? '' : (v & PERF) === PERF ? 'l3' : (v & PERF) ? 'l2' : 'l1'; cells += '<i class="' + lvl + (k === t ? ' today' : '') + '" title="' + k + '"></i>'; }
  h += '<section class="sec" style="padding-top:0"><div class="wrap grid2"><div class="panel glass"><span class="kick">Tu racha</span><h3>' + S.streak.cur + ' ' + (S.streak.cur === 1 ? 'día' : 'días') + ' seguidos · récord: ' + S.streak.best + '</h3><p class="muted" style="margin:0 0 14px;font-size:14px">Cada día con actividad (una lección, un video, una lectura o tu diario) mantiene la llama encendida.</p><div class="heat">' + cells + '</div><p class="muted" style="font-size:12px;margin:10px 0 0">Últimas 5 semanas · rosa intenso = día perfecto</p></div>' +
    '<div class="panel glass"><span class="kick">De dónde vienen tus XP</span><table class="xpt">' + S.xpParts.map(function (p) { return '<tr><td>' + esc(p[0]) + '</td><td>' + p[1] + ' XP</td></tr>'; }).join('') + '<tr><td><b>Total</b></td><td>' + S.xp + ' XP</td></tr></table></div></div></section>';
  ls('plena.nuevas', JSON.stringify([]));
  return h;
}
var ETAPAS = [['peri', 'Aún tengo reglas, pero han cambiado', 'perimenopausia', 'luna'], ['post', 'Llevo 12 meses o más sin regla', 'posmenopausia', 'sol'], ['inducida', 'Llegó por una cirugía o un tratamiento', 'menopausia inducida', 'consulta'], ['nose', 'No lo tengo claro', 'lo descubrimos juntas', 'lupa']];
var OBJIC = { sofocos: 'llama', sueno: 'noche', mente: 'mente', cuerpo: 'pesa', comida: 'hoja', intimidad: 'corazones', consulta: 'consulta', trabajo: 'corona', etapa: 'luna' };
function vPerfil() {
  var S = stats(), t = totalPct(), p = perfil || {};
  return '<section class="sec"><div class="wrap" style="max-width:860px"><div class="panel glass" style="display:flex;gap:18px;align-items:center;flex-wrap:wrap"><span class="ava" style="width:76px;height:76px;font-size:32px">' + esc((nombre() || 'P').charAt(0).toUpperCase()) + '</span><div style="flex:1;min-width:200px"><span class="kick">Tu perfil</span><h2 class="h2">Hola' + (nombre() ? ', <span class="scr">' + esc(nombre()) + '</span>' : '') + '</h2><p class="muted" style="margin:4px 0 0;font-weight:600">Nivel ' + S.lv + ' · ' + esc(S.lvName) + ' · ' + S.xp + ' XP · ' + t.p + '% de tu ruta</p></div>' + (t.p === 100 ? '<a class="btn btn-p btn-s" href="#certificado">Mi certificado</a>' : '') + '</div>' +
    '<div class="panel glass" style="margin-top:18px">' + perfilForm(p, false) + '</div>' +
    '<div class="panel glass" style="margin-top:18px"><b class="ser" style="font-size:20px">Sonido y privacidad</b><p style="margin:6px 0 12px;font-size:14.5px">Tus objetivos y tu etapa se guardan solo en este dispositivo. Tu progreso del curso (lecciones, respuestas del quiz, páginas leídas y días con actividad) se guarda con tu acceso para verlo en otros dispositivos: no incluye datos de salud. <a href="/privacidad.html">Política de privacidad</a>.</p><div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-g btn-s" data-act="sonido">' + ic(sonidoOn() ? 'son' : 'mudo', 18) + (sonidoOn() ? ' Sonidos activados' : ' Sonidos apagados') + '</button><button class="btn btn-g btn-s" data-act="salir">Cerrar sesión en este dispositivo</button></div></div></div></section>';
}
function perfilForm(p, step) {
  var obj = p.objetivos || [];
  var f1 = '<label class="fld" for="pfN">¿Cómo quieres que te llamemos?<input id="pfN" maxlength="40" autocomplete="given-name" value="' + esc(p.nombre || NOMBRE || '') + '" placeholder="Tu nombre"></label>';
  var f2 = '<div class="fld" style="margin-top:16px">¿En qué etapa estás?</div><div class="opts g2">' + ETAPAS.map(function (o) { return '<label class="opt"><input type="radio" name="etapa" value="' + o[0] + '"' + (p.etapa === o[0] ? ' checked' : '') + '><span class="e">' + ic(o[3], 22) + '</span><span>' + o[1] + '<br><small class="muted" style="font-weight:600">' + o[2] + '</small></span></label>'; }).join('') + '</div>';
  var f3 = '<div class="fld" style="margin-top:16px">¿Qué es lo que más te pesa hoy? <span class="muted" style="font-weight:500;font-size:14px">(hasta 3)</span></div><div class="opts g2">' + C.objetivos.map(function (o) { return '<label class="opt"><input type="checkbox" name="obj" value="' + o.id + '"' + (obj.indexOf(o.id) >= 0 ? ' checked' : '') + '><span class="e">' + ic(OBJIC[o.id] || 'corazon', 22) + '</span><span>' + esc(o.texto) + '</span></label>'; }).join('') + '</div>';
  if (!step) return '<form id="pf">' + f1 + f2 + f3 + '<p class="err" id="pfErr" hidden></p><button class="btn btn-p" type="submit" style="width:100%;margin-top:6px">Guardar y actualizar mi ruta</button></form>';
  var body = step === 1 ? f1 : step === 2 ? f2 : f3;
  return '<form id="pf" data-step="' + step + '"><div class="dots">' + [1, 2, 3].map(function (i) { return '<i class="' + (i <= step ? 'on' : '') + '"></i>'; }).join('') + '</div>' + body + '<p class="err" id="pfErr" hidden></p><div style="display:flex;gap:10px;margin-top:8px">' + (step > 1 ? '<button class="btn btn-g" type="button" data-act="atras">Atrás</button>' : '') + '<button class="btn btn-p" type="submit" style="flex:1">' + (step < 3 ? 'Siguiente' : 'Crear mi ruta personal ✦') + '</button></div></form>';
}
var obStep = 1, obDraft = {};
function vOnboarding() {
  var tt = ['Hagamos esto <span class="scr">tuyo</span>', 'Tu <span class="scr">etapa</span>', 'Lo que más te <span class="scr">pesa</span>'][obStep - 1];
  return '<div class="ov"><img class="deco stk flt" src="' + img('cut13a') + '" alt="" style="left:-30px;bottom:0;height:300px;--r:-4deg"><img class="deco stk flt2" src="' + img('cut22a') + '" alt="" style="right:-20px;top:40px;height:280px;--r:5deg">' + glassHeart(70, 'love', '', '', 'position:absolute;right:12%;bottom:60px', 'deco flt') + sparkle('#FFD95A', 36, 'position:absolute;left:14%;top:70px', 'deco twk') +
    '<div class="box glass"><span class="kick">Bienvenida a PLENA · paso ' + obStep + ' de 3</span><h1>' + tt + '</h1><p style="margin:0 0 8px">' + ['Tres preguntas y armamos tu ruta personal. Tus respuestas se quedan en este dispositivo.', 'Así adaptamos los textos a tu momento. Si no lo sabes, no pasa nada.', 'Pondremos primero los módulos que más te ayudan.'][obStep - 1] + '</p>' + perfilForm(Object.assign({}, perfil || {}, obDraft), obStep) + '</div></div>';
}
function vMagic() { return '<div class="ov"><div class="box glass magic">' + glassHeart(150, 'love', '', '', '', 'big') + '<h1 style="font-size:34px">Creando tu ruta' + (nombre() ? ', <span class="scr">' + esc(nombre()) + '</span>' : '') + '…</h1><p id="mgT" style="font-weight:600">Ordenando los módulos según lo que más te pesa</p></div></div>'; }
function vLock(msg) {
  return '<div class="ov"><img class="deco stk flt" src="' + img('cut02a') + '" alt="" style="right:-30px;bottom:0;height:320px">' + glassHeart(70, 'wink', '', '', 'position:absolute;left:10%;top:60px', 'deco flt') + '<div class="box glass"><span class="kick">Acceso privado</span><h1>Tu academia <span class="scr">PLENA</span></h1><p>Curso de menopausia y psicomenopausia, tus libros para hojear, tu diario y tus logros en un solo lugar. Está incluida en el <b>pack completo</b>.</p><form id="lk"><label class="fld" for="lkIn">Tu código de acceso o tu enlace de la app<input id="lkIn" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="ej. 1a17ee86ed0fa0-5824857924"></label><p class="err" id="lkErr"' + (msg ? '' : ' hidden') + '>' + esc(msg || '') + '</p><button class="btn btn-p" style="width:100%;margin-top:12px">Entrar</button></form><p style="font-size:14px;color:var(--muted);margin:14px 0 0">Tu código está en tu página de descargas. ¿Aún no tienes el pack? <a href="/oferta/">Conócelo aquí</a>.</p></div></div>';
}
function vMejora() { return '<div class="ov"><div class="box glass" style="text-align:center">' + glassHeart(90, 'happy', '', '', 'margin:0 auto', 'flt') + '<span class="kick">Tu acceso está activo</span><h1>PLENA está en el <span class="scr">pack completo</span></h1><p>Tu compra incluye la app, pero no la academia. Completa tu pack pagando solo la diferencia desde tu página de descargas.</p><a class="btn btn-p" href="/oferta/">Ver el pack completo</a><p style="margin-top:14px"><a href="/#hoy">Volver a mi app</a></p></div></div>'; }
function vCert() {
  var t = totalPct(), nm = nombre() || 'Graduada', f = new Date().toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' });
  if (t.p < 100) return '<section class="sec"><div class="wrap" style="max-width:720px;text-align:center"><div class="panel glass">' + glassHeart(90, 'happy', '', '', 'margin:0 auto', 'flt') + '<span class="kick">Tu graduación</span><h2 class="h2">Te faltan ' + (t.n - t.d) + ' lecciones</h2><p>Completa tu ruta para desbloquear tu certificado de graduación PLENA y la insignia «Graduada PLENA».</p><div class="xbar" style="height:12px;max-width:420px;margin:16px auto;border-radius:9px;background:#F5D9E1;overflow:hidden"><i style="width:' + t.p + '%"></i></div><a class="btn btn-p" href="' + nextHref() + '">Seguir mi ruta</a></div></div></section>';
  return '<section class="sec"><div class="wrap" style="max-width:880px"><div class="cert"><span class="px" style="color:var(--lotus)">PLENA · Academia de Menopausia y Psicomenopausia</span><h2>Certificado de graduación</h2><p style="margin:0">Se otorga con orgullo a</p><div class="name">' + esc(nm) + '</div><p style="max-width:560px;margin:0 auto">por completar la ruta PLENA: ' + C.modulos.length + ' módulos y ' + t.n + ' lecciones para entender su cuerpo, cuidar su mente y vivir esta etapa con información, fuerza y libertad.</p><p class="scr" style="font-size:40px;margin:16px 0 4px;color:var(--hot)">' + esc(C.cierre) + '</p><p style="font-size:13px;color:var(--muted)">' + esc(f) + ' · DisierTECH</p>' + glassHeart(60, 'love', '', '', 'position:absolute;left:30px;top:30px') + sparkle('#FFD95A', 40, 'position:absolute;right:34px;top:34px') + '<img class="stk" src="' + img('cut22a') + '" alt="" style="position:absolute;right:14px;bottom:-6px;height:170px"></div><p class="noprint" style="text-align:center;margin-top:18px"><button class="btn btn-p" data-act="print">Descargar / imprimir certificado</button></p></div></section>';
}

/* =========================================================
   Lector tipo libro (StPageFlip)
   ========================================================= */
var RD = null;
function openReader(item, page, range) {
  var a = ARCH[item], b = libro(item); if (!a || !a.n || !b) { toast('Este libro no está disponible.'); return; }
  closeReader(true);
  page = Math.max(1, Math.min(a.n, +page || 1));
  var el = document.createElement('div'); el.className = 'reader'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Leyendo ' + b.titulo);
  el.innerHTML = '<div class="rbar"><button class="rb" data-r="close" aria-label="Cerrar el libro">' + ic('x') + '</button><div class="tt"><b>' + esc(b.titulo) + '</b><small id="rPg"></small></div>' +
    '<button class="rb' + (sonidoOn() ? ' on' : '') + '" data-r="son" aria-label="Sonido de página">' + ic(sonidoOn() ? 'son' : 'mudo') + '</button><button class="rb" data-r="zoom" aria-label="Ampliar página">' + ic('zoom') + '</button><button class="rb" data-r="thumbs" aria-label="Ver todas las páginas">' + ic('grid') + '</button>' + (document.documentElement.requestFullscreen ? '<button class="rb hm" data-r="fs" aria-label="Pantalla completa">' + ic('pantalla') + '</button>' : '') +
    (a.url ? '<a class="rb" href="' + esc(a.url) + '" download aria-label="Descargar PDF">' + ic('dl') + '</a>' : '') + '</div>' +
    '<div class="rstage"><button class="rnav p" data-r="prev" aria-label="Página anterior">' + ic('izq') + '</button><div class="bk" id="bk"></div><button class="rnav n" data-r="next" aria-label="Página siguiente">' + ic('der') + '</button></div>' +
    '<div class="rfoot">' + (range ? '<div class="goal" id="rGoal"></div>' : '<div class="hint">Desliza o toca el borde de la hoja para pasar la página</div>') + '<div class="rng"><span>1</span><input type="range" id="rRange" min="1" max="' + a.n + '" value="' + page + '" aria-label="Ir a la página"><span>' + a.n + '</span></div></div>' +
    '<div class="thumbs" id="rThumbs"></div>';
  document.body.appendChild(el); document.body.style.overflow = 'hidden';
  if (el.requestFullscreen && !document.fullscreenElement) { try { el.requestFullscreen().catch(function () { }); } catch (e) { } }
  var idleT; function wake() { el.classList.remove('idle'); clearTimeout(idleT); idleT = setTimeout(function () { if (!$('#rThumbs.on', el)) el.classList.add('idle'); }, 2600); }
  el.addEventListener('pointermove', wake); el.addEventListener('pointerdown', wake); wake();
  RD = { el: el, item: item, a: a, b: b, range: range || null, pf: null, page: page, rangeDone: range ? lecturaOk({ item: item, desde: range.desde, hasta: range.hasta }) : false };
  try { history.pushState({ plenaReader: 1 }, '', location.href); RD.pushed = true; } catch (e) { }
  var P = lsJSON(KEY_POS, {}); P[item] = { p: page, t: Date.now() }; ls(KEY_POS, JSON.stringify(P));
  buildBook(page);
  $('#rRange', el).addEventListener('change', function () { goPage(+this.value); });
  setTimeout(function () { var c = $('[data-r=close]', el); if (c) c.focus(); }, 50);
}
function pageSize() {
  var W = window.innerWidth, H = window.innerHeight, ratio = RD.a.w ? RD.a.w / RD.a.h : 1000 / 1413;
  var land = W >= 720 && W / H > 1.05, pw, ph;
  if (land) { ph = H - 16; pw = ph * ratio; if (pw * 2 > W - 120) { pw = (W - 120) / 2; ph = pw / ratio; } }
  else { var avail = H - 150; pw = W - 12; ph = pw / ratio; if (ph > avail) { ph = avail; pw = ph * ratio; } }
  return { pw: Math.floor(pw), ph: Math.floor(ph), land: land };
}
function buildBook(page) {
  var a = RD.a, bk = $('#bk', RD.el);
  if (RD.pf) { try { RD.pf.destroy(); } catch (e) { } RD.pf = null; bk = document.createElement('div'); bk.className = 'bk'; bk.id = 'bk'; var old = $('#bk', RD.el); old.parentNode.replaceChild(bk, old); }
  var s = pageSize(); RD.land = s.land;
  bk.style.width = (s.land ? s.pw * 2 : s.pw) + 'px'; bk.style.height = s.ph + 'px';
  var pages = [];
  for (var i = 1; i <= a.n; i++) {
    var d = document.createElement('div'); d.className = 'pg'; d.setAttribute('data-density', (i === 1 || i === a.n) ? 'hard' : 'soft');
    d.innerHTML = '<img alt="Página ' + i + '" data-src="' + a.dir + 'p' + pad3(i) + '.webp" draggable="false"><span class="sk">Página ' + i + '</span>';
    pages.push(d);
  }
  if (!window.St || !St.PageFlip) { // respaldo sin la librería: una página cada vez
    bk.innerHTML = ''; pages.forEach(function (p, i) { p.style.cssText = 'position:absolute;inset:0;display:' + (i === page - 1 ? 'block' : 'none'); bk.appendChild(p); });
    RD.simple = pages; onPage(page - 1); return;
  }
  var pf = new St.PageFlip(bk, { width: s.pw, height: s.ph, size: 'fixed', showCover: true, usePortrait: true, startPage: page - 1, maxShadowOpacity: .45, flippingTime: 750, mobileScrollSupport: false, drawShadow: true, autoSize: false, showPageCorners: true, swipeDistance: 24 });
  pf.loadFromHTML(pages);
  pf.on('flip', function (e) { tone('page'); onPage(e.data); });
  pf.on('init', function (e) { onPage(e.data.page); });
  RD.pf = pf; RD.pages = pages;
  loadAround(page - 1); onPage(page - 1);
}
function pad3(n) { return n < 10 ? '00' + n : n < 100 ? '0' + n : '' + n; }
function loadAround(idx) {
  var ps = RD.pages || RD.simple; if (!ps) return;
  for (var i = idx - 2; i <= idx + 4; i++) { var p = ps[i]; if (!p) continue; var im = p.querySelector('img'); if (im && !im.getAttribute('src')) { im.onload = function () { this.classList.add('ld'); }; im.src = im.dataset.src; } }
}
function visible(idx) {
  var n = RD.a.n;
  if (!RD.pf || !RD.land) return [idx];
  if (idx === 0) return [0];
  var l = idx % 2 ? idx : idx - 1; return [l, l + 1].filter(function (x) { return x < n; });
}
function onPage(idx) {
  if (!RD) return;
  RD.idx = idx; loadAround(idx);
  var vis = visible(idx), a = RD.a, item = RD.item, nuevas = 0;
  var s = prog.read[item] || ''; while (s.length < a.n) s += '0';
  var before = snapshot();
  vis.forEach(function (i) { if (s[i] !== '1') { s = s.slice(0, i) + '1' + s.slice(i + 1); nuevas++; } });
  if (nuevas) { prog.read[item] = s; markDay(8); hoyPag(nuevas); }
  var first = vis[0] + 1, last = vis[vis.length - 1] + 1;
  $('#rPg', RD.el).textContent = (first === last ? 'Página ' + first : 'Páginas ' + first + '–' + last) + ' de ' + a.n;
  var rr = $('#rRange', RD.el); if (rr) rr.value = first;
  var P = lsJSON(KEY_POS, {}); P[item] = { p: first, t: Date.now() }; ls(KEY_POS, JSON.stringify(P));
  if (RD.range) {
    var r = RD.range, tot = r.hasta - r.desde + 1, vis2 = 0; for (var p = r.desde; p <= r.hasta; p++) if (s[p - 1] === '1') vis2++;
    var g = $('#rGoal', RD.el);
    if (g) g.innerHTML = ic('libro', 16) + ' Lectura de la lección: págs. ' + r.desde + (r.hasta > r.desde ? '–' + r.hasta : '') + ' <span class="xbar"><i style="width:' + Math.round(vis2 / tot * 100) + '%"></i></span> ' + (vis2 === tot ? '✓ ¡Completada!' : vis2 + '/' + tot);
    if (vis2 === tot && !RD.rangeDone) { RD.rangeDone = true; setTimeout(function () { toast('¡Lectura completada! +' + XP.lectura + ' XP'); confetti(50); }, 400); }
  }
  if (nuevas) { saveProg(true); afterAward(before, $('#rPg', RD.el)); }
  var th = $('#rThumbs', RD.el); if (th && th.classList.contains('on')) paintThumbs();
}
function goPage(p) {
  if (!RD) return; p = Math.max(1, Math.min(RD.a.n, p));
  if (RD.pf) { loadAround(p - 1); RD.pf.turnToPage(p - 1); onPage(p - 1); }
  else if (RD.simple) { RD.simple.forEach(function (x, i) { x.style.display = i === p - 1 ? 'block' : 'none'; }); onPage(p - 1); }
}
function paintThumbs() {
  var th = $('#rThumbs', RD.el), a = RD.a, s = prog.read[RD.item] || '', vis = visible(RD.idx || 0), r = RD.range, h = '';
  for (var i = 1; i <= a.n; i++) h += '<button data-r="go" data-p="' + i + '" class="' + (vis.indexOf(i - 1) >= 0 ? 'cur ' : '') + (s[i - 1] === '1' ? 'rd ' : '') + (r && i >= r.desde && i <= r.hasta ? 'inr' : '') + '" aria-label="Ir a la página ' + i + '"><img src="' + a.dir + 't' + pad3(i) + '.webp" alt="" loading="lazy"><span>' + i + '</span></button>';
  th.innerHTML = h; var c = $('.cur', th); if (c) c.scrollIntoView({ inline: 'center', block: 'nearest' });
}
function closeReader(silent) {
  if (!RD) return;
  try { if (RD.pf) RD.pf.destroy(); } catch (e) { }
  if (document.fullscreenElement) { try { document.exitFullscreen(); } catch (e) { } }
  RD.el.remove(); document.body.style.overflow = '';
  var pushed = RD.pushed; RD = null;
  if (!silent && pushed) { try { history.back(); } catch (e) { } }
  if (!silent) render(true);
}
window.addEventListener('popstate', function () { if (RD) { RD.pushed = false; closeReader(); } });
window.addEventListener('resize', function () { if (!RD || $('.zoom', RD.el)) return; clearTimeout(window._rz); window._rz = setTimeout(function () { if (!RD) return; var s = pageSize(); var cur = (RD.idx || 0) + 1; buildBook(cur); }, 300); });
document.addEventListener('keydown', function (e) {
  if (!RD) { if (e.key === 'Escape' && $('.cel')) $('.cel').remove(); return; }
  if (e.key === 'Escape') { var z = $('.zoom', RD.el); if (z) z.remove(); else closeReader(); }
  else if (e.key === 'ArrowRight') { if (RD.pf) RD.pf.flipNext(); else goPage((RD.idx || 0) + 2); }
  else if (e.key === 'ArrowLeft') { if (RD.pf) RD.pf.flipPrev(); else goPage(RD.idx || 0); }
});

/* =========================================================
   Render y rutas
   ========================================================= */
function parse() { var h = location.hash.replace(/^#/, ''); var p = h.split('/'); return { v: p[0] || 'inicio', a: p[1] || '', b: p[2] || '' }; }
function paintMe() {
  var me = $('#me'); if (!me || !C || !perfil) { if (me) me.innerHTML = ''; return; }
  var S = stats();
  me.innerHTML = '<a class="xpchip" href="#logros" aria-label="Mis logros: nivel ' + S.lv + ', ' + S.xp + ' XP"><span class="lv">' + S.lv + '</span><span class="tx">' + S.xp + ' XP</span><span class="fl">' + ic('llama', 16) + S.streak.cur + '</span></a><a class="ava" href="#perfil" aria-label="Mi perfil">' + esc((nombre() || 'P').charAt(0).toUpperCase()) + '</a>';
}
var lastRoute = '';
function render(keepScroll) {
  var main = $('#main'); if (!C) return;
  if (!perfil) { main.innerHTML = vOnboarding(); bindForms(); setNav(''); paintMe(); return; }
  var r = parse(), h, route = r.v + '/' + r.a + '/' + r.b;
  destroyPlayers();
  if (r.v === 'ruta') h = vRuta();
  else if (r.v === 'm') h = vModulo(r.a);
  else if (r.v === 'l') h = vLeccion(r.a, r.b);
  else if (r.v === 'biblioteca') h = vBiblioteca();
  else if (r.v === 'diario') h = vDiario(r.a);
  else if (r.v === 'videos') h = vVideos(r.a);
  else if (r.v === 'v') h = vVideo(r.a);
  else if (r.v === 'logros') h = vLogros();
  else if (r.v === 'perfil') h = vPerfil();
  else if (r.v === 'certificado') h = vCert();
  else h = vInicio();
  var y = window.scrollY;
  main.innerHTML = '<div class="view">' + h + (r.v === 'diario' ? '' : '<footer class="f"><div class="wrap"><span class="lg">Plena</span><span>© 2026 DisierTECH · ' + esc(C.aviso) + ' · <a href="/privacidad.html">Privacidad</a></span></div></footer>') + '</div>';
  setNav(r.v === 'm' || r.v === 'l' ? 'ruta' : r.v === 'v' ? 'videos' : r.v === 'certificado' || r.v === 'perfil' ? '' : r.v);
  document.body.classList.toggle('is-diario', r.v === 'diario');
  if (r.v === 'v') { var vb = $('.vtheater .vcov'); if (vb && !reduced()) setTimeout(function () { if (document.body.contains(vb)) mountPlayer(vb.parentNode, vb.dataset.vid); }, 250); }
  var vq = $('#vq'); if (vq) vq.addEventListener('input', vSearch);
  bindForms(); reveal(); paintMe();
  if (keepScroll && route === lastRoute) window.scrollTo(0, y); else if (route !== lastRoute) window.scrollTo(0, 0);
  lastRoute = route;
  setTimeout(function () { $$('.ring .fg').forEach(function (c) { c.style.strokeDashoffset = c.dataset.off; }); }, 90);
  var f = $('#appf'); if (f) f.addEventListener('load', function () { var l = $('.appframe .ld'); if (l) l.remove(); });
  document.title = ({ l: 'Lección', m: 'Módulo', ruta: 'Mi ruta', biblioteca: 'Biblioteca', diario: 'Mi diario', logros: 'Logros', perfil: 'Perfil', certificado: 'Certificado', videos: 'Videoteca', v: 'Video' }[r.v] || 'Inicio') + ' · PLENA';
}
function vSearch() {
  var q = this.value.trim().toLowerCase(), res = $('#vres'), br = $('#vbrowse'); if (!res) return;
  if (!q) { res.hidden = true; br.hidden = false; return; }
  var words = q.split(/\s+/), list = VIDS.filter(function (v) { var c = vc(v), s = (v.titulo + ' ' + v.desc + ' ' + (c.nombre || '') + ' ' + (v.tags || []).join(' ')).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); return words.every(function (w) { return s.indexOf(w.normalize('NFD').replace(/[̀-ͯ]/g, '')) >= 0; }); });
  $('#vresg').innerHTML = list.length ? list.map(vidCard).join('') : '<p class="muted">No encontramos videos con «' + esc(q) + '». Prueba con «fuerza», «taichi» o «dormir».</p>';
  res.hidden = false; br.hidden = true;
}
function setNav(v) { $$('[data-v]').forEach(function (a) { if (a.dataset.v === v) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); }); }
var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -30px 0px' }) : null;
function reveal() { $$('.rv').forEach(function (el) { if (io) io.observe(el); else el.classList.add('in'); }); }

/* ---------- formularios ---------- */
function bindForms() {
  var pf = $('#pf');
  if (pf) pf.addEventListener('submit', function (e) {
    e.preventDefault();
    var er = $('#pfErr'), step = +pf.dataset.step || 0;
    function fail(m) { er.textContent = m; er.hidden = false; }
    var nmI = $('#pfN'), et = (pf.querySelector('input[name=etapa]:checked') || {}).value, ob = $$('input[name=obj]:checked', pf).map(function (i) { return i.value; });
    if (step) {
      if (step === 1) { obDraft.nombre = nmI.value.trim().slice(0, 40); obStep = 2; render(); return; }
      if (step === 2) { if (!et) return fail('Elige tu etapa (si no lo sabes, marca «No lo tengo claro»).'); obDraft.etapa = et; obStep = 3; render(); return; }
      if (!ob.length) return fail('Elige al menos una cosa.'); if (ob.length > 3) return fail('Elige como máximo 3.');
      var before = { xp: 0, lv: 1, b: [] };
      perfil = { nombre: obDraft.nombre || '', etapa: obDraft.etapa, objetivos: ob, at: Date.now() }; ls(KEY_PERFIL, JSON.stringify(perfil));
      if (perfil.nombre && !ls('me.name')) ls('me.name', perfil.nombre);
      markDay(8); saveProg(true);
      $('#main').innerHTML = vMagic(); var msgs = ['Ordenando los módulos según lo que más te pesa', 'Eligiendo tus primeras lecturas', 'Preparando tus misiones de hoy', '¡Lista!'], k = 0;
      var tm = setInterval(function () { k++; var el = $('#mgT'); if (el && msgs[k]) el.textContent = msgs[k]; }, 650);
      setTimeout(function () { clearInterval(tm); location.hash = '#inicio'; render(); confetti(120); afterAward(before, null); }, 2600);
      return;
    }
    if (!et) return fail('Elige tu etapa.'); if (!ob.length) return fail('Elige al menos una cosa.'); if (ob.length > 3) return fail('Elige como máximo 3.');
    perfil = { nombre: nmI.value.trim().slice(0, 40), etapa: et, objetivos: ob, at: perfil ? perfil.at : Date.now() }; ls(KEY_PERFIL, JSON.stringify(perfil));
    toast('Listo: tu ruta se actualizó.'); location.hash = '#ruta';
  });
  $$('input[name=obj]').forEach(function (i) { i.addEventListener('change', function () { if ($$('input[name=obj]:checked').length > 3) { i.checked = false; toast('Elige como máximo 3.'); } }); });
  var lk = $('#lk');
  if (lk) lk.addEventListener('submit', function (e) { e.preventDefault(); var a = findAcc($('#lkIn').value); if (!a) { var er = $('#lkErr'); er.textContent = 'Revisa el código: son 14 letras y números, un guion y 10 más.'; er.hidden = false; return; } access = a; ls(KEY_ACC, a); boot(); });
}

/* ---------- clics ---------- */
document.addEventListener('click', function (e) {
  var r = e.target.closest('[data-r]');
  if (r && RD) {
    var k = r.dataset.r;
    if (k === 'close') closeReader();
    else if (k === 'next') { if (RD.pf) RD.pf.flipNext(); else goPage((RD.idx || 0) + 2); }
    else if (k === 'prev') { if (RD.pf) RD.pf.flipPrev(); else goPage(RD.idx || 0); }
    else if (k === 'thumbs') { var th = $('#rThumbs', RD.el); th.classList.toggle('on'); r.classList.toggle('on'); if (th.classList.contains('on')) paintThumbs(); }
    else if (k === 'go') { goPage(+r.dataset.p); $('#rThumbs', RD.el).classList.remove('on'); $('[data-r=thumbs]', RD.el).classList.remove('on'); }
    else if (k === 'son') { ls(KEY_SON, sonidoOn() ? '0' : '1'); r.classList.toggle('on', sonidoOn()); r.innerHTML = ic(sonidoOn() ? 'son' : 'mudo'); }
    else if (k === 'zoom') { var z = document.createElement('div'); z.className = 'zoom'; var vp = visible(RD.idx || 0); z.innerHTML = '<button class="rb" data-r="unzoom" aria-label="Cerrar zoom">' + ic('x') + '</button>' + vp.map(function (i) { return '<img src="' + RD.a.dir + 'p' + pad3(i + 1) + '.webp" alt="Página ' + (i + 1) + '">'; }).join(''); RD.el.appendChild(z); }
    else if (k === 'unzoom') { var z2 = $('.zoom', RD.el); if (z2) z2.remove(); }
    else if (k === 'fs') { if (document.fullscreenElement) document.exitFullscreen(); else if (RD.el.requestFullscreen) RD.el.requestFullscreen().catch(function () { }); }
    return;
  }
  var b = e.target.closest('[data-act]'); if (!b) return;
  var a = b.dataset.act, id = b.dataset.id;
  if (a === 'leer') { openReader(b.dataset.item, +b.dataset.p || 1, b.dataset.h ? { desde: +b.dataset.p, hasta: +b.dataset.h, lid: b.dataset.lid } : null); return; }
  if (a === 'play') { e.preventDefault(); mountPlayer(b.parentNode, b.dataset.vid); return; }
  if (a === 'visto') { if (!prog.vid[b.dataset.vid]) markWatched(b.dataset.vid, b); return; }
  if (a === 'vf') { $$('.vfilt button').forEach(function (x) { x.classList.toggle('on', x === b); }); var tg = b.dataset.t; $$('.vgrid .vcard').forEach(function (c) { c.hidden = !!tg && (c.dataset.tags || '').split('|').indexOf(tg) < 0; }); return; }
  if (a === 'done') {
    if (prog.done[id]) { delete prog.done[id]; saveProg(true); toast('Lección marcada como pendiente.'); render(true); return; }
    award(b, function () { prog.done[id] = Date.now(); markDay(1); });
    confetti(); var t = totalPct(); toast(t.p === 100 ? '¡Completaste toda tu ruta! Tu certificado te espera.' : '¡Bien hecho! Un paso más hacia tu PLENA.');
    render(true); return;
  }
  if (a === 'tarea') { if (prog.tasks[id]) { delete prog.tasks[id]; saveProg(true); render(true); return; } award(b, function () { prog.tasks[id] = Date.now(); markDay(8); }); confetti(40); render(true); return; }
  if (a === 'mito') {
    var fl = $('#flip'); if (!prog.mitos[id]) award(b, function () { prog.mitos[id] = Date.now(); markDay(8); });
    toast(b.dataset.r === 'mito' ? '¡Exacto! Es un mito.' : 'Casi: es un mito. Mira lo que dice la evidencia.'); if (fl) fl.classList.add('on'); paintMe(); return;
  }
  if (a === 'quiz') {
    if (id in prog.quiz) return;
    var l = allLessons().filter(function (x) { return x.l.id === id; })[0].l, i = +b.dataset.i, okq = i === l.quiz.correcta, box = $('#quiz');
    award(b, function () { prog.quiz[id] = okq ? 1 : 0; markDay(16 | 8); });
    $$('.op', box).forEach(function (o, j) { if (j === l.quiz.correcta) o.classList.add('right'); else if (j === i) o.classList.add('wrong'); });
    box.classList.add('answered'); box.insertAdjacentHTML('beforeend', '<div class="fb">' + (okq ? '✓ ¡Acertaste! ' : 'No pasa nada: la correcta está marcada. ') + esc(l.quiz.explica) + '</div>');
    if (okq) confetti(36); paintMe(); return;
  }
  if (a === 'cerrarCel') { var c = b.closest('.cel'); if (c) c.remove(); return; }
  if (a === 'atras') { obStep = Math.max(1, obStep - 1); render(); return; }
  if (a === 'sonido') { ls(KEY_SON, sonidoOn() ? '0' : '1'); render(true); return; }
  if (a === 'print') { window.print(); return; }
  if (a === 'salir') { if (!confirm('¿Cerrar sesión en este dispositivo? Tu progreso se mantiene guardado con tu acceso.')) return; ls(KEY_ACC, null); ls(KEY_PERFIL, null); ls(KEY_PROG, null); location.reload(); return; }
});
window.addEventListener('hashchange', function () { if (RD) closeReader(true); render(); });
/* La app integrada escribe en este mismo dispositivo: PLENA se entera al momento. */
function onAppChange() {
  refreshApp(true);
  var d = $('#dkD'); if (d) { d.innerHTML = '<b>' + APP.days + '</b> días registrados'; var m = $('#dkM'); if (m && APP.today && !m.classList.contains('ok')) { m.classList.add('ok'); m.textContent = '✓ Misión de hoy cumplida'; toast('¡Día registrado! Misión cumplida.'); confetti(50); } }
}
window.addEventListener('storage', function (e) { if (e.key === 'me.data.v2') onAppChange(); });
window.addEventListener('message', function (e) {
  if (e.origin !== location.origin || !e.data) return;
  if (e.data.type === 'me:data') onAppChange();
  if (e.data.type === 'me:nav' && APPV[e.data.v] && parse().v === 'diario') {
    $$('.dtabs a').forEach(function (a) { if (a.getAttribute('href') === '#diario/' + e.data.v) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    try { history.replaceState(null, '', '#diario/' + e.data.v); lastRoute = 'diario/' + e.data.v + '/'; } catch (x) { }
  }
});

/* =========================================================
   Arranque
   ========================================================= */
function boot() {
  var main = $('#main');
  var k = findAcc(location.hash + ' ' + location.search);
  if (k) { access = k; ls(KEY_ACC, k); history.replaceState(null, '', location.pathname + '#inicio'); }
  if (!access) { main.innerHTML = vLock(); bindForms(); return; }
  api('/api/curso').then(function (x) {
    if (!x.ok) {
      if (x.d && x.d.motivo === 'mejora') { main.innerHTML = vMejora(); return; }
      if (x.status === 401 || x.status === 403) { main.innerHTML = vLock(x.d && x.d.error); bindForms(); return; }
      throw new Error('curso');
    }
    C = x.d.curso; NOMBRE = x.d.nombre || '';
    (x.d.archivos || []).forEach(function (f) { ARCH[f.item] = { url: f.url, n: f.paginas || 0, dir: f.dir || '', w: 1000, h: 1413 }; });
    C.videos = x.d.videos || { categorias: [], videos: [], lecciones: {}, subcategorias: {} };
    VIDS = C.videos.videos || []; VBY = {}; VIDS.forEach(function (v) { VBY[v.id] = v; }); VCAT = {}; (C.videos.categorias || []).forEach(function (c) { VCAT[c.id] = c; }); VLEC = C.videos.lecciones || {};
    if (perfil && !perfil.nombre && NOMBRE) perfil.nombre = NOMBRE;
    APP = readApp(); if (APP.today) markDay(4);
    if (seen === null) markSeenSilently();
    var nuevas = earned().filter(function (id) { return seen.indexOf(id) < 0; });
    if (nuevas.length) { ls('plena.nuevas', JSON.stringify(nuevas)); seen = seen.concat(nuevas); ls(KEY_SEEN, JSON.stringify(seen)); }
    render(); syncProg();
  }).catch(function () { main.innerHTML = '<div class="ov"><div class="box glass" style="text-align:center"><h1 style="font-size:32px">Sin conexión</h1><p>No pudimos cargar tu academia. Revisa tu internet e inténtalo de nuevo.</p><button class="btn btn-p" onclick="location.reload()">Reintentar</button></div></div>'; });
}
boot();
})();
