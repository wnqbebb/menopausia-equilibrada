// Correos de PLENA. Dos formas de enviar (se elige sola según las variables de Vercel):
//  1) Dominio propio (recomendado: no cae en spam y se ve profesional): SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
//     y MAIL_FROM (por ejemplo «hola@academiamenopausia.com»). Sirve con Resend, Zoho, Brevo, Google Workspace…
//  2) Gmail (SMTP con contraseña de aplicación): GMAIL_USER + GMAIL_APP_PASSWORD.
// MAIL_NAME cambia el nombre que ve la clienta (por defecto «Academia PLENA»). MAIL_REPLY_TO, la dirección de respuesta.
// Nunca se envía ni se guarda la contraseña de la usuaria: el correo muestra su usuario y cómo recuperarla.
// Pruebas: ME_MAIL=memory guarda los correos en memoria (globalThis.__meCorreos) en lugar de enviarlos.
import { envGet as env } from "./catalog.js";

const SOPORTE = "cristinaaguilarrojas1@gmail.com";
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const ROSA = "#E0337A", ROSA2 = "#FF1A5D", TINTA = "#2B1B24", SUAVE = "#6B4E5C", FONDO = "#FFF0F3", BLUSH = "#FFE3EC", NEGRO = "#1E1419";
const SERIF = "Georgia,'Times New Roman',serif", SANS = "Arial,Helvetica,sans-serif";
const soporte = () => env("MAIL_REPLY_TO") || SOPORTE;

// Plantilla: cabecera rosa con el logo, imagen, contenido y pie oscuro. Tablas e estilos en línea (Gmail, Outlook, Apple Mail).
function marco(origin, titulo, cuerpo, pre, imagen) {
  return `<!doctype html><html lang="es" xmlns:v="urn:schemas-microsoft-com:vml"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only"><title>${esc(titulo)}</title>
<!--[if mso]><style>td,p,a,h1,h2{font-family:Georgia,serif!important}</style><![endif]-->
<style>@media (max-width:600px){.px{padding-left:20px!important;padding-right:20px!important}.h1{font-size:30px!important}.paso{display:block!important;width:100%!important;padding:0 0 10px!important}}</style></head>
<body style="margin:0;padding:0;background:${FONDO};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">${esc(pre)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${FONDO}"><tr><td align="center" style="padding:26px 12px 34px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px">
<tr><td align="center" style="padding:0 0 14px;font-family:${SANS};font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${SUAVE}">Academia PLENA · Menopausia sin tabú</td></tr>
<tr><td style="background:#ffffff;border-radius:26px;overflow:hidden;border:1px solid #FFD1DC">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td align="center" bgcolor="#ffffff" style="background:#ffffff;padding:26px 24px 10px;border-radius:26px 26px 0 0"><a href="${origin}/plena/" style="text-decoration:none"><img src="${origin}/icons/plena-correo.png" width="180" height="72" alt="PLENA" style="display:block;width:180px;height:72px;border:0;outline:none;font-family:${SERIF};font-size:38px;color:${ROSA2}"></a>
<p style="margin:4px 0 0;font-family:${SERIF};font-style:italic;font-size:15px;color:${SUAVE}">Esta es una etapa, no el final.</p></td></tr>
${imagen ? `<tr><td align="center" bgcolor="${BLUSH}" style="background:${BLUSH};padding:8px 0 0"><img src="${origin}/icons/${imagen}" width="600" alt="" style="display:block;width:100%;max-width:600px;height:auto;border:0"></td></tr>` : ""}
<tr><td class="px" style="padding:30px 40px 34px;font-family:${SERIF};font-size:17px;line-height:1.65;color:${TINTA}">${cuerpo}</td></tr>
</table></td></tr>
<tr><td style="padding:22px 26px 0;font-family:${SANS};font-size:12.5px;line-height:1.6;color:${SUAVE}" align="center">
<b style="color:${TINTA}">Tu privacidad es lo primero.</b> Lo que escribes en Mi diario se cifra en tu propio dispositivo: nadie más puede leerlo, tampoco nosotras. Nunca te pediremos tu contraseña por correo ni por mensaje.<br><br>
¿Dudas? Responde a este correo o escríbenos a <a href="mailto:${soporte()}" style="color:${ROSA}">${soporte()}</a><br>
<a href="${origin}/privacidad.html" style="color:${ROSA}">Política de privacidad</a> · © 2026 DisierTECH<br>
<span style="font-size:11.5px">Recibes este correo porque compraste en Menopausia sin tabú. Es un correo de servicio sobre tu compra.</span></td></tr>
</table></td></tr></table></body></html>`;
}
function boton(href, txt) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:26px auto 22px"><tr><td align="center" bgcolor="${ROSA}" style="border-radius:999px;box-shadow:0 10px 22px rgba(224,51,122,.35)">
<!--[if mso]><v:roundrect href="${href}" style="height:56px;v-text-anchor:middle;width:300px" arcsize="50%" fillcolor="${ROSA}" stroke="f"><center style="color:#ffffff;font-family:Arial,sans-serif;font-size:18px;font-weight:bold">${esc(txt)}</center></v:roundrect><![endif]-->
<!--[if !mso]><!--><a href="${href}" style="display:inline-block;padding:17px 40px;font-family:${SANS};font-size:18px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:999px;background:${ROSA}">${esc(txt)} &rarr;</a><!--<![endif]-->
</td></tr></table>`;
}
const h1 = (t) => `<h1 class="h1" style="margin:0 0 14px;font-family:${SERIF};font-size:34px;line-height:1.15;font-weight:bold;color:${TINTA}">${t}</h1>`;
const caja = (html) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 4px"><tr><td bgcolor="${FONDO}" style="background:${FONDO};border-radius:16px;border-left:4px solid ${ROSA};padding:16px 18px;font-family:${SANS};font-size:15px;line-height:1.55;color:${TINTA}">${html}</td></tr></table>`;
const pasos = (lista) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 6px"><tr>${lista.map((p, i) => `<td class="paso" width="${Math.floor(100 / lista.length)}%" valign="top" style="padding:0 6px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="${FONDO}" style="background:${FONDO};border-radius:16px;padding:14px 14px 16px;font-family:${SANS};font-size:14px;line-height:1.45;color:${SUAVE}"><span style="display:inline-block;width:30px;height:30px;line-height:30px;border-radius:50%;background:${ROSA};color:#fff;text-align:center;font-weight:bold;font-size:15px">${i + 1}</span><br><b style="display:block;margin:8px 0 2px;color:${TINTA};font-size:15px">${p[0]}</b>${p[1]}</td></tr></table></td>`).join("")}</tr></table>`;
const li = (t) => `<tr><td width="28" valign="top" style="color:${ROSA};font-size:16px;line-height:1.6;font-family:${SANS}">&#10003;</td><td style="font-size:16px;line-height:1.6;padding-bottom:5px">${t}</td></tr>`;
const lista = (items) => `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="font-family:${SERIF};color:${TINTA};margin:4px 0 0">${items.map(li).join("")}</table>`;
const nombreDe = (nombre) => esc(String(nombre || "").trim().split(/\s+/)[0] || "");

export function bienvenida({ origin, nombre, email }) {
  const n = nombreDe(nombre);
  const url = `${origin}/plena/`;
  const cuerpo = `${h1(`¡Bienvenida${n ? ", " + n : ""}!`)}
<p style="margin:0 0 16px">Tu cuenta de PLENA ya está lista. Desde hoy tienes todo en un solo lugar, en tu celular y en tu computador.</p>
${caja(`Tu usuario: <b style="color:${ROSA}">${esc(email)}</b><br><span style="color:${SUAVE};font-size:13.5px">Tu contraseña es la que elegiste al crear la cuenta. Por seguridad, nunca la enviamos por correo.</span>`)}
${boton(url, "Entrar a PLENA")}
<p style="margin:0 0 4px;font-family:${SANS};font-size:13px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;color:${ROSA}">Tu acceso incluye</p>
${lista(["El curso de menopausia y psicomenopausia: 10 módulos con tu ruta personal.", "132 videos para practicar: fuerza, respiración, baile, podcast y más.", "Tu biblioteca: los 13 libros para leer pasando las hojas.", "Mi diario: registra tu día y descarga tu informe para la consulta.", "Tus logros, tus rachas y tu certificado al terminar."])}
<p style="margin:22px 0 4px;font-family:${SANS};font-size:13px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;color:${ROSA}">Tenla a un toque</p>
<p style="margin:0 0 14px;font-size:15.5px"><b>iPhone (Safari):</b> abre PLENA, toca Compartir y luego «Añadir a pantalla de inicio».<br><b>Android (Chrome):</b> menú ⋮ y luego «Instalar app».</p>
<p style="margin:0;font-size:15px;color:${SUAVE}">¿Olvidaste tu contraseña? En la pantalla de inicio toca «¿Olvidaste tu contraseña?» y te enviamos un enlace para crear una nueva.</p>`;
  const text = `¡Bienvenida${n ? ", " + n : ""}!\n\nTu cuenta de PLENA ya está lista.\nTu usuario es: ${email}\nTu contraseña es la que elegiste al crear la cuenta (por seguridad no la enviamos por correo).\n\nEntrar a PLENA: ${url}\n\nIncluye: el curso (10 módulos), 132 videos para practicar, tu biblioteca de 13 libros, Mi diario con tu informe, tus logros y tu certificado.\n\nInstálala en tu celular: en iPhone (Safari) toca Compartir → «Añadir a pantalla de inicio»; en Android (Chrome) menú ⋮ → «Instalar app».\n\n¿Olvidaste tu contraseña? En la pantalla de inicio toca «¿Olvidaste tu contraseña?» y te enviaremos un enlace.\n\nDudas: ${soporte()} · Privacidad: ${origin}/privacidad.html`;
  return { subject: "Tu cuenta de PLENA está lista", html: marco(origin, "Bienvenida a PLENA", cuerpo, "Tu usuario y cómo entrar a PLENA desde tu celular y tu computador.", "correo-plena.jpg"), text };
}

// Compra solo de libros (Biblioteca PAUSA): enlace a su biblioteca personal (leer y descargar).
export function entrega({ origin, nombre, link }) {
  const n = nombreDe(nombre);
  const cuerpo = `${h1(`¡Gracias${n ? ", " + n : ""}!`)}
<p style="margin:0 0 16px">Tu <b>Biblioteca PAUSA</b> ya es tuya: 13 libros para entender tu cuerpo, dormir mejor y sentirte tú otra vez.</p>
${boton(link, "Abrir mi biblioteca")}
${pasos([["Abre tu biblioteca", "Desliza los libros y toca una portada."], ["Léelo ahí mismo", "Pasa las páginas desde el celular o el computador."], ["Descárgalo", "Cada libro tiene su botón «Descargar PDF»."]])}
<p style="margin:18px 0 0;font-size:15px;color:${SUAVE}">Guarda este correo: el enlace es personal y siempre te lleva a tus libros. Para rellenar los PDF en el celular, ábrelos con una app de PDF (por ejemplo, Adobe Acrobat Reader).</p>
<p style="margin:12px 0 0;font-size:15px;color:${SUAVE}">En tu biblioteca también puedes sumar <b style="color:${TINTA}">PLENA</b> (la academia con videos, Mi diario y tus logros) pagando solo la diferencia.</p>`;
  const text = `¡Gracias${n ? ", " + n : ""}!\n\nTu Biblioteca PAUSA ya es tuya. Abre tus 13 libros (leer y descargar) aquí:\n${link}\n\nGuarda este correo: el enlace es personal.\nDudas: ${soporte()}`;
  return { subject: "Tu Biblioteca PAUSA está lista", html: marco(origin, "Tu Biblioteca PAUSA", cuerpo, "Tus 13 libros te esperan: léelos y descárgalos desde tu biblioteca.", "correo-libros.jpg"), text };
}

export function crearCuenta({ origin, nombre, link }) {
  const n = nombreDe(nombre);
  const cuerpo = `${h1(`Hola${n ? ", " + n : ""}, ya casi estás dentro`)}
<p style="margin:0 0 16px">Tu pago está confirmado y <b>PLENA</b> te está esperando. Solo falta un paso: crear tu cuenta con tu correo y una contraseña que elijas tú.</p>
${boton(link, "Crear mi cuenta")}
${pasos([["Crea tu cuenta", "Tu usuario es este correo; tú eliges la contraseña."], ["Entra a PLENA", "Desde el celular o el computador."], ["Empieza tu ruta", "Tu primer módulo, Mi diario y tus 13 libros."]])}
<p style="margin:18px 0 0;font-size:15px;color:${SUAVE}">Este enlace es personal: no lo compartas. Si no fuiste tú quien compró, ignora este correo.</p>`;
  const text = `Hola${n ? ", " + n : ""}\n\nTu pago está confirmado y PLENA te está esperando. Crea tu cuenta aquí (tu usuario es este correo y tú eliges la contraseña):\n${link}\n\nEste enlace es personal: no lo compartas.\nDudas: ${soporte()}`;
  return { subject: "Crea tu cuenta de PLENA", html: marco(origin, "Crea tu cuenta de PLENA", cuerpo, "Un paso más: crea tu cuenta y entra a tu academia.", "correo-plena.jpg"), text };
}

let tx;
export async function enviar(to, { subject, html, text }) {
  if (env("ME_MAIL") === "memory") { (globalThis.__meCorreos ||= []).push({ to, subject, html, text, at: Date.now() }); return { ok: true, memory: true }; }
  const propio = env("SMTP_HOST") && env("SMTP_USER") && env("SMTP_PASS");
  const user = env("GMAIL_USER"), pass = env("GMAIL_APP_PASSWORD").replace(/\s+/g, "");
  if (!propio && (!user || !pass)) throw new Error("Faltan SMTP_HOST/SMTP_USER/SMTP_PASS o GMAIL_USER/GMAIL_APP_PASSWORD.");
  if (!tx) {
    const nodemailer = (await import("nodemailer")).default;
    tx = propio
      ? nodemailer.createTransport({ host: env("SMTP_HOST"), port: +(env("SMTP_PORT") || 465), secure: +(env("SMTP_PORT") || 465) === 465, auth: { user: env("SMTP_USER"), pass: env("SMTP_PASS") } })
      : nodemailer.createTransport({ host: "smtp.gmail.com", port: 465, secure: true, auth: { user, pass } });
  }
  const desde = (propio ? env("MAIL_FROM") || env("SMTP_USER") : user);
  const info = await tx.sendMail({
    from: { name: env("MAIL_NAME") || "Academia PLENA", address: desde },
    replyTo: soporte(), to, subject, html, text,
    headers: { "List-Unsubscribe": `<mailto:${soporte()}?subject=Baja>` },
  });
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
