/* PLENA · Academia de Menopausia y Psicomenopausia
   Plataforma privada (incluida en el pack completo). Usa el mismo código de acceso que la app.
   Contenido: /api/curso (se edita en contenido/curso.json). Progreso: /api/progreso + este dispositivo. */
(function () {
'use strict';

/* ---------- utilidades ---------- */
var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
function lsJSON(k, d) { try { return JSON.parse(ls(k) || '') || d; } catch (e) { return d; } }
function toast(m) { var t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(function () { t.hidden = true; }, 2800); }
function img(n) { return '/plena/img/' + n + '.webp'; }
function cover(n) { return '/oferta/img/' + n + '.webp'; }
var KEY_ACC = 'me.acc', KEY_PERFIL = 'plena.perfil', KEY_PROG = 'plena.prog';
function findAcc(t) { var m = String(t || '').toLowerCase().match(/[0-9a-f]{14}-[0-9a-f]{10}/); return m ? m[0] : ''; }

/* ---------- estado ---------- */
var access = (ls(KEY_ACC) || '').toLowerCase();
var C = null, ARCH = {}, NOMBRE = '';
var perfil = lsJSON(KEY_PERFIL, null);
var prog = lsJSON(KEY_PROG, { done: {}, last: '' });
if (!prog.done) prog.done = {};

function api(path, opts) {
  opts = opts || {}; opts.headers = Object.assign({ 'x-me-acc': access }, opts.headers || {});
  return fetch(path, opts).then(function (r) { return r.json().then(function (d) { return { ok: r.ok, status: r.status, d: d }; }); });
}

/* ---------- progreso (dispositivo + nube) ---------- */
function allLessons() { var out = []; C.modulos.forEach(function (m) { m.lecciones.forEach(function (l) { out.push({ m: m, l: l }); }); }); return out; }
function modPct(m) { var n = m.lecciones.length, d = m.lecciones.filter(function (l) { return prog.done[l.id]; }).length; return { n: n, d: d, p: n ? Math.round(d / n * 100) : 0 }; }
function totalPct() { var a = allLessons(), d = a.filter(function (x) { return prog.done[x.l.id]; }).length; return { n: a.length, d: d, p: a.length ? Math.round(d / a.length * 100) : 0 }; }
function saveProg(push) {
  ls(KEY_PROG, JSON.stringify(prog));
  if (push) { clearTimeout(saveProg.t); saveProg.t = setTimeout(function () { api('/api/progreso', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(prog) }).catch(function () {}); }, 600); }
}
function syncProg() {
  return api('/api/progreso').then(function (x) {
    if (!x.ok || !x.d.progreso) return;
    var r = x.d.progreso, changed = false, up = false;
    Object.keys(r.done || {}).forEach(function (k) { if (!prog.done[k]) { prog.done[k] = r.done[k]; changed = true; } });
    Object.keys(prog.done).forEach(function (k) { if (!(r.done || {})[k]) up = true; });
    if (!prog.last && r.last) { prog.last = r.last; changed = true; }
    if (changed || up) saveProg(up);
    if (changed) render();
  }).catch(function () {});
}

/* ---------- ruta personal ---------- */
function ruta() {
  var orden = ['m0', 'm1'];
  ((perfil && perfil.objetivos) || []).forEach(function (o) {
    var ob = C.objetivos.filter(function (x) { return x.id === o; })[0];
    if (ob && orden.indexOf(ob.modulo) < 0) orden.push(ob.modulo);
  });
  C.modulos.forEach(function (m) { if (orden.indexOf(m.id) < 0) orden.push(m.id); });
  return orden.map(function (id) { return C.modulos.filter(function (m) { return m.id === id; })[0]; }).filter(Boolean);
}
function paraTi(m) {
  return ((perfil && perfil.objetivos) || []).some(function (o) { var ob = C.objetivos.filter(function (x) { return x.id === o; })[0]; return ob && ob.modulo === m.id; });
}
function siguiente() {
  var r = ruta();
  if (prog.last) { var p = prog.last.split('/'); var mm = C.modulos.filter(function (m) { return m.id === p[0]; })[0]; var ll = mm && mm.lecciones.filter(function (l) { return l.id === p[1]; })[0]; if (ll && !prog.done[ll.id]) return { m: mm, l: ll }; }
  for (var i = 0; i < r.length; i++) for (var j = 0; j < r[i].lecciones.length; j++) if (!prog.done[r[i].lecciones[j].id]) return { m: r[i], l: r[i].lecciones[j] };
  return null;
}
function nombre() { return (perfil && perfil.nombre) || NOMBRE || ''; }
function saludo() { var h = new Date().getHours(); return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'; }
function etapaTxt() {
  var e = perfil && perfil.etapa;
  if (e === 'peri') return 'Estás en plena transición: tu cuerpo está recalibrando, y aquí vas a entender cada señal.';
  if (e === 'post') return 'Ya pasaste la menopausia: esta etapa es larga y valiosa, y hoy empiezas a cuidarla a tu manera.';
  if (e === 'inducida') return 'Tu menopausia llegó por un tratamiento o una cirugía: mereces información clara y acompañamiento a tu ritmo.';
  return 'En el módulo 1 te ayudamos a descubrir en qué etapa estás. Saberlo quita mucho miedo.';
}

/* ---------- vistas ---------- */
function sk(n, cls, style) { return '<img class="sk stk ' + (cls || '') + '" src="' + img(n) + '" alt="" style="' + (style || '') + '">'; }
function heart(c, s, style, cls) { return '<svg class="sk ' + (cls || 'flt') + '" style="' + style + '" width="' + s + '" height="' + s + '" viewBox="0 0 32 30" aria-hidden="true"><path d="M16 29S2 20 2 10.5C2 5.8 5.6 2 10 2c2.6 0 4.8 1.3 6 3.4C17.2 3.3 19.4 2 22 2c4.4 0 8 3.8 8 8.5C30 20 16 29 16 29z" fill="' + c + '"/></svg>'; }
function star(c, s, style, cls) { return '<svg class="sk ' + (cls || 'flt2') + '" style="' + style + '" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.9 6.4 7 .8-5.2 4.7 1.5 6.9L12 17.3 5.8 20.8l1.5-6.9L2.1 9.2l7-.8z" fill="' + c + '" stroke="#2B1B24" stroke-width="1.2"/></svg>'; }

function modCard(m, i) {
  var p = modPct(m);
  return '<a class="mod rv" href="#m/' + m.id + '" style="transition-delay:' + (i * 50) + 'ms"><div class="ph" style="background:' + m.color + '"><img class="f" src="' + img(m.foto) + '" alt="" loading="lazy"><span class="n">Módulo ' + m.num + '</span>' + (paraTi(m) ? '<span class="for">Para ti</span>' : '') + (p.p === 100 ? '<span class="done-badge">✓ Completado</span>' : '') + '</div>' +
    '<img class="cut stk" src="' + img(m.recorte) + '" alt="" loading="lazy">' +
    '<div class="bd"><h3>' + esc(m.titulo) + '</h3><p class="sub">' + esc(m.subtitulo) + '</p><div class="bar" style="margin-top:12px"><i style="width:' + p.p + '%"></i></div><div class="meta"><span>' + p.d + ' de ' + p.n + ' lecciones</span><span>' + p.p + '%</span></div></div></a>';
}

function vInicio() {
  var t = totalPct(), nx = siguiente(), nm = nombre(), C2 = 2 * Math.PI * 38;
  var h = '<section class="hero"><div class="lines"></div><div class="wrap in">' +
    '<div style="position:relative;z-index:2;padding-bottom:34px"><span class="kick dark">' + esc(saludo()) + (nm ? ', ' + esc(nm) : '') + '</span>' +
    '<h1>' + (t.d === 0 ? 'Bienvenida a PLENA' : 'Sigue así') + ' <span class="scr">' + (t.d === 0 ? 'este espacio es tuyo' : 'vas por buen camino') + '</span></h1>' +
    '<p class="lede">' + esc(C.lema) + ' ' + esc(etapaTxt()) + '</p>' +
    '<div class="stat"><svg class="ring" viewBox="0 0 92 92"><circle class="bg" cx="46" cy="46" r="38"/><circle class="fg" cx="46" cy="46" r="38" stroke-dasharray="' + C2 + '" stroke-dashoffset="' + C2 + '" data-off="' + (C2 * (1 - t.p / 100)) + '"/><text x="46" y="52" text-anchor="middle" font-family="Playfair Display" font-weight="900" font-size="20" fill="#2B1B24">' + t.p + '%</text></svg><div><b>' + t.d + ' / ' + t.n + '</b><span style="font-weight:600;font-size:14.5px">lecciones completadas de tu ruta</span></div></div></div>' +
    '<div class="collage" aria-hidden="true"><img class="c1 stk" src="' + img('cut22a') + '" alt="">' + sk('cut68', 'c2 flt', '--r:-6deg;position:absolute') + heart('#E0337A', 40, 'left:42%;top:40px', 'flt') + star('#FFD95A', 36, 'right:8%;top:24px', 'flt2') + heart('#fff', 26, 'left:18%;top:120px', 'flt2') + '</div></div></section>';
  h += '<section class="sec"><div class="wrap"><div class="grid2">';
  if (nx) {
    h += '<a class="card continue rv" href="#l/' + nx.m.id + '/' + nx.l.id + '"><img class="ph" src="' + img(nx.m.foto) + '" alt=""><div><span class="kick">' + (t.d ? 'Continúa donde lo dejaste' : 'Empieza aquí') + '</span><h3>' + esc(nx.l.titulo) + '</h3><p style="margin:0;color:var(--muted);font-size:14.5px">Módulo ' + nx.m.num + ' · ' + esc(nx.m.titulo) + ' · ' + nx.l.min + ' min</p><span class="btn btn-p btn-s" style="margin-top:12px">▶ Ver lección</span></div></a>';
    h += '<div class="card today rv"><span class="kick">Tu acción de hoy</span><h3>' + esc(nx.l.tarea) + '</h3><p>Pequeña, concreta y tuya. Así se cambia una etapa.</p><a class="btn btn-p btn-s" href="/#hoy">Registrar mi día en la app</a>' + sk('cut71', 'flt', '--r:8deg') + '</div>';
  } else {
    h += '<div class="card continue rv" style="grid-column:1/-1;display:block;text-align:center;padding:30px"><span class="kick">¡Lo lograste!</span><h3 style="font-size:32px">Completaste toda tu ruta</h3><p>' + esc(C.cierre) + '</p><a class="btn btn-p" href="#certificado">Ver mi certificado de graduación</a></div>';
  }
  h += '</div></div></section>';
  h += '<section class="sec" style="padding-top:0"><div class="wrap"><div class="sec-h"><div><span class="kick">Hecha para ti' + (nm ? ', ' + esc(nm) : '') + '</span><h2>Tu ruta <span class="scr">personal</span></h2></div><a class="btn btn-g btn-s" href="#perfil">Ajustar mis objetivos</a></div><div class="route">' + ruta().slice(0, 6).map(modCard).join('') + '</div><p style="text-align:center;margin-top:20px"><a class="btn btn-d" href="#ruta">Ver los ' + C.modulos.length + ' módulos</a></p></div></section>';
  h += '<section class="sec" style="padding-top:0"><div class="wrap"><div class="card rv" style="display:grid;grid-template-columns:1fr auto;gap:18px;align-items:center;padding:22px;background:var(--blush);overflow:hidden;position:relative"><div><span class="kick dark">Tu app incluida</span><h2 class="ser" style="font-size:30px;margin:8px 0 6px;line-height:1.1">Tu diario, tu plan de 30 días y tu consulta, en el celular</h2><p style="margin:0 0 14px">Lo que aprendes aquí, lo practicas allí. Tus datos de salud se quedan en tu dispositivo (y, si quieres, en una copia cifrada).</p><a class="btn btn-p" href="/#hoy">Abrir mi app</a></div><img src="' + cover('app-hoy') + '" alt="Pantalla de la app" style="width:170px;border-radius:22px;box-shadow:var(--sh);transform:rotate(4deg)" loading="lazy"></div></div></section>';
  return h;
}

function vRuta() {
  return '<section class="sec"><div class="wrap"><div class="sec-h"><div><span class="kick">' + C.modulos.length + ' módulos · ' + allLessons().length + ' lecciones</span><h2>Tu ruta <span class="scr">completa</span></h2><p style="margin:6px 0 0;color:var(--muted)">Ordenada según lo que más te pesa. Los marcados «Para ti» son tus prioridades.</p></div></div><div class="route">' + ruta().map(modCard).join('') + '</div></div></section>';
}

function vModulo(id) {
  var m = C.modulos.filter(function (x) { return x.id === id; })[0]; if (!m) return vRuta();
  var p = modPct(m);
  var h = '<section class="mhero" style="background:' + m.color + '"><div class="wrap in"><div style="position:relative;z-index:2"><div class="crumbs"><a href="#ruta">Mi ruta</a> › <span>Módulo ' + m.num + '</span></div><span class="kick dark">Módulo ' + m.num + (paraTi(m) ? ' · Para ti' : '') + '</span><h1>' + esc(m.titulo) + '</h1><p style="font-size:18px;font-weight:500;margin:0">' + esc(m.subtitulo) + '</p>' +
    '<div class="quote"><span class="tape"></span><q>' + esc(m.frase) + '</q><p>' + esc(m.respuesta) + '</p></div></div>' +
    '<div class="vis" aria-hidden="true"><img class="f" src="' + img(m.foto) + '" alt=""><img class="c stk" src="' + img(m.recorte) + '" alt="">' + heart('#E0337A', 34, 'left:10%;bottom:40px', 'flt') + star('#FFD95A', 30, 'right:44%;top:10px', 'flt2') + '</div></div></section>';
  h += '<section class="sec"><div class="wrap" style="max-width:860px"><div class="sec-h"><h2 style="font-size:30px">Lecciones</h2><span class="kick">' + p.d + ' de ' + p.n + ' · ' + p.p + '%</span></div><div class="lessons">' +
    m.lecciones.map(function (l, i) { var ok = !!prog.done[l.id]; return '<a class="card les rv' + (ok ? ' ok' : '') + '" href="#l/' + m.id + '/' + l.id + '" style="transition-delay:' + (i * 60) + 'ms"><span class="ck">' + (ok ? '✓' : (i + 1)) + '</span><span><b>' + esc(l.titulo) + '</b><span class="m">' + l.min + ' min' + (l.video ? ' · video' : '') + (l.mito ? ' · mito vs. verdad' : '') + '</span></span><span class="go">›</span></a>'; }).join('') +
    '</div></div></section>';
  return h;
}

function ytId(v) {
  v = String(v || '').trim(); if (!v) return '';
  var m = v.match(/(?:youtu\.be\/|v=|embed\/|shorts\/|live\/)([A-Za-z0-9_-]{11})/); if (m) return m[1];
  return /^[A-Za-z0-9_-]{11}$/.test(v) ? v : '';
}
function videoBox(l, m) {
  var id = ytId(l.video);
  if (!id) return '<div class="video soon"><div class="pbtn"><svg width="34" height="34" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="#fff"/></svg></div><b class="ser" style="font-size:22px;margin-top:10px">Video en camino</b><span style="color:#F2C9D7;font-size:14.5px">Mientras tanto, la lección completa está aquí abajo.</span>' + sk(m.recorte, 'flt', '--r:4deg') + '</div>';
  return '<div class="video" data-yt="' + id + '"><img class="thumb" src="https://i.ytimg.com/vi/' + id + '/hqdefault.jpg" alt="" loading="lazy"><button class="play" type="button" aria-label="Reproducir video: ' + esc(l.titulo) + '"><span class="pbtn"><svg width="34" height="34" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="#fff"/></svg></span></button></div>';
}
function recurso(r) {
  if (r.tipo === 'app') return '<a href="/#' + esc(r.ruta) + '"><span class="ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9B1B4F" stroke-width="2"><rect x="6" y="2.5" width="12" height="19" rx="3"/><path d="M10 18h4"/></svg></span><span>' + esc(r.texto) + '<br><small style="color:var(--muted)">Abrir en tu app</small></span></a>';
  var b = C.biblioteca.filter(function (x) { return x.item === r.item; })[0], u = ARCH[r.item];
  return '<a href="' + esc(u || '#biblioteca') + '"' + (u ? ' target="_blank" rel="noopener"' : '') + '><img src="' + cover(b ? b.portada : 'c-pausa') + '" alt="" loading="lazy"><span>' + esc(r.texto) + '<br><small style="color:var(--muted)">PDF · abrir o descargar</small></span></a>';
}
function vLeccion(mid, lid) {
  var m = C.modulos.filter(function (x) { return x.id === mid; })[0]; if (!m) return vRuta();
  var idx = -1; m.lecciones.forEach(function (l, i) { if (l.id === lid) idx = i; }); if (idx < 0) return vModulo(mid);
  var l = m.lecciones[idx], ok = !!prog.done[l.id];
  prog.last = m.id + '/' + l.id; saveProg(true);
  var flat = allLessons(), fi = -1; flat.forEach(function (x, i) { if (x.l.id === l.id) fi = i; });
  var prev = flat[fi - 1], next = flat[fi + 1];
  var h = '<div class="wrap lesson"><div class="crumbs"><a href="#ruta">Mi ruta</a> › <a href="#m/' + m.id + '">Módulo ' + m.num + ' · ' + esc(m.titulo) + '</a> › <span>Lección ' + (idx + 1) + '</span></div>' +
    '<h1>' + esc(l.titulo) + '</h1><div class="lgrid"><div style="display:flex;flex-direction:column;gap:22px">' + videoBox(l, m) +
    '<div class="txt">' + (l.texto || []).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + '</div>' +
    (l.claves && l.claves.length ? '<div class="card" style="padding:20px"><span class="kick">Lo esencial</span><ul class="keys" style="margin-top:12px">' + l.claves.map(function (k) { return '<li><i>♥</i><span>' + esc(k) + '</span></li>'; }).join('') + '</ul></div>' : '') +
    (l.mito ? '<div class="mito rv"><div class="m"><span class="px" style="color:#F7A8C7">Mito</span><p class="ser" style="font-size:19px;margin:6px 0 0;line-height:1.35">«' + esc(l.mito.mito) + '»</p></div><div class="v"><span class="px" style="color:#1F7A52">Lo que dice la evidencia</span><p style="margin:6px 0 0;font-weight:600">' + esc(l.mito.verdad) + '</p></div></div>' : '') +
    '<div class="card complete"><div><b class="ser" style="font-size:20px">' + (ok ? '¡Lección completada!' : '¿Terminaste la lección?') + '</b><div style="font-size:14px;color:var(--muted)">' + (ok ? 'Puedes volver a verla cuando quieras.' : 'Márcala para avanzar en tu ruta.') + '</div></div>' +
    '<button class="btn ' + (ok ? 'btn-g' : 'btn-p') + '" data-act="done" data-id="' + l.id + '">' + (ok ? '✓ Completada' : 'Marcar como completada') + '</button></div>' +
    '<div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap">' + (prev ? '<a class="btn btn-g btn-s" href="#l/' + prev.m.id + '/' + prev.l.id + '">‹ Anterior</a>' : '<span></span>') + (next ? '<a class="btn btn-d btn-s" href="#l/' + next.m.id + '/' + next.l.id + '">Siguiente ›</a>' : '<a class="btn btn-p btn-s" href="#certificado">Mi graduación ›</a>') + '</div>' +
    '</div><aside class="side"><div class="task"><span class="kick dark">Tu tarea</span><h3>' + esc(l.tarea) + '</h3>' + heart('#E0337A', 30, 'right:14px;top:12px', 'flt') + '</div>' +
    (l.recursos && l.recursos.length ? '<div class="card" style="padding:18px"><span class="kick">Tus recursos</span><div class="res" style="margin-top:12px">' + l.recursos.map(recurso).join('') + '</div></div>' : '') +
    '<p style="font-size:12.5px;color:var(--muted);margin:0">' + esc(C.aviso) + '</p></aside></div></div>';
  return h;
}

function vBiblioteca() {
  return '<section class="sec"><div class="wrap"><div class="sec-h"><div><span class="kick">Todo tu pack</span><h2>Tu <span class="scr">biblioteca</span></h2><p style="margin:6px 0 0;color:var(--muted)">Ábrelos en el celular o descárgalos. Los rellenables se completan con cualquier lector de PDF.</p></div><a class="btn btn-p btn-s" href="/#hoy">Abrir mi app</a></div><div class="lib">' +
    C.biblioteca.map(function (b, i) { var u = ARCH[b.item]; return '<a class="book rv" href="' + esc(u || '#') + '" target="_blank" rel="noopener" style="transition-delay:' + (i * 40) + 'ms"><div class="cv"><img src="' + cover(b.portada) + '" alt="Portada: ' + esc(b.titulo) + '" loading="lazy"></div><b>' + esc(b.titulo) + '</b><span>' + esc(b.desc) + '</span><span class="dl">↓ Abrir PDF</span></a>'; }).join('') +
    '</div></div></section>';
}

function vPerfil() {
  var t = totalPct(), p = perfil || {};
  return '<section class="sec"><div class="wrap" style="max-width:820px"><span class="kick">Tu perfil</span><h2 class="ser" style="font-size:40px;margin:8px 0 18px">Hola' + (nombre() ? ', <span class="scr" style="font-size:1.2em">' + esc(nombre()) + '</span>' : '') + '</h2>' +
    '<div class="card" style="padding:22px;margin-bottom:18px"><b class="ser" style="font-size:22px">Tu progreso</b><div class="bar" style="margin:12px 0 6px;height:12px"><i style="width:' + t.p + '%"></i></div><div class="meta"><span>' + t.d + ' de ' + t.n + ' lecciones</span><span>' + t.p + '%</span></div>' + (t.p === 100 ? '<p><a class="btn btn-p btn-s" href="#certificado">Ver mi certificado</a></p>' : '<p style="margin:10px 0 0;font-size:14px;color:var(--muted)">Al completar tu ruta podrás descargar tu certificado de graduación PLENA.</p>') + '</div>' +
    '<div class="card" style="padding:22px">' + perfilForm(p) + '</div>' +
    '<div class="card" style="padding:22px;margin-top:18px"><b class="ser" style="font-size:20px">Privacidad</b><p style="margin:6px 0 12px;font-size:14.5px">Tus objetivos y tu etapa se guardan solo en este dispositivo. Tu progreso del curso (qué lecciones completaste) se guarda con tu acceso para verlo en otros dispositivos. <a href="/privacidad.html">Política de privacidad</a>.</p><button class="btn btn-g btn-s" data-act="salir">Cerrar sesión en este dispositivo</button></div></div></section>';
}
function perfilForm(p, onboarding) {
  var obj = p.objetivos || [];
  return '<form id="pf"><label class="fld" for="pfN">Tu nombre<input id="pfN" maxlength="40" autocomplete="given-name" value="' + esc(p.nombre || NOMBRE || '') + '" placeholder="¿Cómo quieres que te llamemos?"></label>' +
    '<div class="fld" style="margin-top:14px">¿En qué etapa estás?</div><div class="opts">' +
    [['peri', 'Aún tengo reglas, pero han cambiado (perimenopausia)'], ['post', 'Llevo 12 meses o más sin regla (posmenopausia)'], ['inducida', 'Mi menopausia llegó por una cirugía o un tratamiento'], ['nose', 'No lo tengo claro']].map(function (o) { return '<label class="opt"><input type="radio" name="etapa" value="' + o[0] + '"' + (p.etapa === o[0] ? ' checked' : '') + '>' + o[1] + '</label>'; }).join('') + '</div>' +
    '<div class="fld" style="margin-top:14px">¿Qué es lo que más te pesa hoy? <span style="font-weight:500;color:var(--muted);font-size:14px">(elige hasta 3)</span></div><div class="opts">' +
    C.objetivos.map(function (o) { return '<label class="opt"><input type="checkbox" name="obj" value="' + o.id + '"' + (obj.indexOf(o.id) >= 0 ? ' checked' : '') + '>' + esc(o.texto) + '</label>'; }).join('') + '</div>' +
    '<p class="err" id="pfErr" hidden></p><button class="btn btn-p" type="submit" style="width:100%;margin-top:6px">' + (onboarding ? 'Crear mi ruta personal' : 'Guardar y actualizar mi ruta') + '</button></form>';
}

function vOnboarding() {
  return '<div class="ov"><img class="bg1 stk flt" src="' + img('cut08a') + '" alt="" style="--r:-3deg"><img class="bg2 stk flt2" src="' + img('cut27a') + '" alt="" style="--r:4deg"><div class="box"><span class="kick">Bienvenida a PLENA</span><h1>Hagamos esto <span class="scr">tuyo</span></h1><p style="margin:0 0 6px">Tres preguntas y armamos tu ruta personal. Nadie más ve tus respuestas: se quedan en este dispositivo.</p>' + perfilForm(perfil || {}, true) + '</div></div>';
}
function vMagic() {
  return '<div class="ov"><div class="box magic"><div class="orb"><i>♥</i></div><h1 style="font-size:34px">Creando tu ruta' + (nombre() ? ', <span class="scr">' + esc(nombre()) + '</span>' : '') + '…</h1><p id="mgT">Ordenando los módulos según lo que más te pesa</p></div></div>';
}
function vLock(msg) {
  return '<div class="ov"><img class="bg1 stk flt" src="' + img('cut02a') + '" alt=""><div class="box"><span class="kick">Acceso privado</span><h1>Tu plataforma <span class="scr">PLENA</span></h1><p>Curso de menopausia y psicomenopausia, tus libros y tu app en un solo lugar. Está incluida en el <b>pack completo</b>.</p><form id="lk"><label class="fld" for="lkIn">Tu código de acceso o tu enlace de la app<input id="lkIn" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="ej. 1a17ee86ed0fa0-5824857924"></label><p class="err" id="lkErr"' + (msg ? '' : ' hidden') + '>' + esc(msg || '') + '</p><button class="btn btn-p" style="width:100%">Entrar</button></form><p style="font-size:14px;color:var(--muted);margin:14px 0 0">Tu código está en tu página de descargas. ¿Aún no tienes el pack? <a href="/oferta/">Conócelo aquí</a>.</p></div></div>';
}
function vMejora() {
  return '<div class="ov"><div class="box" style="text-align:center"><span class="kick">Tu acceso está activo</span><h1>PLENA está en el <span class="scr">pack completo</span></h1><p>Tu compra incluye la app, pero no la plataforma de cursos. Completa tu pack pagando solo la diferencia desde tu página de descargas.</p><a class="btn btn-p" href="/oferta/">Ver el pack completo</a><p style="margin-top:14px"><a href="/#hoy">Volver a mi app</a></p></div></div>';
}
function vCert() {
  var t = totalPct(), nm = nombre() || 'Graduada', f = new Date().toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' });
  if (t.p < 100) return '<section class="sec"><div class="wrap" style="max-width:720px;text-align:center"><span class="kick">Tu graduación</span><h2 class="ser" style="font-size:40px">Te faltan ' + (t.n - t.d) + ' lecciones</h2><p>Completa tu ruta para desbloquear tu certificado de graduación PLENA.</p><div class="bar" style="height:12px;max-width:420px;margin:16px auto"><i style="width:' + t.p + '%"></i></div><a class="btn btn-p" href="#inicio">Seguir mi ruta</a></div></section>';
  return '<section class="sec"><div class="wrap" style="max-width:860px"><div class="cert"><span class="px" style="color:var(--berry)">PLENA · Academia de Menopausia y Psicomenopausia</span><h2>Certificado de graduación</h2><p style="margin:0">Se otorga con orgullo a</p><div class="name">' + esc(nm) + '</div><p style="max-width:560px;margin:0 auto">por completar la ruta PLENA: ' + C.modulos.length + ' módulos y ' + t.n + ' lecciones para entender su cuerpo, cuidar su mente y vivir esta etapa con información, fuerza y libertad.</p><p class="scr" style="font-size:40px;margin:16px 0 4px">' + esc(C.cierre) + '</p><p style="font-size:13px;color:var(--muted)">' + esc(f) + ' · DisierTECH</p>' + heart('#E0337A', 40, 'left:30px;top:30px', '') + star('#FFD95A', 40, 'right:30px;top:30px', '') + '<img class="sk stk" src="' + img('cut22a') + '" alt="" style="right:10px;bottom:-6px;height:170px;opacity:.95"></div><p class="noprint" style="text-align:center;margin-top:18px"><button class="btn btn-p" data-act="print">Descargar / imprimir certificado</button></p></div></section>';
}

/* ---------- render y rutas ---------- */
function parse() { var h = location.hash.replace(/^#/, ''); var p = h.split('/'); return { v: p[0] || 'inicio', a: p[1] || '', b: p[2] || '' }; }
function render() {
  var main = $('#main');
  if (!C) return;
  if (!perfil) { main.innerHTML = vOnboarding(); bindForms(); setNav(''); return; }
  var r = parse(), h;
  if (r.v === 'ruta') h = vRuta();
  else if (r.v === 'm') h = vModulo(r.a);
  else if (r.v === 'l') h = vLeccion(r.a, r.b);
  else if (r.v === 'biblioteca') h = vBiblioteca();
  else if (r.v === 'perfil') h = vPerfil();
  else if (r.v === 'certificado') h = vCert();
  else h = vInicio();
  main.innerHTML = '<div class="view">' + h + '<footer class="f wrap">© 2026 DisierTECH · PLENA · ' + esc(C.aviso) + ' · <a href="/privacidad.html">Privacidad</a></footer></div>';
  setNav(r.v === 'm' || r.v === 'l' ? 'ruta' : r.v === 'certificado' ? 'perfil' : r.v);
  bindForms(); reveal();
  setTimeout(function () { $$('.ring .fg').forEach(function (c) { c.style.strokeDashoffset = c.dataset.off; }); }, 80);
  document.title = (r.v === 'l' ? 'Lección' : r.v === 'm' ? 'Módulo' : r.v === 'biblioteca' ? 'Biblioteca' : r.v === 'perfil' ? 'Perfil' : 'Inicio') + ' · PLENA';
}
function setNav(v) { $$('[data-v]').forEach(function (a) { if (a.dataset.v === v) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); }); }
var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -40px 0px' }) : null;
function reveal() { $$('.rv').forEach(function (el) { if (io) io.observe(el); else el.classList.add('in'); }); }
function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var c = document.createElement('div'); c.className = 'confetti'; var cols = ['#E0337A', '#F7A8C7', '#FFD95A', '#CFE3F7', '#9B1B4F'];
  for (var i = 0; i < 60; i++) { var s = document.createElement('i'); s.style.left = Math.random() * 100 + '%'; s.style.background = cols[i % 5]; s.style.borderRadius = i % 3 ? '50%' : '3px'; s.style.animationDelay = Math.random() * .6 + 's'; c.appendChild(s); }
  document.body.appendChild(c); setTimeout(function () { c.remove(); }, 3400);
}

function bindForms() {
  var pf = $('#pf');
  if (pf) pf.addEventListener('submit', function (e) {
    e.preventDefault();
    var nm = $('#pfN').value.trim().slice(0, 40), et = (pf.querySelector('input[name=etapa]:checked') || {}).value, ob = $$('input[name=obj]:checked', pf).map(function (i) { return i.value; });
    var er = $('#pfErr');
    if (!et) { er.textContent = 'Elige tu etapa (si no lo sabes, marca «No lo tengo claro»).'; er.hidden = false; return; }
    if (!ob.length) { er.textContent = 'Elige al menos una cosa que te pese.'; er.hidden = false; return; }
    if (ob.length > 3) { er.textContent = 'Elige como máximo 3: así tu ruta queda enfocada.'; er.hidden = false; return; }
    var first = !perfil;
    perfil = { nombre: nm, etapa: et, objetivos: ob, at: Date.now() }; ls(KEY_PERFIL, JSON.stringify(perfil));
    if (first) {
      $('#main').innerHTML = vMagic(); var msgs = ['Ordenando los módulos según lo que más te pesa', 'Eligiendo tus primeras lecciones', 'Preparando tu acción de hoy'], k = 0;
      var t = setInterval(function () { k++; var el = $('#mgT'); if (el && msgs[k]) el.textContent = msgs[k]; }, 700);
      setTimeout(function () { clearInterval(t); location.hash = '#inicio'; render(); confetti(); }, 2200);
    } else { toast('Listo: tu ruta se actualizó.'); location.hash = '#inicio'; render(); }
  });
  $$('input[name=obj]').forEach(function (i) { i.addEventListener('change', function () { var on = $$('input[name=obj]:checked'); if (on.length > 3) { i.checked = false; toast('Elige como máximo 3.'); } }); });
  var lk = $('#lk');
  if (lk) lk.addEventListener('submit', function (e) { e.preventDefault(); var a = findAcc($('#lkIn').value); if (!a) { var er = $('#lkErr'); er.textContent = 'Revisa el código: son 14 letras y números, un guion y 10 más.'; er.hidden = false; return; } access = a; ls(KEY_ACC, a); boot(); });
}

document.addEventListener('click', function (e) {
  var b = e.target.closest('[data-act]');
  if (b) {
    var a = b.dataset.act;
    if (a === 'done') {
      var id = b.dataset.id;
      if (prog.done[id]) { delete prog.done[id]; toast('Lección marcada como pendiente.'); }
      else { prog.done[id] = Date.now(); confetti(); toast(totalPct().p === 100 ? '¡Completaste toda tu ruta! Tu certificado te espera.' : '¡Bien hecho! Un paso más hacia tu PLENA.'); }
      saveProg(true); render(); return;
    }
    if (a === 'print') { window.print(); return; }
    if (a === 'salir') { if (!confirm('¿Cerrar sesión en este dispositivo? Tu progreso se mantiene guardado con tu acceso.')) return; ls(KEY_ACC, null); ls(KEY_PERFIL, null); location.reload(); return; }
  }
  var v = e.target.closest('.video[data-yt] button.play');
  if (v) { var box = v.parentNode, id2 = box.dataset.yt; box.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + id2 + '?autoplay=1&rel=0&modestbranding=1&playsinline=1" title="Video de la lección" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>'; }
});
window.addEventListener('hashchange', function () { render(); window.scrollTo(0, 0); });

/* ---------- arranque ---------- */
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
    (x.d.archivos || []).forEach(function (f) { ARCH[f.item] = f.url; });
    if (perfil && !perfil.nombre && NOMBRE) perfil.nombre = NOMBRE;
    render(); syncProg();
  }).catch(function () { main.innerHTML = '<div class="ov"><div class="box" style="text-align:center"><h1 style="font-size:32px">Sin conexión</h1><p>No pudimos cargar tu plataforma. Revisa tu internet e inténtalo de nuevo.</p><button class="btn btn-p" onclick="location.reload()">Reintentar</button></div></div>'; });
}
boot();
})();
