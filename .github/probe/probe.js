const { chromium } = require('playwright');
const URL = 'https://artpixe.com/products/portrait-personnalise-one-piece?preview_theme_id=210873549138';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 400, height: 900 }, locale: 'fr-FR' });
  page.on('pageerror', e => console.log('PAGEERROR', e.message));
  try { await page.goto(URL, { waitUntil: 'load', timeout: 90000 }); } catch (e) { console.log('GOTO', e.message); }
  await page.waitForTimeout(12000);
  const where = await page.evaluate(() => {
    const out = [];
    out.push('theme=' + (window.Shopify && Shopify.theme && Shopify.theme.name));
    document.querySelectorAll('.uploadkit').forEach(u => {
      const prev = u.parentElement.previousElementSibling;
      out.push('uploadkit class="' + u.className + '" button=' + !!u.querySelector('.uploadkit-button') + ' parent="' + u.parentElement.className + '" parentPrev="' + (prev && prev.className) + '" inForm=' + !!u.closest('form[action*="/cart/add"]'));
    });
    if (!document.querySelector('.uploadkit')) out.push('NO .uploadkit');
    return out.join('\n');
  });
  console.log('=== WHERE\n' + where);
  await browser.close();
})();
