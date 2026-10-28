/* Artpixe · Offre Displate (fichier HD + livraison express offerts)
   Fonctionne sur les deux zones d'achat :
   - la section « Artpixe · Fiche produit » (cartes .apx-opt--cards, formulaire [data-apx-json]) ;
   - la fiche Kalles avec le sélecteur de format #apx-fmt et les variantes .pr_variants_json.
   Il remplace le badge de la carte Displate, affiche l'encadré de l'offre sous les cartes de format
   (bonus si Displate, incitation sinon), ajoute la propriété de commande « Offre Displate » quand
   un Displate est choisi et présélectionne le Displate si aucune variante n'est imposée par l'URL. */
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

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }

  // Section « Artpixe · Fiche produit »
  function apxPage() {
    var root = document.querySelector('[data-apx-root]');
    var jsonEl = root && root.querySelector('[data-apx-json]');
    var cards = root && root.querySelector('.apx-opt--cards');
    if (!jsonEl || !cards) return null;
    var data;
    try { data = JSON.parse(jsonEl.textContent); } catch (e) { return null; }
    var form = document.getElementById(data.formId);
    var select = root.querySelector('[data-apx-variant-select]');
    if (!form || !select) return null;

    var inputs = Array.prototype.slice.call(cards.querySelectorAll('[data-apx-value]'));
    var displateInput = inputs.filter(function (i) { return i.value === cfg.displateFormat; })[0];

    return {
      variants: data.variants.map(function (v) {
        return { id: v.id, title: v.options.join(' / '), price: v.price };
      }),
      currentId: function () { return select.value; },
      form: form,
      anchor: cards,
      canPick: !!displateInput,
      setBadge: function (text) {
        if (!displateInput) return;
        var label = displateInput.parentNode.querySelector('.apx-val__label');
        var badge = label && label.querySelector('.apx-val__badge');
        if (label && !badge) {
          badge = el('span', 'apx-val__badge');
          var check = label.querySelector('.apx-val__check');
          label.insertBefore(badge, check ? check.nextSibling : label.firstChild);
        }
        if (badge) badge.textContent = text;
      },
      pick: function () {
        if (!displateInput) return;
        displateInput.checked = true;
        displateInput.dispatchEvent(new Event('change', { bubbles: true }));
      },
      watch: function (onChange) {
        root.addEventListener('change', function (e) {
          if (e.target && e.target.matches && e.target.matches('[data-apx-value]')) onChange(e.isTrusted);
        });
      }
    };
  }

  // Fiche Kalles avec le sélecteur de format #apx-fmt
  function kallesPage() {
    var fmt = document.getElementById('apx-fmt');
    var info = document.querySelector('.t4s-product__info-container') || document;
    var form = info.querySelector('form[action*="/cart/add"]');
    var select = form && form.querySelector('[name="id"]');
    var variantsEl = document.querySelector('.pr_variants_json');
    if (!fmt || !form || !select || !variantsEl) return null;
    var variants;
    try { variants = JSON.parse(variantsEl.textContent); } catch (e) { return null; }
    var displateCard = fmt.querySelector('.apx-card[data-fmt="' + cfg.displateFormat + '"]');

    return {
      variants: variants.map(function (v) { return { id: v.id, title: String(v.title).trim(), price: v.price }; }),
      currentId: function () { return select.value; },
      form: form,
      anchor: fmt,
      canPick: !!displateCard && typeof window.apxPick === 'function',
      setBadge: function (text) {
        var tag = displateCard && displateCard.parentNode.querySelector('.apx-bs-tag');
        if (tag) tag.textContent = text;
      },
      pick: function () {
        if (!displateCard) return;
        if (typeof window.apxPick === 'function') window.apxPick(displateCard);
        else displateCard.click();
      },
      watch: function (onChange) {
        // Kalles déclenche « change » sur [name=id]
        document.addEventListener('change', function (e) {
          if (e.target && e.target.matches && e.target.matches('[name="id"]')) onChange(false);
        });
        document.addEventListener('click', function (e) {
          var t = e.target && e.target.closest && e.target.closest('.apx-card, [data-swatch-item]');
          if (t) setTimeout(function () { onChange(e.isTrusted); }, 80);
        });
      }
    };
  }

  function init() {
    if (!live()) return;
    var page = apxPage() || kallesPage();
    if (!page) return;

    var byTitle = {};
    page.variants.forEach(function (v) { byTitle[v.title] = v; });

    if (cfg.badge) page.setBadge(cfg.badge);

    var box = el('div', 'apx-offer');
    box.setAttribute('aria-live', 'polite');
    page.anchor.parentNode.insertBefore(box, page.anchor.nextSibling);

    var userTouched = false;

    function currentVariant() {
      var id = String(page.currentId());
      return page.variants.filter(function (v) { return String(v.id) === id; })[0] || null;
    }

    function formatOf(v) { return v ? v.title.split(' / ').slice(1).join(' / ') : ''; }

    function setProperty(on) {
      var input = page.form.querySelector('input[data-apx-offer-prop]');
      if (on && !input) {
        input = el('input');
        input.type = 'hidden';
        input.name = 'properties[' + cfg.propertyName + ']';
        input.value = cfg.propertyValue;
        input.setAttribute('data-apx-offer-prop', '');
        page.form.appendChild(input);
      } else if (!on && input) {
        input.parentNode.removeChild(input);
      }
    }

    var lastKey = '';
    function update(force) {
      if (!live()) { box.hidden = true; setProperty(false); return; }
      var v = currentVariant();
      if (!v) return;
      var people = v.title.split(' / ')[0];
      var format = formatOf(v);
      var key = v.id + '|' + format;
      if (key === lastKey && !force) return;
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
      } else if (displate && page.canPick) {
        var text = cfg.upsell
          .replace('[ecart]', money(Math.max(displate.price - v.price, 0)))
          .replace('[hd]', hd ? money(hd.price) : '');
        box.appendChild(el('p', 'apx-offer__upsell', text));
        var btn = el('button', 'apx-offer__btn', cfg.upsellButton);
        btn.type = 'button';
        btn.addEventListener('click', function () {
          userTouched = true;
          page.pick();
          setTimeout(function () { update(true); }, 80);
        });
        box.appendChild(btn);
      }
    }

    page.watch(function (trusted) {
      if (trusted) userTouched = true;
      setTimeout(function () { update(true); }, 0);
    });
    setInterval(update, 1000);

    // Présélection du Displate, sauf si l'URL vise une variante précise
    var hasVariantParam = /[?&]variant=/.test(window.location.search);
    if (cfg.preselect && !hasVariantParam && page.canPick) {
      var tries = 0;
      (function pick() {
        if (userTouched || tries > 6) return;
        tries++;
        if (formatOf(currentVariant()) === cfg.displateFormat) { update(true); return; }
        page.pick();
        setTimeout(pick, 300);
      })();
    }

    update(true);
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
