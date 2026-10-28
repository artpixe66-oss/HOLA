/* Artpixe · Offre spéciale Displate
   Un interrupteur remplace le bandeau « livraison offerte » (cfg.replace) : l'activer fait passer le portrait
   en Displate, pour la différence de prix réelle, et débloque les cadeaux (livraison express, commande prioritaire,
   version digitale HD). Le désactiver revient au format choisi avant.
   Fonctionne sur les deux zones d'achat :
   - la section « Artpixe · Fiche produit » (cartes .apx-opt--cards, formulaire [data-apx-json]) ;
   - la fiche Kalles avec le sélecteur de format #apx-fmt et les variantes .pr_variants_json.
   Ajoute la propriété de commande « Offre Displate » tant qu'un format de l'offre est choisi. */
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

    function input(format) {
      return Array.prototype.slice.call(cards.querySelectorAll('[data-apx-value]'))
        .filter(function (i) { return i.value === format; })[0];
    }

    return {
      variants: data.variants.map(function (v) {
        return { id: v.id, title: v.options.join(' / '), price: v.price };
      }),
      currentId: function () { return select.value; },
      form: form,
      cards: cards,
      canPick: function (format) { return !!input(format); },
      setBadge: function (format, text) {
        var i = input(format);
        var label = i && i.parentNode.querySelector('.apx-val__label');
        if (!label) return;
        var badge = label.querySelector('.apx-val__badge');
        if (!badge) {
          badge = el('span', 'apx-val__badge');
          var check = label.querySelector('.apx-val__check');
          label.insertBefore(badge, check ? check.nextSibling : label.firstChild);
        }
        badge.textContent = text;
      },
      pick: function (format) {
        var i = input(format);
        if (!i) return;
        i.checked = true;
        i.dispatchEvent(new Event('change', { bubbles: true }));
      },
      watch: function (onChange) {
        root.addEventListener('change', function (e) {
          if (e.target && e.target.matches && e.target.matches('[data-apx-value]')) onChange();
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

    function card(format) { return fmt.querySelector('.apx-card[data-fmt="' + format + '"]'); }

    return {
      variants: variants.map(function (v) { return { id: v.id, title: String(v.title).trim(), price: v.price }; }),
      currentId: function () { return select.value; },
      form: form,
      cards: fmt,
      canPick: function (format) { return !!card(format); },
      setBadge: function (format, text) {
        var c = card(format);
        var tag = c && c.parentNode.querySelector('.apx-bs-tag');
        if (tag) tag.textContent = text;
      },
      pick: function (format) {
        var c = card(format);
        if (!c) return;
        if (typeof window.apxPick === 'function') window.apxPick(c);
        else c.click();
      },
      watch: function (onChange) {
        // Kalles déclenche « change » sur [name=id]
        document.addEventListener('change', function (e) {
          if (e.target && e.target.matches && e.target.matches('[name="id"]')) onChange();
        });
        document.addEventListener('click', function (e) {
          var t = e.target && e.target.closest && e.target.closest('.apx-card, [data-swatch-item]');
          if (t) setTimeout(onChange, 80);
        });
      }
    };
  }

  function init() {
    if (!live()) return;
    var page = apxPage() || kallesPage();
    if (!page || !page.canPick(cfg.displateFormat)) return;

    var byTitle = {};
    page.variants.forEach(function (v) { byTitle[v.title] = v; });

    if (cfg.badge) page.setBadge(cfg.displateFormat, cfg.badge);

    // L'encadré prend la place du bandeau à remplacer, sinon il se place sous les cartes de format
    var box = el('div', 'apx-offer');
    var replaced = cfg.replace && document.querySelector(cfg.replace);
    if (replaced) {
      var block = replaced.closest('.apx-liquid, .t4s-pr__custom-liquid') || replaced;
      block.parentNode.insertBefore(box, block);
      block.style.display = 'none';
    } else {
      page.cards.parentNode.insertBefore(box, page.cards.nextSibling);
    }

    var head = el('div', 'apx-offer__head');
    var intro = el('div', 'apx-offer__intro');
    var title = el('p', 'apx-offer__title', '🎁 ' + cfg.title);
    var sub = el('p', 'apx-offer__sub');
    sub.id = 'apx-offer-sub';
    intro.appendChild(title);
    intro.appendChild(sub);
    var toggle = el('button', 'apx-switch');
    toggle.type = 'button';
    toggle.setAttribute('role', 'switch');
    toggle.setAttribute('aria-label', cfg.switchLabel);
    toggle.setAttribute('aria-describedby', sub.id);
    toggle.appendChild(el('span', 'apx-switch__knob'));
    head.appendChild(intro);
    head.appendChild(toggle);
    var perks = el('ul', 'apx-offer__perks');
    var until = el('p', 'apx-offer__until', cfg.until);
    box.appendChild(head);
    box.appendChild(perks);
    box.appendChild(until);

    function currentVariant() {
      var id = String(page.currentId());
      return page.variants.filter(function (v) { return String(v.id) === id; })[0] || null;
    }
    function peopleOf(v) { return v.title.split(' / ')[0]; }
    function formatOf(v) { return v ? v.title.split(' / ').slice(1).join(' / ') : ''; }
    function isOffer(format) { return cfg.formats.indexOf(format) !== -1; }

    // Format à retrouver quand on désactive l'offre : le dernier choisi hors offre, sinon l'affiche
    var base = cfg.posterFormat;

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
      var format = formatOf(v);
      var key = v.id + '|' + base;
      if (key === lastKey && force !== true) return;
      lastKey = key;

      var people = peopleOf(v);
      var on = isOffer(format);
      if (!on) base = format;
      var offerFormat = on ? format : cfg.displateFormat;
      var offerVariant = byTitle[people + ' / ' + offerFormat];
      var baseVariant = byTitle[people + ' / ' + base];
      var hd = byTitle[people + ' / ' + cfg.digitalFormat];
      var ecart = offerVariant && baseVariant ? Math.max(offerVariant.price - baseVariant.price, 0) : 0;

      box.classList.toggle('apx-offer--on', on);
      toggle.setAttribute('aria-checked', on ? 'true' : 'false');
      sub.textContent = (on ? cfg.subOn : cfg.subOff)
        .replace('[format]', (cfg.labels && cfg.labels[offerFormat]) || offerFormat)
        .replace('[ecart]', money(ecart));

      perks.innerHTML = '';
      cfg.perks.forEach(function (text) {
        perks.appendChild(el('li', '', text.replace('[hd]', hd ? money(hd.price) : '')));
      });
      setProperty(on);
    }

    toggle.addEventListener('click', function () {
      var on = toggle.getAttribute('aria-checked') === 'true';
      page.pick(on ? base : cfg.displateFormat);
      setTimeout(function () { update(true); }, 80);
    });

    page.watch(function () { setTimeout(function () { update(true); }, 0); });
    setInterval(update, 1000);
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
