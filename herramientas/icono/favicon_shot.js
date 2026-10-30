const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 256, height: 256 } });
  await p.goto('file://' + __dirname + '/fav.html'); await p.waitForFunction(() => document.body.dataset.ok); await p.waitForTimeout(200);
  await p.screenshot({ path: __dirname + '/fav256.png', omitBackground: true }); await b.close(); })();
