/* Artpixe · Offre Displate (fichier HD + livraison express offerts)
   S'appuie sur la page existante : sélecteur de format (#apx-fmt), formulaire Kalles et variantes .pr_variants_json.
   - remplace le badge de la carte Displate,
   - affiche l'encadré de l'offre sous les cartes de format (bonus si Displate, incitation sinon),
   - ajoute la propriété de commande « Offre Displate » quand un Displate est choisi,
   - présélectionne le Displate à l'arrivée si aucune variante n'est imposée par l'URL. */
(function () {
  'use strict';

  var cfgEl = document.getElementById('apx-offer-config');
  if (!cfgEl) return;
  var cfg;
  try { cfg = JSON.parse(cfgEl.textContent); } catch (e) { return; }

  function live() {
    var now = Date.now() / 1000;
    return !(cfg.start && now < cfg.start) && !(cfg.end && now > cfg.end);
  }

  function money(cents) {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100);
  }

  function init() {
    if (!live()) return;
    var fmt = document.getElementById('apx-fmt');
    var info = document.querySelector('.t4s-product__info-container') || document;
    var form = info.querySelector('form[action*="/cart/add"]');
    var select = form && form.querySelector('[name="id"]');
    var variantsEl = document.querySelector('.pr_variants_json');
    if (!fmt || !form || !select || !variantsEl) return;

    var variants;
    try { variants = JSON.parse(variantsEl.textContent); } catch (e) { return; }
    var byTitle = {};
    variants.forEach(function (v) { byTitle[String(v.title).trim()] = v; });

    var displateCard = fmt.querySelector('.apx-card[data-fmt="' + cfg.displateFormat + '"]');

    // Badge de la carte Displate
    if (displateCard && cfg.badge) {
      var tag = displateCard.parentNode.querySelector('.apx-bs-tag');
      if (tag) tag.textContent = cfg.badge;
    }

    // Encadré de l'offre, juste sous les cartes de format
    var box = document.createElement('div');
    box.className = 'apx-offer';
    box.setAttribute('aria-live', 'polite');
    fmt.parentNode.insertBefore(box, fmt.nextSibling);

    var userTouched = false;

    function currentVariant() {
      var opt = select.options[select.selectedIndex];
      var id = select.value;
      var v = variants.filter(function (x) { return String(x.id) === String(id); })[0];
      if (v) return v;
      return opt ? byTitle[opt.textContent.trim()] : null;
    }

    function setProperty(on) {
      var input = form.querySelector('input[data-apx-offer-prop]');
      if (on && !input) {
        input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'properties[' + cfg.propertyName + ']';
        input.value = cfg.propertyValue;
        input.setAttribute('data-apx-offer-prop', '');
        form.appendChild(input);
      } else if (!on && input) {
        input.parentNode.removeChild(input);
      }
    }

    function el(tag, cls, text) {
      var n = document.createElement(tag);
      if (cls) n.className = cls;
      if (text) n.textContent = text;
      return n;
    }

    var lastKey = '';
    function update() {
      if (!live()) { box.hidden = true; setProperty(false); return; }
      var v = currentVariant();
      if (!v) return;
      var parts = String(v.title).split(' / ');
      var people = parts[0];
      var format = parts.slice(1).join(' / ');
      var key = v.id + '|' + format;
      if (key === lastKey) return;
      lastKey = key;

      var hd = byTitle[people + ' / ' + cfg.digitalFormat];
      var a3 = byTitle[people + ' / ' + cfg.posterFormat];
      var displate = byTitle[people + ' / ' + cfg.displateFormat];
      var isOffer = cfg.formats.indexOf(format) !== -1;

      box.innerHTML = '';
      box.classList.toggle('apx-offer--on', isOffer);
      setProperty(isOffer);

      if (isOffer) {
        box.appendChild(el('p', 'apx-offer__title', '🎁 ' + cfg.title));
        var list = el('ul', 'apx-offer__perks');
        if (hd) list.appendChild(el('li', '', cfg.perkHd.replace('[hd]', money(hd.price))));
        list.appendChild(el('li', '', cfg.perkShipping));
        box.appendChild(list);
        if (format === cfg.displateFormat && hd && a3 && displate && displate.price < a3.price + hd.price) {
          box.appendChild(el('p', 'apx-offer__compare', cfg.compare
            .replace('[a3hd]', money(a3.price + hd.price))
            .replace('[displate]', money(displate.price))));
        }
      } else if (displate && displateCard) {
        var diff = displate.price - v.price;
        var text = cfg.upsell
          .replace('[ecart]', money(Math.max(diff, 0)))
          .replace('[hd]', hd ? money(hd.price) : '');
        box.appendChild(el('p', 'apx-offer__upsell', text));
        var btn = el('button', 'apx-offer__btn', cfg.upsellButton);
        btn.type = 'button';
        btn.addEventListener('click', function () {
          userTouched = true;
          if (typeof window.apxPick === 'function') window.apxPick(displateCard);
          else displateCard.click();
          setTimeout(update, 80);
        });
        box.appendChild(btn);
      }
    }

    // Suivre les changements de variante (Kalles déclenche « change » sur [name=id])
    document.addEventListener('change', function (e) {
      if (e.target && e.target.matches && e.target.matches('[name="id"]')) { lastKey = ''; update(); }
    });
    document.addEventListener('click', function (e) {
      var t = e.target && e.target.closest && e.target.closest('.apx-card, [data-swatch-item]');
      if (!t) return;
      if (e.isTrusted) userTouched = true;
      setTimeout(function () { lastKey = ''; update(); }, 80);
    });
    setInterval(update, 1000);

    // Présélection du Displate, sauf si l'URL vise une variante précise
    var hasVariantParam = /[?&]variant=/.test(window.location.search);
    if (cfg.preselect && !hasVariantParam && displateCard && typeof window.apxPick === 'function') {
      var tries = 0;
      (function pick() {
        if (userTouched || tries > 6) return;
        tries++;
        var v = currentVariant();
        var format = v ? String(v.title).split(' / ').slice(1).join(' / ') : '';
        if (format === cfg.displateFormat) { lastKey = ''; update(); return; }
        window.apxPick(displateCard);
        setTimeout(pick, 300);
      })();
    }

    update();
  }

  // Après les scripts de la page (sélecteur de format inclus), qui s'initialisent au DOMContentLoaded
  var started = false;
  function start() {
    if (started) return;
    started = true;
    setTimeout(init, 0);
  }
  if (document.readyState === 'complete') start();
  else {
    document.addEventListener('DOMContentLoaded', start);
    window.addEventListener('load', start);
  }
})();
