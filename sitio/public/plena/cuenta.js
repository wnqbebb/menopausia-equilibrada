/* PLENA · cuenta personal (correo + contraseña con Supabase Auth) y clave de datos del diario.
   Lo usan /plena/ (inicio de sesión, perfil), /oferta/gracias.html (crear la cuenta) y Mi diario (la app integrada,
   a través de window.parent.PlenaCuenta: mismo origen, una sola sesión).
   - La sesión se guarda en este navegador hasta cerrar sesión («Recordarme») o hasta cerrar el navegador.
   - Clave de datos del diario: aleatoria por usuaria (AES-256-GCM). Se guarda en Supabase solo ENVUELTA con una clave
     derivada de su contraseña (PBKDF2-SHA256, 310.000 iteraciones). Ni el servidor ni la administradora pueden abrirla.
   - Necesita /plena/vendor/supabase-2.118.0.js cargado antes. */
(function () {
'use strict';
var KEY_REC = 'plena.recordar', KEY_DK = 'plena.dk', KEY_UID = 'plena.uid', ITER = 310000;
// Datos locales de una usuaria: si entra otra persona en este dispositivo, se borran antes de cargar su cuenta.
var LOCALES = ['plena.perfil', 'plena.prog', 'plena.vistas', 'plena.pos', 'plena.hoy', 'plena.vpos', 'plena.tips', 'plena.tour', 'plena.nuevas', 'me.data.v2', 'me.lastSync', 'me.cloud', 'me.onboarded', 'me.name', 'me.pack', 'me.acc', 'me.code', 'miPausa.v1'];

function st(kind) { try { return kind === 's' ? window.sessionStorage : window.localStorage; } catch (e) { return null; } }
function get(k) { var a = st('l'), b = st('s'); try { return (a && a.getItem(k)) || (b && b.getItem(k)) || null; } catch (e) { return null; } }
function recordar() { try { return localStorage.getItem(KEY_REC) !== '0'; } catch (e) { return true; } }
function put(k, v) { var a = st('l'), b = st('s'); try { if (a) a.removeItem(k); if (b) b.removeItem(k); var t = recordar() ? a : b; if (t) t.setItem(k, v); } catch (e) { } }
function del(k) { try { localStorage.removeItem(k); } catch (e) { } try { sessionStorage.removeItem(k); } catch (e) { } }
// Almacén de la sesión de Supabase: localStorage con «Recordarme», sessionStorage sin él.
var almacen = { getItem: get, setItem: put, removeItem: del };

/* ---------- cifrado ---------- */
function b64e(u8) { u8 = new Uint8Array(u8); var s = ''; for (var i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); }
function b64d(t) { var b = atob(t), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
function rnd(n) { return crypto.getRandomValues(new Uint8Array(n)); }
function kidNuevo() { return Array.prototype.map.call(rnd(8), function (x) { return x.toString(16).padStart(2, '0'); }).join(''); }
function kek(pass, salt, iter) {
  return crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey']).then(function (k) {
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: salt, iterations: iter, hash: 'SHA-256' }, k, { name: 'AES-GCM', length: 256 }, false, ['wrapKey', 'unwrapKey']);
  });
}
function nuevaClave() { return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']); }
function envolver(dk, pass, kid) {
  var salt = rnd(16), iv = rnd(12);
  return kek(pass, salt, ITER).then(function (w) { return crypto.subtle.wrapKey('raw', dk, w, { name: 'AES-GCM', iv: iv }); })
    .then(function (ct) { return { v: 1, kid: kid || kidNuevo(), salt: b64e(salt), iter: ITER, iv: b64e(iv), ct: b64e(ct) }; });
}
function desenvolver(c, pass) {
  return kek(pass, b64d(c.salt), c.iter).then(function (w) {
    return crypto.subtle.unwrapKey('raw', b64d(c.ct), w, { name: 'AES-GCM', iv: b64d(c.iv) }, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  });
}
function sellar(dk, kid, obj) {
  var iv = rnd(12);
  return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, dk, new TextEncoder().encode(JSON.stringify(obj)))
    .then(function (ct) { return { enc: 'aes-gcm', kid: kid, iv: b64e(iv), ct: b64e(ct) }; });
}
function abrir(dk, o) {
  return crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64d(o.iv) }, dk, b64d(o.ct)).then(function (b) { return JSON.parse(new TextDecoder().decode(b)); });
}

/* ---------- clave de datos guardada en este dispositivo ---------- */
var dkCache = null;
function guardarDK(uid, kid, dk) {
  return crypto.subtle.exportKey('raw', dk).then(function (raw) { put(KEY_DK, JSON.stringify({ uid: uid, kid: kid, k: b64e(raw) })); dkCache = { uid: uid, kid: kid, key: dk }; });
}
function leerDK(uid) {
  if (dkCache && dkCache.uid === uid) return Promise.resolve(dkCache);
  var o = null; try { o = JSON.parse(get(KEY_DK) || 'null'); } catch (e) { }
  if (!o || o.uid !== uid) return Promise.resolve(null);
  return crypto.subtle.importKey('raw', b64d(o.k), { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt'])
    .then(function (k) { dkCache = { uid: uid, kid: o.kid, key: k }; return dkCache; }).catch(function () { return null; });
}

/* ---------- Supabase ---------- */
var sb = null, cfgP = null, recuperando = /(^|[#&])type=recovery(&|$)/.test(location.hash);
function config() {
  cfgP = cfgP || fetch('/api/config', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (c) {
    if (!c.ok) { var e = new Error(c.error || 'config'); e.config = true; throw e; }
    sb = window.supabase.createClient(c.supabaseUrl, c.anonKey, { auth: { storage: almacen, storageKey: 'plena.sesion', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'implicit' } });
    sb.auth.onAuthStateChange(function (ev) { if (ev === 'PASSWORD_RECOVERY') recuperando = true; });
    return sb.auth.getSession().then(function () { return sb; });
  });
  cfgP.catch(function () { cfgP = null; });
  return cfgP;
}
function sesion() { return config().then(function () { return sb.auth.getSession(); }).then(function (r) { return (r.data && r.data.session) || null; }); }
function token() { return sesion().then(function (s) { return s ? s.access_token : ''; }); }
function api(path, opts) {
  opts = opts || {};
  return token().then(function (t) {
    opts.headers = Object.assign({}, opts.headers || {}, t ? { authorization: 'Bearer ' + t } : {});
    return fetch(path, opts);
  }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { return { ok: r.ok, status: r.status, d: d }; }); });
}
function json(m, body) { return { method: m, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }; }

function mensaje(err) {
  var c = (err && (err.code || err.error_code)) || '', s = err && err.status;
  if (err && err.config) return 'Las cuentas aún no están configuradas. Inténtalo más tarde.';
  if (c === 'user_banned') return 'Tu acceso no está activo. Escríbenos a cristinaaguilarrojas1@gmail.com.';
  if (c === 'over_request_rate_limit' || c === 'over_email_send_rate_limit' || s === 429) return 'Demasiados intentos seguidos. Espera unos minutos y vuelve a intentarlo.';
  if (c === 'weak_password' || c === 'same_password') return c === 'same_password' ? 'La nueva contraseña debe ser distinta de la anterior.' : 'Esa contraseña es muy débil. Usa al menos 8 caracteres, con letras y números.';
  if (c === 'invalid_credentials' || c === 'email_not_confirmed' || s === 400) return 'Correo o contraseña incorrectos.';
  if (err && /fetch|network|Failed/i.test(String(err.message || err))) return 'Sin conexión. Revisa tu internet e inténtalo de nuevo.';
  return 'No pudimos completar la acción. Inténtalo de nuevo en un momento.';
}

// Prepara este dispositivo para la usuaria: borra datos de otra persona y abre la clave del diario con su contraseña.
function prepararDispositivo(uid, pass) {
  var antes = null; try { antes = localStorage.getItem(KEY_UID); } catch (e) { }
  if (antes && antes !== uid) LOCALES.forEach(del); // (sin uid previo: datos del acceso antiguo con código, se conservan)
  try { localStorage.setItem(KEY_UID, uid); } catch (e) { }
  if (!pass) return Promise.resolve();
  return api('/api/cuenta').then(function (x) {
    if (!x.ok) return;
    var c = x.d.clave;
    if (c) return desenvolver(c, pass).then(function (dk) { return guardarDK(uid, c.kid, dk); });
    // Cuenta sin clave (no debería pasar): se crea ahora.
    return nuevaClave().then(function (dk) { return envolver(dk, pass).then(function (w) { return api('/api/cuenta', json('PATCH', { clave: w })).then(function () { return guardarDK(uid, w.kid, dk); }); }); });
  });
}

var C = window.PlenaCuenta = {
  config: config, sesion: sesion, token: token, api: api, mensaje: mensaje, recordar: recordar,
  recuperando: function () { return recuperando; },
  login: function (email, pass, rec) {
    try { localStorage.setItem(KEY_REC, rec === false ? '0' : '1'); } catch (e) { }
    return config().then(function () { return sb.auth.signInWithPassword({ email: String(email || '').trim().toLowerCase(), password: pass }); })
      .then(function (r) {
        if (r.error) return { ok: false, error: mensaje(r.error) };
        var uid = r.data.user.id;
        return prepararDispositivo(uid, pass).then(function () { return { ok: true, user: r.data.user }; }, function () { return { ok: true, user: r.data.user, sinClave: true }; });
      }).catch(function (e) { return { ok: false, error: mensaje(e) }; });
  },
  // Cerrar sesión. La clave de datos se queda en este dispositivo (solo para esta usuaria): sin sesión no da acceso
  // a nada de la nube, y así, si luego recupera la contraseña aquí, no se pierde su copia cifrada.
  salir: function () {
    dkCache = null;
    return config().then(function () { return sb.auth.signOut({ scope: 'local' }); }).catch(function () { }).then(function () { del('plena.sesion'); });
  },
  recuperar: function (email) {
    return config().then(function () { return sb.auth.resetPasswordForEmail(String(email || '').trim().toLowerCase(), { redirectTo: location.origin + '/plena/' }); })
      .then(function (r) {
        // Mismo mensaje exista o no el correo (no revelamos qué correos tienen cuenta).
        if (r.error && (r.error.status === 429 || /rate/i.test(r.error.code || ''))) return { ok: false, error: mensaje(r.error) };
        return { ok: true };
      }).catch(function (e) { return { ok: false, error: mensaje(e) }; });
  },
  // Nueva contraseña desde el enlace del correo. Si este dispositivo tiene la clave del diario, solo se vuelve a envolver;
  // si no, se crea una nueva y la copia antigua de la nube (que ya nadie puede abrir) se reemplaza con la de este dispositivo.
  nuevaClave: function (pass) {
    var uid;
    return sesion().then(function (s) {
      if (!s) throw { code: 'sin_sesion' };
      uid = s.user.id;
      var antes = null; try { antes = localStorage.getItem(KEY_UID); } catch (e) { }
      if (antes && antes !== uid) { LOCALES.forEach(del); del(KEY_DK); }
      return sb.auth.updateUser({ password: pass });
    }).then(function (r) {
      if (r.error) throw r.error;
      recuperando = false;
      try { localStorage.setItem(KEY_UID, uid); } catch (e) { }
      return leerDK(uid);
    }).then(function (d) {
      if (d) return envolver(d.key, pass, d.kid).then(function (w) { return api('/api/cuenta', json('PATCH', { clave: w })); }).then(function () { return { ok: true, reemplazo: false }; });
      return nuevaClave().then(function (dk) {
        return envolver(dk, pass).then(function (w) {
          return api('/api/cuenta', json('PATCH', { clave: w })).then(function () { return guardarDK(uid, w.kid, dk); });
        });
      }).then(function () { return api('/api/sync', { method: 'DELETE' }); }).then(function () { return { ok: true, reemplazo: true }; });
    }).then(function (res) {
      return sb.auth.signOut({ scope: 'others' }).catch(function () { }).then(function () { return res; });
    }).catch(function (e) { return { ok: false, error: e && e.code === 'sin_sesion' ? 'El enlace caducó o ya se usó. Pide uno nuevo con «¿Olvidaste tu contraseña?».' : mensaje(e) }; });
  },
  // Cambio de contraseña con sesión iniciada: pide la actual, vuelve a envolver la clave del diario con la nueva.
  cambiarClave: function (actual, nueva) {
    var s0, cl;
    return sesion().then(function (s) {
      s0 = s; return sb.auth.signInWithPassword({ email: s.user.email, password: actual });
    }).then(function (r) {
      if (r.error) throw { code: r.error.code === 'invalid_credentials' ? 'actual_mal' : r.error.code, status: r.error.status };
      return api('/api/cuenta');
    }).then(function (x) {
      cl = x.d && x.d.clave;
      return cl ? desenvolver(cl, actual) : nuevaClave();
    }).then(function (dk) {
      return sb.auth.updateUser({ password: nueva }).then(function (r) {
        if (r.error) throw r.error;
        return envolver(dk, nueva, cl && cl.kid);
      }).then(function (w) { return api('/api/cuenta', json('PATCH', { clave: w })).then(function () { return guardarDK(s0.user.id, w.kid, dk); }); });
    }).then(function () { return sb.auth.signOut({ scope: 'others' }).catch(function () { }); })
      .then(function () { return { ok: true }; })
      .catch(function (e) { return { ok: false, error: e && e.code === 'actual_mal' ? 'Tu contraseña actual no es correcta.' : mensaje(e) }; });
  },
  // Abre la clave del diario con la contraseña (en un dispositivo donde falta o quedó vieja).
  abrirDiario: function (pass) {
    return sesion().then(function (s) {
      return api('/api/cuenta').then(function (x) {
        if (!x.ok || !x.d.clave) throw new Error('clave');
        return desenvolver(x.d.clave, pass).then(function (dk) { return guardarDK(s.user.id, x.d.clave.kid, dk); });
      });
    }).then(function () { return { ok: true }; }, function () { return { ok: false, error: 'La contraseña no es correcta.' }; });
  },
  // Para Mi diario: la clave de datos de esta usuaria (o null si hay que pedir la contraseña).
  claveDatos: function () { return sesion().then(function (s) { return s ? leerDK(s.user.id) : null; }); },
  claveVigente: function (kid) { return C.claveDatos().then(function (d) { return !!d && (!kid || d.kid === kid); }); },
  sellar: function (obj) { return C.claveDatos().then(function (d) { return d ? sellar(d.key, d.kid, obj) : null; }); },
  abrir: function (o) { return C.claveDatos().then(function (d) { if (!d) throw new Error('sin clave'); return abrir(d.key, o); }); },
  // Para crear la cuenta (gracias.html): clave nueva envuelta con la contraseña elegida.
  prepararClave: function (pass) {
    return nuevaClave().then(function (dk) { return envolver(dk, pass).then(function (w) { return { envuelta: w, dk: dk }; }); });
  },
  guardarClave: function (uid, kid, dk) { return guardarDK(uid, kid, dk); },
  usuaria: function () { return sesion().then(function (s) { return s ? s.user : null; }); },
  fuerza: function (p) {
    p = String(p || ''); var n = 0;
    if (p.length >= 8) n++; if (p.length >= 12) n++;
    if (/[a-z]/.test(p) && /[A-Z]/.test(p)) n++; if (/\d/.test(p)) n++; if (/[^A-Za-z0-9]/.test(p)) n++;
    if (p.length < 8) n = Math.min(n, 1); if (/^(.)\1+$/.test(p) || /^(12345678|password|contraseña|qwerty)/i.test(p)) n = 0;
    var l = Math.min(4, n);
    return { n: l, t: ['Muy débil', 'Débil', 'Aceptable', 'Fuerte', 'Muy fuerte'][l] };
  }
};
C.prepararDispositivo = prepararDispositivo;
})();
