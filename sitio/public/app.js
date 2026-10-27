/* Menopausia Equilibrada — app de seguimiento.
   Guarda todo en este dispositivo (localStorage) y lo sincroniza con una copia
   privada en la nube (base de datos del sitio en Vercel) identificada por el hash de un código personal. */
(function () {
'use strict';

/* =========================================================
   Configuración
   ========================================================= */
var KEY = 'me.data.v2';
var KEY_CODE = 'me.code';
var KEY_SYNC = 'me.lastSync';
var OLD_KEY = 'miPausa.v1';
var APP_URL = location.origin;

var SYMS = [
  { g: 'Temperatura', items: [['calores', 'Calores / sofocos'], ['sudores', 'Sudores nocturnos']] },
  { g: 'Ciclo', items: [['irregular', 'Reglas irregulares'], ['flujo', 'Flujo distinto']] },
  { g: 'Sueño', items: [['dormir', 'Dificultad para dormir'], ['despertares', 'Despertares nocturnos']] },
  { g: 'Ánimo', items: [['irritabilidad', 'Irritabilidad'], ['tristeza', 'Tristeza'], ['ansiedad', 'Ansiedad']] },
  { g: 'Zona íntima y urinaria', items: [['sequedad', 'Sequedad vaginal'], ['dolor', 'Dolor en las relaciones'], ['urgencia', 'Escapes / urgencia urinaria']] },
  { g: 'Cuerpo', items: [['abdomen', 'Más grasa abdominal'], ['fuerza', 'Menos fuerza muscular'], ['articulaciones', 'Dolor de articulaciones']] }
];
var SYM_LIST = []; SYMS.forEach(function (g) { g.items.forEach(function (i) { SYM_LIST.push({ id: i[0], name: i[1], g: g.g }); }); });
var QUESTIONS = [
  ['etapa', '¿En qué etapa estoy: perimenopausia, menopausia o posmenopausia?'],
  ['causas', '¿Mis síntomas pueden deberse a la menopausia, o conviene descartar otras causas?'],
  ['opciones', '¿Qué opciones tengo para mis síntomas, hormonales y no hormonales?'],
  ['riesgos', 'Con mi historia personal y familiar, ¿qué beneficios y riesgos tendría cada opción para mí?'],
  ['local', '¿Hay tratamiento local para la sequedad vaginal o las molestias urinarias?'],
  ['huesos', '¿Necesito algún estudio para valorar la salud de mis huesos?'],
  ['corazon', '¿Cómo están mi presión, colesterol y glucosa? ¿Qué controles necesito y cada cuánto?'],
  ['suplementos', '¿Los suplementos que tomo son necesarios y seguros con mis medicamentos?'],
  ['anticoncepcion', '¿Necesito seguir usando anticoncepción? ¿Hasta cuándo?'],
  ['sueno', '¿Qué puedo hacer para dormir mejor?'],
  ['seguimiento', '¿Cuándo revisamos si el plan está funcionando?']
];
var MOODS = ['Muy bajo', 'Bajo', 'Normal', 'Bien', 'Muy bien'];
var QUAL = ['Mala', 'Regular', 'Buena'];
var ENERGY = ['Agotada', 'Baja', 'Normal', 'Con energía'];
var HABITS = [
  { id: 'agua', t: 'Hidratación', d: 'Bebe agua a lo largo del día. Cuenta tus vasos en «Hoy».' },
  { id: 'mov', t: 'Movimiento 30 minutos', d: 'Caminar, bailar, bici o nadar: lo que disfrutes, a buen ritmo.' },
  { id: 'fuerza', t: 'Fuerza', d: '10 a 20 minutos con tu peso, bandas o mancuernas.' },
  { id: 'luz', t: 'Luz natural y aire libre', d: 'Sal un rato a la luz del día, mejor por la mañana.' },
  { id: 'prot', t: 'Proteína en cada comida', d: 'Huevo, legumbres, pescado, lácteos, tofu, pollo, frutos secos.' },
  { id: 'sueno', t: 'Rutina de sueño', d: 'Misma hora para acostarte y levantarte; pantallas fuera del cuarto.' }
];
var WEEKDAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
var TPL = [
  { id: 'consulta', t: 'Hoja de consulta', d: 'Todo lo que tu médica necesita saber de ti, en una sola hoja.', kind: 'form', prefill: true,
    fields: [['nombre', 'Nombre', 'text'], ['fecha', 'Fecha de la consulta', 'date'], ['edad', 'Edad', 'text'], ['ultimaRegla', 'Fecha de mi última regla', 'text'],
      ['sintomas', 'Mis 3 síntomas principales y su intensidad (0 a 3)', 'area'], ['impacto', 'Cómo afectan a mi sueño, trabajo, pareja y ánimo', 'area'],
      ['medicacion', 'Medicamentos y suplementos que tomo', 'area'], ['antecedentes', 'Antecedentes personales y familiares (cáncer de mama, trombos, corazón, huesos)', 'area'],
      ['preguntas', 'Mis preguntas', 'area'], ['acuerdos', 'Lo que acordamos', 'area'], ['proxima', 'Próxima revisión', 'text']] },
  { id: 'plan1', t: 'Mi plan en 1 página', d: 'Tu mes, en una página: qué vas a hacer y quién te apoya.', kind: 'form',
    fields: [['objetivo', 'Mi objetivo para este mes', 'area'], ['sueno', 'Sueño: qué voy a hacer', 'area'], ['movimiento', 'Movimiento y fuerza', 'area'],
      ['comida', 'Alimentación', 'area'], ['emociones', 'Emociones y descanso', 'area'], ['consulta', 'Consulta médica: qué voy a pedir', 'area'],
      ['apoyo', 'Quién me apoya y cómo', 'area'], ['premio', 'Cómo voy a celebrar mis avances', 'area']] },
  { id: 'menu', t: 'Menú semanal', d: 'Planea tus comidas de la semana con calma.', kind: 'grid', cols: ['Desayuno', 'Almuerzo', 'Cena', 'Snack'], rows: WEEKDAYS },
  { id: 'compras', t: 'Lista de compras', d: 'Por secciones, con casillas para tachar en el súper.', kind: 'list',
    cats: ['Frutas y verduras', 'Proteínas', 'Lácteos o alternativas', 'Cereales integrales y legumbres', 'Otros'] },
  { id: 'suplementos', t: 'Hoja de suplementos para mi médica', d: 'Anota lo que tomas para revisarlo en consulta.', kind: 'rows',
    cols: ['Suplemento o medicamento', 'Cuánto y cada cuánto lo tomo', 'Desde cuándo', 'Para qué lo tomo'],
    extra: [['preguntas', 'Preguntas para mi médica sobre lo que tomo', 'area']] },
  { id: 'registro30', t: 'Registro de 30 días', d: 'Sofocos, sueño, energía y ánimo, día por día.', kind: 'grid', cols: ['Sofocos (n.º)', 'Sueño (horas)', 'Energía (0–3)', 'Ánimo (0–4)', 'Nota'], rows: null, nrows: 30, prefill: true }
];
var TPL_BY = {}; TPL.forEach(function (t) { TPL_BY[t.id] = t; });
var WORDS = ('rosa luna sol mar miel flor nube cielo rio lago pino hoja trigo uva pera kiwi coco mango menta canela vainilla cacao cafe leche pan queso arroz maiz oliva limon fresa cereza mora lima nuez almendra perla coral seda lino lana brisa lluvia nieve rayo aurora alba tarde noche estrella cometa planeta jardin bosque valle monte isla playa arena ola puerto faro barco vela remo ancla mapa libro carta pluma tinta lapiz papel violeta lila jazmin dalia tulipan orquidea girasol amapola lirio azucena gardenia camelia magnolia hiedra helecho cactus palma cedro roble sauce olmo abeto tilo mirlo gorrion paloma colibri garza cisne pato buho zorro lince ciervo oso koala panda delfin ballena tortuga caracol mariposa abeja grillo dragon fenix sirena hada duende gigante canela salvia romero tomillo albahaca laurel').split(' ').filter(function (w, i, a) { return a.indexOf(w) === i; });

/* =========================================================
   Utilidades
   ========================================================= */
function $(s) { return document.querySelector(s); }
function $$(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function z(n) { return String(n).padStart(2, '0'); }
function iso(d) { return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()); }
function parse(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
function today() { return iso(new Date()); }
function addDays(s, n) { var d = parse(s); d.setDate(d.getDate() + n); return iso(d); }
function diff(a, b) { return Math.round((parse(b) - parse(a)) / 86400000); }
function isISO(s) { return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s); }
var MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
var MESL = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
var DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
function fmt(s) { var d = parse(s); return d.getDate() + ' ' + MES[d.getMonth()] + ' ' + d.getFullYear(); }
function fmtShort(s) { var d = parse(s); return d.getDate() + ' ' + MES[d.getMonth()]; }
function fmtLong(s) { var d = parse(s); return DIAS[d.getDay()] + ' ' + d.getDate() + ' de ' + MESL[d.getMonth()]; }
function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
function n1(v) { return (Math.round(v * 10) / 10).toLocaleString('es', { minimumFractionDigits: 1, maximumFractionDigits: 1 }); }
function now() { return Date.now(); }
function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
function hhmm(ts) { var d = new Date(ts); return z(d.getHours()) + ':' + z(d.getMinutes()); }
function relTime(ts) {
  if (!ts) return 'nunca';
  var s = Math.round((now() - ts) / 1000);
  if (s < 10) return 'hace un momento';
  if (s < 60) return 'hace ' + s + ' s';
  var m = Math.round(s / 60); if (m < 60) return 'hace ' + m + ' min';
  var d = new Date(ts); return fmtShort(iso(d)) + ', ' + hhmm(ts);
}
var toastT;
function toast(m) { var t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(function () { t.hidden = true; }, 3000); }

/* =========================================================
   Datos: modelo, normalización y fusión
   ========================================================= */
var storageOK = true;
function blank() {
  return { v: 2, wipe: 0, days: {}, deleted: {}, plan: { start: { v: '', u: 0 }, days: {} }, tpl: {},
    meta: { lastPeriodBefore: { v: '', u: 0 }, impact: { v: '', u: 0 }, questions: { v: { sel: ['etapa', 'opciones', 'riesgos', 'seguimiento'], own: [] }, u: 0 } } };
}
function num(v, min, max) { v = (v === '' || v == null) ? null : +v; return (v == null || isNaN(v)) ? null : clamp(v, min, max); }
function normDay(x) {
  x = x || {}; var s = {};
  SYM_LIST.forEach(function (it) { var v = +((x.s || {})[it.id]); s[it.id] = (v >= 0 && v <= 3) ? Math.round(v) : 0; });
  return { s: s, flashes: num(x.flashes, 0, 99) || 0, sleepH: num(x.sleepH, 0, 16), sleepQ: num(x.sleepQ, 0, 2), mood: num(x.mood, 0, 4),
    energy: num(x.energy, 0, 3), water: num(x.water, 0, 30) || 0, bleed: !!x.bleed, note: typeof x.note === 'string' ? x.note.slice(0, 2000) : '', u: +x.u || 0 };
}
function str(v, max) { return typeof v === 'string' ? v.slice(0, max || 4000) : ''; }
function normTpl(id, x) {
  var def = TPL_BY[id]; x = x || {}; var o = { u: +x.u || 0, f: {}, cells: {}, rows: [], items: [] };
  if (x.f && typeof x.f === 'object') Object.keys(x.f).forEach(function (k) { o.f[k] = str(x.f[k]); });
  if (x.cells && typeof x.cells === 'object') Object.keys(x.cells).forEach(function (k) { if (/^\d+_\d+$/.test(k)) o.cells[k] = str(x.cells[k], 500); });
  if (Array.isArray(x.rows)) o.rows = x.rows.slice(0, 40).map(function (r) { return Array.isArray(r) ? r.slice(0, def && def.cols ? def.cols.length : 4).map(function (c) { return str(c, 300); }) : []; });
  if (Array.isArray(x.items)) o.items = x.items.slice(0, 200).filter(function (i) { return i && typeof i.t === 'string'; }).map(function (i) { return { c: +i.c || 0, t: i.t.slice(0, 120), d: !!i.d }; });
  return o;
}
function normalize(d) {
  var b = blank(); if (!d || typeof d !== 'object') return b;
  b.wipe = +d.wipe || 0;
  if (d.days && typeof d.days === 'object') Object.keys(d.days).forEach(function (k) { if (isISO(k)) b.days[k] = normDay(d.days[k]); });
  if (d.deleted && typeof d.deleted === 'object') Object.keys(d.deleted).forEach(function (k) { if (isISO(k) && +d.deleted[k]) b.deleted[k] = +d.deleted[k]; });
  if (d.plan && typeof d.plan === 'object') {
    if (d.plan.start && isISO(d.plan.start.v || '')) b.plan.start = { v: d.plan.start.v, u: +d.plan.start.u || 0 };
    else if (d.plan.start && typeof d.plan.start === 'object') b.plan.start = { v: '', u: +d.plan.start.u || 0 };
    if (d.plan.days && typeof d.plan.days === 'object') Object.keys(d.plan.days).forEach(function (k) {
      var n = +k; if (n >= 1 && n <= 30) { var x = d.plan.days[k] || {}; var h = {}; HABITS.forEach(function (hb) { h[hb.id] = !!(x.h && x.h[hb.id]); }); b.plan.days[n] = { h: h, u: +x.u || 0 }; }
    });
  }
  if (d.tpl && typeof d.tpl === 'object') Object.keys(d.tpl).forEach(function (k) { if (TPL_BY[k]) b.tpl[k] = normTpl(k, d.tpl[k]); });
  if (d.meta && typeof d.meta === 'object') {
    var m = d.meta;
    if (m.lastPeriodBefore) b.meta.lastPeriodBefore = { v: isISO(m.lastPeriodBefore.v) ? m.lastPeriodBefore.v : '', u: +m.lastPeriodBefore.u || 0 };
    if (m.impact) b.meta.impact = { v: str(m.impact.v, 1500), u: +m.impact.u || 0 };
    if (m.questions && m.questions.v) {
      var q = m.questions.v;
      b.meta.questions = { v: { sel: Array.isArray(q.sel) ? q.sel.filter(function (x) { return typeof x === 'string'; }) : [], own: Array.isArray(q.own) ? q.own.filter(function (x) { return typeof x === 'string'; }).map(function (x) { return x.slice(0, 200); }).slice(0, 30) : [] }, u: +m.questions.u || 0 };
    }
  }
  return b;
}
// Migración desde «Mi Pausa» (v1)
function fromV1(o) {
  var b = blank(); var t = now();
  if (o && o.days) Object.keys(o.days).forEach(function (k) { if (isISO(k)) { var d = normDay(o.days[k]); d.u = t; b.days[k] = d; } });
  if (o && isISO(o.lastPeriodBefore)) b.meta.lastPeriodBefore = { v: o.lastPeriodBefore, u: t };
  if (o && typeof o.impact === 'string' && o.impact) b.meta.impact = { v: o.impact.slice(0, 1500), u: t };
  if (o && o.questions) b.meta.questions = { v: { sel: (o.questions.sel || []).slice(), own: (o.questions.own || []).slice(0, 30) }, u: t };
  return b;
}
function pickNewer(a, b) { if (!a) return b; if (!b) return a; return (b.u || 0) > (a.u || 0) ? b : a; }
function merge(a, b) {
  a = normalize(a); b = normalize(b);
  var o = blank(); o.wipe = Math.max(a.wipe, b.wipe);
  // borrados
  [a.deleted, b.deleted].forEach(function (del) { Object.keys(del).forEach(function (k) { o.deleted[k] = Math.max(o.deleted[k] || 0, del[k]); }); });
  // días
  var keys = {}; Object.keys(a.days).concat(Object.keys(b.days)).forEach(function (k) { keys[k] = 1; });
  Object.keys(keys).forEach(function (k) {
    var d = pickNewer(a.days[k], b.days[k]);
    if (!d) return;
    if ((d.u || 0) <= o.wipe) return;
    if (o.deleted[k] && o.deleted[k] >= (d.u || 0)) return;
    o.days[k] = d;
  });
  Object.keys(o.deleted).forEach(function (k) { if (o.deleted[k] <= o.wipe) delete o.deleted[k]; });
  // plan
  var st = pickNewer(a.plan.start, b.plan.start); o.plan.start = (st.u || 0) > o.wipe ? st : { v: '', u: 0 };
  for (var i = 1; i <= 30; i++) { var p = pickNewer(a.plan.days[i], b.plan.days[i]); if (p && (p.u || 0) > o.wipe) o.plan.days[i] = p; }
  // plantillas
  TPL.forEach(function (t) { var x = pickNewer(a.tpl[t.id], b.tpl[t.id]); if (x && (x.u || 0) > o.wipe) o.tpl[t.id] = x; });
  // meta
  ['lastPeriodBefore', 'impact', 'questions'].forEach(function (k) { var x = pickNewer(a.meta[k], b.meta[k]); o.meta[k] = (x.u || 0) > o.wipe ? x : blank().meta[k]; });
  return o;
}
function hasContent(d) {
  return Object.keys(d.days).length > 0 || Object.keys(d.plan.days).length > 0 || Object.keys(d.tpl).length > 0 || d.plan.start.u > 0 ||
    d.meta.impact.u > 0 || d.meta.lastPeriodBefore.u > 0 || d.meta.questions.u > 0 || Object.keys(d.deleted).length > 0 || d.wipe > 0;
}

/* almacenamiento local */
function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { storageOK = false; return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); storageOK = true; return true; } catch (e) { storageOK = false; return false; } }
function lsDel(k) { try { localStorage.removeItem(k); } catch (e) { } }
function loadLocal() {
  var raw = lsGet(KEY);
  if (raw) { try { return normalize(JSON.parse(raw)); } catch (e) { } }
  var old = lsGet(OLD_KEY);
  if (old) { try { return fromV1(JSON.parse(old)); } catch (e) { } }
  return blank();
}
var real = loadLocal();
var data = real;
var demo = false;
var onboarded = lsGet('me.onboarded') === '1';
function saveLocal() { if (!demo) lsSet(KEY, JSON.stringify(real)); var w = $('#storeWarn'); if (w) w.hidden = storageOK; }

/* =========================================================
   Código personal y sincronización
   ========================================================= */
function rnd(n) { // entero uniforme en [0, n)
  var a = new Uint32Array(1), lim = Math.floor(4294967296 / n) * n;
  do { crypto.getRandomValues(a); } while (a[0] >= lim);
  return a[0] % n;
}
function newCode() {
  var w = []; for (var i = 0; i < 4; i++) w.push(WORDS[rnd(WORDS.length)]);
  var d1 = String(rnd(100000)).padStart(5, '0'), d2 = String(rnd(100000)).padStart(5, '0');
  return w.join('-') + '-' + d1 + '-' + d2;
}
function normCode(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
function validCode(s) { return /^[a-z]+-[a-z]+-[a-z]+-[a-z]+-\d{5}-\d{5}$/.test(s); }
var code = normCode(lsGet(KEY_CODE) || '');
if (!validCode(code)) { code = newCode(); lsSet(KEY_CODE, code); }
var lastSync = +(lsGet(KEY_SYNC) || 0);
var syncState = 'idle'; // idle | busy | ok | off
var syncing = false, syncAgain = false, syncTimer = null, lastRemoteStr = null;

function personalLink() { return APP_URL + '/#cuenta?c=' + code + (access ? '&a=' + access : ''); }
function hashOf(c) {
  var enc = new TextEncoder().encode('menopausia-equilibrada:v1:' + c);
  return crypto.subtle.digest('SHA-256', enc).then(function (buf) {
    return Array.prototype.map.call(new Uint8Array(buf), function (b) { return b.toString(16).padStart(2, '0'); }).join('');
  });
}
function setSync(s, txt) {
  syncState = s;
  var p = $('#syncPill'); if (!p) return;
  p.className = 'syncpill ' + s;
  $('#syncTxt').textContent = txt || (s === 'ok' ? 'Sincronizado' : s === 'busy' ? 'Sincronizando…' : s === 'off' ? 'Sin conexión' : 'Mi cuenta');
  var st = $('#syncStatus'); if (st) st.textContent = syncLine();
}
function syncLine() {
  if (syncState === 'busy') return 'Sincronizando…';
  if (syncState === 'off') return 'Sin conexión ahora mismo. Todo está guardado en este dispositivo y se sincronizará solo cuando vuelva la conexión.';
  return 'Última sincronización: ' + relTime(lastSync) + '.';
}
function scheduleSync(ms) { clearTimeout(syncTimer); syncTimer = setTimeout(function () { sync(); }, ms == null ? 1200 : ms); }
function sync(opts) {
  if (typeof unlocked !== 'undefined' && !unlocked) return Promise.resolve();
  opts = opts || {};
  if (demo) return Promise.resolve();
  if (!window.crypto || !crypto.subtle) { setSync('off', 'Sin sincronizar'); return Promise.resolve(); }
  if (syncing) { syncAgain = true; return Promise.resolve(); }
  syncing = true; setSync('busy');
  var id;
  return hashOf(code).then(function (h) {
    id = h;
    return fetch('/api/sync?id=' + id, { cache: 'no-store', headers: { 'x-me-acc': access || '' } });
  }).then(function (r) {
    if (!r.ok) throw new Error('GET ' + r.status);
    return r.json();
  }).then(function (j) {
    var remote = j && j.data ? normalize(j.data) : null;
    var before = JSON.stringify(real);
    var merged = remote ? merge(real, remote) : real;
    var mergedStr = JSON.stringify(merged);
    var remoteStr = remote ? JSON.stringify(remote) : null;
    if (mergedStr !== before) { real = merged; if (!demo) data = real; saveLocal(); softRender(); }
    if (remoteStr === mergedStr) return null;
    if (!remote && !hasContent(merged)) return null;
    return fetch('/api/sync?id=' + id, { method: 'PUT', headers: { 'content-type': 'application/json', 'x-me-acc': access || '' }, body: mergedStr }).then(function (r) {
      if (!r.ok) throw new Error('PUT ' + r.status);
    });
  }).then(function () {
    lastSync = now(); lsSet(KEY_SYNC, String(lastSync)); setSync('ok');
    if (opts.toast) toast(opts.toast);
  }).catch(function (e) {
    setSync('off');
    if (opts.toast) toast('No hay conexión. Lo intentaremos de nuevo; tus datos están a salvo aquí.');
  }).then(function () {
    syncing = false;
    if (syncAgain) { syncAgain = false; scheduleSync(400); }
  });
}
function changed() { saveLocal(); scheduleSync(); }
function linkCode(raw) {
  var c = normCode(raw);
  if (!validCode(c)) { toast('Ese código no parece correcto. Revisa que tenga 4 palabras y 2 números.'); return false; }
  if (c === code) { toast('Este dispositivo ya usa ese código.'); return true; }
  code = c; lsSet(KEY_CODE, code); lastSync = 0; lsSet(KEY_SYNC, '0');
  sync({ toast: 'Dispositivo vinculado. Tus datos se unieron con los de tu cuenta.' }).then(function () { render(); });
  return true;
}
// Sincronización eficiente: al volver a la app solo si pasó más de 1 min, y en segundo plano cada 5 min.
// (Con miles de usuarias, consultar cada pocos segundos agotaría el plan del hosting.)
function syncIfStale(ms, minAge) { if (now() - lastSync > minAge) scheduleSync(ms); }
window.addEventListener('online', function () { scheduleSync(300); });
document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') syncIfStale(200, 60000); });
window.addEventListener('focus', function () { syncIfStale(300, 60000); });
setInterval(function () { if (document.visibilityState === 'visible') syncIfStale(0, 290000); }, 300000);

/* =========================================================
   Lógica: ciclo, estadísticas, plan
   ========================================================= */
function getDay(k) { return data.days[k] || null; }
function ensureDay(k) { if (!data.days[k]) data.days[k] = normDay({}); return data.days[k]; }
function touchDay(k) { var d = ensureDay(k); d.u = now(); if (data.deleted[k]) delete data.deleted[k]; return d; }
function bleedDays() { return Object.keys(data.days).filter(function (k) { return data.days[k].bleed; }).sort(); }
function episodes() {
  var eps = [];
  bleedDays().forEach(function (d) { var last = eps[eps.length - 1]; if (last && diff(last.end, d) <= 2) { last.end = d; last.days++; } else eps.push({ start: d, end: d, days: 1 }); });
  return eps;
}
function cycleInfo() {
  var eps = episodes(); var t = today();
  var prior = isISO(data.meta.lastPeriodBefore.v) ? data.meta.lastPeriodBefore.v : '';
  var starts = eps.map(function (e) { return e.start; });
  var allStarts = starts.slice(); if (prior && (!starts.length || prior < starts[0])) allStarts.unshift(prior);
  var lastEnd = eps.length ? eps[eps.length - 1].end : prior;
  var since = lastEnd ? diff(lastEnd, t) : null;
  var lengths = []; for (var i = 1; i < allStarts.length; i++) lengths.push(diff(allStarts[i - 1], allStarts[i]));
  var varPairs = 0; for (var j = 1; j < lengths.length; j++) { if (Math.abs(lengths[j] - lengths[j - 1]) >= 7) varPairs++; }
  var pmb = null, prevEnd = prior || null;
  eps.forEach(function (e) { if (prevEnd && diff(prevEnd, e.start) >= 365) pmb = e.start; prevEnd = e.end; });
  var stage = null;
  if (since != null && since >= 365) stage = { t: '12 meses o más sin regla', d: 'Según el consenso STRAW+10, 12 meses seguidos sin regla confirman la menopausia si no hay otra causa que lo explique.' };
  else if (since != null && since >= 60) stage = { t: '60 días o más sin regla', d: 'Según STRAW+10, 60 días o más sin regla es propio de la transición tardía (perimenopausia tardía).' };
  else if (varPairs >= 2) stage = { t: 'Ciclos que varían 7 días o más', d: 'Según STRAW+10, una diferencia persistente de 7 días o más entre ciclos seguidos es propia de la transición temprana.' };
  return { eps: eps, since: since, lastEnd: lastEnd, lengths: lengths, pmb: pmb, stage: stage, prior: prior };
}
function rangeKeys(n) { var t = today(), out = []; for (var i = n - 1; i >= 0; i--) out.push(addDays(t, -i)); return out; }
function mean(a) { return a.length ? a.reduce(function (x, y) { return x + y; }, 0) / a.length : null; }
function stats(n) {
  var keys = rangeKeys(n), logged = keys.filter(function (k) { return !!data.days[k]; });
  var top = SYM_LIST.map(function (s) {
    var sum = 0, days = 0; logged.forEach(function (k) { var v = data.days[k].s[s.id] || 0; sum += v; if (v > 0) days++; });
    return { id: s.id, name: s.name, avg: logged.length ? sum / logged.length : 0, days: days };
  }).filter(function (x) { return x.avg > 0; }).sort(function (a, b) { return b.avg - a.avg; });
  function col(f) { return logged.map(function (k) { return data.days[k][f]; }).filter(function (v) { return v != null; }); }
  var fl = logged.map(function (k) { return data.days[k].flashes || 0; });
  var sl = col('sleepH'), sq = col('sleepQ'), md = col('mood'), en = col('energy'), wa = logged.map(function (k) { return data.days[k].water || 0; });
  return { keys: keys, logged: logged, top: top, flAvg: mean(fl), flMax: fl.length ? Math.max.apply(null, fl) : null, sleepAvg: mean(sl), sleepN: sl.length,
    sleepQAvg: mean(sq), moodAvg: mean(md), energyAvg: mean(en), waterAvg: mean(wa), bleedN: logged.filter(function (k) { return data.days[k].bleed; }).length };
}
function planDayNum() { var s = data.plan.start.v; if (!isISO(s)) return 0; return clamp(diff(s, today()) + 1, 1, 30); }
function planDone(n) { var p = data.plan.days[n]; if (!p) return 0; return HABITS.filter(function (h) { return p.h[h.id]; }).length; }
function planStreak() {
  var cur = planDayNum(); if (!cur) return 0; var s = 0;
  var n = planDone(cur) >= 4 ? cur : cur - 1;
  while (n >= 1 && planDone(n) >= 4) { s++; n--; }
  return s;
}

/* =========================================================
   Gráficos (SVG)
   ========================================================= */
function showLbl(i, n) { var st = Math.max(1, Math.ceil(n / 6)); if (i === n - 1) return (n - 1) % st === 0 || (n - 1) % st >= st * 0.6; return i % st === 0; }
function niceMax(m) { if (m <= 0) return 4; var steps = [2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 80, 100]; for (var i = 0; i < steps.length; i++) if (steps[i] >= m) return steps[i]; return Math.ceil(m / 10) * 10; }
function ticks(max) { var n = max <= 6 ? max : 4; var out = []; for (var i = 0; i <= n; i++) out.push(Math.round(max * i / n * 10) / 10); return out; }
function barSVG(keys, vals, label, color) {
  var W = 640, H = 250, L = 50, R = 10, T = 16, B = 40, iw = W - L - R, ih = H - T - B;
  var max = niceMax(Math.max.apply(null, vals.map(function (v) { return v || 0; }))); var bw = iw / keys.length;
  var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(label) + '">';
  ticks(max).forEach(function (t) { var y = T + ih - (t / max) * ih; s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y + '" y2="' + y + '" stroke="#F6D5E1" stroke-width="1"/><text x="' + (L - 8) + '" y="' + (y + 7) + '" text-anchor="end">' + String(t).replace('.', ',') + '</text>'; });
  keys.forEach(function (k, i) {
    var v = vals[i]; var x = L + i * bw + bw * .18, w = Math.max(2, bw * .64);
    if (v == null) s += '<rect x="' + x + '" y="' + (T + ih - 2) + '" width="' + w + '" height="2" fill="#E9C9D6"/>';
    else { var h = (v / max) * ih; s += '<rect x="' + x + '" y="' + (T + ih - h) + '" width="' + w + '" height="' + Math.max(h, v > 0 ? 2 : 0) + '" rx="' + Math.min(4, w / 3) + '" fill="' + (color || '#E0337A') + '"><title>' + fmtShort(k) + ': ' + v + '</title></rect>'; }
    if (showLbl(i, keys.length)) s += '<text x="' + Math.min(W - R - 22, Math.max(L + 18, L + i * bw + bw / 2)) + '" y="' + (H - 8) + '" text-anchor="middle">' + fmtShort(k) + '</text>';
  });
  return s + '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + (T + ih) + '" y2="' + (T + ih) + '" stroke="#2B1B24" stroke-width="1.5"/></svg>';
}
function lineSVG(keys, vals, label, fixedMax, color) {
  var W = 640, H = 250, L = 50, R = 14, T = 16, B = 40, iw = W - L - R, ih = H - T - B;
  var r = vals.filter(function (v) { return v != null; }); var max = fixedMax || niceMax(r.length ? Math.max.apply(null, r) : 4);
  var step = keys.length > 1 ? iw / (keys.length - 1) : 0; color = color || '#9B1B4F';
  var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(label) + '">';
  ticks(max).forEach(function (t) { var y = T + ih - (t / max) * ih; s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y + '" y2="' + y + '" stroke="#F6D5E1" stroke-width="1"/><text x="' + (L - 8) + '" y="' + (y + 7) + '" text-anchor="end">' + String(t).replace('.', ',') + '</text>'; });
  var path = '', pen = false;
  keys.forEach(function (k, i) { var v = vals[i]; var x = L + i * step; if (v == null) { pen = false; return; } var y = T + ih - (v / max) * ih; path += (pen ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1) + ' '; pen = true; });
  if (path) s += '<path d="' + path + '" fill="none" stroke="' + color + '" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>';
  keys.forEach(function (k, i) { var v = vals[i]; if (v == null) return; var x = L + i * step, y = T + ih - (v / max) * ih; s += '<circle cx="' + x + '" cy="' + y + '" r="' + (keys.length > 40 ? 2.5 : 4) + '" fill="' + color + '"><title>' + fmtShort(k) + ': ' + v + '</title></circle>'; });
  keys.forEach(function (k, i) { if (showLbl(i, keys.length)) s += '<text x="' + Math.min(W - R - 22, Math.max(L + 22, L + i * step)) + '" y="' + (H - 8) + '" text-anchor="middle">' + fmtShort(k) + '</text>'; });
  return s + '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + (T + ih) + '" y2="' + (T + ih) + '" stroke="#2B1B24" stroke-width="1.5"/></svg>';
}

/* =========================================================
   Vistas
   ========================================================= */
var ui = { day: today(), range: 30, sumRange: 30, calMonth: null, confirmDel: false, importPending: null, planView: null, tplSub: null, params: {} };
var curView = 'hoy';
var IMG_WH = { cut02a: [508, 640], cut03a: [437, 640], cut68: [609, 640], cut22a: [373, 640], cut27a: [543, 640], cut05b: [293, 640], cut10a: [486, 640], cut28a: [372, 640], cut09a: [515, 640], cut08a: [440, 640], cut21a: [480, 640] };
var ART = {
  hoy: ['cut03a', [['heart', '#E0337A', 30, 'left:-8px;top:6px', 'flt', -12], ['spark', '#FFD95A', 22, 'right:-2px;top:58px', 'flt2', 0]]],
  progreso: ['cut27a', [['star', '#FFD95A', 30, 'left:-6px;top:4px', 'flt', 10], ['spark', '#fff', 20, 'right:0;top:70px', 'flt2', 0]]],
  plan30: ['cut05b', [['heart', '#E0337A', 28, 'left:0;top:14px', 'flt', -10], ['star', '#FFD95A', 24, 'right:4px;top:2px', 'flt2', 14]]],
  plantillas: ['cut10a', [['flower', '#F48FB1', 30, 'left:-6px;top:6px', 'flt', 0], ['spark', '#E0337A', 20, 'right:0;top:64px', 'flt2', 0]]],
  consulta: ['cut28a', [['star', '#FFD95A', 28, 'left:-4px;top:10px', 'flt', -8], ['heart', '#9B1B4F', 22, 'right:0;top:60px', 'flt2', 12]]],
  ciclo: ['cut09a', [['spark', '#fff', 26, 'left:-4px;top:6px', 'flt', 0], ['star', '#FFD95A', 20, 'right:2px;top:4px', 'flt2', -10]]],
  alarma: ['cut08a', [['heart', '#E0337A', 26, 'left:-4px;top:8px', 'flt', -8]]],
  cuenta: ['cut21a', [['flower', '#F7A8C7', 28, 'left:-6px;top:4px', 'flt', 0], ['spark', '#E0337A', 20, 'right:0;top:66px', 'flt2', 0]]]
};
function sk(kind, color, size, css, anim, rot) { return '<span class="sk ' + (anim || '') + '" style="' + css + ';--r:' + (rot || 0) + 'deg;width:' + size + 'px;height:' + size + 'px" aria-hidden="true">' + stkSVG(kind, size, color) + '</span>'; }
function cutImg(n, cls, extra) { var wh = IMG_WH[n] || [400, 640]; return '<img class="stk ' + (cls || '') + '" src="/img/' + n + '.webp" width="' + wh[0] + '" height="' + wh[1] + '" alt="" loading="lazy" decoding="async"' + (extra || '') + '>'; }
function head(kick, title, lede) {
  var a = ART[curView] || ART.hoy;
  return '<section class="hero"><div class="hd"><span class="kick">' + kick + '</span><h1>' + title + '</h1></div>' + (lede ? '<p class="lede">' + lede + '</p>' : '') +
    '<div class="art" aria-hidden="true">' + cutImg(a[0]) + a[1].map(function (x) { return sk(x[0], x[1], x[2], x[3], x[4], x[5]); }).join('') + '</div></section>';
}
function segs(name, opts, val, extraAttr) {
  return opts.map(function (o, i) { return '<label class="seg"><input type="radio" name="' + name + '" id="' + name + '_' + i + '" value="' + i + '"' + (val === i ? ' checked' : '') + (extraAttr || '') + '><span>' + esc(o) + '</span></label>'; }).join('');
}

function viewWelcome() {
  return '<div class="welcome" id="welcome"><div class="collage" aria-hidden="true">' + cutImg('cut02a', 'c1') + cutImg('cut22a', 'c2') + cutImg('cut68', 'c3') + sk('heart', '#E0337A', 34, 'left:38%;top:0;z-index:3', 'flt', -12) + sk('star', '#FFD95A', 28, 'right:6%;top:4px;z-index:3', 'flt2', 10) + sk('spark', '#fff', 22, 'left:6%;top:10px', 'flt', 0) + '</div><div class="big">¡Bienvenida!</div>' +
    '<p style="font-weight:600;font-size:17px;line-height:1.5">Esta app es tu diario, tu plan y tu memoria para la consulta. Funciona en el celular y en el computador, y guarda tu progreso sola.</p>' +
    '<ol class="steps"><li><b class="n">1</b><div><b>Registra tu día</b><div class="note">Un minuto: síntomas, sofocos, sueño, energía, ánimo y agua.</div></div></li>' +
    '<li><b class="n">2</b><div><b>Sigue tu Plan de 30 días</b><div class="note">Seis hábitos sencillos para recuperar energía. Marca los que cumplas.</div></div></li>' +
    '<li><b class="n">3</b><div><b>Guarda tu enlace personal</b><div class="note">En «Mi cuenta» está tu enlace: ábrelo en tu otro dispositivo y verás lo mismo.</div></div></li></ol>' +
    '<div class="row"><button type="button" class="dark" data-act="welcomeOk">Empezar</button><a class="btn ghost" href="#cuenta">Ver mi enlace personal</a></div></div>';
}

function viewHoy() {
  var k = ui.day, d = getDay(k) || normDay({}), isToday = k === today(), dt = parse(k);
  var h = '';
  if (!onboarded && !demo) h += viewWelcome();
  h += head('Registro diario', isToday ? '¿Cómo estás <span class="script" style="font-size:1.25em">hoy</span>?' : 'Registro del ' + fmtLong(k), 'Un minuto al día. 0 nada · 1 leve · 2 media · 3 fuerte. Se guarda solo y se sincroniza con tus otros dispositivos.');
  h += '<div class="card"><div class="daybar"><button type="button" class="ghost" data-act="prevDay" aria-label="Día anterior">‹</button><div class="d"><strong>' + (isToday ? 'Hoy' : cap(DIAS[dt.getDay()])) + '</strong><label class="sr" for="dayPick">Elegir fecha</label><input type="date" id="dayPick" value="' + k + '" max="' + today() + '" style="max-width:200px;margin:6px auto 0;display:block"></div><button type="button" class="ghost" data-act="nextDay" aria-label="Día siguiente"' + (isToday ? ' disabled' : '') + '>›</button></div><p class="status" id="saveStatus">' + (data.days[k] ? 'Hay un registro guardado para este día.' : 'Aún no hay registro para este día.') + '</p></div>';
  // sofocos + agua
  h += '<div class="grid2"><div class="card"><h2>Sofocos de hoy</h2><p class="note">Toca + cada vez que tengas uno.</p><div class="counter"><button type="button" data-act="flMinus" aria-label="Restar un sofoco">−</button><output id="flOut" aria-live="polite">' + d.flashes + '</output><button type="button" class="primary" data-act="flPlus" aria-label="Sumar un sofoco">+</button></div></div>';
  h += '<div class="card"><h2>Vasos de agua</h2><p class="note">Un vaso ≈ 250 ml. Cuenta también infusiones.</p><div class="counter"><button type="button" data-act="waMinus" aria-label="Restar un vaso">−</button><output id="waOut" aria-live="polite">' + (d.water || 0) + '</output><button type="button" class="primary" data-act="waPlus" aria-label="Sumar un vaso">+</button></div></div></div>';
  // energía + ánimo
  h += '<div class="card"><h2>Energía</h2><div class="segs" role="radiogroup" aria-label="Energía">' + segs('energy', ENERGY, d.energy) + '</div>';
  h += '<h2 style="margin-top:6px">Ánimo</h2><div class="segs" role="radiogroup" aria-label="Ánimo">' + segs('mood', MOODS, d.mood) + '</div></div>';
  // sueño
  h += '<div class="card"><h2>Sueño de anoche</h2><div class="row" style="align-items:flex-end"><label class="f" for="sleepH" style="max-width:180px">Horas dormidas<input type="number" id="sleepH" min="0" max="16" step="0.5" inputmode="decimal" value="' + (d.sleepH == null ? '' : d.sleepH) + '"></label></div>' +
    '<div><div class="note" style="margin-bottom:6px;font-weight:600;color:var(--ink)">Calidad</div><div class="segs" role="radiogroup" aria-label="Calidad del sueño">' + segs('sleepQ', QUAL, d.sleepQ) + '</div></div></div>';
  // síntomas
  h += '<div class="card"><h2>Síntomas</h2>';
  SYMS.forEach(function (g) {
    h += '<div class="grpT">' + esc(g.g) + '</div>';
    g.items.forEach(function (it) {
      var v = d.s[it[0]] || 0;
      h += '<div class="sym" role="radiogroup" aria-label="' + esc(it[1]) + '"><div class="n">' + esc(it[1]) + '</div><div class="segs">';
      for (var i = 0; i <= 3; i++) h += '<label class="seg"><input type="radio" name="s_' + it[0] + '" id="s_' + it[0] + '_' + i + '" value="' + i + '" data-sym="' + it[0] + '"' + (v === i ? ' checked' : '') + '><span>' + i + '</span></label>';
      h += '</div></div>';
    });
  });
  h += '</div>';
  h += '<div class="card"><h2>Sangrado</h2><label class="switch" for="bleed"><input type="checkbox" id="bleed"' + (d.bleed ? ' checked' : '') + '> Tuve sangrado o manchado este día</label>';
  var ci = cycleInfo(); if (ci.since != null && ci.since >= 365 && !d.bleed) h += '<p class="note">Llevas 12 meses o más sin regla. Si vuelves a sangrar, aunque sea poco, consúltalo (ver Señales de alarma).</p>';
  h += '</div>';
  h += '<div class="card"><label class="f" for="note">Nota libre<textarea id="note" maxlength="2000" placeholder="Qué pasó, qué ayudó, qué empeoró…">' + esc(d.note) + '</textarea></label></div>';
  // accesos rápidos
  h += '<div class="tiles"><a class="tile" href="#plan30"><b>Plan de 30 días</b><span>Marca tus hábitos de hoy.</span><span class="ti" aria-hidden="true">' + stkSVG('heart', 30, '#E0337A') + '</span></a><a class="tile" href="#progreso"><b>Mi progreso</b><span>Gráficas e historial.</span><span class="ti" aria-hidden="true">' + stkSVG('star', 30, '#FFD95A') + '</span></a><a class="tile" href="#plantillas"><b>Plantillas</b><span>Menú, compras, consulta…</span><span class="ti" aria-hidden="true">' + stkSVG('flower', 30, '#F48FB1') + '</span></a><a class="tile" href="#consulta"><b>Mi consulta</b><span>Resumen para tu médica.</span><span class="ti" aria-hidden="true">' + stkSVG('spark', 30, '#9B1B4F') + '</span></a></div>';
  h += '<div class="row"><button type="button" class="danger small" data-act="clearDay"' + (data.days[k] ? '' : ' disabled') + '>Borrar el registro de este día</button></div>';
  return h;
}

function viewProgreso() {
  var st = stats(ui.range);
  var h = head('Progreso', 'Tu progreso, <span class="script" style="font-size:1.2em">día a día</span>', 'Calculado solo con los días que registraste. Toca un día del historial para editarlo.');
  h += '<div class="segs" role="radiogroup" aria-label="Periodo">' + [7, 30, 90].map(function (n) { return '<label class="seg"><input type="radio" name="range" id="range_' + n + '" value="' + n + '"' + (ui.range === n ? ' checked' : '') + '><span>' + n + ' días</span></label>'; }).join('') + '</div>';
  if (st.logged.length) h += '<div class="row"><button type="button" class="primary" data-act="pdfProg">Descargar mi informe en PDF</button></div>';
  if (!st.logged.length && !Object.keys(data.days).length) {
    return h + '<div class="empty">' + sk('heart', '#F7A8C7', 44, '', 'flt', -8) + '<h2>Todavía no hay registros</h2><p class="note">Registra tu primer día y aquí verás tus sofocos, tu sueño, tu energía y tus síntomas principales.</p><div class="row" style="justify-content:center"><a class="btn primary" href="#hoy">Registrar hoy</a>' + (demo ? '' : '<button type="button" data-act="demoOn">Ver un ejemplo</button>') + '</div></div>';
  }
  h += '<div class="stats"><div class="stat"><div class="v">' + st.logged.length + '<span style="font-size:17px">/' + ui.range + '</span></div><div class="l">días registrados</div></div>' +
    '<div class="stat"><div class="v">' + (st.flAvg == null ? '—' : n1(st.flAvg)) + '</div><div class="l">sofocos por día (media)' + (st.flMax != null ? ' · máx. ' + st.flMax : '') + '</div></div>' +
    '<div class="stat"><div class="v">' + (st.sleepAvg == null ? '—' : n1(st.sleepAvg) + ' h') + '</div><div class="l">de sueño por noche</div></div>' +
    '<div class="stat"><div class="v">' + (st.energyAvg == null ? '—' : ENERGY[Math.round(st.energyAvg)]) + '</div><div class="l">energía media</div></div>' +
    '<div class="stat"><div class="v">' + (st.waterAvg == null ? '—' : n1(st.waterAvg)) + '</div><div class="l">vasos de agua al día</div></div></div>';
  if (st.logged.length) {
    h += '<div class="card"><h2>Sofocos por día</h2><div class="chart">' + barSVG(st.keys, st.keys.map(function (k) { return data.days[k] ? data.days[k].flashes : null; }), 'Sofocos por día') + '</div><p class="note">Días sin registro: raya gris.</p></div>';
    h += '<div class="card"><h2>Horas de sueño</h2><div class="chart">' + lineSVG(st.keys, st.keys.map(function (k) { return data.days[k] ? data.days[k].sleepH : null; }), 'Horas de sueño por noche', 12) + '</div></div>';
    h += '<div class="card"><h2>Energía (0–3)</h2><div class="chart">' + lineSVG(st.keys, st.keys.map(function (k) { return data.days[k] ? data.days[k].energy : null; }), 'Energía diaria de 0 a 3', 3, '#E0337A') + '</div></div>';
    h += '<div class="card"><h2>Ánimo (0–4)</h2><div class="chart">' + lineSVG(st.keys, st.keys.map(function (k) { return data.days[k] ? data.days[k].mood : null; }), 'Ánimo diario de 0 a 4', 4) + '</div><p class="note">0 muy bajo · 4 muy bien.</p></div>';
    h += '<div class="card"><h2>Tus síntomas principales</h2>';
    if (!st.top.length) h += '<p class="note">No marcaste síntomas en este periodo.</p>';
    else { h += '<div class="toplist">'; st.top.slice(0, 5).forEach(function (t) { h += '<div class="tl"><span>' + esc(t.name) + ' <span class="note">· ' + t.days + ' d</span></span><div class="b" aria-hidden="true"><i style="width:' + (t.avg / 3 * 100).toFixed(0) + '%"></i></div><b>' + n1(t.avg) + '</b></div>'; }); h += '</div><p class="note">Intensidad media de 0 a 3 en los días registrados.</p>'; }
    h += '</div>';
  }
  // historial
  var all = Object.keys(data.days).sort().reverse();
  h += '<div class="card"><h2>Historial completo <span class="note" style="font-family:var(--f-body);font-weight:500">(' + all.length + ' días)</span></h2><div class="hist">';
  if (!all.length) h += '<p class="note">Sin días guardados.</p>';
  all.slice(0, ui.histAll ? all.length : 30).forEach(function (k) {
    var d = data.days[k]; var tops = SYM_LIST.filter(function (s) { return d.s[s.id] > 0; }).sort(function (a, b) { return d.s[b.id] - d.s[a.id]; }).slice(0, 3).map(function (s) { return s.name.toLowerCase() + ' ' + d.s[s.id]; });
    var bits = ['sofocos ' + d.flashes]; if (d.sleepH != null) bits.push('sueño ' + String(d.sleepH).replace('.', ',') + ' h'); if (d.energy != null) bits.push('energía ' + ENERGY[d.energy].toLowerCase()); if (d.mood != null) bits.push('ánimo ' + MOODS[d.mood].toLowerCase()); if (d.water) bits.push(d.water + ' vasos'); if (d.bleed) bits.push('sangrado');
    h += '<div class="hrow"><div style="min-width:0"><b>' + cap(fmtLong(k)) + ' ' + parse(k).getFullYear() + '</b><div class="note">' + esc(bits.join(' · ')) + (tops.length ? '<br>' + esc(tops.join(', ')) : '') + (d.note ? '<br>«' + esc(d.note.slice(0, 90)) + (d.note.length > 90 ? '…' : '') + '»' : '') + '</div></div><button type="button" class="small ghost" data-edit="' + k + '">Editar</button></div>';
  });
  if (all.length > 30 && !ui.histAll) h += '<button type="button" class="ghost" data-act="histAll">Ver los ' + all.length + ' días</button>';
  h += '</div></div>';
  return h;
}

function viewPlan30() {
  var cur = planDayNum();
  var h = head('Plan de 30 días', 'Recupera tu <span class="script" style="font-size:1.2em">energía</span>', 'Seis hábitos sencillos, un día a la vez. Un día cuenta como «cumplido» con 4 de 6 hábitos. No se trata de ser perfecta, sino constante.');
  if (!cur) {
    h += '<div class="card pink"><h2>¿Empezamos hoy?</h2><p>Tu día 1 será hoy, ' + fmtLong(today()) + '. Puedes reiniciar el plan cuando quieras.</p><div class="row"><button type="button" class="primary" data-act="planStart">Empezar mi plan hoy</button></div></div>';
    h += habitsInfo();
    return h;
  }
  var view = ui.planView && ui.planView >= 1 && ui.planView <= cur ? ui.planView : cur;
  var p = data.plan.days[view] || { h: {} };
  var doneDays = 0; for (var i = 1; i <= 30; i++) if (planDone(i) >= 4) doneDays++;
  h += '<div class="stats"><div class="stat"><div class="v">Día ' + cur + '</div><div class="l">de 30 · empezaste el ' + fmt(data.plan.start.v) + '</div></div><div class="stat"><div class="v">' + planStreak() + '</div><div class="l">días seguidos cumplidos (racha)</div></div><div class="stat"><div class="v">' + doneDays + '</div><div class="l">días cumplidos en total</div></div></div>';
  h += '<div class="card"><div class="row between"><h2>' + (view === cur ? 'Hoy · día ' + view : 'Día ' + view + ' · ' + fmtLong(addDays(data.plan.start.v, view - 1))) + '</h2><span class="kick">' + planDone(view) + ' de 6</span></div><div class="bar" aria-hidden="true"><i style="width:' + (planDone(view) / 6 * 100).toFixed(0) + '%"></i></div><div class="habits">';
  HABITS.forEach(function (hb) { var on = !!(p.h && p.h[hb.id]); h += '<label class="habit' + (on ? ' done' : '') + '" for="hb_' + hb.id + '"><input type="checkbox" id="hb_' + hb.id + '" data-habit="' + hb.id + '" data-pday="' + view + '"' + (on ? ' checked' : '') + '><div><b>' + esc(hb.t) + '</b><span>' + esc(hb.d) + '</span></div></label>'; });
  h += '</div>' + (view !== cur ? '<button type="button" class="ghost" data-act="planToday">Volver a hoy</button>' : '') + '</div>';
  h += '<div class="card"><h2>Tus 30 días</h2><p class="note">Toca un día pasado para revisarlo o completarlo.</p><div class="pgrid">';
  for (var n = 1; n <= 30; n++) {
    var dn = planDone(n), cls = n > cur ? 'fut' : dn >= 4 ? 'full' : dn > 0 ? 'part' : '';
    h += '<button type="button" class="' + cls + (n === view ? ' cur' : '') + '" data-pview="' + n + '"' + (n > cur ? ' disabled' : '') + ' aria-label="Día ' + n + ', ' + dn + ' de 6 hábitos">' + n + '<small>' + (n > cur ? '' : dn + '/6') + '</small></button>';
  }
  h += '</div></div>';
  h += habitsInfo();
  h += '<div class="row"><button type="button" class="danger small" data-act="planReset">Reiniciar el plan</button></div>';
  return h;
}
function habitsInfo() {
  return '<div class="card pink"><h2>Por qué estos hábitos</h2><ul style="margin:0;padding-left:20px;display:flex;flex-direction:column;gap:6px">' +
    '<li><b>Movimiento y fuerza:</b> la OMS recomienda a los adultos 150 a 300 minutos semanales de actividad moderada y ejercicios de fuerza 2 o más días por semana.</li>' +
    '<li><b>Hidratación:</b> la EFSA fija una ingesta adecuada de agua total (bebidas y alimentos) de 2 litros al día para mujeres adultas.</li>' +
    '<li><b>Rutina de sueño:</b> acostarte y levantarte a la misma hora es uno de los consejos básicos del NHS para dormir mejor.</li></ul>' +
    '<p class="src">Fuentes: OMS, «Actividad física» (2020); EFSA, valores dietéticos de referencia para el agua (2010); NHS, «Insomnia». Si tienes una condición médica, consulta antes de cambiar tu actividad física.</p></div>';
}

/* ---------- plantillas ---------- */
function tplData(id) { if (!data.tpl[id]) data.tpl[id] = normTpl(id, {}); return data.tpl[id]; }
function tplTouched(id) { var t = data.tpl[id]; return t && t.u > 0; }
function viewPlantillas() {
  var sub = ui.tplSub && TPL_BY[ui.tplSub] ? ui.tplSub : null;
  if (sub) return viewTplEdit(sub);
  var h = head('Plantillas', 'Tus plantillas <span class="script" style="font-size:1.2em">editables</span>', 'Escribe directamente aquí: todo se guarda solo y aparece igual en tu celular y en tu computador. Puedes descargarlas en PDF o imprimirlas.');
  h += '<div class="tpl-list">';
  TPL.forEach(function (t) { var tt = data.tpl[t.id]; h += '<a class="tpl-card" href="#plantillas/' + t.id + '"><b>' + esc(t.t) + '</b><span>' + esc(t.d) + '</span><em>' + (tt && tt.u ? 'Editada ' + relTime(tt.u) : 'Sin empezar') + '</em></a>'; });
  return h + '</div>';
}
function inputFor(id, key, label, type, val) {
  var fid = 'tf_' + id + '_' + key;
  if (type === 'area') return '<label class="f" for="' + fid + '">' + esc(label) + '<textarea id="' + fid + '" data-tpl="' + id + '" data-tk="f.' + key + '" maxlength="4000">' + esc(val) + '</textarea></label>';
  return '<label class="f" for="' + fid + '">' + esc(label) + '<input type="' + (type === 'date' ? 'date' : 'text') + '" id="' + fid + '" data-tpl="' + id + '" data-tk="f.' + key + '" maxlength="300" value="' + esc(val) + '"></label>';
}
function viewTplEdit(id) {
  var def = TPL_BY[id], t = data.tpl[id] || normTpl(id, {});
  var h = '<div><a class="btn ghost small" href="#plantillas">‹ Todas las plantillas</a></div>';
  h += head('Plantilla', esc(def.t), esc(def.d) + ' Se guarda sola mientras escribes.');
  h += '<div class="row">' + (def.prefill ? '<button type="button" class="primary" data-tplact="prefill" data-id="' + id + '">Rellenar con mis registros</button>' : '') + '<button type="button" data-tplact="pdf" data-id="' + id + '">Descargar PDF</button><button type="button" data-tplact="print" data-id="' + id + '">Imprimir</button><button type="button" class="danger small" data-tplact="clear" data-id="' + id + '">Vaciar</button></div>';
  h += '<p class="status" id="tplStatus">' + (t.u ? 'Guardada ' + relTime(t.u) + '.' : 'Aún vacía.') + '</p>';
  if (def.kind === 'form') {
    h += '<div class="card">'; def.fields.forEach(function (f) { h += inputFor(id, f[0], f[1], f[2], t.f[f[0]] || ''); }); h += '</div>';
  } else if (def.kind === 'grid') {
    var nrows = def.rows ? def.rows.length : def.nrows;
    h += '<div class="tgrid"><table><thead><tr><th scope="col">' + (def.rows ? 'Día' : 'N.º') + '</th>' + def.cols.map(function (c) { return '<th scope="col">' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>';
    for (var r = 0; r < nrows; r++) {
      var rl = def.rows ? def.rows[r] : 'Día ' + (r + 1);
      h += '<tr><td class="dl">' + esc(rl) + '</td>';
      def.cols.forEach(function (c, ci) { var k = r + '_' + ci; h += '<td><label class="sr" for="tc_' + id + '_' + k + '">' + esc(rl + ' · ' + c) + '</label><input type="text" id="tc_' + id + '_' + k + '" data-tpl="' + id + '" data-tk="c.' + k + '" maxlength="200" value="' + esc(t.cells[k] || '') + '"></td>'; });
      h += '</tr>';
    }
    h += '</tbody></table></div>';
  } else if (def.kind === 'rows') {
    var rows = t.rows.length ? t.rows : [['', '', '', '']];
    h += '<div class="tgrid"><table><thead><tr>' + def.cols.map(function (c) { return '<th scope="col">' + esc(c) + '</th>'; }).join('') + '<th scope="col"><span class="sr">Quitar</span></th></tr></thead><tbody>';
    rows.forEach(function (row, ri) {
      h += '<tr>' + def.cols.map(function (c, ci) { return '<td><label class="sr" for="tr_' + id + '_' + ri + '_' + ci + '">' + esc(c + ', fila ' + (ri + 1)) + '</label><input type="text" id="tr_' + id + '_' + ri + '_' + ci + '" data-tpl="' + id + '" data-tk="r.' + ri + '.' + ci + '" maxlength="200" value="' + esc(row[ci] || '') + '"></td>'; }).join('') +
        '<td style="width:1%"><button type="button" class="small ghost" data-tplact="delrow" data-id="' + id + '" data-i="' + ri + '" aria-label="Quitar fila ' + (ri + 1) + '">×</button></td></tr>';
    });
    h += '</tbody></table></div><div class="row"><button type="button" class="ghost" data-tplact="addrow" data-id="' + id + '">Añadir fila</button></div>';
    if (def.extra) { h += '<div class="card">'; def.extra.forEach(function (f) { h += inputFor(id, f[0], f[1], f[2], t.f[f[0]] || ''); }); h += '</div>'; }
    h += '<p class="note">Anota lo que tomas tal como lo tomas. Esta hoja no recomienda cantidades: es para revisarla con tu médica o farmacéutica.</p>';
  } else if (def.kind === 'list') {
    h += '<div class="grid2">';
    def.cats.forEach(function (c, ci) {
      h += '<div class="card"><h2>' + esc(c) + '</h2><div class="shop">';
      t.items.forEach(function (it, ii) { if (it.c !== ci) return; h += '<label class="' + (it.d ? 'done' : '') + '" for="sh_' + ii + '"><input type="checkbox" id="sh_' + ii + '" data-shop="' + ii + '" data-id="' + id + '"' + (it.d ? ' checked' : '') + '><span>' + esc(it.t) + '</span><button type="button" data-tplact="delitem" data-id="' + id + '" data-i="' + ii + '" aria-label="Quitar ' + esc(it.t) + '">×</button></label>'; });
      h += '</div><form class="row" data-additem="' + ci + '" data-id="' + id + '" style="flex-wrap:nowrap"><label class="sr" for="ai_' + ci + '">Añadir a ' + esc(c) + '</label><input type="text" id="ai_' + ci + '" maxlength="120" placeholder="Añadir…"><button type="submit" class="small">Añadir</button></form></div>';
    });
    h += '</div>';
  }
  return h;
}
function setTplValue(id, path, val) {
  var t = tplData(id); var p = path.split('.');
  if (p[0] === 'f') t.f[p[1]] = val;
  else if (p[0] === 'c') { if (val) t.cells[p[1]] = val; else delete t.cells[p[1]]; }
  else if (p[0] === 'r') { var ri = +p[1], ci = +p[2]; while (t.rows.length <= ri) t.rows.push(['', '', '', '']); t.rows[ri][ci] = val; }
  t.u = now();
}
function tplPrefill(id) {
  var t = tplData(id);
  if (id === 'consulta') {
    var st = stats(30), ci = cycleInfo();
    if (!t.f.ultimaRegla && ci.lastEnd) t.f.ultimaRegla = fmt(ci.lastEnd);
    var tops = st.top.slice(0, 3).map(function (x) { return x.name + ': ' + n1(x.avg) + ' de 3 (' + x.days + ' días de 30)'; });
    if (st.flAvg != null) tops.push('Sofocos: ' + n1(st.flAvg) + ' por día de media');
    if (st.sleepAvg != null) tops.push('Sueño: ' + n1(st.sleepAvg) + ' h por noche de media');
    if (tops.length) t.f.sintomas = tops.join('\n');
    if (!t.f.impacto && data.meta.impact.v) t.f.impacto = data.meta.impact.v;
    var qs = QUESTIONS.filter(function (q) { return data.meta.questions.v.sel.indexOf(q[0]) >= 0; }).map(function (q) { return q[1]; }).concat(data.meta.questions.v.own);
    if (!t.f.preguntas && qs.length) t.f.preguntas = qs.map(function (q, i) { return (i + 1) + '. ' + q; }).join('\n');
  } else if (id === 'registro30') {
    var keys = rangeKeys(30);
    keys.forEach(function (k, r) {
      var d = data.days[k]; if (!d) return;
      t.cells[r + '_0'] = String(d.flashes || 0);
      if (d.sleepH != null) t.cells[r + '_1'] = String(d.sleepH).replace('.', ',');
      if (d.energy != null) t.cells[r + '_2'] = String(d.energy);
      if (d.mood != null) t.cells[r + '_3'] = String(d.mood);
      t.cells[r + '_4'] = fmtShort(k) + (d.note ? ' · ' + d.note.slice(0, 60) : '');
    });
  }
  t.u = now();
}
function tplDoc(id) {
  var def = TPL_BY[id], t = data.tpl[id] || normTpl(id, {});
  var b = '<h1>' + esc(def.t) + '</h1><p class="m">Menopausia Equilibrada · ' + fmt(today()) + '</p>';
  if (def.kind === 'form') def.fields.forEach(function (f) { b += '<h2>' + esc(f[1]) + '</h2><div class="v">' + (esc(t.f[f[0]] || '') || '&nbsp;') + '</div>'; });
  else if (def.kind === 'grid') {
    var nrows = def.rows ? def.rows.length : def.nrows;
    b += '<table><tr><th></th>' + def.cols.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + '</tr>';
    for (var r = 0; r < nrows; r++) b += '<tr><th>' + esc(def.rows ? def.rows[r] : 'Día ' + (r + 1)) + '</th>' + def.cols.map(function (c, ci) { return '<td>' + esc(t.cells[r + '_' + ci] || '') + '</td>'; }).join('') + '</tr>';
    b += '</table>';
  } else if (def.kind === 'rows') {
    b += '<table><tr>' + def.cols.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + '</tr>';
    (t.rows.length ? t.rows : [['', '', '', '']]).forEach(function (row) { b += '<tr>' + def.cols.map(function (c, ci) { return '<td>' + esc(row[ci] || '') + '</td>'; }).join('') + '</tr>'; });
    b += '</table>';
    (def.extra || []).forEach(function (f) { b += '<h2>' + esc(f[1]) + '</h2><div class="v">' + (esc(t.f[f[0]] || '') || '&nbsp;') + '</div>'; });
  } else if (def.kind === 'list') {
    def.cats.forEach(function (c, ci) { var its = t.items.filter(function (i) { return i.c === ci; }); b += '<h2>' + esc(c) + '</h2><ul>' + (its.length ? its.map(function (i) { return '<li>' + (i.d ? '☑ ' : '☐ ') + esc(i.t) + '</li>'; }).join('') : '<li>&nbsp;</li>') + '</ul>'; });
  }
  return docShell(def.t, b);
}
function docShell(title, body) {
  return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>' + esc(title) + '</title><style>' +
    'body{font-family:Arial,Helvetica,sans-serif;color:#2B1B24;max-width:760px;margin:28px auto;padding:0 20px;line-height:1.5;font-size:14px}' +
    'h1{font-family:Georgia,serif;color:#9B1B4F;font-size:28px;margin:0 0 2px}.m{color:#6B4E5C;margin:0 0 16px}' +
    'h2{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#9B1B4F;border-top:1px solid #E6B9CB;padding-top:10px;margin:18px 0 6px}' +
    '.v{white-space:pre-wrap;min-height:22px}table{border-collapse:collapse;width:100%;margin-top:8px}th,td{border:1px solid #E6B9CB;padding:6px 8px;text-align:left;vertical-align:top;font-size:13px}th{background:#FCE4EC}' +
    'ul,ol{margin:4px 0 0;padding-left:22px}p{margin:2px 0}@media print{body{margin:0}}</style></head><body>' + body + '</body></html>';
}

/* ---------- consulta ---------- */
function summaryData() { var st = stats(ui.sumRange), ci = cycleInfo(); return { st: st, ci: ci, from: st.keys[0], to: st.keys[st.keys.length - 1] }; }
function selQuestions() { return QUESTIONS.filter(function (q) { return data.meta.questions.v.sel.indexOf(q[0]) >= 0; }).map(function (q) { return q[1]; }).concat(data.meta.questions.v.own); }
function summaryText() {
  var s = summaryData(), st = s.st, ci = s.ci, L = [];
  L.push('MENOPAUSIA EQUILIBRADA — Resumen para mi consulta');
  L.push('Periodo: ' + fmt(s.from) + ' a ' + fmt(s.to) + ' · ' + st.logged.length + ' días registrados');
  L.push(''); L.push('CICLO');
  L.push('- Último sangrado: ' + (ci.lastEnd ? fmt(ci.lastEnd) + ' (' + ci.since + ' días)' : 'sin registrar'));
  if (ci.lengths.length) L.push('- Duración de mis últimos ciclos (días): ' + ci.lengths.slice(-6).join(', '));
  if (ci.stage) L.push('- Pista STRAW+10 (orientativa): ' + ci.stage.t);
  if (ci.pmb) L.push('- ATENCIÓN: sangrado el ' + fmt(ci.pmb) + ' tras 12 meses o más sin regla');
  L.push(''); L.push('SÍNTOMAS (intensidad media 0–3, días con el síntoma)');
  if (st.top.length) st.top.forEach(function (t) { L.push('- ' + t.name + ': ' + n1(t.avg) + ' · ' + t.days + ' días'); }); else L.push('- Sin síntomas marcados');
  L.push(''); L.push('SOFOCOS, SUEÑO, ENERGÍA Y ÁNIMO');
  L.push('- Sofocos por día (media): ' + (st.flAvg == null ? '—' : n1(st.flAvg)) + (st.flMax != null ? ' · máximo en un día: ' + st.flMax : ''));
  L.push('- Sueño: ' + (st.sleepAvg == null ? '—' : n1(st.sleepAvg) + ' h de media en ' + st.sleepN + ' noches') + (st.sleepQAvg == null ? '' : ' · calidad media: ' + QUAL[Math.round(st.sleepQAvg)]));
  L.push('- Energía media: ' + (st.energyAvg == null ? '—' : ENERGY[Math.round(st.energyAvg)]));
  L.push('- Ánimo medio: ' + (st.moodAvg == null ? '—' : MOODS[Math.round(st.moodAvg)]));
  L.push(''); L.push('CÓMO AFECTA A MI VIDA'); L.push(data.meta.impact.v ? data.meta.impact.v : '(sin completar)');
  L.push(''); L.push('MIS PREGUNTAS');
  var qs = selQuestions(); if (qs.length) qs.forEach(function (q, i) { L.push((i + 1) + '. ' + q); }); else L.push('(ninguna seleccionada)');
  L.push(''); L.push('Generado con Menopausia Equilibrada. Informa, no diagnostica.');
  return L.join('\n');
}
function summaryHTMLDoc() {
  var txt = summaryText();
  var body = esc(txt).split('\n').map(function (l) { if (/^[A-ZÁÉÍÓÚÑ ,]{4,}/.test(l) && l === l.toUpperCase() && l.trim()) return '<h2>' + l + '</h2>'; return l ? '<p>' + l + '</p>' : ''; }).join('');
  return docShell('Resumen para mi consulta', '<h1>Resumen para mi consulta</h1>' + body.replace(/<h2>MENOPAUSIA EQUILIBRADA[^<]*<\/h2>/, ''));
}
function viewConsulta() {
  var s = summaryData(), st = s.st, ci = s.ci;
  var h = head('Mi consulta', 'Llega con <span class="script" style="font-size:1.2em">datos</span>, no solo con recuerdos', 'Elige el periodo, escribe cómo te afecta y marca tus preguntas. El resumen se arma solo: imprímelo, descárgalo o cópialo.');
  h += '<div class="segs" role="radiogroup" aria-label="Periodo del resumen">' + [30, 60, 90].map(function (n) { return '<label class="seg"><input type="radio" name="sumRange" id="sumRange_' + n + '" value="' + n + '"' + (ui.sumRange === n ? ' checked' : '') + '><span>' + n + ' días</span></label>'; }).join('') + '</div>';
  h += '<div class="card"><label class="f" for="impact">¿Cómo afectan tus síntomas a tu vida? (trabajo, sueño, pareja, ánimo)<textarea id="impact" maxlength="1500" placeholder="Ej.: me despierto 3 veces por noche y llego agotada al trabajo.">' + esc(data.meta.impact.v) + '</textarea></label></div>';
  h += '<div class="card"><h2>Mis preguntas</h2><div class="qs">';
  QUESTIONS.forEach(function (q) { h += '<label for="q_' + q[0] + '"><input type="checkbox" id="q_' + q[0] + '" data-q="' + q[0] + '"' + (data.meta.questions.v.sel.indexOf(q[0]) >= 0 ? ' checked' : '') + '><span>' + esc(q[1]) + '</span></label>'; });
  data.meta.questions.v.own.forEach(function (q, i) { h += '<div class="row between" style="padding:9px 0;border-bottom:1px dashed var(--line)"><span style="min-width:0;flex:1">' + esc(q) + '</span><button type="button" class="ghost small" data-delq="' + i + '" aria-label="Quitar pregunta">Quitar</button></div>'; });
  h += '</div><form id="ownQ" class="row" style="align-items:flex-end"><label class="f" for="ownQIn" style="flex:1;min-width:200px">Añadir mi propia pregunta<input type="text" id="ownQIn" maxlength="200"></label><button type="submit">Añadir</button></form></div>';
  h += '<div class="sum" id="summary"><div><h2>Resumen</h2><p class="note">' + fmt(s.from) + ' – ' + fmt(s.to) + ' · ' + st.logged.length + ' días registrados</p></div>';
  if (!st.logged.length && !ci.lastEnd) h += '<div class="empty"><strong>Aún no hay datos para resumir</strong><span class="note">Registra algunos días en «Hoy» (y tu última regla en «Ciclo») y el resumen se llenará solo.</span></div>';
  h += '<div><h4>Ciclo</h4><div class="k"><span>Último sangrado</span><b>' + (ci.lastEnd ? fmt(ci.lastEnd) + ' · ' + ci.since + ' días' : '—') + '</b>' + (ci.lengths.length ? '<span>Últimos ciclos (días)</span><b>' + ci.lengths.slice(-6).join(', ') + '</b>' : '') + (ci.stage ? '<span>Pista STRAW+10</span><b>' + esc(ci.stage.t) + '</b>' : '') + '</div>' + (ci.pmb ? '<p style="color:var(--alert);font-weight:700;margin-top:6px">Sangrado el ' + fmt(ci.pmb) + ' tras 12 meses o más sin regla: comentarlo.</p>' : '') + '</div>';
  h += '<div><h4>Síntomas</h4>' + (st.top.length ? '<div class="k">' + st.top.map(function (t) { return '<span>' + esc(t.name) + ' <span class="note">· ' + t.days + ' d</span></span><b>' + n1(t.avg) + ' / 3</b>'; }).join('') + '</div>' : '<p class="note">Sin síntomas marcados.</p>') + '</div>';
  h += '<div><h4>Sofocos, sueño, energía y ánimo</h4><div class="k"><span>Sofocos por día (media)</span><b>' + (st.flAvg == null ? '—' : n1(st.flAvg)) + '</b><span>Máximo en un día</span><b>' + (st.flMax == null ? '—' : st.flMax) + '</b><span>Sueño medio</span><b>' + (st.sleepAvg == null ? '—' : n1(st.sleepAvg) + ' h') + '</b><span>Calidad del sueño</span><b>' + (st.sleepQAvg == null ? '—' : QUAL[Math.round(st.sleepQAvg)]) + '</b><span>Energía media</span><b>' + (st.energyAvg == null ? '—' : ENERGY[Math.round(st.energyAvg)]) + '</b><span>Ánimo medio</span><b>' + (st.moodAvg == null ? '—' : MOODS[Math.round(st.moodAvg)]) + '</b></div></div>';
  h += '<div><h4>Cómo me afecta</h4><p style="white-space:pre-line">' + (data.meta.impact.v ? esc(data.meta.impact.v) : '<span class="note">Escríbelo arriba.</span>') + '</p></div>';
  var qs = selQuestions();
  h += '<div><h4>Mis preguntas</h4>' + (qs.length ? '<ol>' + qs.map(function (q) { return '<li>' + esc(q) + '</li>'; }).join('') + '</ol>' : '<p class="note">Marca al menos una.</p>') + '</div></div>';
  h += '<div class="row"><button type="button" class="primary" data-act="pdfSum">Descargar resumen en PDF</button><button type="button" data-act="printSum">Imprimir</button><button type="button" class="ghost" data-act="copySum">Copiar texto</button></div>';
  h += '<p class="note">¿Prefieres una hoja completa para llenar? Usa la <a href="#plantillas/consulta">Hoja de consulta</a>: se rellena con tus registros.</p>';
  return h;
}

/* ---------- ciclo ---------- */
function viewCiclo() {
  var ci = cycleInfo(), t = today();
  var h = head('Ciclo', 'Tu ciclo, <span class="script" style="font-size:1.2em">en tus datos</span>', 'Toca los días en que sangraste. La app calcula los días desde tu última regla y te da una pista orientativa según el consenso STRAW+10.');
  if (ci.pmb) h += '<div class="hint alert" role="alert"><strong>Consulta: sangrado después de 12 meses sin regla</strong><span>Registraste sangrado el ' + fmt(ci.pmb) + ' tras 12 meses o más sin regla. Las guías de salud recomiendan consultar cualquier sangrado después de la menopausia, aunque sea poco o una sola vez.</span><span class="src">Fuente: HSE (Irlanda), «Postmenopausal bleeding».</span></div>';
  h += '<div class="stats"><div class="stat"><div class="v">' + (ci.since == null ? '—' : ci.since) + '</div><div class="l">' + (ci.since == null ? 'Registra tu última regla para empezar' : 'días desde tu último sangrado (' + fmt(ci.lastEnd) + ')') + '</div></div><div class="stat"><div class="v">' + ci.eps.length + '</div><div class="l">episodios de sangrado registrados</div></div><div class="stat"><div class="v">' + (ci.lengths.length ? ci.lengths[ci.lengths.length - 1] : '—') + '</div><div class="l">' + (ci.lengths.length ? 'días de tu último ciclo' : 'con dos reglas registradas verás tu ciclo') + '</div></div></div>';
  if (ci.stage) h += '<div class="hint"><strong>Pista orientativa: ' + esc(ci.stage.t) + '</strong><span>' + esc(ci.stage.d) + '</span><span class="note">No es un diagnóstico. Anticonceptivos hormonales, DIU hormonal, una histerectomía u otras condiciones cambian el ciclo.</span><span class="src">Fuente: Harlow et al., STRAW+10, <i>Menopause</i>, 2012.</span></div>';
  else h += '<div class="hint"><strong>Aún sin pista</strong><span>Con más reglas registradas, la app podrá decirte si tus ciclos varían 7 días o más, o si llevas 60 días o 12 meses sin regla.</span></div>';
  var m = ui.calMonth || t.slice(0, 7); var y = +m.slice(0, 4), mo = +m.slice(5, 7) - 1; var first = new Date(y, mo, 1), nd = new Date(y, mo + 1, 0).getDate(); var startDow = (first.getDay() + 6) % 7;
  h += '<div class="card"><div class="row between"><button type="button" class="ghost" data-act="calPrev" aria-label="Mes anterior" style="width:48px;padding:0">‹</button><strong style="font-family:var(--f-display);font-size:22px">' + cap(MESL[mo]) + ' ' + y + '</strong><button type="button" class="ghost" data-act="calNext" aria-label="Mes siguiente" style="width:48px;padding:0"' + (m >= t.slice(0, 7) ? ' disabled' : '') + '>›</button></div><div class="cal">';
  ['L', 'M', 'X', 'J', 'V', 'S', 'D'].forEach(function (dn) { h += '<div class="h" aria-hidden="true">' + dn + '</div>'; });
  for (var i = 0; i < startDow; i++) h += '<div></div>';
  for (var dd = 1; dd <= nd; dd++) {
    var k = y + '-' + z(mo + 1) + '-' + z(dd); var on = !!(data.days[k] && data.days[k].bleed); var fut = k > t;
    h += '<button type="button" data-cal="' + k + '" aria-pressed="' + on + '" aria-label="' + dd + ' de ' + MESL[mo] + (on ? ', sangrado registrado' : '') + '"' + (fut ? ' disabled' : '') + (k === t ? ' class="today"' : '') + '>' + dd + '</button>';
  }
  h += '</div><p class="note">Toca un día para marcar o quitar sangrado.</p></div>';
  h += '<div class="card"><label class="f" for="priorLP">¿Cuándo fue tu última regla antes de usar la app? (opcional)<input type="date" id="priorLP" max="' + t + '" value="' + esc(ci.prior) + '" style="max-width:220px"></label></div>';
  if (ci.eps.length) { h += '<div class="card"><h2>Historial de sangrados</h2><div class="toplist">'; ci.eps.slice().reverse().slice(0, 12).forEach(function (e) { h += '<div class="row between" style="border-bottom:1px dashed var(--line);padding-bottom:6px"><span>' + fmt(e.start) + (e.end !== e.start ? ' – ' + fmt(e.end) : '') + '</span><span class="note">' + e.days + ' día' + (e.days > 1 ? 's' : '') + '</span></div>'; }); h += '</div></div>'; }
  return h;
}

/* ---------- alarma ---------- */
function viewAlarma() {
  return head('Señales de alarma', 'Cuándo <span class="script" style="font-size:1.2em">no esperar</span>', 'La mayoría de los cambios de la menopausia se pueden hablar en una consulta normal. Estos no esperan.') +
    '<div class="hint alert"><strong>Pensamientos de hacerte daño o de que no vale la pena vivir</strong><span>Busca ayuda ahora: llama a los servicios de emergencia de tu país o ve a urgencias. Si puedes, avisa a alguien de confianza para que te acompañe. No tienes que pasar por esto sola.</span></div>' +
    '<div class="hint alert"><strong>Sangrado después de 12 meses sin regla</strong><span>Pide cita pronto, aunque sea poco, solo manchado, rosado o marrón, o haya pasado una sola vez. Casi siempre tiene una causa benigna, pero hay que revisarlo.</span><span class="src">Fuente: HSE (servicio de salud de Irlanda), «Postmenopausal bleeding».</span></div>' +
    '<div class="hint"><strong>Tristeza que no se va</strong><span>Si casi todos los días te sientes triste, vacía o sin interés por lo que antes disfrutabas, y dura semanas, coméntalo con un profesional. En la perimenopausia el riesgo de depresión es mayor, y tiene tratamiento.</span><span class="src">Fuente: Badawy et al., <i>Journal of Affective Disorders</i>, 2024.</span></div>' +
    '<div class="hint"><strong>Síntomas que te impiden funcionar</strong><span>Si los sofocos, el insomnio o el dolor te hacen faltar al trabajo o cambiar tu vida, no es «aguantar»: es motivo de consulta. Lleva tu resumen desde <a href="#consulta">Mi consulta</a>.</span></div>';
}

/* ---------- cuenta ---------- */
function viewCuenta() {
  var n = Object.keys(real.days).length;
  var h = head('Mi cuenta', 'Tu progreso, <span class="script" style="font-size:1.2em">en todos lados</span>', 'Sin contraseñas ni correos: tu enlace personal es tu llave. Ábrelo en tu celular y en tu computador y verás lo mismo en los dos.');
  h += '<div class="card"><div class="row between"><h2>Sincronización</h2><span class="kick" id="syncBadge">' + (syncState === 'off' ? 'Sin conexión' : 'Activa') + '</span></div><p class="status" id="syncStatus">' + syncLine() + '</p><div class="row"><button type="button" class="primary" data-act="syncNow">Sincronizar ahora</button></div></div>';
  h += '<div class="card pink"><h2>Tu enlace personal</h2><p>Guárdalo en un lugar seguro (por ejemplo, envíatelo por mensaje). Quien tenga este enlace puede ver tus registros, así que no lo publiques.</p>' +
    '<div class="code" id="myLink">' + esc(personalLink()) + '</div><div class="row"><button type="button" class="dark" data-act="copyLink">Copiar enlace</button><button type="button" data-act="copyCode">Copiar solo el código</button></div>' +
    '<div class="row" style="align-items:flex-start;gap:16px"><div class="qr" id="qr" aria-label="Código QR de tu enlace personal" role="img"></div><p class="note" style="flex:1;min-width:180px">Escanea este código con la cámara de tu celular para abrir la app con tus datos. Tu código: <b>' + esc(code) + '</b></p></div></div>';
  h += '<div class="card"><h2>¿Ya usas la app en otro dispositivo?</h2><p class="note">Pega aquí el enlace o el código de tu otro dispositivo. Los datos de los dos se juntan, sin perder nada.</p><form id="linkForm" class="row" style="align-items:flex-end"><label class="f" for="linkIn" style="flex:1;min-width:220px">Pegar mi enlace o código<input type="text" id="linkIn" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="rosa-luna-miel-sol-12345-67890"></label><button type="submit" class="primary">Vincular</button></form></div>';
  h += '<div class="card"><h2>Instalar en tu pantalla de inicio</h2><ul style="margin:0;padding-left:20px;display:flex;flex-direction:column;gap:6px"><li><b>iPhone (Safari):</b> toca Compartir y luego «Añadir a pantalla de inicio».</li><li><b>Android (Chrome):</b> toca el menú ⋮ y luego «Instalar app» o «Añadir a pantalla de inicio».</li><li><b>Computador (Chrome o Edge):</b> usa el icono de instalar en la barra de direcciones.</li></ul></div>';
  h += '<div class="stats"><div class="stat"><div class="v">' + n + '</div><div class="l">días registrados</div></div><div class="stat"><div class="v">' + Object.keys(real.tpl).length + '</div><div class="l">plantillas con contenido</div></div><div class="stat"><div class="v">' + (planDayNum() || '—') + '</div><div class="l">día del plan de 30 días</div></div></div>';
  h += '<div class="card pink"><h2>Tu informe en PDF</h2><p>Un PDF bonito y ordenado con todo tu progreso: resumen, gráficas, plan de 30 días, ciclo, historial día a día, tus preguntas y tus plantillas. Ideal para guardarlo o llevarlo a tu consulta.</p>' +
    '<div><div class="note" style="margin-bottom:6px;font-weight:600;color:var(--ink)">Periodo</div><div class="segs" role="radiogroup" aria-label="Periodo del informe">' + [['30', '30 días'], ['90', '90 días'], ['all', 'Todo mi historial']].map(function (o) { return '<label class="seg"><input type="radio" name="pdfRange" id="pdfRange_' + o[0] + '" value="' + o[0] + '"' + (String(ui.pdfRange || '30') === o[0] ? ' checked' : '') + '><span>' + o[1] + '</span></label>'; }).join('') + '</div></div>' +
    '<label class="f" for="pdfName">Tu nombre en la portada (opcional)<input type="text" id="pdfName" maxlength="60" autocomplete="name" value="' + esc(lsGet('me.name') || '') + '"></label>' +
    '<div class="row"><button type="button" class="dark" data-act="pdfFull">Descargar mi informe (PDF)</button></div><p class="note">Se crea en tu dispositivo; tus datos no se envían a ningún sitio para hacerlo.</p></div>';
  h += '<details class="card adv"' + (ui.importPending ? ' open' : '') + '><summary><b>Opciones avanzadas</b> <span class="note">· copia técnica para restaurar</span></summary><p class="note">Solo si cambias de navegador sin conexión o quieres un respaldo extra: un archivo técnico (no es para leer) que la app puede volver a cargar.</p><div class="row"><button type="button" class="small" data-act="export">Descargar copia técnica</button></div>';
  h += '<label class="f" for="importFile">Cargar una copia técnica<input type="file" id="importFile" accept="application/json,.json"></label>';
  if (ui.importPending) h += '<div class="hint"><strong>Copia lista: ' + Object.keys(ui.importPending.days).length + ' días</strong><span>¿Qué quieres hacer?</span><div class="row"><button type="button" class="primary" data-act="impMerge">Combinar con mis datos</button><button type="button" data-act="impReplace">Reemplazar mis datos</button><button type="button" class="ghost" data-act="impCancel">Cancelar</button></div></div>';
  h += '</details>';
  h += '<div class="card"><h2>Ver un ejemplo</h2><p class="note">Explora la app con 30 días inventados. No se mezclan con los tuyos ni se guardan.</p><div class="row"><button type="button" data-act="' + (demo ? 'demoOff' : 'demoOn') + '">' + (demo ? 'Salir del ejemplo' : 'Ver con datos de ejemplo') + '</button></div></div>';
  h += '<div class="card"><h2>Borrar todo</h2><p class="note">Elimina todos tus datos de este dispositivo y de tu copia sincronizada (y por tanto de tus otros dispositivos). No se puede deshacer.</p>';
  if (!ui.confirmDel) h += '<div class="row"><button type="button" class="danger" data-act="delAsk">Borrar todos mis datos</button></div>';
  else h += '<div class="hint alert"><strong>¿Seguro? Se borrarán ' + n + ' días y todas tus plantillas y tu plan.</strong><div class="row"><button type="button" class="danger" data-act="delYes">Sí, borrar todo</button><button type="button" class="ghost" data-act="delNo">Cancelar</button></div></div>';
  h += '</div>';
  h += '<div class="card"><h2>Aviso</h2><p class="note">Menopausia Equilibrada informa; no sustituye a tu profesional de salud ni hace diagnósticos. Las pistas del ciclo siguen el consenso STRAW+10 (Harlow et al., <i>Menopause</i>, 2012) y son orientativas. Tus datos se guardan en este dispositivo y en una copia en la nube asociada al hash de tu código; el código no se envía al servidor.</p></div>';
  return h;
}
function drawQR() {
  var el = $('#qr'); if (!el) return;
  el.innerHTML = '';
  if (typeof window.QRCode !== 'function') { el.innerHTML = '<span class="note" style="text-align:center">El código QR aparece cuando hay conexión.</span>'; return; }
  try { new window.QRCode(el, { text: personalLink(), width: 180, height: 180, colorDark: '#2B1B24', colorLight: '#ffffff', correctLevel: window.QRCode.CorrectLevel.M }); } catch (e) { }
}

/* =========================================================
   Enrutador
   ========================================================= */
var VIEWS = { hoy: viewHoy, progreso: viewProgreso, plan30: viewPlan30, plantillas: viewPlantillas, consulta: viewConsulta, ciclo: viewCiclo, alarma: viewAlarma, cuenta: viewCuenta };
var ALIAS = { tendencias: 'progreso', ajustes: 'cuenta', sync: 'cuenta', sincronizar: 'cuenta', inicio: 'hoy', diario: 'hoy', historial: 'progreso', plan: 'plan30' };
function parseHash() {
  var raw = (location.hash || '').replace(/^#\/?/, '');
  var q = ''; var qi = raw.indexOf('?'); if (qi >= 0) { q = raw.slice(qi + 1); raw = raw.slice(0, qi); }
  var parts = raw.split('/'); var v = decodeURIComponent(parts[0] || '').toLowerCase();
  if (ALIAS[v]) v = ALIAS[v];
  if (!VIEWS[v]) v = 'hoy';
  var params = {}; q.split('&').forEach(function (kv) { if (!kv) return; var p = kv.split('='); params[decodeURIComponent(p[0])] = decodeURIComponent(p.slice(1).join('=') || ''); });
  return { v: v, sub: parts[1] ? decodeURIComponent(parts[1]) : null, params: params };
}

/* =========================================================
   Acceso (la app es parte del Pack Menopausia sin tabú)
   ========================================================= */
var KEY_ACC = 'me.acc';
var access = (lsGet(KEY_ACC) || '').toLowerCase();
function accFmt(a) { return /^[0-9a-f]{14}-[0-9a-f]{10}$/.test(a); }
function findAcc(txt) { var m = String(txt || '').toLowerCase().match(/[0-9a-f]{14}-[0-9a-f]{10}/); return m ? m[0] : ''; }
var unlocked = accFmt(access);
var unlocking = false;
function showLock(msg) {
  var l = $('#lock');
  if (!l) {
    l = document.createElement('div'); l.id = 'lock'; l.className = 'lock'; l.setAttribute('role', 'dialog'); l.setAttribute('aria-modal', 'true'); l.setAttribute('aria-labelledby', 'lockT');
    l.innerHTML = '<div class="lock-c"><img class="lock-img" src="/img/cut02a.webp" alt="" width="180" height="227">' +
      '<span class="kick">Acceso privado</span><h1 id="lockT">Tu app <span class="script">te espera</span></h1>' +
      '<p class="lede">Esta app es parte del <b>Pack Menopausia sin tabú</b>. Escribe tu código de acceso: está en tu página de descargas.</p>' +
      '<form id="lockForm" class="lock-f"><label class="f" for="lockIn">Código de acceso o enlace personal<input id="lockIn" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="ej. 90aa78f42e844d-1a2b3c4d5e"></label>' +
      '<p class="lock-err" id="lockErr" role="alert" hidden></p><button type="submit" class="primary" id="lockBtn">Entrar</button></form>' +
      '<p class="note">¿Ya la usas en otro dispositivo? Pega aquí tu enlace personal (está en «Mi cuenta»).</p>' +
      '<a class="btn ghost" href="/oferta/">¿Aún no tienes el pack? Conócelo aquí</a></div>';
    document.body.appendChild(l);
    $('#lockForm').addEventListener('submit', function (e) { e.preventDefault(); var a = findAcc($('#lockIn').value); if (!a) { lockErr('Revisa el código: son 14 letras y números, un guion y 10 más.'); return; } tryUnlock(a, true); });
  }
  l.hidden = false; document.body.classList.add('locked');
  if (msg) lockErr(msg);
  setTimeout(function () { var i = $('#lockIn'); if (i) i.focus(); }, 60);
}
function lockErr(m) { var e = $('#lockErr'); if (e) { e.textContent = m; e.hidden = !m; } }
function hideLock() { var l = $('#lock'); if (l) l.hidden = true; document.body.classList.remove('locked'); }
function tryUnlock(a, fromForm) {
  if (unlocking) return; unlocking = true; var btn = $('#lockBtn'); if (btn) btn.disabled = true;
  return fetch('/api/acceso', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code: a }) })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      unlocking = false; if (btn) btn.disabled = false;
      if (d && d.ok) { access = a; lsSet(KEY_ACC, a); var was = unlocked; unlocked = true; hideLock(); render(); if (!was) { toast('¡Bienvenida' + (d.name ? ', ' + d.name : '') + '! Tu app está lista.'); if (typeof confetti === 'function') confetti(); sync(); } }
      else { if (!unlocked || !fromForm) { showLock(); lockErr((d && d.error) || 'Ese código no es válido.'); } }
    })
    .catch(function () { unlocking = false; if (btn) btn.disabled = false; lockErr('Sin conexión. Inténtalo de nuevo cuando tengas internet.'); });
}
function revalidate() {
  if (!unlocked || !access) return;
  fetch('/api/acceso', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code: access }) })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) { if (d && d.ok === false) { unlocked = false; access = ''; lsDel(KEY_ACC); showLock('Tu acceso ya no está activo. Escribe un código válido.'); } })
    .catch(function () { });
}
var lastView = null, lastSub = null;
function render() {
  var r = parseHash();
  var ka = findAcc(r.params.k || r.params.a || '');
  if (ka && ka !== access) {
    history.replaceState(null, '', '#' + r.v + (r.params.c ? '?c=' + encodeURIComponent(r.params.c) : ''));
    tryUnlock(ka);
    if (!unlocked) { showLock(); return; }
  }
  if (!unlocked) { showLock(); return; }
  ui.tplSub = r.v === 'plantillas' ? r.sub : null;
  if (r.v === 'cuenta' && r.params.c) {
    var c = r.params.c;
    history.replaceState(null, '', '#cuenta');
    if (normCode(c) !== code) { linkCode(c); }
  }
  $$('nav.tabs a').forEach(function (a) { if (a.dataset.v === r.v) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  curView = r.v;
  var vEl = $('#view');
  vEl.innerHTML = VIEWS[r.v]();
  if (lastView !== r.v || lastSub !== ui.tplSub) { vEl.classList.remove('enter'); void vEl.offsetWidth; vEl.classList.add('enter'); }
  $('#demoBanner').hidden = !demo;
  $('#storeWarn').hidden = storageOK;
  document.title = { hoy: 'Hoy', progreso: 'Mi progreso', plan30: 'Plan de 30 días', plantillas: 'Plantillas', consulta: 'Mi consulta', ciclo: 'Ciclo', alarma: 'Señales de alarma', cuenta: 'Mi cuenta' }[r.v] + ' · Menopausia Equilibrada';
  if (r.v === 'cuenta') drawQR();
  if (lastView !== r.v || lastSub !== ui.tplSub) {
    window.scrollTo(0, 0); lastView = r.v; lastSub = ui.tplSub;
    var act = document.querySelector('nav.tabs a[aria-current="page"]'); if (act && act.scrollIntoView) { try { act.scrollIntoView({ block: 'nearest', inline: 'center' }); } catch (e) { } }
  }
}
function rerenderKeepFocus() {
  var ae = document.activeElement, id = ae && ae.id, ss = null, se = null;
  try { if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA') && typeof ae.selectionStart === 'number') { ss = ae.selectionStart; se = ae.selectionEnd; } } catch (e) { }
  var y = window.scrollY; render();
  if (id) { var el = document.getElementById(id); if (el) { el.focus({ preventScroll: true }); try { if (ss != null) el.setSelectionRange(ss, se); } catch (e) { } } }
  window.scrollTo(0, y);
}
var pendingSoft = false;
function softRender() {
  // tras recibir cambios de otro dispositivo: no interrumpir a quien está escribiendo
  var ae = document.activeElement;
  if (ae && (ae.tagName === 'TEXTAREA' || (ae.tagName === 'INPUT' && /text|number|date|search/.test(ae.type)))) { pendingSoft = true; return; }
  pendingSoft = false; rerenderKeepFocus();
}
document.addEventListener('focusout', function () { if (pendingSoft) setTimeout(function () { if (pendingSoft) softRender(); }, 50); });
window.addEventListener('hashchange', render);

/* =========================================================
   Eventos
   ========================================================= */
function popEl(id) { var el = document.getElementById(id); if (!el) return; el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
function confetti() {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var box = document.createElement('div'); box.className = 'confetti'; box.setAttribute('aria-hidden', 'true');
  var kinds = ['heart', 'star', 'spark', 'heart'], cols = ['#E0337A', '#F7A8C7', '#FFD95A', '#9B1B4F', '#F48FB1', '#CFE3F7'], h = '';
  for (var i = 0; i < 34; i++) {
    var sz = 12 + Math.round(Math.random() * 14), dur = 1.4 + Math.random() * 1.2;
    h += '<i style="left:' + (Math.random() * 100).toFixed(1) + '%;--dx:' + Math.round(Math.random() * 120 - 60) + 'px;--rot:' + Math.round(Math.random() * 720 - 360) + 'deg;animation-duration:' + dur.toFixed(2) + 's;animation-delay:' + (Math.random() * .35).toFixed(2) + 's">' + stkSVG(kinds[i % 4], sz, cols[i % cols.length]) + '</i>';
  }
  box.innerHTML = h; document.body.appendChild(box); setTimeout(function () { box.remove(); }, 3200);
}
function saved(msg) { changed(); var st = $('#saveStatus'); if (st) st.textContent = demo ? 'Ejemplo: los cambios no se guardan.' : (msg || 'Guardado · ' + hhmm(now())); }
document.addEventListener('change', function (e) {
  var t = e.target;
  if (t.dataset.sym) { touchDay(ui.day).s[t.dataset.sym] = +t.value; saved(); return; }
  if (t.name === 'sleepQ') { touchDay(ui.day).sleepQ = +t.value; saved(); return; }
  if (t.name === 'mood') { touchDay(ui.day).mood = +t.value; saved(); return; }
  if (t.name === 'energy') { touchDay(ui.day).energy = +t.value; saved(); return; }
  if (t.id === 'sleepH') { var v = t.value === '' ? null : clamp(+t.value, 0, 16); touchDay(ui.day).sleepH = isNaN(v) ? null : v; saved(); return; }
  if (t.id === 'bleed') { touchDay(ui.day).bleed = t.checked; saved(); rerenderKeepFocus(); return; }
  if (t.id === 'dayPick') { if (t.value && t.value <= today()) { ui.day = t.value; rerenderKeepFocus(); } return; }
  if (t.name === 'range') { ui.range = +t.value; rerenderKeepFocus(); return; }
  if (t.name === 'pdfRange') { ui.pdfRange = t.value; return; }
  if (t.name === 'sumRange') { ui.sumRange = +t.value; rerenderKeepFocus(); return; }
  if (t.dataset.q) { var sel = data.meta.questions.v.sel; var i = sel.indexOf(t.dataset.q); if (t.checked && i < 0) sel.push(t.dataset.q); if (!t.checked && i >= 0) sel.splice(i, 1); data.meta.questions.u = now(); changed(); rerenderKeepFocus(); return; }
  if (t.id === 'priorLP') { data.meta.lastPeriodBefore = { v: isISO(t.value) ? t.value : '', u: now() }; changed(); rerenderKeepFocus(); return; }
  if (t.dataset.habit) { var n = +t.dataset.pday; var p = data.plan.days[n] || { h: {}, u: 0 }; p.h[t.dataset.habit] = t.checked; p.u = now(); data.plan.days[n] = p; changed(); rerenderKeepFocus(); var hl = document.querySelector('label[for="hb_' + t.dataset.habit + '"]'); if (hl && t.checked) hl.classList.add('just'); if (planDone(n) === 6 && t.checked) { toast('¡Día completo! 6 de 6. Qué orgullo.'); confetti(); } else if (planDone(n) === 4 && t.checked) { toast('Día cumplido. ¡Sigue así!'); confetti(); } return; }
  if (t.dataset.shop != null && t.dataset.id) { var tt = tplData(t.dataset.id); var it = tt.items[+t.dataset.shop]; if (it) { it.d = t.checked; tt.u = now(); changed(); rerenderKeepFocus(); } return; }
  if (t.id === 'importFile' && t.files && t.files[0]) {
    var f = t.files[0]; if (f.size > 1048576) { toast('El archivo es demasiado grande.'); return; }
    var rd = new FileReader();
    rd.onload = function () { try { var o = JSON.parse(rd.result); ui.importPending = (o && o.v === 2) ? normalize(o) : fromV1(o); render(); } catch (err) { toast('Ese archivo no es una copia válida.'); } };
    rd.readAsText(f); return;
  }
});
var tplT = null;
document.addEventListener('input', function (e) {
  var t = e.target;
  if (t.id === 'note') { touchDay(ui.day).note = t.value.slice(0, 2000); saved(); return; }
  if (t.id === 'pdfName') { lsSet('me.name', t.value.slice(0, 60)); return; }
  if (t.id === 'impact') { data.meta.impact = { v: t.value.slice(0, 1500), u: now() }; changed(); return; }
  if (t.dataset.tpl && t.dataset.tk) {
    setTplValue(t.dataset.tpl, t.dataset.tk, t.value);
    saveLocal(); scheduleSync(1500);
    clearTimeout(tplT); tplT = setTimeout(function () { var s = $('#tplStatus'); if (s) s.textContent = 'Guardada · ' + hhmm(now()) + '.'; }, 300);
  }
});
document.addEventListener('submit', function (e) {
  var f = e.target;
  if (f.id === 'ownQ') { e.preventDefault(); var inp = $('#ownQIn'); var v = (inp.value || '').trim(); if (!v) return; var own = data.meta.questions.v.own; if (own.length >= 30) { toast('Máximo 30 preguntas propias.'); return; } own.push(v.slice(0, 200)); data.meta.questions.u = now(); changed(); render(); var nn = $('#ownQIn'); if (nn) nn.focus(); return; }
  if (f.id === 'linkForm') { e.preventDefault(); var val = ($('#linkIn').value || '').trim(); var m = val.match(/[?&]c=([^&#\s]+)/); if (linkCode(m ? decodeURIComponent(m[1]) : val)) $('#linkIn').value = ''; return; }
  if (f.dataset.additem != null) {
    e.preventDefault(); var inpt = f.querySelector('input'); var txt = (inpt.value || '').trim(); if (!txt) return;
    var tp = tplData(f.dataset.id); tp.items.push({ c: +f.dataset.additem, t: txt.slice(0, 120), d: false }); tp.u = now(); changed();
    var fid = inpt.id; render(); var ni = document.getElementById(fid); if (ni) ni.focus(); return;
  }
});
function download(filename, text, type) {
  try {
    var blob = new Blob([text], { type: (type || 'text/plain') + ';charset=utf-8' });
    var u = URL.createObjectURL(blob); var a = document.createElement('a'); a.href = u; a.download = filename; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(u); a.remove(); }, 1500); toast('Archivo descargado.');
  } catch (e) { toast('No se pudo descargar en este navegador.'); }
}
function printDoc(html) {
  var w = window.open('', '_blank');
  if (!w) { download('documento-menopausia-equilibrada.html', html, 'text/html'); return; }
  w.document.open(); w.document.write(html); w.document.close(); w.focus();
  setTimeout(function () { try { w.print(); } catch (e) { } }, 450);
}
function copyText(txt, ok) {
  function fb() { var ta = document.createElement('textarea'); ta.value = txt; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); toast(ok); } catch (e) { toast('Selecciona el texto y cópialo manualmente.'); } ta.remove(); }
  try { navigator.clipboard.writeText(txt).then(function () { toast(ok); }, fb); } catch (e) { fb(); }
}
document.addEventListener('click', function (e) {
  var b = e.target.closest('button'); if (!b || b.disabled) return;
  if (b.dataset.cal) { var k = b.dataset.cal; var d = touchDay(k); d.bleed = !d.bleed; changed(); rerenderKeepFocus(); var nb = document.querySelector('[data-cal="' + k + '"]'); if (nb) nb.focus(); return; }
  if (b.dataset.delq != null) { data.meta.questions.v.own.splice(+b.dataset.delq, 1); data.meta.questions.u = now(); changed(); render(); return; }
  if (b.dataset.edit) { ui.day = b.dataset.edit; location.hash = '#hoy'; return; }
  if (b.dataset.pview) { ui.planView = +b.dataset.pview; rerenderKeepFocus(); return; }
  if (b.dataset.tplact) {
    var id = b.dataset.id, ta = b.dataset.tplact, tp = tplData(id);
    if (ta === 'prefill') { tplPrefill(id); changed(); render(); toast('Rellenada con tus registros. Revísala y complétala.'); }
    else if (ta === 'print') printDoc(tplDoc(id));
    else if (ta === 'pdf') makePdf('tpl', { id: id });
    else if (ta === 'download') download(TPL_BY[id].t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-') + '.html', tplDoc(id), 'text/html');
    else if (ta === 'clear') { if (confirm('¿Vaciar esta plantilla? Se borrará su contenido en todos tus dispositivos.')) { data.tpl[id] = normTpl(id, {}); data.tpl[id].u = now(); changed(); render(); } }
    else if (ta === 'addrow') { if (tp.rows.length >= 40) return; if (!tp.rows.length) tp.rows.push(['', '', '', '']); tp.rows.push(['', '', '', '']); tp.u = now(); changed(); render(); }
    else if (ta === 'delrow') { tp.rows.splice(+b.dataset.i, 1); tp.u = now(); changed(); render(); }
    else if (ta === 'delitem') { e.preventDefault(); tp.items.splice(+b.dataset.i, 1); tp.u = now(); changed(); render(); }
    return;
  }
  var a = b.dataset.act; if (!a) return;
  switch (a) {
    case 'welcomeOk': onboarded = true; lsSet('me.onboarded', '1'); render(); break;
    case 'prevDay': ui.day = addDays(ui.day, -1); rerenderKeepFocus(); break;
    case 'nextDay': if (ui.day < today()) { ui.day = addDays(ui.day, 1); rerenderKeepFocus(); } break;
    case 'flPlus': var d1 = touchDay(ui.day); d1.flashes = Math.min(99, (d1.flashes || 0) + 1); $('#flOut').textContent = d1.flashes; popEl('flOut'); saved(); break;
    case 'flMinus': var d2 = touchDay(ui.day); d2.flashes = Math.max(0, (d2.flashes || 0) - 1); $('#flOut').textContent = d2.flashes; popEl('flOut'); saved(); break;
    case 'waPlus': var d3 = touchDay(ui.day); d3.water = Math.min(30, (d3.water || 0) + 1); $('#waOut').textContent = d3.water; popEl('waOut'); saved(); break;
    case 'waMinus': var d4 = touchDay(ui.day); d4.water = Math.max(0, (d4.water || 0) - 1); $('#waOut').textContent = d4.water; popEl('waOut'); saved(); break;
    case 'clearDay': delete data.days[ui.day]; data.deleted[ui.day] = now(); changed(); render(); toast('Registro del día borrado.'); break;
    case 'calPrev': case 'calNext': var m = ui.calMonth || today().slice(0, 7); var dt = new Date(+m.slice(0, 4), +m.slice(5, 7) - 1 + (a === 'calPrev' ? -1 : 1), 1); ui.calMonth = dt.getFullYear() + '-' + z(dt.getMonth() + 1); rerenderKeepFocus(); break;
    case 'histAll': ui.histAll = true; rerenderKeepFocus(); break;
    case 'planStart': data.plan.start = { v: today(), u: now() }; ui.planView = null; changed(); render(); toast('¡Plan iniciado! Hoy es tu día 1.'); confetti(); break;
    case 'planToday': ui.planView = null; rerenderKeepFocus(); break;
    case 'planReset': if (confirm('¿Reiniciar el plan? Se borrará el progreso de los 30 días.')) { data.plan.start = { v: today(), u: now() }; var t0 = now(); for (var i = 1; i <= 30; i++) data.plan.days[i] = { h: {}, u: t0 }; ui.planView = null; changed(); render(); } break;
    case 'pdfFull': makePdf('full', { range: ui.pdfRange || '30' }); break;
    case 'pdfProg': makePdf('full', { range: ui.range }); break;
    case 'pdfSum': makePdf('consulta'); break;
    case 'copySum': copyText(summaryText(), 'Resumen copiado.'); break;
    case 'printSum': printDoc(summaryHTMLDoc()); break;
    case 'dlSumHtml': download('resumen-consulta.html', summaryHTMLDoc(), 'text/html'); break;
    case 'dlSumTxt': download('resumen-consulta.txt', summaryText(), 'text/plain'); break;
    case 'syncNow': sync({ toast: 'Sincronizado.' }).then(function () { var st = $('#syncStatus'); if (st) st.textContent = syncLine(); }); break;
    case 'copyLink': copyText(personalLink(), 'Enlace copiado. Ábrelo en tu otro dispositivo.'); break;
    case 'copyCode': copyText(code, 'Código copiado.'); break;
    case 'export': download('copia-tecnica-menopausia-equilibrada-' + today() + '.json', JSON.stringify(real, null, 1), 'application/json'); break;
    case 'impMerge': real = merge(real, ui.importPending); if (demo) exitDemo(); data = real; ui.importPending = null; changed(); render(); toast('Copia combinada con tus datos.'); break;
    case 'impReplace': var w = now(); var imp = ui.importPending; real = blank(); real.wipe = w - 1; real = merge(real, stamp(imp, w)); if (demo) exitDemo(); data = real; ui.importPending = null; real.wipe = w - 1; changed(); render(); toast('Datos reemplazados por la copia.'); break;
    case 'impCancel': ui.importPending = null; render(); break;
    case 'delAsk': ui.confirmDel = true; render(); break;
    case 'delNo': ui.confirmDel = false; render(); break;
    case 'delYes': var wipe = now(); real = blank(); real.wipe = wipe; if (!demo) data = real; ui.confirmDel = false; saveLocal(); sync({ toast: 'Todos tus datos se borraron.' }); render(); break;
    case 'demoOn': enterDemo(); break;
    case 'demoOff': exitDemo(); render(); break;
  }
});
function stamp(doc, t) { // marca todo como recién editado (para «reemplazar»)
  var d = normalize(doc);
  Object.keys(d.days).forEach(function (k) { d.days[k].u = t; });
  Object.keys(d.plan.days).forEach(function (k) { d.plan.days[k].u = t; });
  if (d.plan.start.v) d.plan.start.u = t;
  Object.keys(d.tpl).forEach(function (k) { d.tpl[k].u = t; });
  ['lastPeriodBefore', 'impact', 'questions'].forEach(function (k) { d.meta[k].u = t; });
  d.deleted = {}; d.wipe = 0; return d;
}
$('#exitDemo').addEventListener('click', function () { exitDemo(); render(); });

/* =========================================================
   Informes en PDF (con la marca): informe completo, resumen
   para la consulta y cada plantilla. Se crean en el navegador.
   ========================================================= */
var PDF_LIBS = ['/vendor/html2canvas.min.js', '/vendor/jspdf.umd.min.js'];
var pdfBusy = false;
function loadScript(src) {
  return new Promise(function (res, rej) {
    var s = document.createElement('script'); s.src = src; s.async = true;
    s.onload = function () { res(); }; s.onerror = function () { rej(new Error('No se pudo cargar ' + src)); };
    document.head.appendChild(s);
  });
}
function loadPdfLibs() {
  if (window.html2canvas && window.jspdf && window.jspdf.jsPDF) return Promise.resolve();
  return PDF_LIBS.reduce(function (p, src) { return p.then(function () { return loadScript(src); }); }, Promise.resolve());
}
var STK = {
  heart: 'M12 21.6C5.4 16.4 1.5 12.6 1.5 8.4 1.5 5.4 3.9 3 6.9 3c2 0 3.9 1.1 5.1 2.8C13.2 4.1 15.1 3 17.1 3c3 0 5.4 2.4 5.4 5.4 0 4.2-3.9 8-10.5 13.2z',
  star: 'M12 1.6l3.2 6.6 7.2 1-5.2 5 1.3 7.2L12 18l-6.5 3.4 1.3-7.2-5.2-5 7.2-1z',
  spark: 'M12 0C12.9 7 17 11.1 24 12 17 12.9 12.9 17 12 24 11.1 17 7 12.9 0 12 7 11.1 11.1 7 12 0z'
};
function stkSVG(kind, size, color) {
  var inner;
  if (kind === 'flower') {
    inner = '';
    for (var i = 0; i < 5; i++) { var a = (i * 72 - 90) * Math.PI / 180; inner += '<circle cx="' + (12 + 6 * Math.cos(a)).toFixed(2) + '" cy="' + (12 + 6 * Math.sin(a)).toFixed(2) + '" r="5.4" fill="' + color + '" stroke="#fff" stroke-width="2"/>'; }
    inner = '<g transform="translate(.9 1.4)" opacity=".16">' + inner.replace(/fill="[^"]+"/g, 'fill="#9B1B4F"').replace(/stroke="#fff"/g, 'stroke="none"') + '</g>' + inner + '<circle cx="12" cy="12" r="4" fill="#FFD95A" stroke="#fff" stroke-width="2"/>';
  } else {
    var d = STK[kind];
    inner = '<path d="' + d + '" fill="#9B1B4F" opacity=".16" transform="translate(.9 1.4)"/><path d="' + d + '" fill="' + color + '" stroke="#fff" stroke-width="2.2" stroke-linejoin="round"/>';
  }
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-3 -3 30 30" width="' + size + '" height="' + size + '">' + inner + '</svg>';
}
function stk(kind, size, color, css) { return '<div class="rp-stk" style="' + css + ';width:' + size + 'px;height:' + size + 'px">' + stkSVG(kind, size, color) + '</div>'; }
var STK_SETS = [
  function () { return stk('heart', 62, '#E0337A', 'right:6px;top:-4px;transform:rotate(12deg)') + stk('star', 34, '#FFD95A', 'right:78px;top:34px;transform:rotate(-14deg)') + stk('spark', 26, '#F7A8C7', 'right:2px;top:70px'); },
  function () { return stk('flower', 58, '#F7A8C7', 'right:10px;top:-2px') + stk('heart', 30, '#9B1B4F', 'right:84px;top:44px;transform:rotate(-16deg)') + stk('spark', 24, '#FFD95A', 'right:0;top:66px'); },
  function () { return stk('star', 56, '#FFD95A', 'right:8px;top:-6px;transform:rotate(10deg)') + stk('heart', 34, '#F48FB1', 'right:80px;top:30px;transform:rotate(-10deg)') + stk('spark', 24, '#E0337A', 'right:4px;top:66px'); },
  function () { return stk('spark', 50, '#E0337A', 'right:14px;top:-4px') + stk('flower', 40, '#CFE3F7', 'right:76px;top:30px') + stk('heart', 26, '#F7A8C7', 'right:0;top:62px;transform:rotate(14deg)'); }
];
var RP_CSS = '' +
  '#rpHost{position:absolute;left:-14000px;top:0;width:794px;pointer-events:none}' +
  '.rp{width:794px;height:1123px;position:relative;overflow:hidden;background:#FFF5F8;color:#2B1B24;font-family:"Poppins",Arial,sans-serif;font-size:13.5px;line-height:1.6;box-sizing:border-box}' +
  '.rp *{box-sizing:border-box}.rp p{margin:0}' +
  '.rp-top{position:absolute;top:24px;left:48px;right:48px;display:flex;justify-content:space-between;align-items:center;font-size:10.5px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#9B1B4F;border-bottom:1.5px solid #F2C6D6;padding-bottom:8px}' +
  '.rp-top .lg{display:flex;align-items:center;gap:6px}' +
  '.rp-ft{position:absolute;bottom:22px;left:48px;right:48px;display:flex;justify-content:space-between;align-items:center;font-size:10.5px;font-weight:600;letter-spacing:.08em;color:#9B1B4F}' +
  '.rp-ft .c{position:absolute;left:50%;top:-4px;margin-left:-11px}' +
  '.rp-body{position:absolute;top:66px;left:48px;right:48px;bottom:56px;overflow:hidden;display:flex;flex-direction:column;gap:14px;padding-top:6px}' +
  '.rp-stk{position:absolute}.rp-stk svg{display:block}' +
  '.rp-open{position:relative;padding:4px 150px 2px 0;min-height:100px}' +
  '.rp-tag{display:inline-block;background:#F7A8C7;color:#2B1B24;font-weight:800;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;padding:4px 12px;border-radius:999px}' +
  '.rp-h{font-family:"Playfair Display",Georgia,serif;font-weight:900;font-size:38px;line-height:1.08;margin:10px 0 0;letter-spacing:-.01em}' +
  '.rp-h i{font-family:"Great Vibes",cursive;font-style:normal;font-weight:400;color:#E0337A;font-size:1.32em;line-height:.8}' +
  '.rp-lede{color:#6B4E5C;font-size:13.5px;margin-top:6px;line-height:1.55}' +
  '.rp-card{background:#fff;border:1.5px solid #F6D5E1;border-radius:18px;padding:14px 18px}' +
  '.rp-card.pk{background:#FCE4EC;border-color:#F7A8C7}' +
  '.rp-card h3,.rp-h3{font-family:"Playfair Display",Georgia,serif;font-weight:800;font-size:19px;line-height:1.2;margin:0 0 8px}' +
  '.rp-note{font-size:11px;color:#6B4E5C;line-height:1.45;margin-top:6px}' +
  '.rp-tiles{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}' +
  '.rp-tiles.c3{grid-template-columns:repeat(3,1fr)}' +
  '.rp-tile{background:#fff;border:1.5px solid #F6D5E1;border-radius:16px;padding:12px 12px 10px}' +
  '.rp-tile b{display:block;font-family:"Playfair Display",Georgia,serif;font-weight:900;font-size:27px;line-height:1.05;color:#9B1B4F}' +
  '.rp-tile b small{font-size:15px;font-weight:700}' +
  '.rp-tile span{display:block;font-size:11.5px;line-height:1.35;color:#6B4E5C;margin-top:5px}' +
  '.rp-tile.pk{background:#FCE4EC;border-color:#F7A8C7}.rp-tile.dk{background:#E0337A;border-color:#E0337A}.rp-tile.dk b,.rp-tile.dk span{color:#fff}' +
  '.rp-br{display:grid;grid-template-columns:240px 1fr 52px;align-items:center;gap:12px;padding:6px 0;border-bottom:1px dashed #F6D5E1}' +
  '.rp-br:last-child{border-bottom:0}.rp-br .n{font-weight:600;font-size:13px}.rp-br .n em{font-style:normal;font-weight:400;color:#6B4E5C;font-size:11.5px}' +
  '.rp-br .t{display:block;height:14px;background:#FCE4EC;border-radius:99px;overflow:hidden}.rp-br .t i{display:block;height:14px;background:#E0337A;border-radius:99px}' +
  '.rp-br b{text-align:right;font-family:"Playfair Display",Georgia,serif;font-size:17px;color:#9B1B4F}' +
  '.rp-tr{display:grid;grid-template-columns:1fr 90px 26px 90px 96px;align-items:center;gap:8px;padding:7px 0;border-bottom:1px dashed #F6D5E1;font-size:13px}' +
  '.rp-tr:last-child{border-bottom:0}.rp-tr .v{font-family:"Playfair Display",Georgia,serif;font-weight:800;font-size:17px;text-align:center}.rp-tr .ar{text-align:center;color:#9B1B4F;font-weight:700}' +
  '.rp-chip{display:inline-block;text-align:center;border-radius:99px;padding:3px 10px;font-size:11px;font-weight:700;background:#FCE4EC;color:#9B1B4F}' +
  '.rp-chip.up{background:#E3F4EC;color:#1F7A52}.rp-chip.eq{background:#F3EEF1;color:#6B4E5C}' +
  '.rp-chart svg{display:block;width:100%;height:auto}' +
  '.rp-tbw{display:block}.rp-tbw h3{font-family:"Playfair Display",Georgia,serif;font-weight:800;font-size:19px;margin:0 0 8px}' +
  '.rp-tb{width:100%;border-collapse:collapse;font-size:11.2px;line-height:1.38;background:#fff;table-layout:fixed}' +
  '.rp-tb th{background:#F7A8C7;color:#2B1B24;text-align:left;font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:7px 7px;border:1px solid #F7A8C7}' +
  '.rp-tb td,.rp-tb tbody th{padding:6px 7px;border:1px solid #F6D5E1;vertical-align:top;overflow-wrap:anywhere}' +
  '.rp-tb tbody th{background:#FCE4EC;text-transform:none;letter-spacing:0;font-size:11.2px;font-weight:700;color:#9B1B4F}' +
  '.rp-tb tbody tr:nth-child(even) td{background:#FFF9FB}' +
  '.rp-tb td.num{text-align:center;font-weight:600}' +
  '.rp-pg{display:grid;grid-template-columns:repeat(10,1fr);gap:7px}' +
  '.rp-pg div{border-radius:12px;padding:7px 2px 6px;text-align:center;border:1.5px solid #F6D5E1;background:#fff;font-weight:800;font-size:15px;line-height:1.1;font-family:"Playfair Display",Georgia,serif}' +
  '.rp-pg div small{display:block;font-family:"Poppins",Arial,sans-serif;font-size:10px;font-weight:600;margin-top:3px;color:#6B4E5C}' +
  '.rp-pg .full{background:#E0337A;border-color:#E0337A;color:#fff}.rp-pg .full small{color:#fff}.rp-pg .part{background:#FCE4EC;border-color:#F7A8C7}.rp-pg .fut{background:transparent;border-style:dashed;color:#C9AEBB}' +
  '.rp-hb{display:grid;grid-template-columns:1fr 170px 92px;gap:12px;align-items:center;padding:8px 0;border-bottom:1px dashed #F6D5E1}.rp-hb:last-child{border-bottom:0}' +
  '.rp-hb b{display:block;font-size:13px}.rp-hb span{display:block;font-size:11px;color:#6B4E5C;line-height:1.4}' +
  '.rp-hb .t{display:block;height:12px;background:#FCE4EC;border-radius:99px;overflow:hidden}.rp-hb .t i{display:block;height:12px;background:#9B1B4F;border-radius:99px}.rp-hb em{font-style:normal;font-weight:700;font-size:12px;text-align:right;color:#9B1B4F}' +
  '.rp-f{background:#fff;border:1.5px solid #F6D5E1;border-radius:14px;padding:10px 14px}' +
  '.rp-f .l{font-size:10.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#9B1B4F;margin-bottom:4px}' +
  '.rp-f .v{white-space:pre-wrap;font-size:13px;line-height:1.55;min-height:20px;overflow-wrap:anywhere}.rp-f .v.e{color:#C9AEBB}' +
  '.rp-ql{counter-reset:q;display:flex;flex-direction:column;gap:7px;margin:0;padding:0;list-style:none}' +
  '.rp-ql li{display:grid;grid-template-columns:28px 1fr;gap:10px;align-items:start;font-size:13px;line-height:1.5}' +
  '.rp-ql li b{width:26px;height:26px;border-radius:50%;background:#E0337A;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px}' +
  '.rp-lines div{height:30px;border-bottom:1px solid #D7E5F4}' +
  '.rp-dark{background:#1E1419;color:#fff;border-radius:18px;padding:16px 18px;display:grid;grid-template-columns:1fr 1fr;gap:16px;font-size:12.2px;line-height:1.5}' +
  '.rp-dark b{display:block;color:#F7A8C7;font-size:13px;margin-bottom:3px}' +
  '.rp-chk{display:grid;grid-template-columns:repeat(2,1fr);gap:4px 18px}' +
  '.rp-chk div{display:flex;gap:9px;align-items:flex-start;font-size:13px;padding:3px 0}' +
  '.rp-chk i{flex:0 0 16px;width:16px;height:16px;border:1.8px solid #E0337A;border-radius:4px;margin-top:3px;background:#fff;display:block}.rp-chk i.on{background:#E0337A}' +
  '.rp-chk .d{text-decoration:line-through;color:#6B4E5C}' +
  '.rp-tplh{border-top:2px dashed #F7A8C7;padding-top:12px;margin-top:4px}.rp-tplh.first{border-top:0;padding-top:0;margin-top:0}' +
  '.rp-tplh p{font-size:12.5px;color:#6B4E5C}' +
  /* portada */
  '.rp-cv .blob{position:absolute;border-radius:50%}' +
  '.rp-cv .cvtop{position:absolute;top:40px;left:56px;right:56px;display:flex;justify-content:space-between;font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#9B1B4F}' +
  '.rp-cv .t1{position:absolute;left:52px;top:118px;font-family:"Playfair Display",Georgia,serif;font-weight:900;font-size:104px;line-height:1;letter-spacing:-.02em;color:#2B1B24}' +
  '.rp-cv .t2{position:absolute;left:150px;top:206px;font-family:"Great Vibes",cursive;font-size:118px;line-height:1.1;color:#E0337A;transform:rotate(-5deg);white-space:nowrap}' +
  '.rp-cv .sub{position:absolute;left:56px;top:362px;right:300px;font-size:15px;line-height:1.55;color:#2B1B24}' +
  '.rp-cv .sub b{font-weight:700}.rp-cv .sub .pill{display:inline-block;margin-top:10px;background:#1E1419;color:#fff;border-radius:99px;padding:6px 14px;font-size:12px;font-weight:700;letter-spacing:.06em}' +
  '.rp-cv .circ{position:absolute;z-index:3;width:140px;height:140px;border-radius:50%;border:6px solid #fff;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:10px}' +
  '.rp-cv .circ b{font-family:"Playfair Display",Georgia,serif;font-weight:900;font-size:40px;line-height:1}.rp-cv .circ span{font-size:11.5px;font-weight:600;line-height:1.3;margin-top:5px}' +
  '.rp-cv .idx{position:absolute;left:56px;right:56px;top:690px;background:#fff;border:1.5px solid #F6D5E1;border-radius:22px;padding:18px 24px}' +
  '.rp-cv .idx h3{font-family:"Playfair Display",Georgia,serif;font-weight:800;font-size:22px;margin:0 0 6px}' +
  '.rp-cv .ix{display:flex;align-items:baseline;gap:10px;padding:5px 0;font-size:14px}' +
  '.rp-cv .ix .n{font-family:"Playfair Display",Georgia,serif;font-weight:900;color:#E0337A;width:28px}.rp-cv .ix .t{font-weight:600}.rp-cv .ix .d{flex:1;border-bottom:2px dotted #F2C6D6;transform:translateY(-4px)}.rp-cv .ix .p{font-weight:700;color:#9B1B4F}' +
  '.rp-cv .cvimg{position:absolute;width:auto;z-index:2;filter:drop-shadow(4px 0 0 #fff) drop-shadow(-4px 0 0 #fff) drop-shadow(0 4px 0 #fff) drop-shadow(0 -4px 0 #fff)}' +
  '.rp-cv .tape{position:absolute;height:28px;background:rgba(247,168,199,.62)}' +
  '.rp-cv .cvft{position:absolute;left:56px;right:56px;bottom:34px;font-size:11px;line-height:1.5;color:#6B4E5C;text-align:center}';
function ensureRpStyle() { if (!document.getElementById('rpStyle')) { var s = document.createElement('style'); s.id = 'rpStyle'; s.textContent = RP_CSS; document.head.appendChild(s); } }

function Flow(host) { this.host = host; this.pages = []; this.marks = []; this.sec = ''; this.body = null; this.fresh = true; this.k = 0; }
Flow.prototype.page = function () {
  var p = document.createElement('div'); p.className = 'rp';
  p.innerHTML = '<div class="rp-top"><span class="lg">Menopausia Equilibrada</span><span>' + esc(this.sec) + '</span></div><div class="rp-body"></div>' +
    '<div class="rp-ft"><span>' + esc(location.host) + '</span><span class="c">' + stkSVG('heart', 22, '#F7A8C7') + '</span><span class="rp-pn"></span></div>';
  this.host.appendChild(p); this.pages.push(p); this.body = p.querySelector('.rp-body'); this.fresh = true; return p;
};
Flow.prototype.section = function (name, openerHTML) { this.sec = name; this.page(); this.marks.push({ name: name, page: this.pages.length }); if (openerHTML) this.add(openerHTML); };
Flow.prototype.over = function () { return this.body.scrollHeight > this.body.clientHeight + 1; };
Flow.prototype.add = function (html) {
  var t = document.createElement('div'); t.innerHTML = html; var el = t.firstElementChild;
  this.body.appendChild(el);
  if (this.over() && !this.fresh) { el.remove(); this.page(); this.body.appendChild(el); }
  this.fresh = false; return el;
};
Flow.prototype.table = function (title, cols, rows) {
  var self = this;
  var head = '<colgroup>' + cols.map(function (c) { return '<col style="width:' + c[1] + '">'; }).join('') + '</colgroup><thead><tr>' + cols.map(function (c) { return '<th>' + c[0] + '</th>'; }).join('') + '</tr></thead>';
  function mk(first) {
    var w = document.createElement('div'); w.className = 'rp-tbw';
    w.innerHTML = (title ? '<h3>' + title + (first ? '' : ' <span style="font-family:Poppins,Arial,sans-serif;font-weight:500;font-size:12px;color:#6B4E5C">(continúa)</span>') + '</h3>' : '') + '<table class="rp-tb">' + head + '<tbody></tbody></table>';
    self.body.appendChild(w);
    if (self.over() && !self.fresh) { w.remove(); self.page(); self.body.appendChild(w); }
    self.fresh = false; return w;
  }
  var w = mk(true), tb = w.querySelector('tbody'), placed = 0;
  rows.forEach(function (r) {
    var tmp = document.createElement('tbody'); tmp.innerHTML = r; var tr = tmp.firstElementChild;
    tb.appendChild(tr);
    if (self.over()) {
      tr.remove();
      if (!tb.children.length) w.remove();
      self.page(); w = mk(placed === 0); tb = w.querySelector('tbody'); tb.appendChild(tr);
    }
    placed++;
  });
};
function rpOpen(tag, title, lede, k) { return '<div class="rp-open"><span class="rp-tag">' + tag + '</span><div class="rp-h">' + title + '</div>' + (lede ? '<p class="rp-lede">' + lede + '</p>' : '') + STK_SETS[(k || 0) % STK_SETS.length]() + '</div>'; }
function tile(v, l, cls) { return '<div class="rp-tile ' + (cls || '') + '"><b>' + v + '</b><span>' + l + '</span></div>'; }
function pdfSVG(svg) { return svg.replace(/^<svg /, '<svg xmlns="http://www.w3.org/2000/svg" ').replace(/(<svg[^>]*>)/, '$1<style>text{font-family:Arial,Helvetica,sans-serif;font-size:13px;fill:#6B4E5C}</style>').replace(/<title>[^<]*<\/title>/g, ''); }
function periodLabel(st) { return fmt(st.keys[0]) + ' – ' + fmt(st.keys[st.keys.length - 1]); }
function allRange() { var ks = Object.keys(data.days).sort(); if (!ks.length) return 30; return clamp(diff(ks[0], today()) + 1, 7, 1100); }
function halves(st) {
  var L = st.logged; if (L.length < 6) return null;
  var mid = Math.floor(L.length / 2), A = L.slice(0, mid), B = L.slice(L.length - mid);
  function avg(ks, f) { var v = ks.map(function (k) { return data.days[k][f]; }).filter(function (x) { return x != null; }); return v.length >= 3 ? mean(v) : null; }
  return [['Sofocos por día', 'flashes', -1], ['Horas de sueño', 'sleepH', 1], ['Energía (0–3)', 'energy', 1], ['Ánimo (0–4)', 'mood', 1]].map(function (r) {
    return { t: r[0], a: avg(A, r[1]), b: avg(B, r[1]), good: r[2] };
  }).filter(function (r) { return r.a != null && r.b != null; });
}

/* ---------- secciones ---------- */
function secResumen(f, st, k) {
  f.section('Resumen', rpOpen('Resumen del periodo', 'Así te has <i>sentido</i>', periodLabel(st) + ' · ' + st.logged.length + ' días registrados. Todo se calcula solo con los días que anotaste.', k));
  f.add('<div class="rp-tiles">' +
    tile(st.logged.length + '<small>/' + st.keys.length + '</small>', 'días registrados', 'dk') +
    tile(st.flAvg == null ? '—' : n1(st.flAvg), 'sofocos por día (media)', 'pk') +
    tile(st.flMax == null ? '—' : st.flMax, 'sofocos en tu día más intenso') +
    tile(st.sleepAvg == null ? '—' : n1(st.sleepAvg) + '<small> h</small>', 'de sueño por noche (media)') +
    tile(st.sleepQAvg == null ? '—' : QUAL[Math.round(st.sleepQAvg)], 'calidad del sueño (media)') +
    tile(st.energyAvg == null ? '—' : ENERGY[Math.round(st.energyAvg)], 'energía media', 'pk') +
    tile(st.moodAvg == null ? '—' : MOODS[Math.round(st.moodAvg)], 'ánimo medio') +
    tile(st.waterAvg == null ? '—' : n1(st.waterAvg), 'vasos de agua al día') + '</div>');
  var h = '<div class="rp-card"><h3>Tus síntomas principales</h3>';
  if (!st.top.length) h += '<p class="rp-note" style="font-size:13px">No marcaste síntomas en este periodo.</p>';
  else st.top.slice(0, 8).forEach(function (t) { h += '<div class="rp-br"><span class="n">' + esc(t.name) + ' <em>· ' + t.days + ' días</em></span><span class="t"><i style="width:' + Math.max(3, t.avg / 3 * 100).toFixed(0) + '%"></i></span><b>' + n1(t.avg) + '</b></div>'; });
  f.add(h + '<p class="rp-note">Intensidad media de 0 (nada) a 3 (fuerte) en los días registrados, y número de días en que lo notaste.</p></div>');
  var hv = halves(st);
  if (hv && hv.length) {
    var t = '<div class="rp-card pk"><h3>¿Cómo ha cambiado?</h3><div class="rp-tr" style="font-size:10.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#9B1B4F;padding-top:0"><span></span><span style="text-align:center">1.ª mitad</span><span></span><span style="text-align:center">2.ª mitad</span><span></span></div>';
    hv.forEach(function (r) {
      var d = r.b - r.a, same = Math.abs(d) < 0.15, better = !same && (d * r.good > 0);
      t += '<div class="rp-tr"><span>' + r.t + '</span><span class="v">' + n1(r.a) + '</span><span class="ar">→</span><span class="v">' + n1(r.b) + '</span><span class="rp-chip ' + (same ? 'eq' : better ? 'up' : '') + '">' + (same ? 'Igual' : d < 0 ? 'Bajó' : 'Subió') + '</span></div>';
    });
    f.add(t + '<p class="rp-note">Compara la media de tus primeros días registrados con la de los últimos del periodo. Es una pista para tu consulta, no un diagnóstico.</p></div>');
  }
}
function secCharts(f, st, k) {
  if (!st.logged.length) return;
  f.section('Gráficas', rpOpen('Tus gráficas', 'Tu progreso, <i>día a día</i>', 'Los días sin registro aparecen como una raya gris o como un hueco en la línea.', k));
  var dd = function (fl) { return st.keys.map(function (x) { return data.days[x] ? data.days[x][fl] : null; }); };
  f.add('<div class="rp-card"><h3>Sofocos por día</h3><div class="rp-chart">' + pdfSVG(barSVG(st.keys, dd('flashes'), 'Sofocos')) + '</div></div>');
  f.add('<div class="rp-card"><h3>Horas de sueño</h3><div class="rp-chart">' + pdfSVG(lineSVG(st.keys, dd('sleepH'), 'Sueño', 12)) + '</div></div>');
  f.add('<div class="rp-card"><h3>Energía <span style="font-family:Poppins,Arial,sans-serif;font-weight:500;font-size:12px;color:#6B4E5C">0 agotada · 3 con energía</span></h3><div class="rp-chart">' + pdfSVG(lineSVG(st.keys, dd('energy'), 'Energía', 3, '#E0337A')) + '</div></div>');
  f.add('<div class="rp-card"><h3>Ánimo <span style="font-family:Poppins,Arial,sans-serif;font-weight:500;font-size:12px;color:#6B4E5C">0 muy bajo · 4 muy bien</span></h3><div class="rp-chart">' + pdfSVG(lineSVG(st.keys, dd('mood'), 'Ánimo', 4)) + '</div></div>');
  f.add('<div class="rp-card"><h3>Vasos de agua</h3><div class="rp-chart">' + pdfSVG(barSVG(st.keys, dd('water'), 'Agua', '#F48FB1')) + '</div></div>');
}
function secPlan(f, k) {
  var cur = planDayNum(); if (!cur) return;
  var done = 0; for (var i = 1; i <= 30; i++) if (planDone(i) >= 4) done++;
  f.section('Plan de 30 días', rpOpen('Plan de 30 días', 'Recuperando tu <i>energía</i>', 'Empezaste el ' + fmt(data.plan.start.v) + '. Un día cuenta como cumplido con 4 de 6 hábitos: lo que importa es la constancia, no la perfección.', k));
  f.add('<div class="rp-tiles c3">' + tile('Día ' + cur, 'de 30', 'dk') + tile(planStreak(), 'días seguidos cumplidos (racha)', 'pk') + tile(done, 'días cumplidos en total') + '</div>');
  var g = '<div class="rp-card"><h3>Tus 30 días</h3><div class="rp-pg">';
  for (var n = 1; n <= 30; n++) { var dn = planDone(n), cls = n > cur ? 'fut' : dn >= 4 ? 'full' : dn > 0 ? 'part' : ''; g += '<div class="' + cls + '">' + n + '<small>' + (n > cur ? '·' : dn + '/6') + '</small></div>'; }
  f.add(g + '</div><p class="rp-note">Fucsia: día cumplido (4 o más hábitos) · Rosa: algún hábito · Blanco: ninguno · Punteado: días por venir.</p></div>');
  var h = '<div class="rp-card"><h3>Tus hábitos</h3>';
  HABITS.forEach(function (hb) {
    var c = 0; for (var n2 = 1; n2 <= cur; n2++) { var p = data.plan.days[n2]; if (p && p.h && p.h[hb.id]) c++; }
    h += '<div class="rp-hb"><div><b>' + esc(hb.t) + '</b><span>' + esc(hb.d) + '</span></div><span class="t"><i style="width:' + Math.max(2, c / cur * 100).toFixed(0) + '%"></i></span><em>' + c + ' de ' + cur + ' días</em></div>';
  });
  f.add(h + '</div>');
}
function secCiclo(f, k) {
  var ci = cycleInfo(); if (!ci.eps.length && !ci.prior) return;
  f.section('Ciclo', rpOpen('Tu ciclo', 'Tu ciclo, <i>en tus datos</i>', 'Pistas orientativas según el consenso STRAW+10 (Harlow et al., <i>Menopause</i>, 2012). No son un diagnóstico.', k));
  f.add('<div class="rp-tiles c3">' + tile(ci.since == null ? '—' : ci.since, ci.lastEnd ? 'días desde tu último sangrado (' + fmt(ci.lastEnd) + ')' : 'sin sangrado registrado', 'dk') + tile(ci.eps.length, 'episodios de sangrado registrados', 'pk') + tile(ci.lengths.length ? ci.lengths[ci.lengths.length - 1] : '—', ci.lengths.length ? 'días de tu último ciclo' : 'con dos reglas registradas verás tu ciclo') + '</div>');
  if (ci.pmb) f.add('<div class="rp-card" style="border-color:#B3261E;background:#FDECEA"><h3 style="color:#B3261E">Sangrado tras 12 meses sin regla</h3><p>Registraste sangrado el ' + fmt(ci.pmb) + ' después de 12 meses o más sin regla. Las guías de salud recomiendan consultarlo siempre, aunque sea poco o una sola vez.</p><p class="rp-note">Fuente: HSE (Irlanda), «Postmenopausal bleeding».</p></div>');
  if (ci.stage) f.add('<div class="rp-card pk"><h3>Pista orientativa: ' + esc(ci.stage.t) + '</h3><p>' + esc(ci.stage.d) + '</p><p class="rp-note">Anticonceptivos hormonales, DIU hormonal, una histerectomía u otras condiciones cambian el ciclo.</p></div>');
  if (ci.lengths.length) f.add('<div class="rp-card"><h3>Duración de tus últimos ciclos</h3><p style="font-size:15px;font-weight:600">' + ci.lengths.slice(-8).join(' · ') + ' días</p></div>');
  if (ci.eps.length) f.table('Historial de sangrados', [['Inicio', '40%'], ['Fin', '40%'], ['Días', '20%']], ci.eps.slice().reverse().map(function (e) { return '<tr><td>' + fmt(e.start) + '</td><td>' + fmt(e.end) + '</td><td class="num">' + e.days + '</td></tr>'; }));
}
function secHist(f, st, k) {
  if (!st.logged.length) return;
  f.section('Historial', rpOpen('Historial', 'Día a <i>día</i>', 'Cada día que registraste en el periodo, del más antiguo al más reciente. Síntomas: intensidad de 0 a 3.', k));
  var rows = st.logged.map(function (x) {
    var d = data.days[x], dt = parse(x);
    var tops = SYM_LIST.filter(function (s) { return d.s[s.id] > 0; }).sort(function (a, b) { return d.s[b.id] - d.s[a.id]; }).slice(0, 4).map(function (s) { return s.name.split(' / ')[0].toLowerCase() + ' ' + d.s[s.id]; });
    return '<tr><td><b>' + DIAS[dt.getDay()].slice(0, 3) + ' ' + dt.getDate() + ' ' + MES[dt.getMonth()] + '</b>' + (d.bleed ? '<br><span style="color:#E0337A;font-weight:700">sangrado</span>' : '') + '</td><td class="num">' + d.flashes + '</td><td class="num">' + (d.sleepH == null ? '—' : String(d.sleepH).replace('.', ',') + ' h') + (d.sleepQ == null ? '' : '<br><span style="font-weight:400">' + QUAL[d.sleepQ].toLowerCase() + '</span>') + '</td><td>' + (d.energy == null ? '—' : ENERGY[d.energy]) + '</td><td>' + (d.mood == null ? '—' : MOODS[d.mood]) + '</td><td class="num">' + (d.water || 0) + '</td><td>' + (tops.length ? esc(tops.join(', ')) : '—') + '</td><td>' + (d.note ? esc(d.note.slice(0, 160)) + (d.note.length > 160 ? '…' : '') : '') + '</td></tr>';
  });
  f.table('', [['Fecha', '11%'], ['Sofocos', '9%'], ['Sueño', '10%'], ['Energía', '10%'], ['Ánimo', '10%'], ['Agua', '7%'], ['Síntomas', '22%'], ['Nota', '21%']], rows);
}
function secConsulta(f, k, inline) {
  if (!inline) f.section('Para tu consulta', rpOpen('Para tu consulta', 'Llega con <i>datos</i>', 'Lleva este informe a tu cita. Tu profesional de salud es quien interpreta los datos contigo.', k));
  f.add('<div class="rp-f"><div class="l">Cómo afectan mis síntomas a mi vida</div><div class="v' + (data.meta.impact.v ? '' : ' e') + '">' + (data.meta.impact.v ? esc(data.meta.impact.v) : 'Escríbelo en la app, en «Mi consulta».') + '</div></div>');
  var qs = selQuestions();
  f.add('<div class="rp-card"><h3>Mis preguntas</h3>' + (qs.length ? '<ol class="rp-ql">' + qs.map(function (q, i) { return '<li><b>' + (i + 1) + '</b><span>' + esc(q) + '</span></li>'; }).join('') + '</ol>' : '<p class="rp-note" style="font-size:13px">Marca tus preguntas en «Mi consulta».</p>') + '</div>');
  f.add('<div class="rp-card"><h3>Lo que acordamos</h3><div class="rp-lines"><div></div><div></div><div></div><div></div><div></div></div></div>');
  f.add('<div class="rp-dark"><div><b>No esperes si…</b>tienes sangrado después de 12 meses sin regla (aunque sea poco), o pensamientos de hacerte daño: busca atención pronto; en una emergencia, llama a los servicios de emergencia de tu país.</div><div><b>Este informe</b>informa, no diagnostica. Las cifras salen solo de lo que registraste en Menopausia Equilibrada.</div></div>');
}
function tplHasContent(id) {
  var t = data.tpl[id]; if (!t || !t.u) return false;
  return Object.keys(t.f).some(function (x) { return (t.f[x] || '').trim(); }) || Object.keys(t.cells).length > 0 || t.rows.some(function (r) { return r.some(function (c) { return (c || '').trim(); }); }) || t.items.length > 0;
}
function secTpl(f, id, first) {
  var def = TPL_BY[id], t = data.tpl[id] || normTpl(id, {});
  if (!first) f.add('<div class="rp-tplh"><span class="rp-tag">Plantilla</span><div class="rp-h3" style="font-size:26px;margin:8px 0 2px">' + esc(def.t) + '</div><p>' + esc(def.d) + '</p></div>');
  function field(lbl, v) { return '<div class="rp-f"><div class="l">' + esc(lbl) + '</div><div class="v' + (v ? '' : ' e') + '">' + (v ? esc(v) : 'Sin completar') + '</div></div>'; }
  if (def.kind === 'form') def.fields.forEach(function (x) { var v = t.f[x[0]] || ''; if (x[2] === 'date' && isISO(v)) v = fmt(v); f.add(field(x[1], v)); });
  else if (def.kind === 'grid') {
    var nrows = def.rows ? def.rows.length : def.nrows, rows = [];
    for (var r = 0; r < nrows; r++) rows.push('<tr><th>' + esc(def.rows ? def.rows[r] : 'Día ' + (r + 1)) + '</th>' + def.cols.map(function (c, ci) { return '<td>' + esc(t.cells[r + '_' + ci] || '') + '</td>'; }).join('') + '</tr>');
    var w = def.rows ? 14 : 12, cw = ((100 - w) / def.cols.length).toFixed(2) + '%';
    f.table('', [['', w + '%']].concat(def.cols.map(function (c) { return [esc(c), cw]; })), rows);
  } else if (def.kind === 'rows') {
    var rr = (t.rows.length ? t.rows : [['', '', '', '']]).map(function (row) { return '<tr>' + def.cols.map(function (c, ci) { return '<td>' + esc(row[ci] || '') + '</td>'; }).join('') + '</tr>'; });
    f.table('', def.cols.map(function (c) { return [esc(c), (100 / def.cols.length).toFixed(2) + '%']; }), rr);
    (def.extra || []).forEach(function (x) { f.add(field(x[1], t.f[x[0]] || '')); });
  } else if (def.kind === 'list') {
    def.cats.forEach(function (c, ci) {
      var its = t.items.filter(function (i) { return i.c === ci; });
      f.add('<div class="rp-card"><h3>' + esc(c) + '</h3>' + (its.length ? '<div class="rp-chk">' + its.map(function (i) { return '<div><i class="' + (i.d ? 'on' : '') + '"></i><span class="' + (i.d ? 'd' : '') + '">' + esc(i.t) + '</span></div>'; }).join('') + '</div>' : '<p class="rp-note" style="font-size:13px">Sin productos.</p>') + '</div>');
    });
  }
}
function coverPage(host, o) {
  var p = document.createElement('div'); p.className = 'rp rp-cv';
  var nm = (lsGet('me.name') || '').trim();
  p.innerHTML =
    '<div class="blob" style="width:560px;height:560px;right:-190px;top:-200px;background:#F7A8C7"></div>' +
    '<div class="blob" style="width:300px;height:300px;right:150px;top:250px;background:#FCE4EC"></div>' +
    '<div class="blob" style="width:220px;height:220px;left:-90px;top:520px;background:#FCE4EC"></div>' +
    '<div class="tape" style="width:150px;left:40px;top:96px;transform:rotate(-8deg)"></div>' +
    '<div class="cvtop"><span>Menopausia Equilibrada</span><span>Informe personal' + (demo ? ' · ejemplo' : '') + '</span></div>' +
    '<div class="t1">Mi informe</div><div class="t2">de bienestar</div>' +
    '<div class="sub">' + (nm ? 'Preparado para <b>' + esc(nm) + '</b><br>' : '') + 'Del <b>' + fmt(o.st.keys[0]) + '</b> al <b>' + fmt(o.st.keys[o.st.keys.length - 1]) + '</b><br><span class="pill">' + o.st.logged.length + ' DÍAS REGISTRADOS</span></div>' +
    '<img class="cvimg" src="/img/cut22a.webp" alt="" style="left:548px;top:318px;height:364px">' + '<img class="cvimg" src="/img/cut68.webp" alt="" style="left:660px;top:574px;height:104px;transform:rotate(8deg);z-index:3">' +
    '<div class="circ" style="left:52px;top:500px;background:#E0337A;color:#fff;transform:rotate(-6deg)"><b>' + (o.st.flAvg == null ? '—' : n1(o.st.flAvg)) + '</b><span>sofocos al día<br>(media)</span></div>' +
    '<div class="circ" style="left:198px;top:520px;background:#FFD95A;color:#2B1B24;transform:rotate(5deg)"><b>' + (o.st.sleepAvg == null ? '—' : n1(o.st.sleepAvg)) + '</b><span>horas de sueño<br>por noche</span></div>' +
    '<div class="circ" style="left:344px;top:494px;background:#CFE3F7;color:#2B1B24;transform:rotate(-3deg)"><b>' + (planDayNum() ? planDayNum() + '<span style="font-size:18px;margin:0">/30</span>' : '—') + '</b><span>día de tu<br>plan de 30 días</span></div>' +
    stk('heart', 70, '#E0337A', 'left:668px;top:206px;transform:rotate(14deg)') + stk('star', 50, '#FFD95A', 'left:700px;top:96px;transform:rotate(-12deg)') + stk('spark', 40, '#fff', 'left:500px;top:300px') +
    stk('flower', 46, '#F48FB1', 'left:30px;top:470px') + stk('heart', 30, '#9B1B4F', 'left:470px;top:640px;transform:rotate(-14deg)') + stk('spark', 30, '#E0337A', 'left:740px;top:520px') +
    '<div class="idx"><h3>En este informe</h3><div class="ixs"></div></div>' +
    '<div class="cvft">Creado el ' + fmt(today()) + ' con Menopausia Equilibrada · Informa, no diagnostica: llévalo a tu consulta.</div>';
  host.insertBefore(p, host.firstChild); return p;
}

function showPdfOverlay(msg) {
  var o = $('#pdfOv');
  if (!o) { o = document.createElement('div'); o.id = 'pdfOv'; o.className = 'pdfov'; o.setAttribute('role', 'status'); o.setAttribute('aria-live', 'polite'); o.innerHTML = '<div class="box"><div class="hrt">' + stkSVG('heart', 64, '#E0337A') + '</div><b>Creando tu PDF</b><span id="pdfMsg"></span><div class="pbar"><i id="pdfBar"></i></div></div>'; document.body.appendChild(o); }
  o.hidden = false; $('#pdfMsg').textContent = msg || ''; $('#pdfBar').style.width = '4%';
}
function pdfProgress(i, n) { var m = $('#pdfMsg'); if (m) m.textContent = 'Página ' + i + ' de ' + n + '…'; var b = $('#pdfBar'); if (b) b.style.width = Math.round(i / n * 100) + '%'; }
function hidePdfOverlay() { var o = $('#pdfOv'); if (o) o.hidden = true; }
function slug(s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
function savePdf(doc, name) {
  var blob = doc.output('blob');
  var standalone = window.navigator.standalone === true || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
  var file = null; try { file = new File([blob], name, { type: 'application/pdf' }); } catch (e) { }
  if (standalone && file && navigator.canShare && navigator.canShare({ files: [file] })) {
    return navigator.share({ files: [file], title: name }).then(function () { toast('PDF listo.'); }, function () { });
  }
  var u = URL.createObjectURL(blob); var a = document.createElement('a'); a.href = u; a.download = name; a.rel = 'noopener'; document.body.appendChild(a); a.click();
  setTimeout(function () { URL.revokeObjectURL(u); a.remove(); }, 8000);
  toast('PDF descargado: ' + name);
}
/* kind: 'full' | 'consulta' | 'tpl' */
function makePdf(kind, opt) {
  if (pdfBusy) return; pdfBusy = true; opt = opt || {};
  showPdfOverlay('Preparando el diseño…');
  var host = null;
  return loadPdfLibs().then(function () { return document.fonts && document.fonts.ready; }).then(function () {
    ensureRpStyle();
    host = document.createElement('div'); host.id = 'rpHost'; host.setAttribute('aria-hidden', 'true'); document.body.appendChild(host);
    var f = new Flow(host), title, fname, cover = null;
    if (kind === 'full') {
      var n = opt.range === 'all' ? allRange() : (+opt.range || 30), st = stats(n);
      secResumen(f, st, 0); secCharts(f, st, 1); secPlan(f, 2); secCiclo(f, 3); secHist(f, st, 0); secConsulta(f, 1);
      var ids = TPL.filter(function (t) { return tplHasContent(t.id); });
      if (ids.length) { f.section('Mis plantillas', rpOpen('Mis plantillas', 'Lo que has <i>escrito</i>', 'Tus plantillas tal como las completaste en la app.', 2)); ids.forEach(function (t) { secTpl(f, t.id, false); }); }
      cover = coverPage(host, { st: st });
      var ix = '';
      f.marks.forEach(function (m, i) { ix += '<div class="ix"><span class="n">' + z(i + 1) + '</span><span class="t">' + esc(m.name) + '</span><span class="d"></span><span class="p">pág. ' + (m.page + 1) + '</span></div>'; });
      cover.querySelector('.ixs').innerHTML = ix;
      title = 'Mi informe de bienestar'; fname = 'mi-informe-menopausia-equilibrada-' + today() + '.pdf';
    } else if (kind === 'consulta') {
      var s2 = stats(ui.sumRange), ci = cycleInfo();
      f.section('Mi consulta', rpOpen('Resumen para mi consulta', 'Llego con <i>datos</i>', periodLabel(s2) + ' · ' + s2.logged.length + ' días registrados' + ((lsGet('me.name') || '').trim() ? ' · ' + esc(lsGet('me.name').trim()) : '') + '.', 0));
      f.add('<div class="rp-tiles">' + tile(s2.flAvg == null ? '—' : n1(s2.flAvg), 'sofocos por día (media)', 'dk') + tile(s2.flMax == null ? '—' : s2.flMax, 'sofocos en el día más intenso', 'pk') + tile(s2.sleepAvg == null ? '—' : n1(s2.sleepAvg) + '<small> h</small>', 'de sueño por noche') + tile(s2.energyAvg == null ? '—' : ENERGY[Math.round(s2.energyAvg)], 'energía media') + '</div>');
      var sy = '<div class="rp-card"><h3>Síntomas</h3>';
      if (!s2.top.length) sy += '<p class="rp-note" style="font-size:13px">Sin síntomas marcados en el periodo.</p>';
      else s2.top.slice(0, 6).forEach(function (t) { sy += '<div class="rp-br"><span class="n">' + esc(t.name) + ' <em>· ' + t.days + ' días</em></span><span class="t"><i style="width:' + Math.max(3, t.avg / 3 * 100).toFixed(0) + '%"></i></span><b>' + n1(t.avg) + '</b></div>'; });
      f.add(sy + '<p class="rp-note">Intensidad media de 0 a 3.</p></div>');
      f.add('<div class="rp-card pk"><h3>Ciclo</h3><p><b>Último sangrado:</b> ' + (ci.lastEnd ? fmt(ci.lastEnd) + ' (hace ' + ci.since + ' días)' : 'sin registrar') + (ci.lengths.length ? '<br><b>Últimos ciclos:</b> ' + ci.lengths.slice(-6).join(', ') + ' días' : '') + (ci.stage ? '<br><b>Pista STRAW+10 (orientativa):</b> ' + esc(ci.stage.t) : '') + '</p>' + (ci.pmb ? '<p style="color:#B3261E;font-weight:700;margin-top:6px">Sangrado el ' + fmt(ci.pmb) + ' tras 12 meses o más sin regla: comentarlo.</p>' : '') + '</div>');
      if (s2.logged.length) f.add('<div class="rp-card"><h3>Sofocos por día</h3><div class="rp-chart">' + pdfSVG(barSVG(s2.keys, s2.keys.map(function (x) { return data.days[x] ? data.days[x].flashes : null; }), 'Sofocos')) + '</div></div>');
      secConsulta(f, 1, true);
      title = 'Resumen para mi consulta'; fname = 'resumen-consulta-' + today() + '.pdf';
    } else {
      var def = TPL_BY[opt.id];
      f.section(def.t, rpOpen('Plantilla', esc(def.t), esc(def.d) + ' · ' + fmt(today()), ['consulta', 'plan1', 'menu', 'compras', 'suplementos', 'registro30'].indexOf(opt.id)));
      secTpl(f, opt.id, true);
      title = def.t; fname = slug(def.t) + '-' + today() + '.pdf';
    }
    return Promise.all(Array.prototype.map.call(host.querySelectorAll('img'), function (im) { return im.complete ? Promise.resolve() : new Promise(function (r) { im.onload = im.onerror = function () { r(); }; }); })).then(function () {
    var pages = Array.prototype.slice.call(host.querySelectorAll('.rp')), N = pages.length, ixLinks = [];
    if (cover) { var r0 = cover.getBoundingClientRect(); Array.prototype.forEach.call(cover.querySelectorAll('.ix'), function (el, i) { var r = el.getBoundingClientRect(); ixLinks.push({ x: (r.left - r0.left) * 210 / 794, y: (r.top - r0.top) * 297 / 1123, w: r.width * 210 / 794, h: r.height * 297 / 1123, page: f.marks[i].page + 1 }); }); }
    pages.forEach(function (p, i) { var pn = p.querySelector('.rp-pn'); if (pn) pn.textContent = 'Pág. ' + (i + 1) + ' de ' + N; });
    var doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4', compress: true });
    doc.setProperties({ title: title + ' · Menopausia Equilibrada', subject: title, author: 'Menopausia Equilibrada', creator: 'Menopausia Equilibrada' });
    var scale = Math.min(2.2, Math.max(1.6, window.devicePixelRatio || 2));
    return pages.reduce(function (pr, p, i) {
      return pr.then(function () {
        pdfProgress(i + 1, N);
        return window.html2canvas(p, { scale: scale, backgroundColor: '#FFF5F8', logging: false, useCORS: true, scrollX: 0, scrollY: 0, windowWidth: 1024 }).then(function (c) {
          if (i > 0) doc.addPage();
          doc.addImage(c.toDataURL('image/jpeg', 0.9), 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
          if (!p.classList.contains('rp-cv')) doc.link(12, 285, 62, 6, { url: APP_URL + '/' });
          c.width = c.height = 0;
        });
      });
    }, Promise.resolve()).then(function () {
      if (ixLinks.length) { doc.setPage(1); ixLinks.forEach(function (l) { doc.link(l.x, l.y, l.w, l.h, { pageNumber: l.page }); }); }
      return savePdf(doc, fname);
    });
    });
  }).catch(function (e) { console.error(e); toast('No se pudo crear el PDF. Revisa tu conexión e inténtalo de nuevo.'); })
    .then(function () { pdfBusy = false; hidePdfOverlay(); if (host) host.remove(); });
}
window.__mePdf = makePdf;

/* ---------- ejemplo ---------- */
function enterDemo() {
  var seed = 7; function r() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  var dd = blank(); var t = today();
  for (var i = 29; i >= 0; i--) {
    if (i === 12 || i === 20) continue; var k = addDays(t, -i); var s = {}; SYM_LIST.forEach(function (x) { s[x.id] = 0; });
    s.calores = Math.min(3, 1 + Math.round(r() * 2)); s.sudores = Math.round(r() * 2); s.despertares = Math.round(r() * 2 + .4); s.dormir = Math.round(r() * 1.6); s.irritabilidad = Math.round(r() * 1.4); s.ansiedad = r() > .7 ? 1 : 0;
    dd.days[k] = normDay({ s: s, flashes: Math.round(3 + r() * 5), sleepH: Math.round((5 + r() * 2.5) * 2) / 2, sleepQ: Math.round(r() * 2), mood: Math.min(4, Math.round(1 + r() * 2.5)), energy: Math.min(3, Math.round(r() * 3)), water: Math.round(4 + r() * 4), bleed: (i === 27 || i === 26), note: '', u: 1 });
  }
  dd.meta.lastPeriodBefore = { v: addDays(t, -71), u: 1 }; dd.meta.impact = { v: 'Ejemplo: me despierto varias veces por noche con calor y llego cansada al trabajo.', u: 1 };
  dd.plan.start = { v: addDays(t, -9), u: 1 }; for (var n = 1; n <= 10; n++) { var h = {}; HABITS.forEach(function (hb) { h[hb.id] = r() > .35; }); dd.plan.days[n] = { h: h, u: 1 }; }
  data = dd; demo = true; render(); toast('Datos de ejemplo cargados.');
}
function exitDemo() { demo = false; data = real; }

/* =========================================================
   Arranque
   ========================================================= */
if (!lsGet(KEY) && lsGet(OLD_KEY)) saveLocal(); // migra Mi Pausa
saveLocal();
render();
setSync(lastSync ? 'ok' : 'idle', lastSync ? 'Sincronizado' : 'Mi cuenta');
if (unlocked) { sync(); revalidate(); }
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function () { }); });
}
window.addEventListener('load', function () { if (parseHash().v === 'cuenta') drawQR(); });
})();
