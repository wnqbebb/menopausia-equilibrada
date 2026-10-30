// Correos de PLENA desde Gmail (SMTP con contraseña de aplicación): GMAIL_USER + GMAIL_APP_PASSWORD.
// Nunca se envía ni se guarda la contraseña de la usuaria: el correo muestra su usuario y cómo recuperarla.
// Pruebas: ME_MAIL=memory guarda los correos en memoria (globalThis.__meCorreos) en lugar de enviarlos.
import { envGet as env } from "./catalog.js";

const SOPORTE = "cristinaaguilarrojas1@gmail.com";
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const ROSA = "#FF1A5D", TINTA = "#2B1B24", SUAVE = "#6B4E5C", FONDO = "#FFF0F3";

function marco(origin, titulo, cuerpo, pre) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>${esc(titulo)}</title>
<!--[if mso]><style>td,p,a,h1{font-family:Georgia,serif!important}</style><![endif]--></head>
<body style="margin:0;padding:0;background:${FONDO};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(pre)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${FONDO}"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border-radius:22px;border:1px solid #FFD1DC">
<tr><td align="center" style="padding:30px 24px 6px"><a href="${origin}/plena/" style="text-decoration:none"><img src="${origin}/icons/plena-correo.png" width="200" height="80" alt="Plena" style="display:block;width:200px;height:80px;border:0;outline:none;font-family:Georgia,serif;font-size:40px;color:${ROSA}"></a>
<p style="margin:6px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:${SUAVE}">Academia de menopausia y psicomenopausia</p></td></tr>
<tr><td style="padding:16px 28px 28px;font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.6;color:${TINTA}">${cuerpo}</td></tr>
<tr><td style="padding:18px 28px 26px;border-top:1px solid #FFE4EA;font-family:Arial,Helvetica,sans-serif;font-size:12.5px;line-height:1.55;color:${SUAVE}">
<b>Tu privacidad:</b> tus datos de salud del diario se cifran en tu propio dispositivo antes de guardarse; nadie más puede leerlos, tampoco nosotras. Nunca te pediremos tu contraseña por correo ni por mensaje.<br>
¿Dudas? Escríbenos a <a href="mailto:${SOPORTE}" style="color:${ROSA}">${SOPORTE}</a> · <a href="${origin}/privacidad.html" style="color:${ROSA}">Política de privacidad</a><br>© 2026 DisierTECH</td></tr>
</table></td></tr></table></body></html>`;
}
function boton(href, txt) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:22px auto"><tr><td align="center" bgcolor="${ROSA}" style="border-radius:999px">
<!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${href}" style="height:52px;v-text-anchor:middle;width:260px" arcsize="50%" fillcolor="${ROSA}" stroke="f"><center style="color:#ffffff;font-family:Arial,sans-serif;font-size:17px;font-weight:bold">${esc(txt)}</center></v:roundrect><![endif]-->
<!--[if !mso]><!--><a href="${href}" style="display:inline-block;padding:15px 34px;font-family:Arial,Helvetica,sans-serif;font-size:17px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:999px;background:${ROSA}">${esc(txt)}</a><!--<![endif]-->
</td></tr></table>`;
}
const li = (t) => `<tr><td width="26" valign="top" style="color:${ROSA};font-size:17px;line-height:1.6">♥</td><td style="font-size:16px;line-height:1.6;padding-bottom:4px">${t}</td></tr>`;

export function bienvenida({ origin, nombre, email }) {
  const n = esc(String(nombre || "").trim().split(/\s+/)[0] || "");
  const url = `${origin}/plena/`;
  const cuerpo = `<h1 style="margin:8px 0 12px;font-family:'Playfair Display',Georgia,serif;font-size:28px;line-height:1.2;color:${TINTA}">¡Bienvenida${n ? ", " + n : ""}!</h1>
<p style="margin:0 0 12px">Tu cuenta de PLENA ya está lista. Desde hoy tienes todo en un solo lugar, en tu celular y en tu computador.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${FONDO};border-radius:14px"><tr><td style="padding:14px 16px;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:${TINTA}">Tu usuario es: <b style="color:${ROSA}">${esc(email)}</b><br><span style="color:${SUAVE};font-size:13.5px">Tu contraseña es la que elegiste al crear la cuenta. Por seguridad, no la enviamos por correo.</span></td></tr></table>
${boton(url, "Entrar a PLENA")}
<p style="margin:0 0 6px"><b>Qué incluye tu acceso</b></p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="font-family:Georgia,serif;color:${TINTA}">
${li("El curso de menopausia y psicomenopausia: 10 módulos con su ruta personal.")}${li("Los cursos de práctica en video: fuerza, taichi, baile, podcast y más.")}${li("Tu biblioteca: los 13 libros para leer pasando las hojas.")}${li("Mi diario: registra tu día y descarga tu informe para la consulta.")}${li("Tus logros: niveles, insignias y rachas.")}${li("Tu certificado de graduación al terminar el curso.")}</table>
<p style="margin:18px 0 6px"><b>Instálala en tu celular</b></p>
<p style="margin:0 0 6px;font-size:15.5px"><b>iPhone (Safari):</b> abre ${esc(url)}, toca Compartir y luego «Añadir a pantalla de inicio».<br><b>Android (Chrome):</b> abre el enlace, toca el menú ⋮ y luego «Instalar app» o «Añadir a pantalla de inicio».</p>
<p style="margin:18px 0 6px"><b>¿Olvidaste tu contraseña?</b></p>
<p style="margin:0;font-size:15.5px">En la pantalla de inicio de sesión toca «¿Olvidaste tu contraseña?», escribe tu correo y te enviaremos un enlace para crear una nueva.</p>`;
  const text = `¡Bienvenida${n ? ", " + n : ""}!\n\nTu cuenta de PLENA ya está lista.\nTu usuario es: ${email}\nTu contraseña es la que elegiste al crear la cuenta (por seguridad no la enviamos por correo).\n\nEntrar a PLENA: ${url}\n\nIncluye: el curso (10 módulos), los cursos de práctica en video, tu biblioteca de 13 libros, Mi diario con tu informe, tus logros y tu certificado.\n\nInstálala en tu celular: en iPhone (Safari) toca Compartir → «Añadir a pantalla de inicio»; en Android (Chrome) menú ⋮ → «Instalar app».\n\n¿Olvidaste tu contraseña? En la pantalla de inicio de sesión toca «¿Olvidaste tu contraseña?» y te enviaremos un enlace.\n\nTus datos de salud del diario se cifran en tu dispositivo: nadie más puede leerlos.\nDudas: ${SOPORTE} · Privacidad: ${origin}/privacidad.html`;
  return { subject: "Tu cuenta de PLENA está lista", html: marco(origin, "Bienvenida a PLENA", cuerpo, "Tu usuario y cómo entrar a PLENA desde tu celular y tu computador."), text };
}

// Compra solo de libros (Biblioteca PAUSA): enlace a su página de descargas.
export function entrega({ origin, nombre, link }) {
  const n = esc(String(nombre || "").trim().split(/\s+/)[0] || "");
  const cuerpo = `<h1 style="margin:8px 0 12px;font-family:'Playfair Display',Georgia,serif;font-size:28px;line-height:1.2;color:${TINTA}">¡Gracias${n ? ", " + n : ""}!</h1>
<p style="margin:0 0 12px">Tu Biblioteca PAUSA ya es tuya: 13 libros para entender tu cuerpo y sentirte tú otra vez. Descárgalos cuando quieras desde tu página personal.</p>${boton(link, "Descargar mis libros")}
<p style="margin:0 0 10px;font-size:15px;color:${SUAVE}">Guarda este correo: el enlace es personal y siempre te lleva a tus descargas. Para rellenar los PDF en el celular, ábrelos con una app de PDF (por ejemplo, Adobe Acrobat Reader).</p>
<p style="margin:0;font-size:15px;color:${SUAVE}">En la misma página puedes sumar <b>PLENA</b> (la academia, Mi diario y tus logros) pagando solo la diferencia.</p>`;
  const text = `¡Gracias${n ? ", " + n : ""}!\n\nTu Biblioteca PAUSA ya es tuya. Descarga tus 13 libros aquí:\n${link}\n\nGuarda este correo: el enlace es personal.\nDudas: ${SOPORTE}`;
  return { subject: "Tus libros de PAUSA están listos", html: marco(origin, "Tus libros de PAUSA", cuerpo, "Descarga tus 13 libros desde tu página personal."), text };
}

export function crearCuenta({ origin, nombre, link }) {
  const n = esc(String(nombre || "").trim().split(/\s+/)[0] || "");
  const cuerpo = `<h1 style="margin:8px 0 12px;font-family:'Playfair Display',Georgia,serif;font-size:28px;line-height:1.2;color:${TINTA}">Hola${n ? ", " + n : ""}</h1>
<p style="margin:0 0 12px">Tu acceso a PLENA te está esperando. Solo falta un paso: crear tu cuenta con tu correo y una contraseña que elijas tú.</p>${boton(link, "Crear mi cuenta")}
<p style="margin:0;font-size:15px;color:${SUAVE}">Este enlace es personal: no lo compartas. En la misma página están también tus descargas.</p>`;
  const text = `Hola${n ? ", " + n : ""}\n\nTu acceso a PLENA te está esperando. Crea tu cuenta aquí:\n${link}\n\nEste enlace es personal: no lo compartas.\nDudas: ${SOPORTE}`;
  return { subject: "Crea tu cuenta de PLENA", html: marco(origin, "Crea tu cuenta de PLENA", cuerpo, "Un paso más para entrar a tu academia."), text };
}

let tx;
export async function enviar(to, { subject, html, text }) {
  if (env("ME_MAIL") === "memory") { (globalThis.__meCorreos ||= []).push({ to, subject, html, text, at: Date.now() }); return { ok: true, memory: true }; }
  const user = env("GMAIL_USER"), pass = env("GMAIL_APP_PASSWORD").replace(/\s+/g, "");
  if (!user || !pass) throw new Error("Faltan GMAIL_USER y GMAIL_APP_PASSWORD.");
  if (!tx) {
    const nodemailer = (await import("nodemailer")).default;
    tx = nodemailer.createTransport({ host: "smtp.gmail.com", port: 465, secure: true, auth: { user, pass } });
  }
  const info = await tx.sendMail({ from: { name: "PLENA", address: user }, replyTo: SOPORTE, to, subject, html, text });
  return { ok: true, id: info.messageId };
}

// Envía y deja constancia en el pedido (rec.correos) para verlo y reenviarlo desde el panel.
export async function enviarYRegistrar(rec, tipo, msg) {
  const log = { tipo, at: new Date().toISOString() };
  try { await enviar(rec.email, msg); log.ok = true; }
  catch (e) { console.error("correo", tipo, e?.message || e); log.ok = false; log.error = String(e?.message || e).slice(0, 200); }
  rec.correos = [...(rec.correos || []).slice(-9), log];
  return log;
}
