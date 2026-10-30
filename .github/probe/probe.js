const { chromium } = require('playwright');
const URL = 'https://artpixe.com/products/portrait-personnalise-one-piece?preview_theme_id=211006259538';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 400, height: 900 }, locale: 'fr-FR' });
  const scripts = new Set();
  page.on('response', r => { const u = r.url(); if (/upload/i.test(u)) scripts.add(u); });
  page.on('console', m => { if (/apx|upload/i.test(m.text())) console.log('CONSOLE', m.text()); });
  page.on('pageerror', e => console.log('PAGEERROR', e.message));
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(8000);
  console.log('=== URLS WITH "upload"\n' + [...scripts].join('\n'));
  const info = await page.evaluate(() => {
    const out = {};
    const form = document.querySelector('[data-apx-form]');
    out.formFound = !!form;
    out.appSlot = (document.querySelector('.apx-app') || {}).outerHTML ? document.querySelector('.apx-app').outerHTML.slice(0, 3000) : null;
    const buy = document.querySelector('.apx-buy');
    // Structure de la zone d'achat : chaque élément avec son parent, sans le texte
    const lines = [];
    const walk = (el, depth) => {
      if (depth > 6) return;
      for (const c of el.children) {
        const attrs = [...c.attributes].filter(a => a.name !== 'style' && a.name !== 'd').map(a => a.name + '="' + a.value.slice(0, 60) + '"').join(' ');
        lines.push('  '.repeat(depth) + '<' + c.tagName.toLowerCase() + ' ' + attrs + '>' + (c.children.length ? '' : ' ' + (c.textContent || '').trim().slice(0, 40)));
        if (!/^(SVG|SELECT|SCRIPT|STYLE)$/i.test(c.tagName)) walk(c, depth + 1);
      }
    };
    if (buy) walk(buy, 0);
    out.tree = lines.join('\n').slice(0, 30000);
    const btn = [...document.querySelectorAll('button, a, div, span, label')].filter(e => /Ajouter mes photos/i.test(e.textContent) && e.children.length < 3);
    out.ukButton = btn.map(e => { let p = e, chain = []; while (p && p !== document.body) { chain.push(p.tagName.toLowerCase() + (p.id ? '#' + p.id : '') + (p.className && typeof p.className === 'string' ? '.' + p.className.trim().split(/\s+/).join('.') : '')); p = p.parentElement; } return chain.join(' < '); });
    return out;
  });
  console.log('=== FORM FOUND', info.formFound);
  console.log('=== APP SLOT\n' + info.appSlot);
  console.log('=== UPLOADKIT BUTTON ANCESTORS\n' + info.ukButton.join('\n\n'));
  console.log('=== BUY TREE\n' + info.tree);
  for (const u of scripts) {
    if (!/\.js(\?|$)/.test(u)) continue;
    try {
      const txt = await (await fetch(u)).text();
      console.log('=== SCRIPT ' + u + ' (' + txt.length + ' chars)');
      const re = /insertBefore|insertAdjacent|\.before\(|\.after\(|prepend\(|appendChild|cart\/add|\[name=.?add|type=.?submit|MutationObserver|setInterval/g;
      let m, n = 0;
      while ((m = re.exec(txt)) && n < 60) { n++; console.log('--- ' + m[0] + ' @' + m.index + ': ' + txt.slice(Math.max(0, m.index - 300), m.index + 200).replace(/\s+/g, ' ')); }
    } catch (e) { console.log('fetch fail', u, e.message); }
  }
  await browser.close();
})();
