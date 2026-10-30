/* Biblioteca PAUSA en 3D. Basada en la estantería «PAUSA — Tu biblioteca digital».
   Dos modos (atributo data-modo de #biblio):
   - «venta» (página de ventas): los libros giran y se inclinan, pero al tocar la portada NO se abre el libro: lleva a las ofertas.
   - «lectura» (página de entrega de la Biblioteca PAUSA): al tocar la portada se abre el libro completo, con su botón de descarga.
     La página fija window.L3_PDF = { guia: 'url del PDF', … } antes de que la clienta abra un libro.
   Vive dentro de la página: no bloquea el desplazamiento vertical y solo se anima cuando se ve. */
(function () {
'use strict';
var root = document.getElementById('biblio');
if (!root) return;
// item = id del producto (lib/catalog.js); páginas en /plena/libros/<item>/p001.webp
var books = [
  { item: 'guia', title: 'Menopausia equilibrada', label: 'Guía integral', category: 'guias', color: '#ed9cbd', ink: '#191117', pages: 38, cover: 'c-guia' },
  { item: 'recetario', title: 'Recetario para la menopausia', label: 'Bono 1', category: 'bonos', color: '#f7eee8', ink: '#231821', pages: 25, cover: 'c-recetario' },
  { item: 'plan30', title: 'Plan de 30 días para tu energía', label: 'Bono 2', category: 'bonos', color: '#f5ecdf', ink: '#231821', pages: 12, cover: 'c-plan30' },
  { item: 'vitaminas', title: 'Guía de vitaminas y suplementos', label: 'Bono 3', category: 'bonos', color: '#ef99ba', ink: '#24131d', pages: 10, cover: 'c-vitaminas' },
  { item: 'diario', title: 'Mi diario de síntomas y progreso', label: 'Bono 4', category: 'bonos', color: '#f6c0d6', ink: '#29131e', pages: 8, cover: 'c-diario' },
  { item: 'yoga', title: 'Yoga en calma', label: 'Bono 5', category: 'bonos', color: '#f0b4ce', ink: '#25171f', pages: 10, cover: 'c-yoga' },
  { item: 'aroma', title: 'Aromaterapia en calma', label: 'Bono 6', category: 'bonos', color: '#efe7db', ink: '#25171f', pages: 7, cover: 'c-aroma' },
  { item: 'plantillas', title: 'Tres plantillas rellenables', label: 'Plantillas', category: 'plantillas', color: '#f7e9ee', ink: '#25171f', pages: 3, cover: 'c-pl1' },
  { item: 'pausa', title: 'Menopausia sin tabú', label: 'PAUSA · Manual', category: 'pausa', color: '#f19fc0', ink: '#26131d', pages: 60, cover: 'c-pausa' },
  { item: 'k1', title: 'Noches frescas', label: 'PAUSA · Guía complementaria', category: 'pausa', color: '#e795b6', ink: '#26131d', pages: 6, cover: 'c-k1' },
  { item: 'k2', title: 'Intimidad sin dolor', label: 'PAUSA · Guía complementaria', category: 'pausa', color: '#f5e9e5', ink: '#26131d', pages: 6, cover: 'c-k2' },
  { item: 'k3', title: 'Menopausia en el trabajo', label: 'PAUSA · Kit de trabajo', category: 'pausa', color: '#f2c6d7', ink: '#26131d', pages: 6, cover: 'c-k3' },
  { item: 'k4', title: 'Fuerte después de los 45', label: 'PAUSA · Programa de fuerza', category: 'pausa', color: '#2c1b26', ink: '#f5deea', pages: 6, cover: 'c-k4' }
];
var MODO = root.dataset.modo === 'lectura' ? 'lectura' : 'venta';
var preview = function (b) { return b.pages; };
var q = function (s, c) { return (c || root).querySelector(s); };
var mod = function (x, n) { return ((x % n) + n) % n; };
var smooth = function (x) { return x * x * (3 - 2 * x); };
var motion = window.matchMedia ? matchMedia('(prefers-reduced-motion:reduce)') : { matches: false };
var N = books.length, L = N * 3;
var stage = q('.l3-stage'), shelf = q('.l3-shelf'), reader = document.getElementById('l3Reader'), scrollArea = q('.l3-scroll', reader);
var tabs = [].slice.call(root.querySelectorAll('[data-category]'));
var H, ws, d, gap, W, HH, s = N, T = N, hover = -1, active = -1, mx = 0, my = 0, tiltX = 0, tiltY = 0, onCover = false;
var isOpen = false, closing = false, drag = null, suppress = false, last = performance.now(), prevFocus = null, openBook = null;
var currentPage = 1, selectedCategory = 'all', readerAnimation = null, visible = true, rafOn = false;
if (q('#l3Count')) q('#l3Count').textContent = N + ' libros · ' + books.reduce(function (a, b) { return a + b.pages; }, 0) + ' páginas';

var tapes = Array.from({ length: L }, function (_, v) {
  var book = books[v % N], el = document.createElement('div');
  el.className = 'l3-tape';
  var sp = document.createElement('button'), cv = document.createElement('button');
  sp.type = cv.type = 'button';
  sp.className = 'l3-face l3-sp'; cv.className = 'l3-face l3-cv';
  sp.style.setProperty('--book-bg', book.color); sp.style.setProperty('--book-ink', book.ink);
  sp.setAttribute('aria-label', 'Seleccionar ' + book.title); cv.setAttribute('aria-label', 'Leer un adelanto de ' + book.title);
  cv.style.backgroundImage = 'url("/oferta/img/' + book.cover + '-s.webp")'; // versión liviana (380 px)
  [['l3-num', String((v % N) + 1).padStart(2, '0')], ['l3-name', book.title], ['l3-mark', 'PAUSA']].forEach(function (p) {
    var e = document.createElement('span'); e.className = p[0]; e.textContent = p[1]; sp.appendChild(e);
  });
  el.appendChild(sp); el.appendChild(cv); stage.appendChild(el);
  var obj = { el: el, sp: sp, cv: cv, v: v, r: 0, lift: 0 };
  el.addEventListener('pointerenter', function () { hover = v; });
  el.addEventListener('pointerleave', function () { if (hover === v) hover = -1; });
  el.addEventListener('click', function () {
    if (suppress || isOpen) return;
    if (Math.abs(obj.r) < 0.5) abrir(); else { T = Math.round(s + obj.r); selectedCategory = 'all'; updateTab(); }
  });
  return obj;
});

function resize() {
  var r = root.getBoundingClientRect();
  W = r.width; HH = r.height;
  var probe = document.createElement('div'); probe.style.cssText = 'height:var(--H);position:absolute;pointer-events:none';
  root.appendChild(probe); H = probe.getBoundingClientRect().height; probe.remove();
  ws = H * 0.135; d = (H * 596) / 842; gap = H * 0.03;
  stage.style.setProperty('--ws', ws + 'px'); stage.style.setProperty('--d', d + 'px');
  var shelfR = shelf.getBoundingClientRect(), cy = shelfR.top - r.top + shelfR.height / 2;
  q('.l3-play').style.left = W / 2 - 0.5 * d - 27 + 'px';
  q('.l3-play').style.top = cy + 0.36 * H - 21 + 'px';
  updateTab();
}
function updateTab() {
  tabs.forEach(function (b) {
    var yes = b.dataset.category === selectedCategory;
    b.classList.toggle('active', yes);
    if (yes) { b.setAttribute('aria-current', 'true'); q('.l3-indicator').style.width = b.offsetWidth + 'px'; q('.l3-indicator').style.transform = 'translateX(' + b.offsetLeft + 'px)'; }
    else b.removeAttribute('aria-current');
  });
}
function setActive(i, dir) {
  dir = dir || 1; active = i; var b = books[i];
  [q('.l3-caption .l3-title'), q('.l3-caption .l3-sub'), q('.l3-caption .l3-year')].forEach(function (mask, j) {
    var val = [b.title, b.label, b.pages + (MODO === 'lectura' ? ' páginas · Toca la portada para leerlo' : ' páginas · Incluido en las 2 ofertas')][j];
    if (motion.matches || !mask.animate) { mask.textContent = ''; var e0 = document.createElement('span'); e0.textContent = val; mask.appendChild(e0); return; }
    [].slice.call(mask.children).forEach(function (old) {
      if (old.dataset.leaving) return; old.dataset.leaving = '1';
      old.animate([{ transform: getComputedStyle(old).transform }, { transform: 'translateY(' + (-dir * 105) + '%)' }], { duration: 650, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'both' }).onfinish = function () { old.remove(); };
    });
    var span = document.createElement('span'); span.textContent = val; mask.appendChild(span);
    span.animate([{ transform: 'translateY(' + (dir * 105) + '%)' }, { transform: 'translateY(0)' }], { duration: 650, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'both' });
  });
}
function jump(i) { T = Math.round(T) + mod(i - mod(Math.round(T), N) + N / 2, N) - N / 2; }
function move(n) { if (!isOpen) { T = Math.round(T) + n; selectedCategory = 'all'; updateTab(); } }
q('.l3-prev').onclick = function () { move(-1); };
q('.l3-next').onclick = function () { move(1); };
// En la página de ventas el libro no se abre: la portada lleva a las ofertas.
function irOfertas() {
  var o = document.getElementById('ofertas');
  if (o) o.scrollIntoView({ behavior: motion.matches ? 'auto' : 'smooth' });
  if (window.meTrack && books[active]) meTrack('ViewContent', { content_name: 'Portada: ' + books[active].title, currency: 'USD' });
}
function abrir() { if (MODO === 'lectura') openReader(); else if (Math.abs(T - s) < 0.35) irOfertas(); }
q('.l3-play').onclick = abrir;
q('.l3-play').setAttribute('aria-label', MODO === 'lectura' ? 'Leer el libro' : 'Ver las ofertas');
tabs.forEach(function (b) {
  b.onclick = function () {
    selectedCategory = b.dataset.category; updateTab();
    jump(selectedCategory === 'all' ? 0 : books.findIndex(function (x) { return x.category === selectedCategory; }));
  };
});
// Rueda: solo el gesto horizontal (trackpad) mueve los libros; el vertical sigue bajando la página.
var wheelTimer;
shelf.addEventListener('wheel', function (e) {
  if (isOpen || e.ctrlKey || Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
  e.preventDefault(); T += (e.deltaX / (ws + gap)) * 0.5; selectedCategory = 'all'; updateTab();
  clearTimeout(wheelTimer); wheelTimer = setTimeout(function () { T = Math.round(T); }, 160);
}, { passive: false });
shelf.addEventListener('pointerdown', function (e) {
  if (isOpen || e.button !== 0) return;
  drag = { x: e.clientX, y: e.clientY, t: T, moved: false }; suppress = false;
});
root.addEventListener('pointermove', function (e) {
  var r = root.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top;
  if (drag) {
    var dx = e.clientX - drag.x;
    if (Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(e.clientY - drag.y)) drag.moved = true;
    if (drag.moved) { T = drag.t - dx / (ws + gap); suppress = true; selectedCategory = 'all'; updateTab(); }
  }
});
root.addEventListener('pointerleave', function () { mx = W / 2; my = -1e4; });
function endDrag() { if (!drag) return; var moved = drag.moved; drag = null; if (moved) { T = Math.round(T); setTimeout(function () { suppress = false; }, 100); } }
addEventListener('pointerup', endDrag); addEventListener('pointercancel', endDrag);
addEventListener('keydown', function (e) {
  if (isOpen) {
    if (e.key === 'Escape') { e.preventDefault(); closeReader(); }
    if (e.key === 'Tab') {
      var f = [].slice.call(reader.querySelectorAll('button,input,a[href],[tabindex="0"]')).filter(function (x) { return !x.disabled && x.offsetParent !== null; }), a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    }
    if (document.activeElement.tagName !== 'INPUT') {
      if (e.key === 'ArrowRight') { e.preventDefault(); goPage(currentPage + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPage(currentPage - 1); }
    }
    return;
  }
  // Flechas del teclado: solo si la biblioteca está a la vista y nadie está escribiendo.
  var t = document.activeElement && document.activeElement.tagName;
  if (!visible || t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT' || document.body.style.overflow === 'hidden') return;
  if (e.key === 'ArrowRight') { e.preventDefault(); move(1); }
  if (e.key === 'ArrowLeft') { e.preventDefault(); move(-1); }
});
function coverRect() { return tapes.reduce(function (a, b) { return Math.abs(a.r) < Math.abs(b.r) ? a : b; }).cv.getBoundingClientRect(); }
function inset(r) { var vw = innerWidth, vh = innerHeight; return 'inset(' + Math.max(0, r.top) + 'px ' + Math.max(0, vw - r.right) + 'px ' + Math.max(0, vh - r.bottom) + 'px ' + Math.max(0, r.left) + 'px round 3px)'; }
function setPage(p) {
  var n = preview(openBook);
  currentPage = Math.max(1, Math.min(n, p));
  q('.l3-page-input', reader).value = currentPage;
  q('.l3-page-prev', reader).disabled = currentPage <= 1;
  q('.l3-page-next', reader).disabled = currentPage >= n;
  q('.l3-progress', reader).style.transform = 'scaleX(' + currentPage / n + ')';
}
function goPage(p) {
  if (!openBook) return;
  var n = preview(openBook), target = Math.max(1, Math.min(n, Math.round(p) || 1)), page = q('.l3-pages', reader).children[target - 1];
  setPage(target); scrollArea.scrollTo({ top: page.offsetTop - q('.l3-pages', reader).offsetTop, behavior: 'auto' });
}
function openReader() {
  if (isOpen || Math.abs(T - s) > 0.35) return;
  T = Math.round(s); isOpen = true; closing = false; prevFocus = document.activeElement; openBook = books[active];
  var n = preview(openBook);
  q('#l3ReaderTitle', reader).textContent = openBook.title;
  q('.l3-reader-label', reader).textContent = openBook.label + ' · ' + openBook.pages + ' páginas';
  var pdf = (window.L3_PDF || {})[openBook.item] || '';
  [].slice.call(reader.querySelectorAll('.l3-dl')).forEach(function (a) { a.hidden = !pdf; if (pdf) a.href = pdf; });
  q('.l3-page-total', reader).textContent = '/ ' + n;
  q('.l3-page-input', reader).max = n;
  reader.classList.remove('zoomed'); var zb = q('.l3-zoom', reader); zb.textContent = 'Ampliar'; zb.setAttribute('aria-pressed', 'false');
  var pages = q('.l3-pages', reader); pages.innerHTML = '';
  for (var i = 1; i <= n; i++) {
    var fig = document.createElement('figure'); fig.className = 'l3-page'; fig.dataset.page = i;
    var im = document.createElement('img');
    im.src = '/plena/libros/' + openBook.item + '/p' + String(i).padStart(3, '0') + '.webp';
    im.alt = openBook.title + ' — página ' + i + ' de ' + openBook.pages; im.width = 1400; im.height = 1978;
    im.loading = i <= 2 ? 'eager' : 'lazy'; im.decoding = 'async';
    var cap = document.createElement('figcaption'); cap.textContent = i + ' / ' + openBook.pages;
    fig.appendChild(im); fig.appendChild(cap); pages.appendChild(fig);
  }
  // Al final del libro: descargarlo y volver a la biblioteca.
  var end = document.createElement('div'); end.className = 'l3-more';
  end.innerHTML = '<span class="kick">Terminaste «' + openBook.title.replace(/</g, '&lt;') + '»</span><h3>Guárdalo en tu celular o computador</h3>' +
    '<p>Descarga el PDF para leerlo sin internet, imprimirlo o llenar sus campos.</p>' +
    '<div class="l3-more-b">' + (pdf ? '<a class="btn btn-p" download target="_blank" rel="noopener" href="' + pdf.replace(/"/g, '&quot;') + '">↓ Descargar el PDF</a>' : '') + '<button type="button" class="btn btn-g" data-l3-close>Volver a la biblioteca</button></div>';
  pages.appendChild(end);
  var r = coverRect();
  reader.inert = false; reader.removeAttribute('aria-hidden'); reader.style.visibility = 'visible';
  reader.style.transformOrigin = (r.x + r.width / 2) + 'px ' + (r.y + r.height / 2) + 'px';
  document.documentElement.classList.add('l3-lock');
  readerAnimation = reader.animate ? reader.animate([{ clipPath: inset(r), transform: 'rotate(-4.5deg)' }, { clipPath: 'inset(0px 0px 0px 0px round 0px)', transform: 'rotate(0deg)' }], { duration: motion.matches ? 1 : 1050, easing: 'cubic-bezier(.76,0,.18,1)', fill: 'both' }) : null;
  scrollArea.scrollTop = 0; setPage(1);
  q('.l3-back', reader).focus({ preventScroll: true });
}
scrollArea.addEventListener('scroll', function () {
  if (!isOpen || !openBook) return;
  var rootRect = scrollArea.getBoundingClientRect(), line = rootRect.top + Math.min(160, rootRect.height * 0.25), figs = [].slice.call(q('.l3-pages', reader).querySelectorAll('figure'));
  var c = figs.filter(function (f) { var r = f.getBoundingClientRect(); return r.bottom > line && r.top <= line; })[0];
  if (c) setPage(+c.dataset.page);
}, { passive: true });
function closeReader(cb) {
  if (!isOpen || closing) return; closing = true;
  if (readerAnimation) readerAnimation.cancel();
  var r = coverRect();
  function done() {
    reader.style.visibility = 'hidden'; reader.inert = true; reader.setAttribute('aria-hidden', 'true');
    isOpen = false; closing = false; document.documentElement.classList.remove('l3-lock');
    if (typeof cb === 'function') cb(); else if (prevFocus && prevFocus.focus) prevFocus.focus({ preventScroll: true });
  }
  if (!reader.animate || motion.matches) return done();
  readerAnimation = reader.animate([{ clipPath: 'inset(0px 0px 0px 0px round 0px)', transform: 'rotate(0deg)' }, { clipPath: inset(r), transform: 'rotate(-4.5deg)' }], { duration: 850, easing: 'cubic-bezier(.76,0,.18,1)', fill: 'both' });
  readerAnimation.onfinish = done;
}
q('.l3-back', reader).onclick = function () { closeReader(); };
q('.l3-page-prev', reader).onclick = function () { goPage(currentPage - 1); };
q('.l3-page-next', reader).onclick = function () { goPage(currentPage + 1); };
q('.l3-page-input', reader).addEventListener('change', function (e) { goPage(+e.target.value); });
q('.l3-zoom', reader).onclick = function () {
  var yes = reader.classList.toggle('zoomed'); this.textContent = yes ? 'Ajustar' : 'Ampliar'; this.setAttribute('aria-pressed', String(yes)); goPage(currentPage);
};
reader.addEventListener('click', function (e) {
  if (e.target.closest('[data-l3-close]')) { closeReader(); return; }
  if (e.target.closest('[data-l3-oferta]')) { closeReader(function () { var o = document.getElementById('ofertas'); if (o) o.scrollIntoView({ behavior: motion.matches ? 'auto' : 'smooth' }); }); }
});
addEventListener('resize', resize);
window.L3_resize = function () { visible = true; resize(); start(); };
// Solo se anima mientras la biblioteca está a la vista (ahorra batería en el celular).
if ('IntersectionObserver' in window) {
  new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) { resize(); start(); } }, { threshold: 0.05 }).observe(root);
}
function start() { if (!rafOn) { rafOn = true; last = performance.now(); requestAnimationFrame(frame); } }
// Cursor de la estantería original: anillo que se agranda sobre la portada con «LEER LIBRO» / «LO QUIERO».
var fino = window.matchMedia && matchMedia('(pointer:fine)').matches, cur = null, ccx = 0, ccy = 0, px = -100, py = -100, dentro = false;
if (fino) {
  cur = document.createElement('div'); cur.className = 'l3-cursor'; cur.setAttribute('aria-hidden', 'true');
  cur.innerHTML = '<div class="l3-ring"></div><div class="l3-dot"></div><span class="l3-clabel">' + (MODO === 'lectura' ? 'LEER<br>LIBRO' : 'LO<br>QUIERO') + '</span>';
  document.body.appendChild(cur); root.classList.add('l3-fino');
  root.addEventListener('pointermove', function (e) { px = e.clientX; py = e.clientY; if (!dentro) { dentro = true; ccx = px; ccy = py; } });
  root.addEventListener('pointerleave', function () { dentro = false; cur.className = 'l3-cursor'; });
}
resize(); setActive(0); mx = W / 2; my = -1e4;
function frame(now) {
  if (!visible && !isOpen) { rafOn = false; return; }
  var dt = Math.min(0.05, (now - last) / 1000); last = now;
  s = motion.matches ? T : s + (T - s) * (1 - Math.exp(-((drag && drag.moved) ? 18 : 5.2) * dt));
  if (Math.abs(T - s) < 0.0001) s = T;
  if (Math.abs(s) > L * 4) { var shift = Math.floor(s / L) * L; s -= shift; T -= shift; }
  var i = mod(Math.round(s), N);
  if (i !== active) setActive(i, Math.sign(T - s) || 1);
  var shelfR = shelf.getBoundingClientRect(), rootR = root.getBoundingClientRect(), cy = shelfR.top - rootR.top + shelfR.height / 2;
  onCover = !isOpen && Math.abs(T - s) < 0.3 && Math.abs(mx - W / 2) < 0.55 * d && Math.abs(my - cy) < 0.55 * H;
  var ty = onCover ? ((mx - W / 2) / (0.55 * d)) * 9 : ((mx - W / 2) / (W || 1)) * 5, tx = onCover ? (-(my - cy) / (H / 2 || 1)) * 6 : 0;
  if (!isFinite(tiltX)) tiltX = 0; if (!isFinite(tiltY)) tiltY = 0;
  tiltX += (tx - tiltX) * (1 - Math.exp(-7 * dt)); tiltY += (ty - tiltY) * (1 - Math.exp(-7 * dt));
  for (var k = 0; k < tapes.length; k++) {
    var t = tapes[k], r = mod(t.v - s + L / 2, L) - L / 2; t.r = r;
    var ar = Math.abs(r), B = ar < 1 ? (r + Math.sin(Math.PI * r) / Math.PI) / 2 : Math.sign(r) * 0.5, x = r * (ws + gap) + (d - ws + 1.6 * gap) * B;
    var vis = Math.abs(x) <= W / 2 + 1.5 * d;
    t.el.style.visibility = vis ? 'visible' : 'hidden';
    t.sp.tabIndex = vis && ar > 0.5 ? 0 : -1; t.cv.tabIndex = vis && ar < 0.5 ? 0 : -1;
    t.el.setAttribute('aria-hidden', String(!vis));
    if (!vis) continue;
    var o = smooth(Math.max(0, 1 - ar)), lift = hover === t.v && ar > 0.5 ? 1 : 0;
    t.lift = motion.matches ? lift : t.lift + (lift - t.lift) * (1 - Math.exp(-12 * dt));
    t.el.style.transform = 'translate3d(' + x + 'px,' + (-o * 0.025 * H - t.lift * 0.045 * H) + 'px,' + (o * 0.2 * H) + 'px) rotateZ(' + (-4.5 * o) + 'deg) rotateX(' + (tiltX * o) + 'deg) rotateY(' + ((-90 + tiltY) * o) + 'deg)';
    t.el.style.zIndex = Math.round(100 - ar * 4);
    t.sp.style.setProperty('--shade', o * 0.55); t.cv.style.setProperty('--shade', (1 - o) * 0.5);
  }
  q('.l3-play').style.transform = 'scale(' + (isOpen ? 0 : smooth(Math.max(0, 1 - Math.abs(T - s) * 3))) + ')';
  root.classList.toggle('on-cover', onCover);
  if (cur) {
    ccx += (px - ccx) * (1 - Math.exp(-16 * dt)); ccy += (py - ccy) * (1 - Math.exp(-16 * dt));
    cur.style.transform = 'translate3d(' + ccx + 'px,' + ccy + 'px,0)';
    var tg = dentro ? document.elementFromPoint(px, py) : null;
    cur.className = 'l3-cursor' + (dentro && !isOpen ? ' on' : '') + (onCover ? ' open' : hover >= 0 && Math.abs(tapes[hover].r) > 0.5 ? ' spine' : tg && tg.closest('button,a,input') ? ' btn' : '');
  }
  requestAnimationFrame(frame);
}
start();
})();
