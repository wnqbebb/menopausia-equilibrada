const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 512, height: 512 } });
  for (const [name, fs] of [['big', 140], ['mask', 108]]) {
    await p.goto('file://' + __dirname + '/icon.html?fs=' + fs); await p.waitForFunction(() => document.body.dataset.ok);
    await p.waitForTimeout(200); await p.screenshot({ path: __dirname + '/' + name + '.png', omitBackground: false });
  }
  await b.close();
})();
