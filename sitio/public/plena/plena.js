/* PLENA · Academia de Menopausia y Psicomenopausia · v4
   Plataforma privada (incluida en el pack completo). Se entra con la cuenta personal (correo + contraseña, Supabase Auth: cuenta.js).
   - Contenido: /api/curso (contenido/curso.json, libros.json y videos.json).
   - Progreso y logros: este dispositivo + /api/progreso (la etapa y los objetivos van cifrados con la clave del diario).
   - Cursos al estilo aula: cada módulo tiene introducción, lecciones, videos, lecturas y cierre.
   - Cursos de práctica en video (dentro de Cursos): cada categoría tiene su lista de videos; el reproductor es propio (Plyr).
   - Mi ruta: el mapa personal con el progreso de cada módulo.
   - Biblioteca: los libros se leen aquí mismo, a pantalla completa, pasando las hojas.
   - Mi diario: la app Menopausia Equilibrada completa, integrada (mismo origen: usa esta sesión y la clave de datos). */
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
function ytimg(id, q) { return 'https://i.ytimg.com/vi/' + id + '/' + (q || 'mqdefault') + '.jpg'; }
function pad(n) { return (n < 10 ? '0' : '') + n; }
function pad3(n) { return n < 10 ? '00' + n : n < 100 ? '0' + n : '' + n; }
function dk(d) { d = d || new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function addD(k, n) { var p = k.split('-'), d = new Date(+p[0], +p[1] - 1, +p[2] + n); return dk(d); }
function reduced() { return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; }
function plural(n, a, b) { return n + ' ' + (n === 1 ? a : b); }
function toast(m) { var t = $('#toast'); t.textContent = m; t.hidden = false; t.style.animation = 'none'; void t.offsetWidth; t.style.animation = ''; clearTimeout(toast.t); toast.t = setTimeout(function () { t.hidden = true; }, 3200); }
var KEY_PERFIL = 'plena.perfil', KEY_PROG = 'plena.prog', KEY_SEEN = 'plena.vistas', KEY_POS = 'plena.pos', KEY_HOY = 'plena.hoy', KEY_SON = 'plena.sonido', KEY_VPOS = 'plena.vpos', KEY_TIPS = 'plena.tips', KEY_TOUR = 'plena.tour';
function findAcc(t) { var m = String(t || '').toLowerCase().match(/[0-9a-f]{14}-[0-9a-f]{10}/); return m ? m[0] : ''; }
var PC = window.PlenaCuenta;
var UID = 0;

/* =========================================================
   Arte: corazones de cristal, destellos e iconos
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
  izq: 'M15 5l-7 7 7 7', der: 'M9 5l7 7-7 7', abajo: 'M5 9l7 7 7-7',
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
  regalo: 'M4 11h16v10H4zM2.5 7h19v4h-19zM12 7v14M12 7S10.5 3 8 3.5 6.5 7 12 7zM12 7s1.5-4 4-3.5S17.5 7 12 7z',
  ayuda: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5h.01',
  inicio: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',
  cursos: 'M3 5h7a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H3zM21 5h-7a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h7z',
  lista: 'M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01',
  reloj: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2'
};
function ic(n, s, sw) { return '<svg width="' + (s || 22) + '" height="' + (s || 22) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (sw || 2) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + IC[n] + '"/></svg>'; }
function svgURI(s) { return 'url("data:image/svg+xml,' + encodeURIComponent(s) + '")'; }
function pattern(t) {
  var a = t.acc;
  switch (t.patron) {
    case 'lineas': return 'background-image:repeating-linear-gradient(transparent 0 23px,' + a + '26 23px 24px)';
    case 'puntos': return 'background-image:radial-gradient(' + a + '40 1.5px,transparent 2px);background-size:16px 16px';
    case 'rayos': return 'background-image:repeating-conic-gradient(from 0deg at 100% 0%,' + a + '1c 0 5deg,transparent 5deg 12deg)';
    case 'estrellas': return 'background-image:' + svgURI('<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"><path d="M14 5c.4 3 2 4.6 5 5-3 .4-4.6 2-5 5-.4-3-2-4.6-5-5 3-.4 4.6-2 5-5z" fill="' + a + '" opacity=".35"/><circle cx="44" cy="40" r="1.3" fill="' + a + '" opacity=".4"/></svg>');
    case 'cuadros': return 'background-image:linear-gradient(' + a + '1f 1px,transparent 1px),linear-gradient(90deg,' + a + '1f 1px,transparent 1px);background-size:20px 20px';
    case 'diagonal': return 'background-image:repeating-linear-gradient(45deg,' + a + '16 0 8px,transparent 8px 18px)';
    case 'vichy': return 'background-image:linear-gradient(90deg,' + a + '14 50%,transparent 50%),linear-gradient(' + a + '14 50%,transparent 50%);background-size:24px 24px';
    case 'corazones': return 'background-image:' + svgURI('<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50"><path d="M14 22c-4.5-3.4-7-5.7-7-8.3a3.4 3.4 0 0 1 7-1.2 3.4 3.4 0 0 1 7 1.2c0 2.6-2.5 4.9-7 8.3z" fill="' + a + '" opacity=".3"/></svg>');
    case 'destellos': return 'background-image:' + svgURI('<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56"><path d="M12 4c.4 3 2 4.6 5 5-3 .4-4.6 2-5 5-.4-3-2-4.6-5-5 3-.4 4.6-2 5-5z" fill="' + a + '" opacity=".4"/><path d="M42 36c.2 1.6 1 2.4 2.6 2.6-1.6.2-2.4 1-2.6 2.6-.2-1.6-1-2.4-2.6-2.6 1.6-.2 2.4-1 2.6-2.6z" fill="' + a + '" opacity=".5"/></svg>');
  }
  return '';
}
/* Temas de módulo en versión clara (sin fondos oscuros): los módulos «oscuros» usan su color como acento */
function themeVars(m) {
  var t = m.tema, bg = t.oscuro ? t.bg2 : t.bg, acc = t.oscuro ? t.bg : t.acc, ink = t.oscuro ? t.deep : t.ink;
  if (m.id === 'm3') acc = '#5B4B8A'; if (m.id === 'm7') acc = '#92333C'; if (m.id === 'm9') acc = '#B7791F';
  return '--m-bg:' + bg + ';--m-bg2:' + t.bg2 + ';--m-acc:' + acc + ';--m-deep:' + t.deep + ';--m-ink:' + ink;
}
function mAcc(m) { var t = m.tema; return m.id === 'm3' ? '#5B4B8A' : m.id === 'm7' ? '#92333C' : m.id === 'm9' ? '#B7791F' : t.acc; }
function lightTema(m) { var t = Object.assign({}, m.tema); t.acc = mAcc(m); return t; }

/* =========================================================
   Estado
   ========================================================= */
var SES = null, CUENTA = null, CLAVE_OK = true; // sesión, perfil de la cuenta (nombre, correo, foto) y si la clave del diario está lista
var C = null, ARCH = {}, NOMBRE = '', VIDS = [], VBY = {}, VCAT = {}, VLEC = {};
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
  return PC.api(path, opts).then(function (x) {
    // La sesión terminó (contraseña cambiada en otro dispositivo, cuenta revocada…): volver a iniciar sesión.
    if (SES && (x.status === 401 || (x.status === 403 && x.d && x.d.motivo === 'revocado'))) { SES = null; var m = x.d && x.d.error; PC.salir().then(function () { authScreen(vLogin(m)); }); }
    return x;
  });
}
function mod(id) { return C.modulos.filter(function (x) { return x.id === id; })[0]; }
function libro(item) { return C.biblioteca.filter(function (b) { return b.item === item; })[0]; }
function allLessons() { var o = []; C.modulos.forEach(function (m) { m.lecciones.forEach(function (l) { o.push({ m: m, l: l }); }); }); return o; }
function modPct(m) { var n = m.lecciones.length, d = m.lecciones.filter(function (l) { return prog.done[l.id]; }).length; return { n: n, d: d, p: n ? Math.round(d / n * 100) : 0 }; }
function totalPct() { var a = allLessons(), d = a.filter(function (x) { return prog.done[x.l.id]; }).length; return { n: a.length, d: d, p: a.length ? Math.round(d / a.length * 100) : 0 }; }
function modVideos(m) { return VIDS.filter(function (v) { return v.mods.indexOf(m.id) >= 0; }).sort(function (a, b) { return a.opinion - b.opinion; }); }
function modReadings(m) { var seenR = {}, list = []; m.lecciones.forEach(function (l) { (l.lecturas || []).forEach(function (r) { var k = r.item + r.desde; if (!seenR[k]) { seenR[k] = 1; list.push({ r: r, l: l }); } }); }); return list; }
function modMins(m) { return m.lecciones.reduce(function (a, l) { return a + l.min; }, 0); }

/* ---------- progreso: guardar y sincronizar ---------- */
function pruneDays() { var ks = Object.keys(prog.days).sort(); while (ks.length > 120) delete prog.days[ks.shift()]; }
function saveProg(push) {
  pruneDays(); ls(KEY_PROG, JSON.stringify(prog));
  if (push && SES) { clearTimeout(saveProg.t); saveProg.t = setTimeout(pushProg, 700); }
}
function pushProg() { prog.tour = ls(KEY_TOUR) === 'hecho' ? 1 : 0; api('/api/progreso', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(prog) }).catch(function () {}); }
/* La bienvenida (nombre, etapa y objetivos) viaja cifrada con la clave del diario: el servidor no la puede leer. */
function savePerfil() {
  ls(KEY_PERFIL, JSON.stringify(perfil));
  var at = Date.now();
  return PC.sellar(perfil).then(function (o) { if (o) { prog.pf = o; prog.pfAt = at; saveProg(true); } }).catch(function () {});
}
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
  if (r.tour === 1 && ls(KEY_TOUR) !== 'hecho') { ls(KEY_TOUR, 'hecho'); changed = true; } else if (ls(KEY_TOUR) === 'hecho' && r.tour !== 1) up = true;
  if (r.pf && (r.pfAt || 0) > (prog.pfAt || 0)) { prog.pf = r.pf; prog.pfAt = r.pfAt; changed = true; }
  else if (prog.pf && (prog.pfAt || 0) > (r.pfAt || 0)) up = true;
  return { changed: changed, up: up };
}
function syncProg(first) {
  return api('/api/progreso').then(function (x) {
    if (!x.ok || !x.d.progreso) return;
    var hadPf = prog.pfAt || 0, res = mergeProg(x.d.progreso);
    if (res.changed || res.up) saveProg(res.up);
    // Bienvenida hecha en otro dispositivo: se recupera y no se repite.
    var pfP = (prog.pf && (prog.pfAt || 0) !== hadPf) || (prog.pf && !perfil) ? PC.abrir(prog.pf).then(function (o) { if (o && o.etapa) { perfil = o; ls(KEY_PERFIL, JSON.stringify(perfil)); res.changed = true; } }).catch(function () {}) : null;
    return Promise.resolve(pfP).then(function () { if (res.changed && !first) { markSeenSilently(); render(true); } });
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
   Gamificación: XP, 15 niveles, 50 insignias en 4 dificultades, rachas y misiones
   ========================================================= */
var XP = { leccion: 100, tarea: 40, quizOk: 30, quizNo: 10, mito: 20, lectura: 25, pagina: 2, modulo: 200, diario: 10, perfecto: 60, bienvenida: 50, video: 15 };
var PERF = 1 | 2 | 4 | 32; // lección + 5 páginas + diario + video
var NIV = [0, 350, 800, 1350, 2000, 2750, 3600, 4550, 5600, 6750, 8000, 9300, 10700, 12100, 13500];
var NIVN = ['Curiosa', 'Despierta', 'Valiente', 'Consciente', 'Constante', 'Serena', 'Fuerte', 'Sabia', 'Radiante', 'Imparable', 'Inspiradora', 'Luminosa', 'Maestra', 'Leyenda', 'Plena'];
var NIVD = ['Empezaste con curiosidad: es el primer paso para entender tu cuerpo.', 'Ya abriste los ojos a lo que te pasa. Nada de aguantar en silencio.', 'Te atreviste a mirar de frente tus síntomas. Eso es valentía.', 'Sabes lo que pasa en tu cuerpo: el conocimiento quita miedo.', 'Vuelves cada día. La constancia es lo que cambia una etapa.', 'Estás encontrando calma en medio del cambio.', 'Tu cuerpo y tu mente se están cuidando de verdad.', 'Lo que sabes ya puede ayudar a otras mujeres.', 'Se nota: estás volviendo a sentirte tú.', 'Nada te detiene: tus hábitos ya son parte de ti.', 'Eres ejemplo para las mujeres que te rodean.', 'Brillas con luz propia en esta etapa.', 'Dominas tu salud: preguntas, decides y te cuidas.', 'Muy pocas llegan hasta aquí. Eres leyenda.', 'Llegaste a PLENA. No es el final de nada: es una graduación.'];
var TIER = { 1: { n: 'Fácil', k: 't1' }, 2: { n: 'Media', k: 't2' }, 3: { n: 'Difícil', k: 't3' }, 4: { n: 'Legendaria', k: 't4' } };
function nivTier(lv) { return lv <= 4 ? 1 : lv <= 8 ? 2 : lv <= 12 ? 3 : 4; }
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
  var S = { lessons: 0, tasks: 0, qOk: 0, qNo: 0, mitos: 0, mitosN: 0, lect: 0, lectN: 0, pages: 0, pagesN: 0, mods: 0, books: 0, booksFull: 0, perfect: 0, vids: 0, vcat: {} };
  allLessons().forEach(function (x) {
    var id = x.l.id;
    if (prog.done[id]) S.lessons++;
    if (prog.tasks[id]) S.tasks++;
    if (prog.quiz[id] === 1) S.qOk++; else if (prog.quiz[id] === 0) S.qNo++;
    if (x.l.mito) S.mitosN++;
    if (prog.mitos[id]) S.mitos++;
    (x.l.lecturas || []).forEach(function (r) { S.lectN++; if (prog.done[id] && lecturaOk(r)) S.lect++; });
  });
  C.biblioteca.forEach(function (b) { var n = pagesRead(b.item), t = (ARCH[b.item] || {}).n || 0; S.pages += n; S.pagesN += t; if (n) S.books++; if (t && n >= t) S.booksFull++; });
  C.modulos.forEach(function (m) { if (modPct(m).p === 100) S.mods++; });
  Object.keys(prog.days).forEach(function (d) { if ((prog.days[d] & PERF) === PERF) S.perfect++; });
  Object.keys(prog.vid).forEach(function (id) { var v = VBY[id]; if (!v) return; S.vids++; S.vcat[v.cat] = (S.vcat[v.cat] || 0) + 1; });
  S.diario = APP.days; S.streak = streakInfo(); S.total = allLessons().length;
  S.xpParts = [
    ['Lecciones completadas', S.lessons * XP.leccion], ['Tareas hechas', S.tasks * XP.tarea], ['Preguntas rápidas', S.qOk * XP.quizOk + S.qNo * XP.quizNo],
    ['Mitos descubiertos', S.mitos * XP.mito], ['Lecturas de lección', S.lect * XP.lectura], ['Páginas leídas', S.pages * XP.pagina],
    ['Videos completados', S.vids * XP.video], ['Módulos completados', S.mods * XP.modulo], ['Días en tu diario', S.diario * XP.diario],
    ['Días perfectos', S.perfect * XP.perfecto], ['Bienvenida', perfil ? XP.bienvenida : 0]
  ];
  S.xp = S.xpParts.reduce(function (a, b) { return a + b[1]; }, 0);
  var lv = 0; for (var i = 0; i < NIV.length; i++) if (S.xp >= NIV[i]) lv = i;
  S.lv = lv + 1; S.lvName = NIVN[lv]; S.lvFrom = NIV[lv]; S.lvTo = NIV[lv + 1] || null; S.tier = nivTier(S.lv);
  S.lvPct = S.lvTo ? Math.round((S.xp - S.lvFrom) / (S.lvTo - S.lvFrom) * 100) : 100;
  return S;
}
function badges() {
  function bd(id, tier, n, d, ic, t, pr, grupo) { return { id: id, tier: tier, n: n, d: d, ic: ic, t: t, pr: pr, g: grupo }; }
  function cnt(f, goal) { return [function (S) { return f(S) >= goal; }, function (S) { return [Math.min(f(S), goal), goal]; }]; }
  var B = [];
  function add(id, tier, n, d, icn, grupo, f, goal) { var c = cnt(f, goal); B.push(bd(id, tier, n, d, icn, c[0], c[1], grupo)); }
  add('hola', 1, 'Hola, PLENA', 'Creaste tu ruta personal', 'hola', 'Primeros pasos', function () { return perfil ? 1 : 0; }, 1);
  add('tour', 1, 'Exploradora', 'Hiciste el recorrido por la plataforma', 'bandera', 'Primeros pasos', function () { return ls(KEY_TOUR) === 'hecho' ? 1 : 0; }, 1);
  add('primera', 1, 'Primer paso', 'Completaste tu primera lección', 'estrella', 'Primeros pasos', function (S) { return S.lessons; }, 1);
  add('lec10', 2, 'Diez lecciones', 'Completaste 10 lecciones', 'cursos', 'Lecciones y módulos', function (S) { return S.lessons; }, 10);
  C.modulos.forEach(function (m) {
    var f = function () { return modPct(m).d; };
    add('mod-' + m.id, 2, m.tema.insignia, 'Completa el módulo ' + m.num + ': ' + m.titulo, m.tema.icono, 'Lecciones y módulos', f, m.lecciones.length);
    B[B.length - 1].mod = m.id;
  });
  add('graduada', 4, 'Graduada PLENA', 'Completaste las 31 lecciones', 'corona', 'Lecciones y módulos', function (S) { return S.lessons; }, allLessons().length);
  add('racha3', 1, 'Racha de 3', '3 días seguidos con actividad', 'llama', 'Constancia', function (S) { return S.streak.best; }, 3);
  add('racha7', 2, 'Semana encendida', '7 días seguidos', 'llama', 'Constancia', function (S) { return S.streak.best; }, 7);
  add('racha21', 3, 'Hábito de hierro', '21 días seguidos', 'rayo', 'Constancia', function (S) { return S.streak.best; }, 21);
  add('racha60', 4, 'Llama eterna', '60 días seguidos', 'rayo', 'Constancia', function (S) { return S.streak.best; }, 60);
  add('perfecto', 2, 'Día perfecto', 'Cumpliste las 4 misiones de un día', 'sol', 'Constancia', function (S) { return S.perfect; }, 1);
  add('perfecto7', 3, 'Semana perfecta', '7 días perfectos', 'sol', 'Constancia', function (S) { return S.perfect; }, 7);
  add('perfecto21', 4, 'Brillo absoluto', '21 días perfectos', 'sol', 'Constancia', function (S) { return S.perfect; }, 21);
  add('video1', 1, 'Primera función', 'Tu primer video completo', 'play', 'Práctica en video', function (S) { return S.vids; }, 1);
  add('baile', 1, 'A bailar', 'Un cardio o baile completo', 'nota', 'Práctica en video', function (S) { return S.vcat.cardio || 0; }, 1);
  add('escucha', 1, 'Oído atento', 'Un podcast o audiolibro', 'auri', 'Práctica en video', function (S) { return (S.vcat.podcast || 0) + (S.vcat.audio || 0); }, 1);
  add('video10', 2, 'Maratón PLENA', '10 videos completos', 'video', 'Práctica en video', function (S) { return S.vids; }, 10);
  add('fuerza5', 2, 'Fuerza de acero', '5 rutinas de fuerza', 'pesa', 'Práctica en video', function (S) { return S.vcat.fuerza || 0; }, 5);
  add('taichi5', 2, 'Flujo zen', '5 prácticas de taichi', 'chispa', 'Práctica en video', function (S) { return S.vcat.taichi || 0; }, 5);
  add('escucha3', 2, 'Escucha profunda', '3 podcast o audiolibros', 'auri', 'Práctica en video', function (S) { return (S.vcat.podcast || 0) + (S.vcat.audio || 0); }, 3);
  add('video30', 3, 'Cinéfila del bienestar', '30 videos completos', 'video', 'Práctica en video', function (S) { return S.vids; }, 30);
  add('fuerza15', 3, 'Titanio', '15 rutinas de fuerza', 'pesa', 'Práctica en video', function (S) { return S.vcat.fuerza || 0; }, 15);
  add('taichi15', 3, 'Maestra del flujo', '15 prácticas de taichi', 'chispa', 'Práctica en video', function (S) { return S.vcat.taichi || 0; }, 15);
  add('video75', 4, 'Práctica infinita', '75 videos completos', 'video', 'Práctica en video', function (S) { return S.vids; }, 75);
  add('lectora', 1, 'Lectora', '80 páginas leídas', 'libro', 'Biblioteca', function (S) { return S.pages; }, 80);
  add('libro1', 2, 'Libro terminado', 'Leíste un libro entero', 'check', 'Biblioteca', function (S) { return S.booksFull; }, 1);
  add('devora', 2, 'Devoralibros', '150 páginas leídas', 'libro', 'Biblioteca', function (S) { return S.pages; }, 150);
  add('estante', 3, 'Biblioteca abierta', 'Abriste los 13 libros', 'lupa', 'Biblioteca', function (S) { return S.books; }, C.biblioteca.length);
  add('todaslaspag', 4, 'Cada página', 'Leíste las ' + (function () { var n = 0; C.biblioteca.forEach(function (b) { n += (ARCH[b.item] || {}).n || 0; }); return n; })() + ' páginas del pack', 'libro', 'Biblioteca', function (S) { return S.pages; }, Math.max(1, (function () { var n = 0; C.biblioteca.forEach(function (b) { n += (ARCH[b.item] || {}).n || 0; }); return n; })()));
  add('mitos5', 1, 'Cazamitos', '3 mitos descubiertos', 'chispa', 'Saber', function (S) { return S.mitos; }, 3);
  add('mitostodos', 2, 'Sin mitos', 'Descubriste los ' + 6 + ' mitos del curso', 'chispa', 'Saber', function (S) { return S.mitos; }, 6);
  add('sabia', 2, 'Mente brillante', '10 preguntas acertadas', 'diana', 'Saber', function (S) { return S.qOk; }, 10);
  add('tareas', 2, 'Manos a la obra', '10 tareas hechas', 'check', 'Saber', function (S) { return S.tasks; }, 10);
  add('tareas31', 3, 'Todo en práctica', 'Las 31 tareas hechas', 'check', 'Saber', function (S) { return S.tasks; }, allLessons().length);
  add('sabiatotal', 4, 'Pleno total', 'Acertaste las 31 preguntas a la primera', 'diana', 'Saber', function (S) { return S.qOk; }, allLessons().length);
  add('diario7', 2, 'Diario de oro', '7 días en tu diario', 'tel', 'Mi diario', function (S) { return S.diario; }, 7);
  add('diario30', 3, 'Un mes de datos', '30 días en tu diario', 'tel', 'Mi diario', function (S) { return S.diario; }, 30);
  add('diario90', 4, 'Experta en mí', '90 días en tu diario', 'tel', 'Mi diario', function (S) { return S.diario; }, 90);
  add('nivel5', 2, 'Nivel 5', 'Llegaste al nivel Constante', 'trofeo', 'Niveles', function (S) { return S.lv; }, 5);
  add('nivel10', 3, 'Nivel 10', 'Llegaste al nivel Imparable', 'trofeo', 'Niveles', function (S) { return S.lv; }, 10);
  add('nivel15', 4, 'Nivel 15', 'Llegaste a PLENA, el nivel máximo', 'corona', 'Niveles', function (S) { return S.lv; }, 15);
  return B;
}
function earned(S) { S = S || stats(); return badges().filter(function (b) { return b.t(S); }).map(function (b) { return b.id; }); }
function markSeenSilently() { seen = earned(); ls(KEY_SEEN, JSON.stringify(seen)); }
function snapshot() { var S = stats(); return { xp: S.xp, lv: S.lv, b: earned(S) }; }
function afterAward(before, ev) {
  var S = stats(), now = earned(S), diff = S.xp - before.xp;
  if (diff > 0 && ev) xpFloat(ev, diff);
  var nuevos = now.filter(function (id) { return before.b.indexOf(id) < 0; });
  var B = badges(); var q = nuevos.map(function (id) { return B.filter(function (b) { return b.id === id; })[0]; });
  if (nuevos.length) { seen = (seen || []).concat(nuevos); ls(KEY_SEEN, JSON.stringify(seen)); queueCel(q.map(function (b) { return { t: 'b', b: b }; })); }
  if (S.lv > before.lv) queueCel([{ t: 'l', S: S }]);
  paintMe();
}
function award(ev, fn) { var b = snapshot(); fn(); saveProg(true); afterAward(b, ev); }
function markDay(bit) { var k = dk(); prog.days[k] = (prog.days[k] || 0) | bit | 8; }
function hoyPag(n) { var h = lsJSON(KEY_HOY, {}); if (h.d !== dk()) h = { d: dk(), n: 0 }; h.n += n; ls(KEY_HOY, JSON.stringify(h)); if (h.n >= 5) markDay(2); return h.n; }
function pagHoy() { var h = lsJSON(KEY_HOY, {}); return h.d === dk() ? h.n : 0; }
function misiones() {
  var b = prog.days[dk()] || 0, done1 = Object.keys(prog.done).some(function (id) { return dk(new Date(prog.done[id])) === dk(); });
  if (done1 && !(b & 1)) { markDay(1); saveProg(true); b = prog.days[dk()]; }
  var rv = recVideos(1, true)[0];
  return [
    { ok: !!(b & 1), t: 'Completa una lección', s: 'Tu siguiente paso del curso', rw: XP.leccion, href: nextHref(), ic: 'cursos' },
    { ok: !!(b & 32), t: 'Mira un video completo', s: rv ? rv.titulo : 'De tus cursos', rw: XP.video, href: rv ? vHref(rv) : '#cursos', ic: 'play' },
    { ok: !!(b & 2), t: 'Lee 5 páginas', s: Math.min(5, pagHoy()) + ' de 5 páginas hoy', rw: 5 * XP.pagina, href: '#biblioteca', ic: 'libro' },
    { ok: !!(b & 4), t: 'Registra tu día', s: APP.today ? 'Registrado hoy' : 'En Mi diario, dos minutos', rw: XP.diario, href: '#diario/hoy', ic: 'tel' }
  ];
}

/* ---------- celebraciones (en cola, una a la vez) ---------- */
var AC = null, CELQ = [];
function sonidoOn() { return ls(KEY_SON) !== '0'; }
function audioCtx() { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); } catch (e) { AC = null; } return AC; }
function noiseBuf(len) { var b = AC.createBuffer(1, Math.max(1, Math.floor(AC.sampleRate * len)), AC.sampleRate), d = b.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; }
function note(fr, t0, dur, vol, type) { var o = AC.createOscillator(), g = AC.createGain(); o.type = type || 'sine'; o.frequency.value = fr; g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + .012); g.gain.exponentialRampToValueAtTime(.0008, t0 + dur); o.connect(g); g.connect(AC.destination); o.start(t0); o.stop(t0 + dur + .05); }
/* Efectos de sonido sintetizados (sin archivos): hoja de libro, toques y celebraciones */
function tone(kind) {
  if (!sonidoOn() || !audioCtx()) return;
  try {
    var t = AC.currentTime + .01, r = .9 + Math.random() * .2;
    if (kind === 'page') {
      // 1) roce del papel: ruido con filtro que barre de grave a agudo y un leve aleteo
      var len = .34 * r, s = AC.createBufferSource(); s.buffer = noiseBuf(len);
      var bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = .9; bp.frequency.setValueAtTime(700 * r, t); bp.frequency.exponentialRampToValueAtTime(3600 * r, t + len * .8);
      var hp = AC.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 350;
      var g = AC.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.32, t + .05); g.gain.setValueAtTime(.32, t + len * .45); g.gain.exponentialRampToValueAtTime(.001, t + len);
      var lfo = AC.createOscillator(), lg = AC.createGain(); lfo.frequency.value = 28 + Math.random() * 10; lg.gain.value = .1; lfo.connect(lg); lg.connect(g.gain); lfo.start(t); lfo.stop(t + len);
      s.connect(hp); hp.connect(bp); bp.connect(g); g.connect(AC.destination); s.start(t); s.stop(t + len);
      // 2) la hoja cae: golpe suave y grave
      var t2 = t + len * .78, s2 = AC.createBufferSource(); s2.buffer = noiseBuf(.09);
      var lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520; var g2 = AC.createGain(); g2.gain.setValueAtTime(.38, t2); g2.gain.exponentialRampToValueAtTime(.001, t2 + .09);
      s2.connect(lp); lp.connect(g2); g2.connect(AC.destination); s2.start(t2); return;
    }
    if (kind === 'tap') { note(1320, t, .09, .06); note(1980, t + .015, .07, .03); return; }
    if (kind === 'step') { note(784, t, .25, .08, 'triangle'); note(1175, t + .07, .3, .08, 'triangle'); note(1568, t + .14, .35, .05, 'sine'); return; }
    if (kind === 'magic') {
      [1047, 1319, 1568, 2093, 2637, 3136].forEach(function (f, i) { note(f, t + i * .07, .6, .05, 'sine'); note(f * 1.004, t + i * .07, .6, .03, 'triangle'); });
      var sw = AC.createBufferSource(); sw.buffer = noiseBuf(.7); var f2 = AC.createBiquadFilter(); f2.type = 'bandpass'; f2.Q.value = 2; f2.frequency.setValueAtTime(2000, t); f2.frequency.exponentialRampToValueAtTime(8000, t + .7);
      var g3 = AC.createGain(); g3.gain.setValueAtTime(0, t); g3.gain.linearRampToValueAtTime(.05, t + .2); g3.gain.exponentialRampToValueAtTime(.001, t + .7); sw.connect(f2); f2.connect(g3); g3.connect(AC.destination); sw.start(t); return;
    }
    if (kind === 'done') { [523, 659, 784, 1047].forEach(function (f, i) { note(f, t + i * .06, .9, .07, 'triangle'); }); return; }
    var notes = kind === 'level' ? [523, 659, 784, 1047] : kind === 'badge' ? [784, 988, 1319] : [659, 880];
    notes.forEach(function (fr, i) { note(fr, t + i * .09, .45, .12, 'triangle'); });
  } catch (e) { }
}
function confetti(n) {
  if (reduced()) return;
  var c = document.createElement('div'); c.className = 'confetti'; var cols = ['#FF1A5D', '#FFC1CC', '#FFD95A', '#D2CADF', '#DB7F8E', '#fff', '#9DE3D5'];
  for (var i = 0; i < (n || 80); i++) { var s = document.createElement('i'); s.style.left = Math.random() * 100 + '%'; s.style.background = cols[i % cols.length]; s.style.borderRadius = i % 3 ? '50%' : i % 2 ? '2px' : '50% 50% 0 50%'; s.style.animationDelay = Math.random() * .7 + 's'; s.style.animationDuration = 2.2 + Math.random() * 1.4 + 's'; c.appendChild(s); }
  document.body.appendChild(c); setTimeout(function () { c.remove(); }, 4200);
}
function xpFloat(ev, n) {
  var x = innerWidth / 2, y = innerHeight / 2;
  if (ev && ev.clientX) { x = ev.clientX; y = ev.clientY; } else if (ev && ev.getBoundingClientRect) { var r = ev.getBoundingClientRect(); x = r.left + r.width / 2; y = r.top; }
  var d = document.createElement('div'); d.className = 'xpfloat'; d.textContent = '+' + n + ' XP'; d.style.left = x + 'px'; d.style.top = (y - 10) + 'px';
  document.body.appendChild(d); setTimeout(function () { d.remove(); }, 1500); tone('xp');
}
function queueCel(items) { CELQ = CELQ.concat(items); if (!$('.cel')) setTimeout(nextCel, 450); }
function nextCel() {
  var it = CELQ.shift(); if (!it) return;
  var d = document.createElement('div'); d.className = 'cel'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true');
  if (it.t === 'b') {
    var b = it.b, T = TIER[b.tier];
    d.innerHTML = '<div class="box lg">' + bcard(b, true, null, 'big') + '<span class="tier ' + T.k + '">Dificultad ' + T.n.toLowerCase() + '</span><h2>¡Nueva insignia!</h2><p>' + esc(b.n) + ' · ' + esc(b.d) + '</p><button class="btn btn-p" data-act="cerrarCel" style="width:100%">¡Me la llevo!</button></div>';
    tone('badge'); confetti(b.tier >= 3 ? 140 : 70);
  } else {
    var S = it.S, tk = TIER[S.tier].k;
    d.innerHTML = '<div class="box lg">' + '<div class="lvbig ' + tk + '"><span>' + S.lv + '</span></div><span class="tier ' + tk + '">Nivel ' + S.lv + ' de 15</span><h2>¡Subiste a <em>' + esc(S.lvName) + '</em>!</h2><p>' + esc(NIVD[S.lv - 1]) + '</p><button class="btn btn-p" data-act="cerrarCel" style="width:100%">¡Seguir brillando!</button></div>';
    tone('level'); confetti(120);
  }
  document.body.appendChild(d); setTimeout(function () { var x = $('button', d); if (x) x.focus(); }, 300);
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
  if (mis === 4) return '¡Día perfecto! Cumpliste tus 4 misiones.';
  if (S.streak.cur >= 2) return '¡' + S.streak.cur + ' días seguidos! No rompas la racha.';
  if (S.lvTo && S.lvTo - S.xp <= 150) return 'Te faltan ' + (S.lvTo - S.xp) + ' XP para ser «' + NIVN[S.lv] + '».';
  return 'Una lección, un video y tu diario: así se cambia una etapa.';
}

/* =========================================================
   Componentes
   ========================================================= */
function ring(p, size, stroke, txt, cls) {
  var r = (size - stroke) / 2, c = 2 * Math.PI * r, id = 'rg' + (++UID);
  return '<svg class="ring ' + (cls || '') + '" viewBox="0 0 ' + size + ' ' + size + '" width="' + size + '" height="' + size + '" aria-hidden="true"><defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--ra,#FFC1CC)"/><stop offset="1" stop-color="var(--rb,#FF1A5D)"/></linearGradient></defs><circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="rgba(255,255,255,.75)" stroke-width="' + stroke + '"/><circle class="fg" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="url(#' + id + ')" stroke-width="' + stroke + '" stroke-linecap="round" stroke-dasharray="' + c + '" stroke-dashoffset="' + c + '" data-off="' + (c * (1 - p / 100)) + '" transform="rotate(-90 ' + size / 2 + ' ' + size / 2 + ')" style="transition:stroke-dashoffset 1.2s cubic-bezier(.2,.8,.2,1)"/>' +
    (txt !== '' && txt != null ? '<text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-family="Playfair Display" font-weight="900" font-size="' + size * .32 + '" fill="#372937">' + txt + '</text>' : '') + '</svg>';
}
function pbar(p, label) { return '<div class="pbar"><span class="pb"><i style="width:' + p + '%"></i></span><span class="pl">' + (label != null ? label : p + '%') + '</span></div>'; }
function bcard(b, on, S, cls) {
  var T = TIER[b.tier], pr = !on && b.pr && S ? b.pr(S) : null;
  return '<div class="bc ' + T.k + (on ? '' : ' off') + ' ' + (cls || '') + '"><div class="bc-art"><span class="bc-tier">' + T.n + '</span><span class="bc-ic">' + ic(on ? b.ic : 'candado', 14, 2.3) + '</span><img src="' + img('b-' + b.id) + '" alt="" loading="lazy"></div>' +
    '<div class="bc-body"><b>' + esc(b.n) + '</b><small>' + esc(b.d) + '</small>' + (on ? '<em class="ok">' + ic('check', 13, 3) + ' Ganada</em>' : pr ? '<span class="bc-pr"><i style="width:' + Math.min(100, Math.round(pr[0] / pr[1] * 100)) + '%"></i></span><em>' + pr[0] + ' de ' + pr[1] + '</em>' : '<em>Bloqueada</em>') + '</div></div>';
}
function modBadge(m) { return badges().filter(function (b) { return b.id === 'mod-' + m.id; })[0]; }
/* Portada enmarcada del módulo: estable, sin giros ni círculos */
function mcover(m, cls) {
  var t = lightTema(m);
  return '<div class="mcov ' + (cls || '') + '" style="' + themeVars(m) + '"><div class="mc-in"><div class="mc-side" style="' + pattern(t) + '"><span class="mc-k">Módulo</span><b>' + pad(+m.num) + '</b><span class="mc-w">' + esc(m.tema.palabra) + '</span></div>' +
    '<div class="mc-ph"><img src="' + img(m.foto) + '" alt="" loading="lazy"></div><img class="mc-cut" src="' + img(m.recorte) + '" alt="" loading="lazy"></div></div>';
}
function tip(key, title, text, icon) {
  var T = lsJSON(KEY_TIPS, {}); if (T[key]) return '';
  return '<div class="tip lg" data-tip="' + key + '"><span class="tip-i">' + ic(icon || 'info', 20) + '</span><div><b>' + esc(title) + '</b><p>' + text + '</p></div><button class="btn btn-s btn-g" data-act="tipOk" data-k="' + key + '">Entendido</button></div>';
}
function phead(o) {
  return '<section class="phead"><div class="wrap"><div class="ph-card lg" style="--pc:' + (o.color || '#FF1A5D') + ';--pf:' + (o.fondo || '#FFE3EA') + '"><div class="ph-tx"><span class="kick">' + o.kick + '</span><h1>' + o.title + '</h1><p>' + o.desc + '</p>' + (o.extra || '') + '</div>' +
    '<div class="ph-art" aria-hidden="true"><div class="ph-frame"><img src="' + o.photo + '" alt=""></div>' + (o.cut ? '<img class="ph-cut" src="' + o.cut + '" alt="">' : '') + sparkle('#FFD95A', 26, 'position:absolute;left:4%;top:8%') + '</div></div></div></section>';
}
function chipStat(n, l) { return '<span class="cstat"><b>' + n + '</b>' + l + '</span>'; }
function checkDot(on, cur) { return '<span class="ck' + (on ? ' on' : '') + (cur ? ' cur' : '') + '">' + (on ? ic('check', 13, 3) : '') + '</span>'; }

/* =========================================================
   Inicio
   ========================================================= */
function vInicio() {
  var S = stats(), t = totalPct(), nx = siguiente(), nm = nombre(), mis = misiones(), misOk = mis.filter(function (m) { return m.ok; }).length, tk = TIER[S.tier].k;
  var h = '<section class="hero2"><div class="wrap"><div class="hcard lg">' +
    '<div class="h-tx"><div class="chips"><span class="pill hot">Menopausia</span><span class="pill lav">Psicomenopausia</span><span class="pill">Sin tabú</span></div>' +
    '<p class="hi">' + esc(saludo()) + (nm ? ', <b>' + esc(nm) + '</b>' : '') + '</p><h1 class="plena">Plena</h1>' +
    '<p class="sub">' + esc(C.subtitulo) + '</p><p class="lema">«' + esc(C.lema) + '» ' + esc(etapaTxt()) + '</p>' +
    '<div class="cta"><a class="btn btn-p" href="' + nextHref() + '">' + ic('play', 16) + (t.d ? ' Continuar donde lo dejé' : ' Empezar mi curso') + '</a><a class="btn btn-g" href="#cursos">' + ic('cursos', 17) + ' Ver los 10 módulos</a></div></div>' +
    '<div class="h-art" aria-hidden="true"><div class="h-frame"><img src="' + img('f37a') + '" alt=""><span>tu momento</span></div><img class="h-cut" src="' + img('cut02a') + '" alt="">' +
    glassHeart(62, 'wink', '#FFD1DC', '#FF1A5D', 'position:absolute;left:4%;top:4%', 'flt') + sparkle('#FFD95A', 28, 'position:absolute;right:6%;top:6%') + '</div>' +
    '<a class="h-lv lg ' + tk + '" href="#logros">' + ring(S.lvPct, 54, 6, S.lv) + '<span><b>Nivel ' + S.lv + ' · ' + esc(S.lvName) + '</b><small>' + S.xp + ' XP' + (S.lvTo ? ' · ' + (S.lvTo - S.xp) + ' para el nivel ' + (S.lv + 1) : '') + '</small></span><span class="tier ' + tk + '">' + TIER[S.tier].n + '</span></a>' +
    '</div></div></section>';
  h += '<section class="sec"><div class="wrap today">';
  if (nx) {
    h += '<div class="lg next" id="nextStep" style="' + themeVars(nx.m) + '"><div class="nx-cov">' + mcover(nx.m, 'sm') + '</div><div class="nx-tx"><span class="kick">' + (t.d ? 'Tu siguiente paso' : 'Empieza aquí') + '</span><h2>' + esc(nx.l.titulo) + '</h2><p>Módulo ' + nx.m.num + ' · ' + esc(nx.m.titulo) + ' · ' + nx.l.min + ' min · hasta +' + lessonMaxXP(nx.l) + ' XP</p>' + pbar(modPct(nx.m).p, modPct(nx.m).d + ' de ' + modPct(nx.m).n + ' lecciones del módulo') + '<a class="btn btn-p" href="#l/' + nx.m.id + '/' + nx.l.id + '">' + ic('play', 16) + ' Ir a la lección</a></div></div>';
  } else {
    h += '<div class="lg next done"><div class="nx-tx"><span class="kick">¡Lo lograste!</span><h2>Completaste todo el curso</h2><p>' + esc(C.cierre) + '</p><a class="btn btn-p" href="#certificado">Ver mi certificado</a></div></div>';
  }
  h += '<div class="lg mispanel" id="misiones"><div class="mh2"><div><span class="kick">Misiones de hoy</span><h3>' + misOk + ' de 4 cumplidas</h3></div>' + ring(misOk * 25, 54, 6, misOk + '/4') + '</div><div class="mis">' +
    mis.map(function (m) { return '<a class="mi' + (m.ok ? ' ok' : '') + '" href="' + m.href + '">' + checkDot(m.ok) + '<span><b>' + esc(m.t) + '</b><small>' + esc(m.s) + '</small></span><span class="rw">' + (m.ok ? 'Hecha' : '+' + m.rw + ' XP') + '</span></a>'; }).join('') +
    '</div><p class="bonus">' + ic('regalo', 16) + ' Las 4 misiones = día perfecto <b>+' + XP.perfecto + ' XP</b></p><div class="lati">' + glassHeart(52, misOk === 4 ? 'love' : 'happy') + '<span class="bb">' + esc(latiDice(S)) + '</span></div></div>';
  h += '</div></section>';
  var R = ruta();
  h += '<section class="sec pt0"><div class="wrap"><div class="sec-h"><div><span class="kick">Tu recorrido · ' + t.d + ' de ' + t.n + ' lecciones</span><h2>Tu ruta <em>personal</em></h2></div><a class="btn btn-g btn-s" href="#ruta">Ver mi mapa de ruta ' + ic('der', 14) + '</a></div><div class="steps-rail">' +
    R.map(function (m, i) { var p = modPct(m), here = nx && nx.m.id === m.id; return '<a class="srail lg' + (p.p === 100 ? ' ok' : '') + (here ? ' here' : '') + '" href="#m/' + m.id + '" style="' + themeVars(m) + '"><span class="sr-n">' + (i + 1) + '</span><span class="sr-ph"><img src="' + img(m.foto) + '" alt="" loading="lazy"></span><b>' + esc(m.titulo) + '</b><small>' + (p.p === 100 ? '✓ Completado' : here ? 'Estás aquí · ' + p.p + '%' : p.p + '%') + (paraTi(m) ? ' · ♥ Para ti' : '') + '</small><span class="sr-bar"><i style="width:' + p.p + '%"></i></span></a>'; }).join('') + '</div></div></section>';

  var B = badges(), got = earned(S), next = B.filter(function (b) { return got.indexOf(b.id) < 0; }).sort(function (a, b) { var pa = a.pr ? a.pr(S) : [0, 1], pb2 = b.pr ? b.pr(S) : [0, 1]; return (pb2[0] / pb2[1]) - (pa[0] / pa[1]) || a.tier - b.tier; }).slice(0, 3), last = B.filter(function (b) { return got.indexOf(b.id) >= 0; }).slice(-2);
  h += '<section class="sec pt0"><div class="wrap"><div class="sec-h"><div><span class="kick">' + got.length + ' de ' + B.length + ' insignias · 4 dificultades</span><h2>Tus <em>logros</em></h2></div><a class="btn btn-g btn-s" href="#logros">Ver el álbum ' + ic('der', 14) + '</a></div><div class="bgrid five">' +
    last.map(function (b) { return bcard(b, true, S); }).join('') + next.map(function (b) { return bcard(b, false, S); }).join('') + '</div></div></section>';
  h += '<section class="sec pt0"><div class="wrap"><div class="dcta lg"><div><span class="kick">Mi diario · la app integrada</span><h2>Lo que aprendes aquí, lo registras allí</h2><p>Dos minutos al día: síntomas, sofocos, sueño, ánimo y energía. Con eso armas tu informe en PDF para la consulta.</p><div class="dn">' + chipStat(APP.days, 'días registrados') + chipStat(APP.plan + '/30', 'días del plan') + chipStat(APP.today ? '✓' : '—', 'registro de hoy') + '</div><a class="btn btn-p" href="#diario/hoy">' + ic('tel', 17) + ' Abrir mi diario</a></div><div class="d-art" aria-hidden="true"><img class="d-ph" src="' + cover('app-hoy') + '" alt=""><img class="d-cut" src="' + img('cut21b') + '" alt=""></div></div></div></section>';
  return h;
}
function lessonMaxXP(l) { return XP.leccion + XP.tarea + XP.quizOk + (l.mito ? XP.mito : 0) + (l.lecturas || []).length * XP.lectura + (VLEC[l.id] ? XP.video : 0); }

/* =========================================================
   Cursos (estilo aula)
   ========================================================= */
function vCursos() {
  var t = totalPct(), R = ruta();
  var h = phead({ kick: C.modulos.length + ' módulos · ' + t.n + ' lecciones · ' + t.p + '% completado', title: 'Tus <em>cursos</em>', color: '#FF1A5D', fondo: '#FFE3EA', photo: img('f73'), cut: img('cut28b'),
    desc: 'Cada módulo es un curso completo: empieza con una introducción, sigue con lecciones cortas, videos para practicar y lecturas de tus libros, y termina con un cierre y su insignia. Están ordenados según lo que más te pesa; los marcados «Para ti» son tus prioridades.',
    extra: '<div class="cstats">' + chipStat(t.d + '/' + t.n, 'lecciones') + chipStat(C.modulos.filter(function (m) { return modPct(m).p === 100; }).length + '/10', 'módulos') + chipStat(VIDS.length, 'videos') + '</div>' });
  h += '<section class="sec pt0"><div class="wrap">' + tip('cursos', 'Cómo funcionan los cursos', 'Entra en un módulo y verás a la izquierda todo su contenido: <b>Introducción</b>, <b>Lecciones</b>, <b>Videos</b>, <b>Lecturas</b> y <b>Cierre</b>. Lo que terminas queda marcado con ✓ y sigue en la lista para repasarlo cuando quieras.', 'cursos') +
    '<div class="cgrid">' + R.map(function (m) {
      var p = modPct(m), nv = modVideos(m).length, nr = modReadings(m).length;
      return '<a class="ccard lg" href="#m/' + m.id + '" style="' + themeVars(m) + '"><div class="cc-cov">' + mcover(m) + (p.p === 100 ? '<span class="pill ok">✓ Completado</span>' : paraTi(m) ? '<span class="pill hot">♥ Para ti</span>' : '') + '</div>' +
        '<div class="cc-body"><span class="kick">Módulo ' + m.num + '</span><h3>' + esc(m.titulo) + '</h3><p>' + esc((m.intro && m.intro.texto[0] || m.subtitulo).split('. ')[0].replace(/\.$/, '')) + '.</p>' +
        '<div class="cc-meta"><span>' + ic('lista', 14) + plural(m.lecciones.length, 'lección', 'lecciones') + '</span><span>' + ic('play', 13) + plural(nv, 'video', 'videos') + '</span><span>' + ic('libro', 14) + plural(nr, 'lectura', 'lecturas') + '</span><span>' + ic('reloj', 14) + '≈ ' + modMins(m) + ' min</span></div>' + pbar(p.p) + '</div></a>';
    }).join('') + '</div>' +
    vPractica() + '<a class="certcta lg" href="#certificado">' + ic('corona', 26) + '<span><b>Tu graduación</b><small>' + (t.p === 100 ? 'Tu certificado está listo' : 'Al completar las ' + t.n + ' lecciones se desbloquea tu certificado y la insignia legendaria «Graduada PLENA»') + '</small></span>' + ic('der', 18) + '</a></div></section>';
  return h;
}

/* ---------- aula del módulo ---------- */
function introSeen(m) { return !!lsJSON('plena.intro', {})[m.id]; }
function roomSide(o) {
  return '<aside class="rside lg"><div class="rs-head"><a class="back" href="' + o.back + '">' + ic('izq', 14) + ' ' + o.backTxt + '</a><b>' + esc(o.title) + '</b>' + pbar(o.pct) + '</div>' +
    '<details class="rs-mob"' + (window.innerWidth > 980 ? ' open' : '') + '><summary>' + ic('lista', 16) + ' Contenido <span>' + o.count + '</span>' + ic('abajo', 16) + '</summary><nav class="rs-list">' + o.groups.map(function (g) {
      return '<div class="rs-g"><span class="rs-gt">' + (g.icon ? ic(g.icon, 15) : '') + esc(g.t) + (g.c ? ' <em>' + g.c + '</em>' : '') + '</span>' + g.items.map(function (it) {
        return '<a class="rs-it' + (it.cur ? ' cur' : '') + (it.ok ? ' ok' : '') + '" href="' + it.href + '"' + (it.act ? ' data-act="' + it.act + '" ' + it.data : '') + '>' + checkDot(it.ok) + '<span>' + esc(it.t) + (it.s ? '<small>' + esc(it.s) + '</small>' : '') + '</span></a>';
      }).join('') + '</div>';
    }).join('') + '</nav></details></aside>';
}
function vRoom(mid, kind, id) {
  var m = mod(mid); if (!m) return vCursos();
  var p = modPct(m), vids = modVideos(m), reads = modReadings(m), B = modBadge(m), S = stats();
  if (kind === 'intro') { var I = lsJSON('plena.intro', {}); if (!I[m.id]) { I[m.id] = 1; ls('plena.intro', JSON.stringify(I)); } }
  var groups = [
    { t: 'Empieza aquí', icon: 'bandera', items: [{ t: 'Introducción al módulo', s: 'Qué vas a lograr', href: '#m/' + m.id, ok: introSeen(m) || kind === 'intro', cur: kind === 'intro' }] },
    { t: 'Lecciones', icon: 'lista', c: p.d + '/' + p.n, items: m.lecciones.map(function (l, i) { return { t: (i + 1) + '. ' + l.titulo, s: l.min + ' min', href: '#l/' + m.id + '/' + l.id, ok: !!prog.done[l.id], cur: kind === 'leccion' && id === l.id }; }) }
  ];
  if (vids.length) groups.push({ t: 'Practica con videos', icon: 'play', c: vids.filter(function (v) { return prog.vid[v.id]; }).length + '/' + vids.length, items: vids.map(function (v) { return { t: v.titulo, s: (durTag(v) || vc(v).nombre || ''), href: '#mv/' + m.id + '/' + v.id, ok: !!prog.vid[v.id], cur: kind === 'video' && id === v.id }; }) });
  if (reads.length) groups.push({ t: 'Lee en tus libros', icon: 'libro', c: reads.filter(function (x) { return lecturaOk(x.r); }).length + '/' + reads.length, items: reads.map(function (x) { var b = libro(x.r.item); return { t: x.r.titulo, s: b.titulo + ' · pág. ' + x.r.desde + (x.r.hasta > x.r.desde ? '–' + x.r.hasta : ''), href: '#m/' + m.id, ok: lecturaOk(x.r), act: 'leer', data: 'data-item="' + x.r.item + '" data-p="' + x.r.desde + '" data-h="' + x.r.hasta + '" data-lid="' + x.l.id + '"' }; }) });
  groups.push({ t: 'Cierre', icon: 'trofeo', items: [{ t: 'Tu insignia: ' + m.tema.insignia, s: p.p === 100 ? '¡Módulo completado!' : 'Se desbloquea al terminar', href: '#mc/' + m.id, ok: p.p === 100, cur: kind === 'cierre' }] });
  var count = (p.d + (introSeen(m) ? 1 : 0)) + '/' + (p.n + 1);
  var main = kind === 'leccion' ? roomLesson(m, id) : kind === 'video' ? roomVideo(VBY[id], { list: vids, base: '#mv/' + m.id + '/', backTo: '#m/' + m.id, m: m }) : kind === 'cierre' ? roomClose(m, S) : roomIntro(m, S);
  return '<section class="room" style="' + themeVars(m) + '"><div class="wrap room-g">' + roomSide({ back: '#cursos', backTxt: 'Cursos', title: 'Módulo ' + m.num + ' · ' + m.titulo, pct: p.p, count: count, groups: groups }) + '<article class="rmain">' + main + '</article></div></section>';
}
function roomIntro(m, S) {
  var p = modPct(m), vids = modVideos(m), reads = modReadings(m), B = modBadge(m), first = m.lecciones.filter(function (l) { return !prog.done[l.id]; })[0] || m.lecciones[0];
  var h = '<div class="lg rcard-main"><div class="ri-cov">' + mcover(m, 'big') + '</div><div class="ri-body"><span class="kick">Introducción · Módulo ' + m.num + (paraTi(m) ? ' · ♥ Para ti' : '') + '</span><h1>' + esc(m.titulo) + '</h1><p class="lead">' + esc(m.subtitulo) + '</p>' +
    '<blockquote class="voice"><p>«' + esc(m.frase) + '»</p><cite>' + esc(m.respuesta) + '</cite></blockquote>' +
    (m.intro ? m.intro.texto.map(function (x) { return '<p>' + esc(x) + '</p>'; }).join('') : '') +
    '<h2>Al terminar este módulo podrás</h2><ul class="goals">' + (m.intro ? m.intro.logros : []).map(function (x) { return '<li>' + checkDot(true) + '<span>' + esc(x) + '</span></li>'; }).join('') + '</ul>' +
    '<h2>Qué incluye</h2><div class="incl">' +
    '<div>' + ic('lista', 20) + '<b>' + m.lecciones.length + '</b><span>lecciones de ' + Math.round(modMins(m) / m.lecciones.length) + ' min</span></div>' +
    '<div>' + ic('play', 19) + '<b>' + vids.length + '</b><span>videos para practicar</span></div>' +
    '<div>' + ic('libro', 20) + '<b>' + reads.length + '</b><span>lecturas de tus libros</span></div>' +
    '<div>' + ic('trofeo', 20) + '<b>+' + XP.modulo + '</b><span>XP y una insignia</span></div></div>' +
    '<h2>Cómo avanzar</h2><ol class="how"><li><span><b>Lee la lección</b> y sus tres ideas esenciales.</span></li><li><span><b>Practica</b> con el video y abre las páginas de tus libros.</span></li><li><span><b>Responde</b> la pregunta rápida y descubre el mito.</span></li><li><span><b>Haz tu tarea</b> y marca la lección como completada: queda con ✓ en la lista.</span></li></ol>' +
    '<div class="ri-cta"><a class="btn btn-p" href="#l/' + m.id + '/' + first.id + '">' + ic('play', 16) + (p.d ? ' Continuar: ' : ' Empezar: ') + esc(first.titulo) + '</a>' + (p.d ? '<span class="muted">' + p.d + ' de ' + p.n + ' lecciones hechas</span>' : '') + '</div></div></div>' +
    '<div class="ri-badge lg"><div>' + bcard(B, p.p === 100, S, 'sm') + '</div><div><span class="kick">Tu premio</span><h3>Insignia «' + esc(m.tema.insignia) + '»</h3><p>Completa las ' + m.lecciones.length + ' lecciones para ganarla, junto con +' + XP.modulo + ' XP. Su dificultad es <b>media</b>.</p></div></div>';
  return h;
}
function roomHead(kick, title, done, act, idAttr) {
  return '<header class="rm-head"><div><span class="kick">' + kick + '</span><h1>' + esc(title) + '</h1></div><button class="cbig' + (done ? ' on' : '') + '" data-act="' + act + '" ' + idAttr + ' aria-label="' + (done ? 'Completado' : 'Marcar como completado') + '" title="' + (done ? 'Completado' : 'Marcar como completado') + '">' + ic('check', 22, 2.6) + '</button></header>';
}
function readBtn(r, lid) {
  var b = libro(r.item), ok = lecturaOk(r), n = r.hasta - r.desde + 1;
  return '<button class="read' + (ok ? ' ok' : '') + '" data-act="leer" data-item="' + r.item + '" data-p="' + r.desde + '" data-h="' + r.hasta + '" data-lid="' + (lid || '') + '"><span class="cv"><img src="' + cover(b.portada) + '" alt="" loading="lazy"></span><span><b>' + esc(r.titulo) + '</b><small>' + esc(b.titulo) + ' · ' + (n > 1 ? 'págs. ' + r.desde + '–' + r.hasta : 'pág. ' + r.desde) + '</small></span><span class="st">' + (ok ? '✓ Leída' : '+' + XP.lectura + ' XP') + '</span></button>';
}
var LESS_T = {}, LESS_MIN = 60000;   // momento en que se abrió cada lección (en esta visita) y tiempo mínimo para completarla
function roomLesson(m, lid) {
  var idx = -1; m.lecciones.forEach(function (l, i) { if (l.id === lid) idx = i; }); if (idx < 0) return roomIntro(m, stats());
  var l = m.lecciones[idx], ok = !!prog.done[l.id];
  if (!LESS_T[l.id]) LESS_T[l.id] = Date.now();
  if (prog.last !== m.id + '/' + l.id) { prog.last = m.id + '/' + l.id; saveProg(true); }
  var flat = allLessons(), fi = -1; flat.forEach(function (x, i) { if (x.l.id === l.id) fi = i; });
  var prev = flat[fi - 1], next = flat[fi + 1], lv = VBY[VLEC[l.id]];
  var h = '<div class="lg rcard-main">' + roomHead('Lección ' + (idx + 1) + ' de ' + m.lecciones.length + ' · ' + l.min + ' min · hasta +' + lessonMaxXP(l) + ' XP', l.titulo, ok, 'done', 'data-id="' + l.id + '"');
  if (lv) h += '<div class="rm-video">' + vPlayerBox(lv, true) + '<p class="vcap">' + ic('play', 13) + ' Practica: <b>' + esc(lv.titulo) + '</b>' + (lv.canal ? ' · ' + esc(lv.canal) : '') + (prog.vid[lv.id] ? ' · <span class="okc">✓ Visto</span>' : ' · +' + XP.video + ' XP al terminarlo') + '</p>' + (lv.opinion ? opNote() : '') + '</div>';
  h += '<div class="lectura">' + (l.texto || []).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + '</div>';
  if (l.claves && l.claves.length) h += '<h2 class="h3">Lo esencial</h2><div class="notes">' + l.claves.map(function (k, i) { return '<div class="note n' + i + '"><span class="nn">' + (i + 1) + '</span>' + esc(k) + '</div>'; }).join('') + '</div>';
  h += '</div>';
  if ((l.lecturas || []).length) h += '<div class="lg rblock"><span class="kick">Lee en tus libros · +' + XP.lectura + ' XP por lectura</span><h2>Profundiza en las páginas exactas</h2><p class="muted">Se abren a pantalla completa como un libro: pasa las hojas. Al ver todas las páginas de una lectura queda marcada con ✓.</p><div class="reads">' + l.lecturas.map(function (r) { return readBtn(r, l.id); }).join('') + '</div></div>';
  if (l.mito) {
    var mo = !!prog.mitos[l.id];
    h += '<div class="flip' + (mo ? ' on' : '') + '" id="flip"><div class="card3"><div class="face front lg"><span class="kick">¿Mito o realidad? · +' + XP.mito + ' XP</span><q>' + esc(l.mito.mito) + '</q><div class="opts"><button class="btn btn-g" data-act="mito" data-id="' + l.id + '" data-r="mito">Es un mito</button><button class="btn btn-g" data-act="mito" data-id="' + l.id + '" data-r="real">Es real</button></div></div>' +
      '<div class="face back lg"><span class="kick" style="color:var(--ok)">Es un mito · lo que dice la evidencia</span><p>' + esc(l.mito.verdad) + '</p></div></div></div>';
  }
  if (l.quiz) {
    var qa = l.id in prog.quiz, q = l.quiz;
    h += '<div class="lg rblock quiz' + (qa ? ' answered' : '') + '" id="quiz"><span class="kick">Pregunta rápida · +' + XP.quizOk + ' XP si aciertas a la primera</span><p class="q">' + esc(q.pregunta) + '</p><div class="ops">' +
      q.opciones.map(function (o, i) { var cls = qa && i === q.correcta ? ' right' : ''; return '<button class="op' + cls + '" data-act="quiz" data-id="' + l.id + '" data-i="' + i + '"><i>' + 'ABC'[i] + '</i>' + esc(o) + '</button>'; }).join('') +
      '</div>' + (qa ? '<div class="fb">' + (prog.quiz[l.id] === 1 ? '✓ ¡Acertaste! ' : 'La respuesta correcta está marcada. ') + esc(q.explica) + '</div>' : '') + '</div>';
  }
  var td = !!prog.tasks[l.id], apps = (l.recursos || []).filter(function (r) { return r.tipo === 'app'; });
  h += '<div class="lg rblock task"><span class="kick">Tu tarea · +' + XP.tarea + ' XP</span><h2>' + esc(l.tarea) + '</h2><button class="done' + (td ? ' ok' : '') + '" data-act="tarea" data-id="' + l.id + '">' + checkDot(td) + '<span>' + (td ? '¡Hecha! Queda registrada' : 'Marcar «¡La hice!»') + '</span></button>' +
    (apps.length ? '<div class="tools">' + apps.map(function (r) { return '<a class="tool" href="#diario/' + esc(r.ruta) + '"><span class="ti">' + ic('tel', 18) + '</span><span>' + esc(r.texto) + '<small>Se abre aquí, en Mi diario</small></span>' + ic('der', 16) + '</a>'; }).join('') + '</div>' : '') + '</div>';
  h += '<div class="lg finish' + (ok ? ' ok' : '') + '"><div><b>' + (ok ? '¡Lección completada!' : '¿Terminaste la lección?') + '</b><span>' + (ok ? 'Queda con ✓ en la lista. Puedes volver cuando quieras.' : 'Márcala y gana +' + XP.leccion + ' XP.') + '</span></div><button class="btn ' + (ok ? 'btn-g' : 'btn-p') + '" data-act="done" data-id="' + l.id + '">' + (ok ? '✓ Completada' : ic('check', 17, 3) + ' Completar lección') + '</button></div>' +
    '<div class="pn">' + (prev ? '<a class="btn btn-g btn-s" href="#l/' + prev.m.id + '/' + prev.l.id + '">' + ic('izq', 15) + ' Anterior</a>' : '<span></span>') + (idx === m.lecciones.length - 1 ? '<a class="btn btn-d btn-s" href="#mc/' + m.id + '">Cierre del módulo ' + ic('trofeo', 15) + '</a>' : next ? '<a class="btn btn-d btn-s" href="#l/' + next.m.id + '/' + next.l.id + '">Siguiente ' + ic('der', 15) + '</a>' : '') + '</div>' +
    '<p class="aviso">' + esc(C.aviso) + '</p>';
  return h;
}
function roomClose(m, S) {
  var p = modPct(m), B = modBadge(m), vids = modVideos(m), reads = modReadings(m), done = p.p === 100;
  var q = m.lecciones.filter(function (l) { return prog.quiz[l.id] === 1; }).length, tk = m.lecciones.filter(function (l) { return prog.tasks[l.id]; }).length;
  var vw = vids.filter(function (v) { return prog.vid[v.id]; }).length, rd = reads.filter(function (x) { return lecturaOk(x.r); }).length;
  var R = ruta(), i = R.indexOf(m), nm = R.slice(i + 1).concat(R.slice(0, i)).filter(function (x) { return modPct(x).p < 100; })[0];
  var h = '<div class="lg rcard-main close' + (done ? ' done' : '') + '"><div class="cl-top">' + bcard(B, done, S, 'big') + '<div><span class="kick">Cierre · Módulo ' + m.num + '</span><h1>' + (done ? '¡Módulo completado!' : 'Casi lo tienes') + '</h1><p>' + (done ? 'Ganaste la insignia «' + esc(m.tema.insignia) + '» y +' + XP.modulo + ' XP. ' + esc(m.respuesta) : 'Te faltan ' + plural(p.n - p.d, 'lección', 'lecciones') + ' para ganar la insignia «' + esc(m.tema.insignia) + '».') + '</p></div></div>' +
    '<h2>Tu resumen</h2><div class="incl">' +
    '<div>' + ic('lista', 20) + '<b>' + p.d + '/' + p.n + '</b><span>lecciones</span></div><div>' + ic('check', 20) + '<b>' + tk + '/' + p.n + '</b><span>tareas</span></div><div>' + ic('diana', 20) + '<b>' + q + '/' + p.n + '</b><span>aciertos</span></div><div>' + ic('play', 19) + '<b>' + vw + '/' + vids.length + '</b><span>videos</span></div><div>' + ic('libro', 20) + '<b>' + rd + '/' + reads.length + '</b><span>lecturas</span></div></div>';
  if (!done) h += '<h2>Lo que te falta</h2><div class="todo">' + m.lecciones.filter(function (l) { return !prog.done[l.id]; }).map(function (l) { return '<a class="rs-it" href="#l/' + m.id + '/' + l.id + '">' + checkDot(false) + '<span>' + esc(l.titulo) + '<small>' + l.min + ' min</small></span></a>'; }).join('') + '</div>';
  h += '<div class="ri-cta">' + (nm ? '<a class="btn btn-p" href="#m/' + nm.id + '">' + ic('der', 16) + ' Siguiente: Módulo ' + nm.num + ' · ' + esc(nm.titulo) + '</a>' : '<a class="btn btn-p" href="#certificado">' + ic('corona', 16) + ' Ver mi certificado</a>') + '<a class="btn btn-g" href="#cursos">Todos los cursos</a></div></div>';
  if (done && !lsJSON('plena.cel', {})[m.id]) { var c = lsJSON('plena.cel', {}); c[m.id] = 1; ls('plena.cel', JSON.stringify(c)); setTimeout(function () { confetti(120); }, 300); }
  return h;
}

/* =========================================================
   Cursos de práctica en video
   ========================================================= */
function vc(v) { return VCAT[v.cat] || {}; }
function vHref(v) { return '#vc/' + v.cat + '/' + v.id; }
function durTag(v) { return (v.tags || []).filter(function (t) { return /min$/.test(t); })[0] || ''; }
function opNote() { return '<p class="opnote">' + ic('info', 16) + ' Opinión de la autora del video: algunas ideas no coinciden con la evidencia del curso. Ante dudas, coméntalo con tu profesional.</p>'; }
function vPlayerBox(v, big) {
  return '<div class="vplayer' + (big ? ' big' : '') + '" style="--vc:' + vc(v).color + '"><button class="vcov" data-act="play" data-vid="' + v.id + '" aria-label="Reproducir: ' + esc(v.titulo) + '"><img src="' + ytimg(v.id, 'sddefault') + '" onerror="this.onerror=null;this.src=\'' + ytimg(v.id, 'hqdefault') + '\'" alt="" loading="lazy"><span class="vshade"></span><span class="vplay">' + ic('play', big ? 30 : 26) + '</span><span class="vtt"><span class="pill">' + esc(vc(v).nombre || '') + '</span><b>' + esc(v.titulo) + '</b></span>' + (prog.vid[v.id] ? '<span class="vseen">✓ Visto</span>' : '') + '</button></div>';
}
function vidCard(v) {
  var c = vc(v), dur = durTag(v), seen = !!prog.vid[v.id], p = (lsJSON(KEY_VPOS, {})[v.id] || {});
  var pct = !seen && p.d ? Math.round(p.t / p.d * 100) : 0;
  return '<a class="vcard lg' + (seen ? ' seen' : '') + '" href="' + vHref(v) + '" style="--vc:' + c.color + ';--vf:' + c.fondo + '" data-tags="' + esc((v.tags || []).join('|')) + '"><span class="vthumb"><img src="' + ytimg(v.id) + '" alt="" loading="lazy"><span class="vplay sm">' + ic(v.tipo === 'video' ? 'play' : v.tipo === 'musica' ? 'nota' : 'auri', 15) + '</span>' + (dur ? '<span class="vdur">' + dur + '</span>' : '') + (seen ? '<span class="vseen">✓ Completado</span>' : '') + (pct ? '<span class="vprog"><i style="width:' + pct + '%"></i></span>' : '') + '</span><span class="vbody"><span class="vcat">' + ic(c.icono || 'play', 13) + ' ' + esc(c.nombre || '') + '</span><b>' + esc(v.titulo) + '</b>' + (v.opinion ? '<small class="op">Opinión de la autora</small>' : '<small>' + esc(v.canal || '') + '</small>') + '</span></a>';
}
/* Recomendados: primero lo pendiente; lo ya visto se queda marcado como completado (no desaparece) */
function recVideos(n, onlyPending) {
  var mods = [];
  ((perfil && perfil.objetivos) || []).forEach(function (o) { var ob = C.objetivos.filter(function (x) { return x.id === o; })[0]; if (ob) mods.push(ob.modulo); });
  mods.push('m5'); var nx = siguiente(); if (nx) mods.unshift(nx.m.id);
  var out = [], ids = {};
  mods.forEach(function (m) { VIDS.forEach(function (v) { if (!v.opinion && v.mods.indexOf(m) >= 0 && !ids[v.id]) { ids[v.id] = 1; out.push(v); } }); });
  VIDS.forEach(function (v) { if (!v.opinion && !ids[v.id] && v.tipo === 'video') { ids[v.id] = 1; out.push(v); } });
  var pend = out.filter(function (v) { return !prog.vid[v.id]; }), vis = out.filter(function (v) { return prog.vid[v.id]; });
  return onlyPending ? pend.slice(0, n) : pend.slice(0, n).concat(vis.slice(0, 3));
}
function catPct(cat) { var l = VIDS.filter(function (v) { return v.cat === cat; }), d = l.filter(function (v) { return prog.vid[v.id]; }).length; return { n: l.length, d: d, p: l.length ? Math.round(d / l.length * 100) : 0 }; }
function vPractica() {
  var cats = C.videos.categorias;
  return '<div class="sec-h" style="margin-top:38px"><div><span class="kick">' + VIDS.length + ' clases en video · +' + XP.video + ' XP cada una</span><h2>Cursos de <em>práctica</em></h2><p class="muted" style="margin:6px 0 0;max-width:680px">Fuerza, taichi, pilates, cardio, movilidad, meditación, nutrición, podcast, audiolibros y música. Cada curso abre su lista de clases; las que terminas quedan con ✓. Algunas llevan la etiqueta «Opinión de la autora»: son ideas que no coinciden con la evidencia del curso.</p></div></div><div class="cgrid vc-grid">' + cats.map(function (c) {
    var l = VIDS.filter(function (v) { return v.cat === c.id; }), p = catPct(c.id), th = l.slice(0, 3);
    return '<a class="ccard lg" href="#vc/' + c.id + '" style="--vc:' + c.color + ';--vf:' + c.fondo + '"><div class="vcc-cov"><div class="vcc-in">' + th.map(function (v, i) { return '<img class="t' + i + '" src="' + ytimg(v.id) + '" alt="" loading="lazy">'; }).join('') + '<span class="vcc-ic">' + ic(c.icono, 22) + '</span></div></div>' +
      '<div class="cc-body"><span class="kick" style="color:' + c.color + '">' + plural(l.length, 'clase', 'clases') + '</span><h3>' + esc(c.nombre) + '</h3><p>' + esc(c.desc) + '</p>' + pbar(p.p, p.d + ' de ' + p.n + ' completadas') + '</div></a>';
  }).join('') + '</div><p class="vdisc">Videos públicos de sus autoras y canales en YouTube, seleccionados para acompañar el curso. Son un complemento: no sustituyen la consulta con tu profesional de salud.</p>';
}
/* ---------- Mi ruta: el mapa con bolitas y caminitos ---------- */
var XS = [50, 26, 50, 74];
function vRuta() {
  var t = totalPct(), S = stats(), mods = C.modulos.filter(function (m) { return modPct(m).p === 100; }).length;
  return '<section class="sec"><div class="wrap"><div class="sec-h"><div><span class="kick">' + C.modulos.length + ' módulos · ' + t.n + ' lecciones · ' + t.p + '% completado</span><h2>Mi <em>ruta</em> personal</h2><p class="muted" style="margin:6px 0 0;max-width:680px">Tu camino por PLENA, ordenado según lo que más te pesa. Cada bolita es un módulo: el anillo muestra tu avance, el camino se pinta a medida que completas y a su lado está la insignia que ganas. Al final te espera tu graduación.</p></div><div class="cstats">' + chipStat(t.d + '/' + t.n, 'lecciones') + chipStat(mods + '/' + C.modulos.length, 'módulos') + chipStat(S.xp, 'XP') + '</div></div>' +
    tip('ruta', 'Cómo leer tu mapa', 'Toca una bolita para entrar en ese módulo. <b>«Estás aquí»</b> marca tu lección actual, <b>♥ Para ti</b> son tus prioridades y el camino dorado es lo que ya completaste. Puedes cambiar el orden en tu perfil.', 'bandera') +
    mapa(ruta()) + '</div></section>';
}
function mapa(list) {
  var n = list.length, nx = siguiente(), rows = '', H = 200, top = 70, lastDone = -1, S = stats(), B = badges(), got = earned(S);
  var mob = window.innerWidth < 700, xs = mob ? [17, 29, 17, 29] : XS;
  list.forEach(function (m, i) { if (modPct(m).p === 100) lastDone = i; });
  var pts = list.map(function (m, i) { return [xs[i % 4], top + i * H + 84]; });
  var endY = top + n * H + 60;
  var d = 'M50 30 C50 ' + (top + 40) + ' ' + pts[0][0] + ' ' + (pts[0][1] - 70) + ' ' + pts[0][0] + ' ' + pts[0][1], dDone = '';
  pts.forEach(function (p, i) {
    if (!i) return;
    var q = pts[i - 1], seg = ' C' + q[0] + ' ' + (q[1] + H / 2) + ' ' + p[0] + ' ' + (p[1] - H / 2) + ' ' + p[0] + ' ' + p[1];
    d += seg; if (i <= lastDone) dDone += (dDone ? '' : 'M' + q[0] + ' ' + q[1]) + seg;
  });
  var lp = pts[n - 1]; d += ' C' + lp[0] + ' ' + (lp[1] + 90) + ' 50 ' + (endY - 70) + ' 50 ' + endY;
  list.forEach(function (m, i) {
    var p = modPct(m), here = nx && nx.m.id === m.id, x = xs[i % 4], right = !mob && x > 60, bx = x < 50 ? 80 : x > 50 ? 20 : 17;
    var b = B.filter(function (q) { return q.id === 'mod-' + m.id; })[0], won = got.indexOf(b.id) >= 0;
    rows += '<div class="mrow" style="top:' + (top + i * H) + 'px">' +
      '<a class="node' + (right ? ' r' : '') + (here ? ' here' : '') + (p.p === 100 ? ' ok' : '') + '" href="#m/' + m.id + '" style="left:' + x + '%;--p:' + p.p + ';' + themeVars(m) + '">' +
      '<span class="disc">' + (here ? '<span class="heretag pill hot">' + ic('corazon', 12) + ' Estás aquí</span>' : '') + '<span class="in"><img src="' + img(m.foto) + '" alt="" loading="lazy"></span><span class="num">' + (p.p === 100 ? ic('check', 16, 3) : m.num) + '</span></span>' +
      '<span class="lab lg"><b>' + esc(m.titulo) + '</b><small>' + p.d + '/' + p.n + ' lecciones · ' + p.p + '%</small><span class="pills">' + (paraTi(m) ? '<span class="pill hot">♥ Para ti</span>' : '') + (p.p === 100 ? '<span class="pill ok">✓ Completado</span>' : here ? '<span class="pill lav">En curso</span>' : '<span class="pill">+' + XP.modulo + ' XP</span>') + '</span></span></a>' +
      '<div class="prize" style="left:' + bx + '%"><span class="pz ' + TIER[b.tier].k + (won ? '' : ' off') + '"><img src="' + img('b-' + b.id) + '" alt="" loading="lazy"><i>' + ic(won ? 'check' : 'candado', 12, 3) + '</i></span><b>' + esc(b.n) + '</b><small>' + (won ? '¡Ganada!' : 'Insignia del módulo') + '</small></div></div>';
  });
  var fin = '<a class="mfin" href="#certificado" style="top:' + (endY - 10) + 'px"><span class="crown">' + ic('corona', 32, 2) + '</span><b>Graduación PLENA</b><small>' + (totalPct().p === 100 ? 'Tu certificado te espera' : 'Completa la ruta y recibe tu certificado') + '</small></a>';
  return '<div class="board lg"><div class="map" style="height:' + (endY + 130) + 'px"><span class="mstart pill">' + ic('bandera', 14) + ' Inicio de tu ruta</span>' +
    '<svg class="path" viewBox="0 0 100 ' + (endY + 20) + '" preserveAspectRatio="none" aria-hidden="true" style="height:' + (endY + 20) + 'px"><path d="' + d + '" fill="none" stroke="#fff" stroke-width="18" vector-effect="non-scaling-stroke" stroke-linecap="round"/><path d="' + d + '" fill="none" stroke="#E8A5B3" stroke-width="4" stroke-dasharray="2 13" vector-effect="non-scaling-stroke" stroke-linecap="round"/>' + (dDone ? '<path d="' + dDone + '" fill="none" stroke="url(#dg)" stroke-width="7" vector-effect="non-scaling-stroke" stroke-linecap="round"/><defs><linearGradient id="dg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD95A"/><stop offset="1" stop-color="#FF1A5D"/></linearGradient></defs>' : '') + '</svg>' + rows + fin + '</div></div>';
}
function vCatRoom(cat, vid) {
  var c = VCAT[cat]; if (!c) return vCursos();
  var list = VIDS.filter(function (v) { return v.cat === cat; }), p = catPct(cat);
  var v = VBY[vid] && VBY[vid].cat === cat ? VBY[vid] : (list.filter(function (x) { return !prog.vid[x.id]; })[0] || list[0]);
  var groups = [];
  if (cat === 'taichi') Object.keys(C.videos.subcategorias).forEach(function (s) { var l = list.filter(function (x) { return x.sub === s; }); if (l.length) groups.push({ t: C.videos.subcategorias[s], c: l.filter(function (x) { return prog.vid[x.id]; }).length + '/' + l.length, items: l }); });
  else groups.push({ t: 'Clases', c: p.d + '/' + p.n, items: list });
  groups = groups.map(function (g) { g.items = g.items.map(function (x) { return { t: x.titulo, s: durTag(x) || (x.tags || [])[0] || (x.opinion ? 'Opinión de la autora' : ''), href: vHref(x), ok: !!prog.vid[x.id], cur: x.id === v.id }; }); return g; });
  return '<section class="room" style="--m-acc:' + c.color + ';--m-bg:' + c.fondo + ';--m-bg2:' + c.fondo + '"><div class="wrap room-g">' + roomSide({ back: '#cursos', backTxt: 'Cursos', title: c.nombre, pct: p.p, count: p.d + '/' + p.n, groups: groups }) + '<article class="rmain">' + roomVideo(v, { list: list, base: '#vc/' + cat + '/', backTo: '#cursos' }) + '</article></div></section>';
}
function roomVideo(v, o) {
  if (!v) return '';
  var c = vc(v), seen = !!prog.vid[v.id], i = o.list.indexOf(v), prev = o.list[i - 1], next = o.list[i + 1], mods = v.mods.map(mod).filter(Boolean);
  return '<div class="lg rcard-main">' + roomHead(esc(c.nombre) + (durTag(v) ? ' · ' + durTag(v) : '') + ' · +' + XP.video + ' XP', v.titulo, seen, 'visto', 'data-vid="' + v.id + '"') +
    '<div class="rm-video">' + vPlayerBox(v, true) + '</div>' +
    '<p class="lead">' + esc(v.desc) + '</p>' + (v.opinion ? opNote() : '') +
    '<div class="chips">' + (v.tags || []).map(function (t) { return '<span class="pill">' + esc(t) + '</span>'; }).join('') + mods.map(function (m) { return '<a class="pill hot" href="#m/' + m.id + '">Módulo ' + m.num + ' · ' + esc(m.titulo) + '</a>'; }).join('') + '</div>' +
    (v.canal ? '<p class="credit">Video de <b>' + esc(v.canal) + '</b>. Se reproduce aquí para que no salgas de tu academia. Un video cuenta como completado al ver el 60 % (o 8 minutos en los largos), o al pulsar ✓.</p>' : '') +
    '</div><div class="pn">' + (prev ? '<a class="btn btn-g btn-s" href="' + o.base + prev.id + '">' + ic('izq', 15) + ' Anterior</a>' : '<span></span>') + (next ? '<a class="btn btn-d btn-s" href="' + o.base + next.id + '">Siguiente ' + ic('der', 15) + '</a>' : '<a class="btn btn-g btn-s" href="' + o.backTo + '">Volver</a>') + '</div>';
}

/* =========================================================
   Biblioteca
   ========================================================= */
function vBiblioteca() {
  var S = stats(), cats = ['Libros', 'Bonos', 'Kits', 'Plantillas'], P = lsJSON(KEY_POS, {});
  var leyendo = C.biblioteca.filter(function (b) { var n = (ARCH[b.item] || {}).n || 0; return P[b.item] && pagesRead(b.item) < n; }).sort(function (a, b) { return P[b.item].t - P[a.item].t; }).slice(0, 3);
  var h = phead({ kick: 'Tu pack completo · ' + C.biblioteca.length + ' libros', title: 'Tu <em>biblioteca</em>', color: '#DB7F8E', fondo: '#FFE3EA', photo: img('f34a'), cut: img('cut28b'),
    desc: 'Todos tus libros, bonos, kits y plantillas. Toca una portada y se abre a pantalla completa: pasa las hojas deslizando o con las flechas, usa las miniaturas para saltar y la lupa para ampliar. Siempre vuelves a la página donde lo dejaste. Cada página nueva suma +' + XP.pagina + ' XP.',
    extra: '<div class="cstats">' + chipStat(S.books + '/' + C.biblioteca.length, 'abiertos') + chipStat(S.pages, 'páginas leídas') + chipStat(S.booksFull, 'terminados') + '</div>' });
  h += '<section class="sec pt0"><div class="wrap">' + tip('biblio', 'Cómo leer aquí', 'En el computador: flechas ← → o clic en el borde de la hoja; con la tecla Esc sales. En el celular: desliza la hoja. Arriba tienes las miniaturas, la lupa, el sonido de página y la descarga del PDF (los rellenables se completan con cualquier lector de PDF).', 'libro');
  if (leyendo.length) h += '<div class="sec-h"><h2>Sigue leyendo</h2></div><div class="reading">' + leyendo.map(function (b) { var n = (ARCH[b.item] || {}).n || 1, pr = Math.round(pagesRead(b.item) / n * 100); return '<button class="rcard lg" data-act="leer" data-item="' + b.item + '" data-p="' + P[b.item].p + '"><img src="' + cover(b.portada) + '" alt=""><span><b>' + esc(b.titulo) + '</b><small>Página ' + P[b.item].p + ' de ' + n + '</small>' + pbar(pr) + '</span></button>'; }).join('') + '</div>';
  cats.forEach(function (c) {
    var bs = C.biblioteca.filter(function (b) { return b.categoria === c; }); if (!bs.length) return;
    h += '<div class="sec-h" style="margin-top:28px"><h2>' + esc(c) + ' <span class="pill">' + bs.length + '</span></h2></div><div class="libgrid">' + bs.map(function (b) {
      var a = ARCH[b.item] || {}, n = a.n || 0, pr = n ? Math.round(pagesRead(b.item) / n * 100) : 0, p = P[b.item] ? P[b.item].p : 1;
      return '<button class="bk2" data-act="leer" data-item="' + b.item + '" data-p="' + p + '" aria-label="Leer ' + esc(b.titulo) + '"><span class="cv2"><img src="' + cover(b.portada) + '" alt="" loading="lazy">' + (pr === 100 ? '<span class="pill ok">✓ Leído</span>' : !pagesRead(b.item) ? '<span class="pill hot">Nuevo</span>' : '') + '<span class="open">' + ic('libro', 16) + ' Leer</span></span><b>' + esc(b.titulo) + '</b><small>' + esc(b.desc) + '</small><span class="bk-meta">' + n + ' páginas · ' + pr + '%</span>' + '<span class="bar"><i style="width:' + pr + '%"></i></span></button>';
    }).join('') + '</div>';
  });
  return h + '</div></section>';
}

/* =========================================================
   Mi diario (la app completa)
   ========================================================= */
var APPV = { hoy: 'Hoy', progreso: 'Progreso', plan30: 'Plan 30 días', plantillas: 'Plantillas', consulta: 'Mi consulta', ciclo: 'Ciclo', alarma: 'Señales de alarma', cuenta: 'Mi cuenta' };
function vDiario(sub) {
  if (!CLAVE_OK) return vClaveDiario();
  sub = APPV[sub] ? sub : 'hoy';
  var mis = misiones()[3];
  return '<section class="dfull"><div class="dpill"><span class="syncdot"><i></i> Conectado con PLENA</span><span id="dkD"><b>' + APP.days + '</b> días registrados</span><span class="dm' + (mis.ok ? ' ok' : '') + '" id="dkM">' + (mis.ok ? '✓ Misión de hoy cumplida' : 'Registrar hoy: +' + XP.diario + ' XP') + '</span><button class="lnk" data-act="appGuia">' + ic('ayuda', 15) + ' Cómo se usa</button></div>' +
    '<div class="appframe"><div class="ld">Abriendo tu diario…</div><iframe id="appf" title="Mi diario · app Menopausia Equilibrada" src="/?embed=1#' + sub + '" allow="clipboard-write"></iframe></div></section>';
}

/* =========================================================
   Logros
   ========================================================= */
function vLogros() {
  var S = stats(), B = badges(), got = earned(S), news = (lsJSON('plena.nuevas', []) || []), tk = TIER[S.tier].k;
  var h = '<section class="sec"><div class="wrap"><div class="lvcard lg ' + tk + '"><div class="lv-ring">' + ring(S.lvPct, 150, 12, '') + '<span class="n">' + S.lv + '</span></div><div class="lv-tx"><span class="tier ' + tk + '">Nivel ' + S.lv + ' de 15 · dificultad ' + TIER[S.tier].n.toLowerCase() + '</span><h1>' + esc(S.lvName) + '</h1><p>' + esc(NIVD[S.lv - 1]) + '</p>' + pbar(S.lvPct, S.xp + ' XP' + (S.lvTo ? ' · faltan ' + (S.lvTo - S.xp) + ' para «' + NIVN[S.lv] + '»' : ' · nivel máximo')) + '</div><img class="lv-cut" src="' + img('cut22b') + '" alt="" aria-hidden="true"></div>' +
    '<div class="lvtrack">' + NIVN.map(function (n, i) { var t2 = TIER[nivTier(i + 1)].k; return '<span class="' + t2 + (i < S.lv ? ' on' : '') + (i === S.lv - 1 ? ' cur' : '') + '" title="' + NIV[i] + ' XP"><b>' + (i + 1) + '</b>' + n + '</span>'; }).join('') + '</div></div></section>';
  h += '<section class="sec pt0"><div class="wrap">' + tip('logros', 'Cómo funcionan los logros', 'Todo suma XP: lecciones, tareas, preguntas, mitos, lecturas, páginas, videos, módulos y días en tu diario. Hay <b>15 niveles</b> y <b>' + B.length + ' insignias</b> en cuatro dificultades: <span class="tier t1">Fácil</span> <span class="tier t2">Media</span> <span class="tier t3">Difícil</span> <span class="tier t4">Legendaria</span>. Las legendarias son para muy pocas.', 'trofeo') +
    '<div class="tiers">' + [1, 2, 3, 4].map(function (t) { var all = B.filter(function (b) { return b.tier === t; }), g = all.filter(function (b) { return got.indexOf(b.id) >= 0; }).length; return '<div class="tcard lg ' + TIER[t].k + '"><span class="tier ' + TIER[t].k + '">' + TIER[t].n + '</span><b>' + g + '<small>/' + all.length + '</small></b><span>' + ['Para empezar con buen pie', 'Piden constancia', 'Para las más comprometidas', 'Solo para leyendas'][t - 1] + '</span></div>'; }).join('') + '</div>';
  var groups = []; B.forEach(function (b) { if (groups.indexOf(b.g) < 0) groups.push(b.g); });
  groups.forEach(function (g) {
    var l = B.filter(function (b) { return b.g === g; }), n = l.filter(function (b) { return got.indexOf(b.id) >= 0; }).length;
    h += '<div class="sec-h" style="margin-top:28px"><h2>' + esc(g) + ' <span class="pill">' + n + '/' + l.length + '</span></h2></div><div class="bgrid">' + l.map(function (b) { var on = got.indexOf(b.id) >= 0; return '<div class="bwrap' + (on && news.indexOf(b.id) >= 0 ? ' new' : '') + '">' + bcard(b, on, S) + '</div>'; }).join('') + '</div>';
  });
  var cells = '', t = dk(), start = addD(t, -34);
  for (var i = 0; i < 35; i++) { var k = addD(start, i), v = prog.days[k] || 0, lvl = !(v & 8) ? '' : (v & PERF) === PERF ? 'l3' : (v & PERF) ? 'l2' : 'l1'; cells += '<i class="' + lvl + (k === t ? ' today' : '') + '" title="' + k + '"></i>'; }
  h += '<div class="grid2" style="margin-top:30px"><div class="lg panel"><span class="kick">Tu racha</span><h3>' + plural(S.streak.cur, 'día seguido', 'días seguidos') + ' · récord: ' + S.streak.best + '</h3><p class="muted">Cada día con actividad (una lección, un video, una lectura o tu diario) mantiene la llama encendida.</p><div class="heat">' + cells + '</div><p class="muted sm">Últimas 5 semanas · rosa intenso = día perfecto</p></div>' +
    '<div class="lg panel"><span class="kick">De dónde vienen tus XP</span><table class="xpt">' + S.xpParts.map(function (p) { return '<tr><td>' + esc(p[0]) + '</td><td>' + p[1] + ' XP</td></tr>'; }).join('') + '<tr><td><b>Total</b></td><td>' + S.xp + ' XP</td></tr></table></div></div></div></section>';
  ls('plena.nuevas', JSON.stringify([]));
  return h;
}

/* =========================================================
   Perfil, certificado, bienvenida y bloqueo
   ========================================================= */
var ETAPAS = [['peri', 'Aún tengo reglas, pero han cambiado', 'perimenopausia', 'luna'], ['post', 'Llevo 12 meses o más sin regla', 'posmenopausia', 'sol'], ['inducida', 'Llegó por una cirugía o un tratamiento', 'menopausia inducida', 'consulta'], ['nose', 'No lo tengo claro', 'lo descubrimos juntas', 'lupa']];
var OBJIC = { sofocos: 'llama', sueno: 'noche', mente: 'mente', cuerpo: 'pesa', comida: 'hoja', intimidad: 'corazones', consulta: 'consulta', trabajo: 'corona', etapa: 'luna' };
function pwField(id, label, ac) { return '<label class="fld" for="' + id + '">' + label + '<span class="pw"><input id="' + id + '" type="password" autocomplete="' + ac + '" maxlength="72" required><button type="button" class="pwv" data-act="verPw" data-for="' + id + '" aria-label="Mostrar la contraseña">Ver</button></span></label>'; }
function vPerfil() {
  var S = stats(), t = totalPct(), p = perfil || {}, tk = TIER[S.tier].k, f = CUENTA && CUENTA.foto;
  return '<section class="sec"><div class="wrap narrow"><div class="lg panel prof">' + avaHTML('ava big') + '<div><span class="kick">Tu perfil</span><h1>Hola' + (nombre() ? ', <em>' + esc(nombre()) + '</em>' : '') + '</h1><p class="muted">Nivel ' + S.lv + ' · ' + esc(S.lvName) + ' <span class="tier ' + tk + '">' + TIER[S.tier].n + '</span> · ' + S.xp + ' XP · ' + t.p + '% del curso</p></div>' + (t.p === 100 ? '<a class="btn btn-p btn-s" href="#certificado">Mi certificado</a>' : '') + '</div>' +
    '<div class="lg panel" id="fotoP"><b class="ser">Tu foto</b><p class="muted">Aparece en la cabecera, en tu perfil y en tu certificado. Elige una de tu galería o tómala con la cámara: la recortamos cuadrada y la comprimimos aquí antes de subirla. Solo tú la ves.</p>' +
    '<div class="fotorow"><span class="fprev" id="fPrev">' + (f ? '<img src="' + esc(f) + '" alt="Tu foto">' : esc((nombre() || 'P').charAt(0).toUpperCase())) + '</span><div class="row"><label class="btn btn-p btn-s" for="fIn">' + ic('dl', 16) + ' Subir mi foto<input id="fIn" type="file" accept="image/jpeg,image/png,image/webp,image/*" hidden></label>' + (f ? '<button class="btn btn-g btn-s" data-act="fotoQuitar">Quitar foto</button>' : '') + '</div></div>' +
    '<div id="fNueva" hidden><p class="muted sm">Así se verá. ¿La guardamos?</p><div class="row"><button class="btn btn-p btn-s" data-act="fotoGuardar">Guardar foto</button><button class="btn btn-g btn-s" data-act="fotoCancelar">Cancelar</button></div></div><p class="err" id="fErr" hidden></p></div>' +
    '<div class="lg panel">' + perfilForm(p, false) + '</div>' +
    '<div class="lg panel"><b class="ser">Ayuda</b><p class="muted">¿Te perdiste? Vuelve a ver el recorrido guiado o abre la guía rápida con la explicación de cada sección.</p><div class="row"><button class="btn btn-g btn-s" data-act="tour">' + ic('bandera', 16) + ' Repetir el recorrido</button><button class="btn btn-g btn-s" data-act="guia">' + ic('ayuda', 16) + ' Guía rápida</button></div></div>' +
    '<div class="lg panel" id="cuentaP"><b class="ser">Tu cuenta</b><p class="muted">Tu usuario: <b>' + esc((CUENTA && CUENTA.email) || '') + '</b>. Entras con él y tu contraseña en el celular, en el computador y en la app instalada.</p>' +
    '<details class="acc"><summary>Cambiar mi contraseña</summary><form id="cpF" novalidate>' + pwField('cpA', 'Contraseña actual', 'current-password') + pwField('cpN', 'Nueva contraseña <small>(mínimo 8 caracteres)</small>', 'new-password') + '<div class="meter" id="cpM"><i></i><i></i><i></i><i></i><span>Mínimo 8 caracteres</span></div>' + pwField('cpR', 'Repite la nueva contraseña', 'new-password') + '<p class="err" id="cpErr" hidden></p><button class="btn btn-p" type="submit">Guardar la nueva contraseña</button></form></details>' +
    '<div class="row" style="margin-top:12px"><button class="btn btn-g btn-s" data-act="misDatos">' + ic('dl', 16) + ' Descargar mis datos</button><button class="btn btn-g btn-s" data-act="salir">Cerrar sesión</button></div>' +
    '<details class="acc danger"><summary>Borrar mi cuenta</summary><p class="muted">Se borran para siempre tu cuenta, tu perfil, tu progreso, tus insignias, tu foto y la copia cifrada de tu diario. No se puede deshacer. Si quieres guardar algo, primero descarga tus datos.</p><form id="dlF" novalidate>' + pwField('dlP', 'Escribe tu contraseña para confirmar', 'current-password') + '<p class="err" id="dlErr" hidden></p><button class="btn btn-danger" type="submit">Borrar mi cuenta para siempre</button></form></details></div>' +
    '<div class="lg panel"><b class="ser">Sonido y privacidad</b><p class="muted">Tu progreso del curso (lecciones, respuestas, páginas leídas, videos vistos y días con actividad) se guarda en tu cuenta para verlo en todos tus dispositivos. Tu etapa, tus objetivos y tu diario se cifran en este dispositivo con una clave que solo se abre con tu contraseña: nadie más puede leerlos, tampoco nosotras. <a href="/privacidad.html">Política de privacidad</a>.</p><div class="row"><button class="btn btn-g btn-s" data-act="sonido">' + ic(sonidoOn() ? 'son' : 'mudo', 16) + (sonidoOn() ? ' Sonidos activados' : ' Sonidos apagados') + '</button></div></div></div></section>';
}
function perfilForm(p, step) {
  var obj = p.objetivos || [];
  var f1 = '<label class="fld" for="pfN">¿Cómo quieres que te llamemos?<input id="pfN" maxlength="40" autocomplete="given-name" value="' + esc(p.nombre || NOMBRE || '') + '" placeholder="Tu nombre"></label>';
  var f2 = '<div class="fld">¿En qué etapa estás?</div><div class="opts g2">' + ETAPAS.map(function (o) { return '<label class="opt"><input type="radio" name="etapa" value="' + o[0] + '"' + (p.etapa === o[0] ? ' checked' : '') + '><span class="e">' + ic(o[3], 20) + '</span><span>' + o[1] + '<small>' + o[2] + '</small></span></label>'; }).join('') + '</div>';
  var f3 = '<div class="fld">¿Qué es lo que más te pesa hoy? <small>(hasta 3)</small></div><div class="opts g2">' + C.objetivos.map(function (o) { return '<label class="opt"><input type="checkbox" name="obj" value="' + o.id + '"' + (obj.indexOf(o.id) >= 0 ? ' checked' : '') + '><span class="e">' + ic(OBJIC[o.id] || 'corazon', 20) + '</span><span>' + esc(o.texto) + '</span></label>'; }).join('') + '</div>';
  if (!step) return '<form id="pf">' + f1 + f2 + f3 + '<p class="err" id="pfErr" hidden></p><button class="btn btn-p" type="submit" style="width:100%;margin-top:6px">Guardar y actualizar mi ruta</button></form>';
  var body = step === 1 ? f1 : step === 2 ? f2 : f3;
  return '<form id="pf" data-step="' + step + '">' + body + '<p class="err" id="pfErr" hidden></p><div class="row ob-nav">' + '<button class="btn btn-g" type="button" data-act="atras">Atrás</button>' + '<button class="btn btn-p" type="submit" style="flex:1">' + (step < 3 ? 'Siguiente' : 'Crear mi ruta personal') + '</button></div></form>';
}
var obStep = 0, obDraft = {};
function obDots() { return '<div class="dots">' + [0, 1, 2, 3].map(function (i) { return '<i class="' + (i <= obStep ? 'on' : '') + '"></i>'; }).join('') + '</div>'; }
function vOnboarding() {
  if (obStep === 0) return '<div class="ov"><div class="obwrap"><div class="box lg obox">' + obDots() + '<span class="kick">Bienvenida · paso 1 de 4</span><h1>Esto es <span class="plena sm">Plena</span></h1><p class="lead">Tu academia para entender la menopausia y cuidar tu mente en esta etapa. Todo está en un solo lugar, y te guiamos paso a paso para que nunca te pierdas.</p>' +
    '<div class="obgrid">' +
    [['cursos', 'Cursos', '10 módulos y 10 cursos de práctica en video, con introducción y cierre.'], ['bandera', 'Mi ruta', 'Tu mapa con bolitas y caminitos que muestra tu progreso.'], ['libro', 'Biblioteca', 'Tus 13 libros para leer pasando las hojas.'], ['tel', 'Mi diario', 'Tu app: registra tu día y descarga tu informe.'], ['trofeo', 'Logros', 'XP, 15 niveles y ' + badges().length + ' insignias en 4 dificultades.']].map(function (x) { return '<div class="obi"><span class="obic">' + ic(x[0], 20) + '</span><b>' + x[1] + '</b><small>' + x[2] + '</small></div>'; }).join('') +
    '</div><p class="muted sm">Primero te hacemos 3 preguntas para ordenar tu ruta. Luego un recorrido de un minuto te muestra dónde está cada cosa.</p><button class="btn btn-p" data-act="obNext" style="width:100%">Empezar</button></div><img class="obcut" src="' + img('cut13a') + '" alt="" aria-hidden="true"></div></div>';
  var tt = ['', 'Hagamos esto <em>tuyo</em>', 'Tu <em>etapa</em>', 'Lo que más te <em>pesa</em>'][obStep];
  var dsc = ['', 'Tus respuestas se guardan cifradas en tu cuenta: solo tú puedes leerlas.', 'Así adaptamos los textos a tu momento. Si no lo sabes, no pasa nada: el módulo 1 te ayuda.', 'Pondremos primero los módulos que más te ayudan. Puedes cambiarlo cuando quieras en tu perfil.'][obStep];
  return '<div class="ov"><div class="obwrap"><div class="box lg obox">' + obDots() + '<span class="kick">Bienvenida · paso ' + (obStep + 1) + ' de 4</span><h1>' + tt + '</h1><p>' + dsc + '</p>' + perfilForm(Object.assign({}, perfil || {}, obDraft), obStep) + '</div><img class="obcut" src="' + img(['cut13a', 'cut08a', 'cut17a', 'cut27a'][obStep]) + '" alt="" aria-hidden="true"></div></div>';
}
function vMagic() { return '<div class="ov"><div class="box lg magic">' + glassHeart(130, 'love', '', '', '', 'big flt') + '<h1>Creando tu ruta' + (nombre() ? ', <em>' + esc(nombre()) + '</em>' : '') + '…</h1><p id="mgT">Ordenando los módulos según lo que más te pesa</p></div></div>'; }
/* ---------- iniciar sesión, recuperar y crear una nueva contraseña ---------- */
var AUTHV = 'login', AUTHMSG = '';
function authBox(inner, cut) { return '<div class="ov"><div class="obwrap"><div class="box lg obox auth">' + inner + '</div><img class="obcut" src="' + img(cut || 'cut02a') + '" alt="" aria-hidden="true"></div></div>'; }
function vLogin(msg) {
  if (AUTHV === 'olvido') return authBox('<span class="kick">Recuperar contraseña</span><h1>¿Olvidaste tu <em>contraseña</em>?</h1><p>Escribe el correo con el que creaste tu cuenta y te enviaremos un enlace para crear una nueva.</p><form id="rcF" novalidate><label class="fld" for="rcE">Tu correo<input id="rcE" type="email" autocomplete="username" inputmode="email" autocapitalize="none" spellcheck="false" required></label><p class="err" id="rcErr" hidden></p><p class="okmsg" id="rcOk" hidden></p><button class="btn btn-p" style="width:100%;margin-top:12px">Enviarme el enlace</button></form><p class="muted sm"><button class="lnk" data-act="authV" data-v="login">← Volver a iniciar sesión</button></p>', 'cut08a');
  return authBox('<span class="kick">Acceso privado</span><h1>Tu academia <span class="plena sm">Plena</span></h1><p>Curso de menopausia y psicomenopausia, videoteca, libros para hojear, tu diario y tus logros en un solo lugar. Está incluida en el <b>pack completo</b>.</p>' +
    '<form id="lgF" novalidate><label class="fld" for="lgE">Tu correo<input id="lgE" type="email" autocomplete="username" inputmode="email" autocapitalize="none" spellcheck="false" required></label>' + pwField('lgP', 'Tu contraseña', 'current-password') +
    '<div class="lgrow"><label class="chk" for="lgR"><input type="checkbox" id="lgR"' + (PC.recordar() ? ' checked' : '') + '> Recordarme en este dispositivo</label><button type="button" class="lnk" data-act="authV" data-v="olvido">¿Olvidaste tu contraseña?</button></div>' +
    '<p class="err" id="lgErr"' + (msg ? '' : ' hidden') + ' role="alert">' + esc(msg || '') + '</p><button class="btn btn-p" id="lgB" style="width:100%;margin-top:12px">Entrar</button></form>' +
    '<p class="muted sm">¿Compraste y aún no tienes cuenta? Créala con el enlace de tu correo de compra (tu página de descargas). ¿Aún no tienes el pack? <a href="/oferta/">Conócelo aquí</a>.</p>');
}
function vNuevaClave() {
  return authBox('<span class="kick">Nueva contraseña</span><h1>Crea tu nueva <em>contraseña</em></h1><p>Elige una contraseña que no uses en otros sitios. Al guardarla, se cerrará la sesión en tus otros dispositivos.</p><form id="ncF" novalidate>' + pwField('ncP', 'Nueva contraseña <small>(mínimo 8 caracteres)</small>', 'new-password') + '<div class="meter" id="ncM"><i></i><i></i><i></i><i></i><span>Mínimo 8 caracteres</span></div>' + pwField('ncR', 'Repite la contraseña', 'new-password') + '<p class="err" id="ncErr" hidden role="alert"></p><button class="btn btn-p" style="width:100%;margin-top:12px">Guardar y entrar</button></form>', 'cut17a');
}
function vClaveDiario() {
  return '<section class="sec"><div class="wrap narrow"><div class="lg panel" style="text-align:center">' + glassHeart(80, 'happy', '', '', 'margin:0 auto', 'flt') + '<span class="kick">Tu diario está protegido</span><h1>Confirma tu <em>contraseña</em></h1><p class="muted">Tu diario se cifra con una clave que solo se abre con tu contraseña. En este dispositivo hace falta escribirla una vez (por ejemplo, si la cambiaste en otro dispositivo).</p><form id="cdF" novalidate style="max-width:420px;margin:0 auto;text-align:left">' + pwField('cdP', 'Tu contraseña', 'current-password') + '<p class="err" id="cdErr" hidden role="alert"></p><button class="btn btn-p" style="width:100%;margin-top:12px">Abrir mi diario</button></form></div></div></section>';
}
function vMejora() { return '<div class="ov"><div class="box lg obox" style="text-align:center">' + glassHeart(90, 'happy', '', '', 'margin:0 auto', 'flt') + '<span class="kick">Tu acceso está activo</span><h1>PLENA está en el <em>pack completo</em></h1><p>Tu compra incluye la app, pero no la academia. Completa tu pack pagando solo la diferencia desde tu página de descargas.</p><a class="btn btn-p" href="/oferta/">Ver el pack completo</a><p style="margin-top:14px"><button class="lnk" data-act="salir">Cerrar sesión</button></p></div></div>'; }
function vCert() {
  var t = totalPct(), nm = nombre() || 'Graduada', f = new Date().toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' });
  if (t.p < 100) return '<section class="sec"><div class="wrap narrow"><div class="lg panel" style="text-align:center">' + glassHeart(80, 'happy', '', '', 'margin:0 auto', 'flt') + '<span class="kick">Tu graduación</span><h1>Te faltan ' + plural(t.n - t.d, 'lección', 'lecciones') + '</h1><p>Completa el curso para desbloquear tu certificado de graduación PLENA y la insignia legendaria «Graduada PLENA».</p>' + pbar(t.p) + '<a class="btn btn-p" href="' + nextHref() + '" style="margin-top:14px">Seguir mi curso</a></div></div></section>';
  return '<section class="sec"><div class="wrap" style="max-width:880px"><div class="cert"><span class="px">PLENA · Academia de Menopausia y Psicomenopausia</span><h2>Certificado de graduación</h2><p>Se otorga con orgullo a</p>' + (CUENTA && CUENTA.foto ? '<img class="cfoto" src="' + esc(CUENTA.foto) + '" alt="">' : '') + '<div class="name">' + esc(nm) + '</div><p style="max-width:560px;margin:0 auto">por completar el curso PLENA: ' + C.modulos.length + ' módulos y ' + t.n + ' lecciones para entender su cuerpo, cuidar su mente y vivir esta etapa con información, fuerza y libertad.</p><p class="cierre">' + esc(C.cierre) + '</p><p class="muted sm">' + esc(f) + ' · DisierTECH</p>' + glassHeart(56, 'love', '', '', 'position:absolute;left:30px;top:30px') + sparkle('#FFD95A', 40, 'position:absolute;right:34px;top:34px') + '<img src="' + img('cut22a') + '" alt="" style="position:absolute;right:14px;bottom:-6px;height:170px"></div><p class="noprint" style="text-align:center;margin-top:18px"><button class="btn btn-p" data-act="print">Descargar / imprimir certificado</button></p></div></section>';
}

/* =========================================================
   Reproductor de video (Plyr)
   ========================================================= */
var PLAYERS = [];
function destroyPlayers() { PLAYERS.forEach(function (p) { try { p.destroy(); } catch (e) { } }); PLAYERS = []; }
var PLYR_ES = { restart: 'Reiniciar', rewind: 'Retroceder {seektime}s', play: 'Reproducir', pause: 'Pausar', fastForward: 'Adelantar {seektime}s', seek: 'Buscar', seekLabel: '{currentTime} de {duration}', played: 'Reproducido', buffered: 'Cargado', currentTime: 'Tiempo actual', duration: 'Duración', volume: 'Volumen', mute: 'Silenciar', unmute: 'Activar sonido', enableCaptions: 'Activar subtítulos', disableCaptions: 'Desactivar subtítulos', enterFullscreen: 'Pantalla completa', exitFullscreen: 'Salir de pantalla completa', frameTitle: 'Reproductor de {title}', captions: 'Subtítulos', settings: 'Ajustes', speed: 'Velocidad', normal: 'Normal', quality: 'Calidad', loop: 'Repetir' };
function savePos(id, t, d, w) { var P = lsJSON(KEY_VPOS, {}); P[id] = { t: Math.round(t), d: Math.round(d || 0), w: Math.round(w != null ? w : ((P[id] || {}).w || 0)), at: Date.now() }; var ks = Object.keys(P); if (ks.length > 80) { ks.sort(function (a, b) { return P[a].at - P[b].at; }).slice(0, ks.length - 80).forEach(function (k) { delete P[k]; }); } ls(KEY_VPOS, JSON.stringify(P)); }
function markWatched(id, el) {
  if (prog.vid[id]) return;
  award(el, function () { prog.vid[id] = Date.now(); markDay(32); });
  toast('¡Video completado! Queda con ✓ en la lista. +' + XP.video + ' XP'); confetti(40);
  $$('[data-act=visto][data-vid="' + id + '"]').forEach(function (b) { b.classList.add('on'); });
  $$('.rs-it.cur').forEach(function (a) { a.classList.add('ok'); var c = $('.ck', a); if (c) { c.classList.add('on'); c.innerHTML = ic('check', 13, 3); } });
}
function mountPlayer(box, id) {
  destroyPlayers();
  var start = (lsJSON(KEY_VPOS, {})[id] || {}).t || 0;
  if (!window.Plyr) { box.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3' + (start > 15 ? '&start=' + start : '') + '" title="Video" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen style="width:100%;aspect-ratio:16/9;border:0;display:block"></iframe>'; return; }
  box.classList.add('on'); box.innerHTML = '<div data-plyr-provider="youtube" data-plyr-embed-id="' + id + '"></div>';
  var p = new Plyr(box.firstChild, { autoplay: true, iconUrl: '/plena/vendor/plyr.svg', blankVideo: '', i18n: PLYR_ES, ratio: '16:9', youtube: { noCookie: true, rel: 0, showinfo: 0, iv_load_policy: 3, modestbranding: 1, playsinline: 1 },
    controls: ['play-large', 'play', 'rewind', 'progress', 'current-time', 'duration', 'mute', 'volume', 'settings', 'fullscreen'], settings: ['speed'], speed: { selected: 1, options: [0.75, 1, 1.25, 1.5, 2] }, seekTime: 10, keyboard: { focused: true, global: false } });
  var last = 0, acc = (lsJSON(KEY_VPOS, {})[id] || {}).w || 0, saved = 0, sought = false;
  p.on('playing', function () { if (!sought && start > 15 && p.duration && start < p.duration - 20) { try { p.currentTime = start; } catch (e) { } } sought = true; });
  p.on('timeupdate', function () {
    var c = p.currentTime || 0, d = p.duration || 0, dt = c - last; if (dt > 0 && dt < 2.5) acc += dt; last = c;
    if (Date.now() - saved > 4000) { saved = Date.now(); savePos(id, c, d, acc); }
    if (!prog.vid[id] && d && acc >= Math.min(d * 0.6, 480)) markWatched(id, box);
  });
  p.on('ended', function () { savePos(id, 0, p.duration); if (!prog.vid[id]) markWatched(id, box); });
  PLAYERS.push(p);
}
function vSearch() {
  var q = this.value.trim().toLowerCase(), res = $('#vres'), br = $('#vbrowse'); if (!res) return;
  if (!q) { res.hidden = true; br.hidden = false; return; }
  var norm = function (s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
  var words = norm(q).split(/\s+/), list = VIDS.filter(function (v) { var s = norm(v.titulo + ' ' + v.desc + ' ' + (vc(v).nombre || '') + ' ' + (v.tags || []).join(' ')); return words.every(function (w) { return s.indexOf(w) >= 0; }); });
  $('#vresg').innerHTML = list.length ? list.map(vidCard).join('') : '<p class="muted">No encontramos videos con «' + esc(q) + '». Prueba con «fuerza», «taichi» o «dormir».</p>';
  res.hidden = false; br.hidden = true;
}

/* =========================================================
   Lector tipo libro (StPageFlip) a pantalla completa
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
    '<div class="rfoot">' + (range ? '<div class="goal" id="rGoal"></div>' : '<div class="hint">Desliza o toca el borde de la hoja para pasar la página · Esc para salir</div>') + '<div class="rng"><span>1</span><input type="range" id="rRange" min="1" max="' + a.n + '" value="' + page + '" aria-label="Ir a la página"><span>' + a.n + '</span></div></div>' +
    '<div class="thumbs" id="rThumbs"></div>';
  document.body.appendChild(el); document.body.style.overflow = 'hidden';
  RD = { el: el, item: item, a: a, b: b, range: range || null, pf: null, page: page, rangeDone: range ? lecturaOk({ item: item, desde: range.desde, hasta: range.hasta }) : false };
  audioCtx();
  try { history.pushState({ plenaReader: 1 }, '', location.href); RD.pushed = true; } catch (e) { }
  var P = lsJSON(KEY_POS, {}); P[item] = { p: page, t: Date.now() }; ls(KEY_POS, JSON.stringify(P));
  buildBook(page);
  if (el.requestFullscreen && !document.fullscreenElement && window.innerWidth >= 720) { try { el.requestFullscreen().catch(function () { }); } catch (e) { } }
  var idleT; function wake() { if (!RD) return; el.classList.remove('idle'); clearTimeout(idleT); idleT = setTimeout(function () { if (RD && !$('#rThumbs.on', el)) el.classList.add('idle'); }, 2800); }
  el.addEventListener('pointermove', wake); el.addEventListener('pointerdown', wake); wake();
  $('#rRange', el).addEventListener('change', function () { goPage(+this.value); });
  setTimeout(function () { var c = $('[data-r=close]', el); if (c) c.focus(); }, 50);
}
function pageSize() {
  var W = window.innerWidth, H = window.innerHeight, ratio = RD.a.w ? RD.a.w / RD.a.h : 1000 / 1413;
  var land = W >= 720 && W / H > 1.05, pw, ph;
  if (land) { ph = H - 20; pw = ph * ratio; if (pw * 2 > W - 130) { pw = (W - 130) / 2; ph = pw / ratio; } }
  else { var avail = H - 150; pw = W - 12; ph = pw / ratio; if (ph > avail) { ph = avail; pw = ph * ratio; } }
  return { pw: Math.floor(pw), ph: Math.floor(ph), land: land };
}
/* Nota: PageFlip.destroy() elimina el contenedor; por eso se crea uno nuevo cada vez (antes esto dejaba el libro en blanco al entrar en pantalla completa). */
function buildBook(page) {
  var a = RD.a, stage = $('.rstage', RD.el);
  if (RD.pf) { try { RD.pf.destroy(); } catch (e) { } RD.pf = null; }
  var old = $('#bk', RD.el); if (old) old.remove();
  var bk = document.createElement('div'); bk.className = 'bk'; bk.id = 'bk'; stage.insertBefore(bk, $('.rnav.n', stage));
  var s = pageSize(); RD.land = s.land; RD.size = s;
  bk.style.width = (s.land ? s.pw * 2 : s.pw) + 'px'; bk.style.height = s.ph + 'px';
  var pages = [];
  for (var i = 1; i <= a.n; i++) {
    var d = document.createElement('div'); d.className = 'pg'; d.setAttribute('data-density', (i === 1 || i === a.n) ? 'hard' : 'soft');
    d.innerHTML = '<span class="sk">Página ' + i + '</span><img class="th" alt="" data-src="' + a.dir + 't' + pad3(i) + '.webp" draggable="false"><img class="full" alt="Página ' + i + '" data-src="' + a.dir + 'p' + pad3(i) + '.webp" draggable="false"' + (Math.abs(i - page) <= 2 ? ' fetchpriority="high"' : '') + '>';
    pages.push(d);
  }
  RD.pages = null; RD.simple = null;
  if (!window.St || !St.PageFlip) {
    pages.forEach(function (p, i) { p.style.cssText = 'position:absolute;inset:0;display:' + (i === page - 1 ? 'block' : 'none'); bk.appendChild(p); });
    RD.simple = pages; onPage(page - 1); return;
  }
  try {
    var pf = new St.PageFlip(bk, { width: s.pw, height: s.ph, size: 'fixed', showCover: true, usePortrait: true, startPage: page - 1, maxShadowOpacity: .4, flippingTime: 750, mobileScrollSupport: false, drawShadow: true, autoSize: false, showPageCorners: true, swipeDistance: 24 });
    pf.loadFromHTML(pages);
    pf.on('flip', function (e) { onPage(e.data); });
    pf.on('changeState', function (e) { if (e.data === 'flipping' || e.data === 'user_fold') { if (!RD.snd || Date.now() - RD.snd > 450) { RD.snd = Date.now(); tone('page'); } } });
    RD.pf = pf; RD.pages = pages;
    loadAround(page - 1); onPage(page - 1);
  } catch (e) {
    bk.innerHTML = ''; pages.forEach(function (p, i) { p.style.cssText = 'position:absolute;inset:0;display:' + (i === page - 1 ? 'block' : 'none'); bk.appendChild(p); });
    RD.simple = pages; onPage(page - 1);
  }
}
/* Carga rápida: miniatura al instante (borrosa) y la página nítida encima; las siguientes se precargan */
function loadAround(idx) {
  var ps = RD.pages || RD.simple; if (!ps) return;
  for (var i = idx - 4; i <= idx + 10; i++) { var p = ps[i]; if (!p) continue; var th = p.querySelector('img.th'); if (th && !th.getAttribute('src')) th.src = th.dataset.src; }
  for (var j = idx - 2; j <= idx + 5; j++) { var q = ps[j]; if (!q) continue; var im = q.querySelector('img.full'); if (im && !im.getAttribute('src')) { im.onload = function () { this.classList.add('ld'); }; im.decoding = 'async'; im.src = im.dataset.src; } }
  clearTimeout(RD.pre); RD.pre = setTimeout(function () { if (!RD) return; for (var k = idx + 6; k <= idx + 12; k++) { var x = ps[k]; if (!x) continue; var f = x.querySelector('img.full'); if (f && !f.dataset.pre) { f.dataset.pre = 1; var pi = new Image(); pi.src = f.dataset.src; } } }, 700);
}
function visible(idx) {
  var n = RD.a.n;
  if (!RD.pf || !RD.land) return [idx];
  if (idx === 0) return [0];
  var l = idx % 2 ? idx : idx - 1; return [l, l + 1].filter(function (x) { return x < n; });
}
var PAGE_DWELL = 5000;
function onPage(idx, opts) {
  if (!RD) return;
  RD.idx = idx; if (!opts || !opts.commit) loadAround(idx);
  var vis = visible(idx), a = RD.a, item = RD.item, nuevas = 0;
  var s = prog.read[item] || ''; while (s.length < a.n) s += '0';
  var before = snapshot();
  // una página cuenta como leída solo si se queda ~5 s en pantalla (pasar hojas rápido no suma XP)
  clearTimeout(RD.dw);
  if (!opts || !opts.commit) { RD.dw = setTimeout(function () { if (RD && RD.idx === idx) onPage(idx, { commit: true }); }, PAGE_DWELL); }
  else vis.forEach(function (i) { if (s[i] !== '1') { s = s.slice(0, i) + '1' + s.slice(i + 1); nuevas++; } });
  if (nuevas) { prog.read[item] = s; markDay(8); hoyPag(nuevas); }
  var first = vis[0] + 1, last = vis[vis.length - 1] + 1;
  $('#rPg', RD.el).textContent = (first === last ? 'Página ' + first : 'Páginas ' + first + '–' + last) + ' de ' + a.n;
  var rr = $('#rRange', RD.el); if (rr) rr.value = first;
  var P = lsJSON(KEY_POS, {}); P[item] = { p: first, t: Date.now() }; ls(KEY_POS, JSON.stringify(P));
  if (RD.range) {
    var r = RD.range, tot = r.hasta - r.desde + 1, vis2 = 0; for (var p = r.desde; p <= r.hasta; p++) if (s[p - 1] === '1') vis2++;
    var g = $('#rGoal', RD.el);
    if (g) g.innerHTML = ic('libro', 16) + ' Lectura de la lección: págs. ' + r.desde + (r.hasta > r.desde ? '–' + r.hasta : '') + ' <span class="xbar"><i style="width:' + Math.round(vis2 / tot * 100) + '%"></i></span> ' + (vis2 === tot ? '✓ ¡Completada!' : vis2 + '/' + tot);
    if (vis2 === tot && !RD.rangeDone) { RD.rangeDone = true; setTimeout(function () { toast(r.lid && prog.done[r.lid] ? '¡Lectura completada! +' + XP.lectura + ' XP' : '¡Lectura completada! Suma +' + XP.lectura + ' XP al completar su lección.'); confetti(50); }, 400); }
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
window.addEventListener('resize', function () {
  if (TOURI >= 0) placeTour();
  if (!RD || $('.zoom', RD.el)) return; clearTimeout(window._rz);
  window._rz = setTimeout(function () { if (!RD) return; var s = pageSize(), o = RD.size || {}; if (s.land === o.land && Math.abs(s.pw - o.pw) < 24 && Math.abs(s.ph - o.ph) < 24) return; buildBook((RD.idx || 0) + 1); }, 300);
});
document.addEventListener('keydown', function (e) {
  if (TOURI >= 0 && e.key === 'Escape') { endTour(false); return; }
  if (!RD) { if (e.key === 'Escape') { var c = $('.cel') || $('.modal'); if (c) { c.remove(); if (!$('.cel')) nextCel(); } } return; }
  if (e.key === 'Escape') { var z = $('.zoom', RD.el); if (z) z.remove(); else closeReader(); }
  else if (e.key === 'ArrowRight') { if (RD.pf) RD.pf.flipNext(); else goPage((RD.idx || 0) + 2); }
  else if (e.key === 'ArrowLeft') { if (RD.pf) RD.pf.flipPrev(); else goPage(RD.idx || 0); }
});

/* =========================================================
   Recorrido guiado, guía rápida y avisos de cada sección
   ========================================================= */
var TOUR = [
  { r: 'inicio', s: '.hcard', t: 'Este es tu inicio', d: 'Cada día empieza aquí: tu saludo, tu nivel y el botón para continuar donde lo dejaste.' },
  { r: 'inicio', s: '#nextStep', t: 'Tu siguiente paso', d: 'PLENA siempre te dice qué lección toca. Con un paso al día es suficiente.' },
  { r: 'inicio', s: '#misiones', t: 'Misiones de hoy', d: 'Cuatro misiones pequeñas: una lección, un video, 5 páginas y tu diario. Si cumples las cuatro, ganas el día perfecto.' },
  { s: '[data-v=cursos]', t: 'Cursos', d: 'Tus 10 módulos (introducción, lecciones, videos, lecturas y cierre con insignia) y, más abajo, 10 cursos de práctica en video. Lo que terminas queda con ✓.' },
  { s: '[data-v=ruta]', t: 'Mi ruta', d: 'Tu mapa personal: cada bolita es un módulo con su progreso y su insignia, el camino se pinta mientras avanzas y al final está tu graduación.' },
  { s: '[data-v=biblioteca]', t: 'Biblioteca', d: 'Tus 13 libros. Se abren a pantalla completa y pasas las hojas como en un libro de verdad.' },
  { s: '[data-v=diario]', t: 'Mi diario', d: 'Tu app integrada: registra tu día en dos minutos, mira tu progreso y descarga tu informe en PDF para la consulta.' },
  { s: '#me .xpchip', t: 'Tus logros', d: 'Tu nivel, tu XP y tu racha. Hay 15 niveles y 50 insignias en cuatro dificultades: fácil, media, difícil y legendaria.' },
  { s: '#helpBtn', t: '¿Dudas? Aquí estoy', d: 'Este botón abre la guía rápida y te deja repetir este recorrido cuando quieras.' }
];
function VIDS_N_TXT() { return '132 clases de fuerza, taichi, pilates, cardio, meditación, podcast y audiolibros.'; }
var TOURI = -1;
/* El recorrido espera a que no haya celebraciones abiertas ni en cola (primero la insignia, después el recorrido) */
function startTourWhenFree(delay) {
  setTimeout(function wait() { if ($('.cel') || CELQ.length || $('.ov')) { setTimeout(wait, 400); return; } if (ls(KEY_TOUR) !== 'hecho' && TOURI < 0) startTour(); }, delay || 900);
}
function startTour() {
  closeModal();
  if (parse().v !== 'inicio') { location.hash = '#inicio'; setTimeout(function () { TOURI = 0; showTour(); }, 500); return; }
  TOURI = 0; tone('magic'); showTour();
}
function tourEl(st) { return $$(st.s).filter(function (e) { var r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; })[0]; }
function showTour() {
  var st = TOUR[TOURI]; if (!st) return endTour(true);
  var el = tourEl(st); if (!el) { TOURI++; return showTour(); }
  var ov = $('.tour'); if (!ov) { ov = document.createElement('div'); ov.className = 'tour'; ov.innerHTML = '<div class="tspot"></div><div class="tbox lg" role="dialog" aria-live="polite"></div>'; document.body.appendChild(ov); }
  var fixed = !!el.closest('header.top,nav.bottom');
  if (!fixed) el.scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' });
  $('.tbox', ov).innerHTML = '<span class="kick">Paso ' + (TOURI + 1) + ' de ' + TOUR.length + '</span><h3>' + esc(st.t) + '</h3><p>' + esc(st.d) + '</p><div class="tdots">' + TOUR.map(function (x, i) { return '<i class="' + (i <= TOURI ? 'on' : '') + '"></i>'; }).join('') + '</div><div class="row"><button class="lnk" data-act="tourSkip">Saltar</button><span style="flex:1"></span>' + (TOURI ? '<button class="btn btn-g btn-s" data-act="tourPrev">Atrás</button>' : '') + '<button class="btn btn-p btn-s" data-act="tourNext">' + (TOURI === TOUR.length - 1 ? '¡Listo!' : 'Siguiente') + '</button></div>';
  setTimeout(placeTour, fixed ? 30 : 420);
}
function placeTour() {
  var st = TOUR[TOURI], ov = $('.tour'); if (!st || !ov) return;
  var el = tourEl(st); if (!el) return;
  var r = el.getBoundingClientRect(), pad = 8, sp = $('.tspot', ov), bx = $('.tbox', ov);
  sp.style.left = (r.left - pad) + 'px'; sp.style.top = (r.top - pad) + 'px'; sp.style.width = (r.width + pad * 2) + 'px'; sp.style.height = (r.height + pad * 2) + 'px';
  var bw = Math.min(360, innerWidth - 24), bh = bx.offsetHeight || 200, below = r.bottom + 16 + bh < innerHeight, top = below ? r.bottom + 16 : Math.max(12, r.top - bh - 16);
  if (!below && r.top - bh - 16 < 12) top = Math.min(innerHeight - bh - 12, r.bottom + 16);
  var left = Math.min(Math.max(12, r.left + r.width / 2 - bw / 2), innerWidth - bw - 12);
  bx.style.width = bw + 'px'; bx.style.left = left + 'px'; bx.style.top = top + 'px';
}
function endTour(done) {
  var ov = $('.tour'); if (ov) ov.remove(); TOURI = -1;
  if (ls(KEY_TOUR) !== 'hecho') { var b = snapshot(); ls(KEY_TOUR, 'hecho'); afterAward(b, null); saveProg(true); }
  if (done) { tone('done'); toast('¡Listo! Si te pierdes, el botón ? te lo vuelve a mostrar.'); }
}
function closeModal() { var m = $('.modal'); if (m) m.remove(); }
function openGuide() {
  closeModal(); var S = stats();
  var d = document.createElement('div'); d.className = 'modal'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true');
  var sec = [['inicio', 'Inicio', 'Tu resumen del día: siguiente lección, misiones, tu ruta y tus próximos logros.'], ['cursos', 'Cursos', '10 módulos. Cada uno: introducción, lecciones (texto, ideas esenciales, video, lecturas, mito, pregunta y tarea), videos, lecturas y cierre con insignia. Lo terminado queda con ✓.'], ['bandera', 'Mi ruta', 'Tu mapa personal: cada bolita es un módulo con su progreso y su insignia; al final, tu graduación.'], ['play', 'Cursos de práctica', 'Dentro de Cursos: 10 cursos en video. Un video cuenta como completado al ver el 60 % (o 8 minutos), o al pulsar ✓.'], ['libro', 'Biblioteca', 'Tus 13 libros a pantalla completa: pasa las hojas, usa miniaturas y lupa, y descarga el PDF.'], ['tel', 'Mi diario', 'La app completa: registra tu día, sigue el plan de 30 días y descarga tu informe en PDF para la consulta.'], ['trofeo', 'Logros', '15 niveles y ' + badges().length + ' insignias en cuatro dificultades. Tus XP vienen de todo lo que haces.']];
  d.innerHTML = '<div class="box lg guide"><button class="x" data-act="cerrarModal" aria-label="Cerrar">' + ic('x', 20) + '</button><span class="kick">Guía rápida</span><h2>Cómo funciona <span class="plena sm">Plena</span></h2>' +
    '<div class="gsec">' + sec.map(function (x) { return '<div><span class="obic">' + ic(x[0], 18) + '</span><b>' + x[1] + '</b><p>' + x[2] + '</p></div>'; }).join('') + '</div>' +
    '<h3>Cuánto suma cada cosa</h3><table class="xpt"><tr><td>Lección completada</td><td>' + XP.leccion + ' XP</td></tr><tr><td>Tarea hecha</td><td>' + XP.tarea + ' XP</td></tr><tr><td>Pregunta acertada a la primera / intento</td><td>' + XP.quizOk + ' / ' + XP.quizNo + ' XP</td></tr><tr><td>Mito descubierto</td><td>' + XP.mito + ' XP</td></tr><tr><td>Lectura de lección completa</td><td>' + XP.lectura + ' XP</td></tr><tr><td>Página nueva leída</td><td>' + XP.pagina + ' XP</td></tr><tr><td>Video completado</td><td>' + XP.video + ' XP</td></tr><tr><td>Módulo completado</td><td>' + XP.modulo + ' XP</td></tr><tr><td>Día registrado en tu diario</td><td>' + XP.diario + ' XP</td></tr><tr><td>Día perfecto (4 misiones)</td><td>' + XP.perfecto + ' XP</td></tr></table>' +
    '<h3>Dificultades</h3><p class="tiersline"><span class="tier t1">Fácil</span> para empezar · <span class="tier t2">Media</span> piden constancia · <span class="tier t3">Difícil</span> para las más comprometidas · <span class="tier t4">Legendaria</span> solo para leyendas.</p>' +
    '<div class="row" style="margin-top:14px"><button class="btn btn-p" data-act="tour">' + ic('bandera', 16) + ' Repetir el recorrido</button><button class="btn btn-g" data-act="cerrarModal">Cerrar</button></div></div>';
  document.body.appendChild(d);
}

/* =========================================================
   Render y rutas
   ========================================================= */
function parse() { var h = location.hash.replace(/^#/, ''); var p = h.split('/'); return { v: p[0] || 'inicio', a: p[1] || '', b: p[2] || '' }; }
function avaHTML(cls, href) {
  var ini = esc((nombre() || 'P').charAt(0).toUpperCase()), f = CUENTA && CUENTA.foto;
  var inner = f ? '<img src="' + esc(f) + '" alt="" referrerpolicy="no-referrer">' : ini;
  return href ? '<a class="' + cls + (f ? ' ph' : '') + '" href="' + href + '" aria-label="Mi perfil">' + inner + '</a>' : '<span class="' + cls + (f ? ' ph' : '') + '">' + inner + '</span>';
}
function paintMe() {
  var me = $('#me'); if (!me) return; if (!C || !perfil) { me.innerHTML = ''; return; }
  var S = stats(), tk = TIER[S.tier].k;
  me.innerHTML = '<button class="hbtn" id="helpBtn" data-act="guia" aria-label="Ayuda y guía rápida">' + ic('ayuda', 20) + '</button><a class="xpchip lg ' + tk + '" href="#logros" aria-label="Mis logros: nivel ' + S.lv + ', ' + S.xp + ' XP"><span class="lv">' + S.lv + '</span><span class="tx">' + S.xp + ' XP</span><span class="fl">' + ic('llama', 15) + S.streak.cur + '</span></a>' + avaHTML('ava', '#perfil');
}
var lastRoute = '';
function render(keepScroll) {
  var main = $('#main'); if (!C) return;
  document.body.classList.toggle('no-nav', !perfil);
  if (!perfil) { main.innerHTML = vOnboarding(); bindForms(); setNav(''); paintMe(); document.body.classList.remove('is-diario'); return; }
  var r = parse(), h, route = r.v + '/' + r.a + '/' + r.b;
  if (r.v === 'v' && VBY[r.a]) { location.replace(vHref(VBY[r.a])); return; }
  if (r.v === 'videos') { location.replace('#cursos'); return; }
  destroyPlayers();
  if (r.v === 'cursos') h = vCursos();
  else if (r.v === 'm') h = vRoom(r.a, 'intro');
  else if (r.v === 'l') h = vRoom(r.a, 'leccion', r.b);
  else if (r.v === 'mv') h = vRoom(r.a, 'video', r.b);
  else if (r.v === 'mc') h = vRoom(r.a, 'cierre');
  else if (r.v === 'ruta') h = vRuta();
  else if (r.v === 'vc') h = vCatRoom(r.a, r.b);
  else if (r.v === 'biblioteca') h = vBiblioteca();
  else if (r.v === 'diario') h = vDiario(r.a);
  else if (r.v === 'logros') h = vLogros();
  else if (r.v === 'perfil') h = vPerfil();
  else if (r.v === 'certificado') h = vCert();
  else h = vInicio();
  var y = window.scrollY;
  main.innerHTML = '<div class="view">' + h + (r.v === 'diario' ? '' : '<footer class="f"><div class="wrap"><span class="plena sm">Plena</span><span>Academia de Menopausia y Psicomenopausia · © 2026 DisierTECH</span><span class="muted">' + esc(C.aviso) + ' · <a href="/privacidad.html">Privacidad</a> · <button class="lnk" data-act="guia">Guía rápida</button></span></div></footer>') + '</div>';
  var nav = { m: 'cursos', l: 'cursos', mv: 'cursos', mc: 'cursos', vc: 'cursos', certificado: '', perfil: '' };
  setNav(r.v in nav ? nav[r.v] : r.v);
  document.body.classList.toggle('is-diario', r.v === 'diario');
  bindForms(); reveal(); paintMe();
  if (keepScroll && route === lastRoute) window.scrollTo(0, y);
  else if (route !== lastRoute) window.scrollTo(0, 0);
  lastRoute = route;
  setTimeout(function () { $$('.ring .fg').forEach(function (c) { c.style.strokeDashoffset = c.dataset.off; }); }, 90);
  var f = $('#appf'); if (f) f.addEventListener('load', function () { var l = $('.appframe .ld'); if (l) l.remove(); });
  var vq = $('#vq'); if (vq) vq.addEventListener('input', vSearch);
  document.title = ({ l: 'Lección', m: 'Módulo', mv: 'Video', mc: 'Cierre del módulo', cursos: 'Cursos', ruta: 'Mi ruta', biblioteca: 'Biblioteca', diario: 'Mi diario', logros: 'Logros', perfil: 'Perfil', certificado: 'Certificado', vc: 'Práctica en video' }[r.v] || 'Inicio') + ' · PLENA';
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
      if (step === 1) { tone('step'); obDraft.nombre = nmI.value.trim().slice(0, 40); obStep = 2; render(); return; }
      if (step === 2) { if (!et) { tone('tap'); return fail('Elige tu etapa (si no lo sabes, marca «No lo tengo claro»).'); } tone('step'); obDraft.etapa = et; obStep = 3; render(); return; }
      if (!ob.length) { tone('tap'); return fail('Elige al menos una cosa.'); } if (ob.length > 3) return fail('Elige como máximo 3.');
      tone('magic');
      var before = snapshot();
      perfil = { nombre: obDraft.nombre || '', etapa: obDraft.etapa, objetivos: ob, at: Date.now() }; savePerfil();
      if (perfil.nombre && !ls('me.name')) ls('me.name', perfil.nombre);
      markDay(8); saveProg(true);
      $('#main').innerHTML = vMagic(); var msgs = ['Ordenando los módulos según lo que más te pesa', 'Eligiendo tus primeras lecturas y videos', 'Preparando tus misiones de hoy', '¡Lista! Ahora te enseño dónde está todo'], k = 0;
      var tm = setInterval(function () { k++; var el = $('#mgT'); if (el && msgs[k]) el.textContent = msgs[k]; }, 700);
      var tk2 = setInterval(function () { tone('tap'); }, 700);
      setTimeout(function () { clearInterval(tm); clearInterval(tk2); location.hash = '#inicio'; render(); tone('done'); confetti(100); afterAward(before, null); if (ls(KEY_TOUR) !== 'hecho') startTourWhenFree(1400); }, 2900);
      return;
    }
    if (!et) return fail('Elige tu etapa.'); if (!ob.length) return fail('Elige al menos una cosa.'); if (ob.length > 3) return fail('Elige como máximo 3.');
    perfil = { nombre: nmI.value.trim().slice(0, 40), etapa: et, objetivos: ob, at: perfil ? perfil.at : Date.now() }; savePerfil();
    toast('Listo: tu ruta se actualizó.'); location.hash = '#cursos';
  });
  $$('input[name=obj]').forEach(function (i) { i.addEventListener('change', function () { if ($$('input[name=obj]:checked').length > 3) { i.checked = false; toast('Elige como máximo 3.'); } else tone('tap'); }); });
  $$('input[name=etapa]').forEach(function (i) { i.addEventListener('change', function () { tone('tap'); }); });
  bindCuenta();
}
/* ---------- cuenta: iniciar sesión, recuperar, nueva contraseña, cambiarla, borrar la cuenta, foto ---------- */
function formErr(id, m) { var e = $(id); if (!e) return; e.textContent = m || ''; e.hidden = !m; }
function busy(form, on, txt) { var b = form.querySelector('button[type=submit],button:not([type])'); if (!b) return; if (on) { b.dataset.t = b.textContent; b.textContent = txt || 'Un momento…'; } else if (b.dataset.t) b.textContent = b.dataset.t; b.disabled = !!on; }
function meter(inp, box) {
  if (!inp || !box) return;
  inp.addEventListener('input', function () { var f = PC.fuerza(inp.value); box.className = 'meter n' + f.n; $$('i', box).forEach(function (x, j) { x.className = inp.value && j < Math.max(1, f.n) ? 'on' : ''; }); $('span', box).textContent = inp.value.length < 8 ? 'Mínimo 8 caracteres' : f.t; });
}
function nuevaOk(p, r, errId) {
  if (p.length < 8) { formErr(errId, 'La contraseña debe tener al menos 8 caracteres.'); return false; }
  if (PC.fuerza(p).n < 1) { formErr(errId, 'Esa contraseña es muy fácil de adivinar. Usa letras y números.'); return false; }
  if (p !== r) { formErr(errId, 'Las dos contraseñas no coinciden.'); return false; }
  return true;
}
function bindCuenta() {
  var lg = $('#lgF');
  if (lg) lg.addEventListener('submit', function (e) {
    e.preventDefault(); formErr('#lgErr');
    var em = $('#lgE').value.trim(), pw = $('#lgP').value;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return formErr('#lgErr', 'Escribe tu correo completo.');
    if (!pw) return formErr('#lgErr', 'Escribe tu contraseña.');
    busy(lg, true, 'Entrando…');
    PC.login(em, pw, $('#lgR').checked).then(function (r) { if (!r.ok) { busy(lg, false); formErr('#lgErr', r.error); tone('tap'); return; } location.hash = '#inicio'; boot(); });
  });
  var rc = $('#rcF');
  if (rc) rc.addEventListener('submit', function (e) {
    e.preventDefault(); formErr('#rcErr'); var em = $('#rcE').value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return formErr('#rcErr', 'Escribe tu correo completo.');
    busy(rc, true, 'Enviando…');
    PC.recuperar(em).then(function (r) { busy(rc, false); if (!r.ok) return formErr('#rcErr', r.error); var ok = $('#rcOk'); ok.textContent = 'Listo. Si ese correo tiene una cuenta, te llegará en unos minutos un enlace para crear tu nueva contraseña. Revisa también la carpeta de spam o promociones.'; ok.hidden = false; });
  });
  var nc = $('#ncF'); meter($('#ncP'), $('#ncM'));
  if (nc) nc.addEventListener('submit', function (e) {
    e.preventDefault(); formErr('#ncErr'); var p = $('#ncP').value;
    if (!nuevaOk(p, $('#ncR').value, '#ncErr')) return;
    busy(nc, true, 'Guardando…');
    PC.nuevaClave(p).then(function (r) {
      if (!r.ok) { busy(nc, false); return formErr('#ncErr', r.error); }
      location.hash = '#inicio'; boot(r.reemplazo ? 'Tu nueva contraseña está lista. Como tu diario se protege con tu contraseña, la copia guardada en la nube se reemplazó con los registros de este dispositivo. Los registros que solo estaban en otros dispositivos se volverán a guardar cuando entres en ellos con tu nueva contraseña.' : 'Tu nueva contraseña está lista. Cerramos la sesión en tus otros dispositivos.');
    });
  });
  var cp = $('#cpF'); meter($('#cpN'), $('#cpM'));
  if (cp) cp.addEventListener('submit', function (e) {
    e.preventDefault(); formErr('#cpErr'); var a = $('#cpA').value, p = $('#cpN').value;
    if (!a) return formErr('#cpErr', 'Escribe tu contraseña actual.');
    if (!nuevaOk(p, $('#cpR').value, '#cpErr')) return;
    busy(cp, true, 'Guardando…');
    PC.cambiarClave(a, p).then(function (r) { busy(cp, false); if (!r.ok) return formErr('#cpErr', r.error); cp.reset(); cp.closest('details').open = false; toast('Contraseña cambiada. Cerramos la sesión en tus otros dispositivos.'); });
  });
  var dl = $('#dlF');
  if (dl) dl.addEventListener('submit', function (e) {
    e.preventDefault(); formErr('#dlErr'); var pw = $('#dlP').value;
    if (!pw) return formErr('#dlErr', 'Escribe tu contraseña.');
    if (!confirm('¿Borrar tu cuenta y todos tus datos para siempre? No se puede deshacer.')) return;
    busy(dl, true, 'Borrando…');
    api('/api/cuenta', { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password: pw }) }).then(function (x) {
      if (!x.ok) { busy(dl, false); return formErr('#dlErr', (x.d && x.d.error) || 'No se pudo borrar tu cuenta.'); }
      borrarLocal(); PC.salir().then(function () { $('#main').innerHTML = authBox('<span class="kick">Cuenta borrada</span><h1>Hasta pronto</h1><p>Tu cuenta y todos tus datos se borraron. Gracias por haber sido parte de PLENA.</p><a class="btn btn-p" href="/oferta/">Ir al inicio</a>'); document.body.classList.add('no-nav'); paintMe(); });
    });
  });
  var cd = $('#cdF');
  if (cd) cd.addEventListener('submit', function (e) {
    e.preventDefault(); formErr('#cdErr'); busy(cd, true, 'Abriendo…');
    PC.abrirDiario($('#cdP').value).then(function (r) { if (!r.ok) { busy(cd, false); return formErr('#cdErr', r.error); } CLAVE_OK = true; render(); });
  });
  var fi = $('#fIn');
  if (fi) fi.addEventListener('change', function () { var f = fi.files && fi.files[0]; fi.value = ''; if (f) prepFoto(f); });
}
/* Foto: recorte cuadrado al centro y compresión a 512×512 WebP en el navegador, antes de subirla. */
var FOTO = null;
function prepFoto(file) {
  formErr('#fErr');
  if (!/^image\//.test(file.type)) return formErr('#fErr', 'Elige una foto (JPG, PNG o WebP).');
  if (file.size > 20 * 1024 * 1024) return formErr('#fErr', 'Esa foto es demasiado grande. Elige otra.');
  var url = URL.createObjectURL(file), im = new Image();
  im.onload = function () {
    var s = Math.min(im.naturalWidth, im.naturalHeight), c = document.createElement('canvas'); c.width = c.height = 512;
    var g = c.getContext('2d'); g.imageSmoothingQuality = 'high';
    g.drawImage(im, (im.naturalWidth - s) / 2, (im.naturalHeight - s) / 2, s, s, 0, 0, 512, 512);
    URL.revokeObjectURL(url);
    var done = function (b) {
      if (!b) return formErr('#fErr', 'No pudimos preparar esa foto. Prueba con otra.');
      if (b.size > 2 * 1024 * 1024) return formErr('#fErr', 'La foto sigue pesando más de 2 MB. Prueba con otra.');
      FOTO = b; $('#fPrev').innerHTML = '<img src="' + URL.createObjectURL(b) + '" alt="Vista previa de tu foto">'; $('#fNueva').hidden = false;
    };
    c.toBlob(function (b) { if (b && b.type === 'image/webp') done(b); else c.toBlob(done, 'image/jpeg', .86); }, 'image/webp', .86);
  };
  im.onerror = function () { URL.revokeObjectURL(url); formErr('#fErr', 'No pudimos abrir esa foto. Prueba con otra (JPG, PNG o WebP).'); };
  im.src = url;
}
function borrarLocal() { ['plena.perfil', 'plena.prog', 'plena.vistas', 'plena.pos', 'plena.hoy', 'plena.vpos', 'plena.tips', 'plena.tour', 'plena.nuevas', 'plena.uid', 'me.data.v2', 'me.lastSync', 'me.cloud', 'me.onboarded', 'me.name', 'me.pack'].forEach(function (k) { ls(k, null); }); }
/* «Descargar mis datos»: un archivo con tu cuenta, tu bienvenida, tu progreso y tu diario (descifrado aquí, en tu dispositivo). */
function misDatos(btn) {
  btn.disabled = true;
  var out = { generado: new Date().toISOString(), aviso: 'Copia de tus datos de PLENA. Guárdala en un lugar seguro: incluye datos de salud.' };
  Promise.all([api('/api/cuenta'), api('/api/progreso'), api('/api/sync')]).then(function (r) {
    var c = r[0].d || {};
    out.cuenta = { nombre: c.nombre, correo: c.email, creada: c.creado, pack_completo: c.pack, foto: c.foto ? 'sí (descárgala desde tu perfil)' : 'no' };
    out.bienvenida = perfil || null;
    var pr = Object.assign({}, (r[1].d && r[1].d.progreso) || prog); delete pr.pf; out.progreso = pr;
    var loc = lsJSON('me.data.v2', null), rem = r[2].d && r[2].d.data;
    if (loc && loc.days && Object.keys(loc.days).length) { out.diario = loc; return; }
    if (rem) return PC.abrir(rem).then(function (d) { out.diario = d; }, function () { out.diario = 'No se pudo descifrar la copia de la nube en este dispositivo.'; });
    out.diario = null;
  }).then(function () {
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' }));
    a.download = 'mis-datos-plena-' + dk() + '.json'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    toast('Tus datos se descargaron.');
  }).catch(function () { toast('No se pudieron descargar ahora. Revisa tu conexión.'); }).then(function () { btn.disabled = false; });
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
  if (a === 'leer') { e.preventDefault(); openReader(b.dataset.item, +b.dataset.p || 1, b.dataset.h ? { desde: +b.dataset.p, hasta: +b.dataset.h, lid: b.dataset.lid } : null); return; }
  if (a === 'play') { e.preventDefault(); mountPlayer(b.parentNode, b.dataset.vid); return; }
  if (a === 'visto') {
    var vi = b.dataset.vid; if (prog.vid[vi]) { toast('Este video ya está completado.'); return; }
    var vp = lsJSON(KEY_VPOS, {})[vi] || {}, need = vp.d ? Math.min(vp.d * 0.5, 300) : 300;
    if ((vp.w || 0) < need) { toast('Para marcarlo, mira al menos ' + (vp.d ? 'la mitad del video' : 'unos minutos del video') + '. Se marca sola cuando llegas.'); return; }
    markWatched(vi, b); return;
  }
  if (a === 'done') {
    if (!prog.done[id]) {
      if (!(id in prog.quiz)) { toast('Antes de completarla, responde la pregunta rápida.'); var qz = $('.rblock.quiz'); if (qz) qz.scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' }); return; }
      var falta = Math.ceil((LESS_MIN - (Date.now() - (LESS_T[id] || Date.now()))) / 1000);
      if (falta > 0) { toast('Tómate un momento con la lección: lee lo esencial y haz tu tarea. Podrás completarla en ' + falta + ' s.'); return; }
    }
    if (prog.done[id]) { delete prog.done[id]; saveProg(true); toast('Lección marcada como pendiente.'); render(true); return; }
    award(b, function () { prog.done[id] = Date.now(); markDay(1); });
    confetti(); var t = totalPct(); toast(t.p === 100 ? '¡Completaste todo el curso! Tu certificado te espera.' : '¡Bien hecho! La lección queda con ✓ en la lista.');
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
  if (a === 'vf') { $$('.vfilt button').forEach(function (x) { x.classList.toggle('on', x === b); }); return; }
  if (a === 'cerrarCel') { var c = b.closest('.cel'); if (c) c.remove(); setTimeout(nextCel, 250); return; }
  if (a === 'cerrarModal') { closeModal(); return; }
  if (a === 'tipOk') { var T = lsJSON(KEY_TIPS, {}); T[b.dataset.k] = 1; ls(KEY_TIPS, JSON.stringify(T)); var tp = b.closest('.tip'); if (tp) tp.remove(); return; }
  if (a === 'obNext') { tone('step'); obStep = 1; render(); return; }
  if (a === 'atras') { tone('tap'); obStep = Math.max(0, obStep - 1); render(); return; }
  if (a === 'tour') { startTour(); return; }
  if (a === 'tourNext') { TOURI++; if (TOURI >= TOUR.length) endTour(true); else { tone('step'); showTour(); } return; }
  if (a === 'tourPrev') { tone('tap'); TOURI = Math.max(0, TOURI - 1); showTour(); return; }
  if (a === 'tourSkip') { endTour(false); return; }
  if (a === 'guia') { openGuide(); return; }
  if (a === 'appGuia') { var fr = $('#appf'); try { fr.contentWindow.location.hash = 'guia'; } catch (x) { fr.src = '/?embed=1#guia'; } return; }
  if (a === 'sonido') { ls(KEY_SON, sonidoOn() ? '0' : '1'); render(true); return; }
  if (a === 'print') { window.print(); return; }
  if (a === 'salir') { if (!confirm('¿Cerrar sesión en este dispositivo? Tu progreso queda guardado en tu cuenta.')) return; PC.salir().then(function () { ls(KEY_PERFIL, null); ls(KEY_PROG, null); location.hash = ''; location.reload(); }); return; }
  if (a === 'authV') { AUTHV = b.dataset.v; tone('tap'); $('#main').innerHTML = vLogin(); bindForms(); var f1 = $('#main input'); if (f1) f1.focus(); return; }
  if (a === 'verPw') { var pi = document.getElementById(b.dataset.for), sh = pi.type === 'password'; pi.type = sh ? 'text' : 'password'; b.textContent = sh ? 'Ocultar' : 'Ver'; b.setAttribute('aria-label', sh ? 'Ocultar la contraseña' : 'Mostrar la contraseña'); return; }
  if (a === 'fotoCancelar') { FOTO = null; render(true); return; }
  if (a === 'fotoGuardar') {
    if (!FOTO) return; b.disabled = true; b.textContent = 'Subiendo…';
    api('/api/cuenta?foto=1', { method: 'PUT', headers: { 'content-type': FOTO.type }, body: FOTO }).then(function (x) {
      if (!x.ok) { b.disabled = false; b.textContent = 'Guardar foto'; return formErr('#fErr', (x.d && x.d.error) || 'No se pudo subir la foto.'); }
      FOTO = null; CUENTA.foto = x.d.foto; toast('¡Foto guardada!'); render(true);
    }); return;
  }
  if (a === 'fotoQuitar') { if (!confirm('¿Quitar tu foto?')) return; api('/api/cuenta?foto=1', { method: 'DELETE' }).then(function (x) { if (x.ok) { CUENTA.foto = ''; toast('Foto quitada.'); render(true); } else toast('No se pudo quitar ahora.'); }); return; }
  if (a === 'misDatos') { misDatos(b); return; }
});
document.addEventListener('click', function (e) { if (e.target.classList && e.target.classList.contains('modal')) closeModal(); });
window.addEventListener('hashchange', function () { if (RD) closeReader(true); if (TOURI >= 0) { var o = $('.tour'); if (o) o.remove(); TOURI = -1; } render(); });
window.addEventListener('scroll', function () { if (TOURI >= 0) placeTour(); }, { passive: true });
/* Celular: al abrirse el teclado, el campo que se está escribiendo queda a la vista. */
document.addEventListener('focusin', function (e) {
  var t = e.target; if (!t || !/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || innerWidth > 900) return;
  setTimeout(function () { var r = t.getBoundingClientRect(); if (r.top < 70 || r.bottom > innerHeight - 10) t.scrollIntoView({ block: 'center', behavior: 'auto' }); }, 250);
});
/* La app integrada escribe en este mismo dispositivo: PLENA se entera al momento. */
function onAppChange() {
  refreshApp(true);
  var d = $('#dkD'); if (d) { d.innerHTML = '<b>' + APP.days + '</b> días registrados'; var m = $('#dkM'); if (m && APP.today && !m.classList.contains('ok')) { m.classList.add('ok'); m.textContent = '✓ Misión de hoy cumplida'; toast('¡Día registrado! Misión cumplida.'); confetti(50); } }
}
window.addEventListener('storage', function (e) { if (e.key === 'me.data.v2') onAppChange(); });
window.addEventListener('message', function (e) {
  if (e.origin !== location.origin || !e.data) return;
  if (e.data.type === 'me:data') onAppChange();
  if (e.data.type === 'me:clave') { CLAVE_OK = false; if (parse().v === 'diario') render(); } // la clave del diario cambió en otro dispositivo
  if (e.data.type === 'me:sesion') boot();                                                    // la sesión terminó
});

/* =========================================================
   Arranque
   ========================================================= */
function authScreen(html) { var main = $('#main'); C = null; document.body.classList.add('no-nav'); document.body.classList.remove('is-diario'); main.innerHTML = html; setNav(''); paintMe(); bindForms(); }
function boot(aviso) {
  var main = $('#main');
  // Enlace antiguo con código de acceso: ahora sirve una sola vez para crear la cuenta de su pedido.
  var k = findAcc(location.hash + ' ' + location.search);
  if (k) { location.replace('/oferta/gracias.html?k=' + encodeURIComponent(k) + '#cuenta'); return; }
  if (!PC) { main.innerHTML = '<div class="ov"><div class="box lg obox" style="text-align:center"><h1>Actualiza la página</h1><button class="btn btn-p" onclick="location.reload()">Reintentar</button></div></div>'; return; }
  PC.config().then(function () {
    if (PC.recuperando()) { history.replaceState(null, '', location.pathname + '#nueva-clave'); authScreen(vNuevaClave()); return null; }
    return PC.sesion();
  }).then(function (ses) {
    if (ses === null && !PC.recuperando()) {
      if (/^#nueva-clave/.test(location.hash)) AUTHMSG = 'El enlace para crear tu nueva contraseña caducó o ya se usó. Pide uno nuevo con «¿Olvidaste tu contraseña?».';
      if (/error_code=otp_expired|error=access_denied/.test(location.hash)) { AUTHMSG = 'El enlace del correo caducó o ya se usó. Pide uno nuevo con «¿Olvidaste tu contraseña?».'; history.replaceState(null, '', location.pathname); }
      AUTHV = 'login'; authScreen(vLogin(AUTHMSG)); AUTHMSG = ''; return;
    }
    if (!ses) return;
    SES = null;
    try { var uid0 = localStorage.getItem('plena.uid'); if (uid0 !== ses.user.id) PC.prepararDispositivo(ses.user.id); } catch (e) { }
    return Promise.all([api('/api/curso'), api('/api/cuenta')]).then(function (r) {
      var x = r[0];
      if (!x.ok) {
        if (x.d && x.d.motivo === 'mejora') { CUENTA = r[1].d; document.body.classList.add('no-nav'); main.innerHTML = vMejora(); return; }
        if (x.status === 401 || x.status === 403) { return PC.salir().then(function () { authScreen(vLogin(x.d && x.d.error)); }); }
        throw new Error('curso');
      }
      SES = ses;
      CUENTA = r[1].ok ? r[1].d : { nombre: '', email: ses.user.email, foto: '' };
      C = x.d.curso; NOMBRE = x.d.nombre || '';
      (x.d.archivos || []).forEach(function (f) { ARCH[f.item] = { url: f.url, n: f.paginas || 0, dir: f.dir || '', w: 1000, h: 1413 }; });
      C.videos = x.d.videos || { categorias: [], videos: [], lecciones: {}, subcategorias: {} };
      VIDS = C.videos.videos || []; VBY = {}; VIDS.forEach(function (v) { VBY[v.id] = v; }); VCAT = {}; (C.videos.categorias || []).forEach(function (c) { VCAT[c.id] = c; }); VLEC = C.videos.lecciones || {};
      perfil = lsJSON(KEY_PERFIL, null); prog = normProg(lsJSON(KEY_PROG, {})); seen = lsJSON(KEY_SEEN, null);
      // Clave del diario: ¿está en este dispositivo y es la vigente?
      return PC.claveVigente(CUENTA.clave && CUENTA.clave.kid).then(function (okK) { CLAVE_OK = okK; return syncProg(true); }).then(function () {
        if (perfil && !perfil.nombre && NOMBRE) perfil.nombre = NOMBRE;
        APP = readApp(); if (APP.today) markDay(4);
        if (seen === null) markSeenSilently();
        var nuevas = earned().filter(function (id) { return seen.indexOf(id) < 0; });
        if (nuevas.length) { ls('plena.nuevas', JSON.stringify(nuevas)); seen = seen.concat(nuevas); ls(KEY_SEEN, JSON.stringify(seen)); }
        if (/^#nueva-clave/.test(location.hash)) location.hash = '#inicio';
        render();
        if (aviso) setTimeout(function () { openModalMsg('Contraseña actualizada', aviso); }, 400);
        if (perfil && ls(KEY_TOUR) !== 'hecho') startTourWhenFree(1200);
      });
    });
  }).catch(function (err) {
    if (window.console) console.error(err);
    var cfg = err && err.config;
    main.innerHTML = '<div class="ov"><div class="box lg obox" style="text-align:center"><h1>' + (cfg ? 'Estamos preparando tu acceso' : 'Sin conexión') + '</h1><p>' + (cfg ? 'Las cuentas de PLENA se están configurando. Vuelve a intentarlo en unos minutos.' : 'No pudimos cargar tu academia. Revisa tu internet e inténtalo de nuevo.') + '</p><button class="btn btn-p" onclick="location.reload()">Reintentar</button></div></div>';
  });
}
function openModalMsg(t, m) {
  var d = document.createElement('div'); d.className = 'modal';
  d.innerHTML = '<div class="box lg"><button class="x" data-act="cerrarModal" aria-label="Cerrar">' + ic('x', 20) + '</button><span class="kick">Aviso</span><h2>' + esc(t) + '</h2><p>' + esc(m) + '</p><button class="btn btn-p" data-act="cerrarModal">Entendido</button></div>';
  document.body.appendChild(d);
}
boot();
if ('serviceWorker' in navigator && location.protocol === 'https:') window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function () { }); });
})();
