// Genera sitio/public/icons/plena-correo.png (logotipo de los correos). Uso: node herramientas/icono/correo_shot.js
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 400, height: 160 } });
  await p.goto('file://' + __dirname + '/correo.html'); await p.waitForFunction(() => document.body.dataset.ok); await p.waitForTimeout(200);
  await p.screenshot({ path: __dirname + '/../../sitio/public/icons/plena-correo.png' }); await b.close(); })();
