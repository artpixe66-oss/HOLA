/* Artpixe · Fiche produit personnalisée
   Configurateur de variantes, prix dynamiques, messages datés, galerie, barre fixe mobile.
   Aucune dépendance. Le contenu est rendu côté serveur : ce script ne fait qu'améliorer. */
(function () {
  'use strict';

  function formatMoney(cents, format) {
    var value = '';
    var placeholder = /\{\{\s*(\w+)\s*\}\}/;
    var fmt = format || '{{amount_with_comma_separator}} €';

    function withDelimiters(number, precision, thousands, decimal) {
      if (isNaN(number) || number == null) return '0';
      var parts = (number / 100).toFixed(precision).split('.');
      var dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands);
      return dollars + (parts[1] ? decimal + parts[1] : '');
    }

    var match = fmt.match(placeholder);
    switch (match ? match[1] : 'amount') {
      case 'amount': value = withDelimiters(cents, 2, ',', '.'); break;
      case 'amount_no_decimals': value = withDelimiters(cents, 0, ',', '.'); break;
      case 'amount_with_comma_separator': value = withDelimiters(cents, 2, '.', ','); break;
      case 'amount_no_decimals_with_comma_separator': value = withDelimiters(cents, 0, '.', ','); break;
      case 'amount_with_apostrophe_separator': value = withDelimiters(cents, 2, "'", '.'); break;
      case 'amount_with_space_separator': value = withDelimiters(cents, 2, ' ', ','); break;
      default: value = withDelimiters(cents, 2, '.', ',');
    }
    var tmp = document.createElement('div');
    tmp.innerHTML = fmt.replace(placeholder, value);
    return tmp.textContent;
  }

  function publish(name, data) {
    try {
      if (window.Shopify && Shopify.analytics && typeof Shopify.analytics.publish === 'function') {
        Shopify.analytics.publish(name, data);
      }
    } catch (e) { /* suivi facultatif */ }
  }

  function initProduct(root) {
    var jsonEl = root.querySelector('[data-apx-json]');
    if (!jsonEl) return;
    var data;
    try { data = JSON.parse(jsonEl.textContent); } catch (e) { return; }

    var form = document.getElementById(data.formId);
    var select = root.querySelector('[data-apx-variant-select]');
    var fieldsets = Array.prototype.slice.call(root.querySelectorAll('[data-apx-option]'));
    var variants = data.variants || [];
    var current = variants.filter(function (v) { return v.id === data.currentVariantId; })[0] || variants[0];
    if (!current) return;
    var selected = current.options.slice();
    var touched = false;

    if (select) { select.hidden = true; select.tabIndex = -1; }

    function findVariant(options) {
      for (var i = 0; i < variants.length; i++) {
        var v = variants[i];
        var ok = true;
        for (var j = 0; j < options.length; j++) {
          if (v.options[j] !== options[j]) { ok = false; break; }
        }
        if (ok) return v;
      }
      return null;
    }

    function priceFor(optionIndex, value) {
      var opts = selected.slice();
      opts[optionIndex] = value;
      return findVariant(opts);
    }

    function money(cents) { return formatMoney(cents, data.moneyFormat); }

    function renderValuePrices() {
      var picker = root.querySelector('[data-apx-picker]');
      var chipsMode = picker ? picker.getAttribute('data-chips-price') : 'none';
      var cardsPrice = picker ? picker.getAttribute('data-cards-price') === 'true' : false;

      fieldsets.forEach(function (fs) {
        var idx = parseInt(fs.getAttribute('data-apx-option'), 10);
        var isCards = fs.classList.contains('apx-opt--cards');
        var inputs = Array.prototype.slice.call(fs.querySelectorAll('[data-apx-value]'));
        var base = inputs.length ? priceFor(idx, inputs[0].value) : null;

        inputs.forEach(function (input) {
          var v = priceFor(idx, input.value);
          var priceEl = input.parentNode.querySelector('[data-apx-value-price]');
          if (v && v.available) { input.removeAttribute('data-unavailable'); }
          else { input.setAttribute('data-unavailable', ''); }
          if (!priceEl || !v) return;
          if (isCards) {
            priceEl.textContent = cardsPrice ? money(v.price) : '';
          } else if (chipsMode === 'absolute') {
            priceEl.textContent = money(v.price);
          } else if (chipsMode === 'delta' && base) {
            var delta = v.price - base.price;
            priceEl.textContent = delta > 0 ? '+' + money(delta) : '';
          }
        });

        var upsell = fs.querySelector('[data-apx-upsell]');
        if (upsell && inputs.length > 1) {
          var first = priceFor(idx, inputs[0].value);
          var second = priceFor(idx, inputs[1].value);
          var isFirst = selected[idx] === inputs[0].value;
          if (isFirst && first && second && second.available && second.price > first.price) {
            upsell.textContent = upsell.getAttribute('data-template').replace('[ecart]', money(second.price - first.price));
            upsell.hidden = false;
          } else {
            upsell.hidden = true;
          }
        }
      });
    }

    function renderVariant(variant) {
      root.querySelectorAll('[data-apx-price]').forEach(function (el) {
        el.textContent = money(variant.price);
      });
      root.querySelectorAll('[data-apx-compare]').forEach(function (el) {
        if (variant.compare > variant.price) {
          el.textContent = money(variant.compare);
          el.hidden = false;
        } else {
          el.hidden = true;
        }
      });
      root.querySelectorAll('[data-apx-savings]').forEach(function (el) {
        var diff = variant.compare - variant.price;
        if (diff > 0) {
          el.textContent = el.getAttribute('data-template').replace('[montant]', money(diff));
          el.hidden = false;
        } else {
          el.hidden = true;
        }
      });
      fieldsets.forEach(function (fs) {
        var checked = fs.querySelector('[data-apx-value]:checked');
        var current = fs.querySelector('[data-apx-current]');
        if (checked && current) current.textContent = checked.getAttribute('data-label') || checked.value;
      });
      root.querySelectorAll('[data-apx-price-context]').forEach(function (el) {
        var tpl = el.getAttribute('data-apx-price-context');
        el.textContent = tpl
          .replace('[1]', variant.options[0] || '')
          .replace('[2]', variant.options[1] || '')
          .replace('[3]', variant.options[2] || '');
      });
      root.querySelectorAll('[data-apx-submit]').forEach(function (btn) {
        var label = btn.querySelector('[data-apx-btn-label]');
        btn.disabled = !variant.available;
        if (label) label.textContent = variant.available ? btn.getAttribute('data-label') : btn.getAttribute('data-soldout');
      });
      if (select) select.value = String(variant.id);

      if (data.updateUrl && window.history && history.replaceState) {
        var url = new URL(window.location.href);
        url.searchParams.set('variant', variant.id);
        history.replaceState(history.state, '', url.toString());
      }
      if (variant.media) goToMedia(variant.media);
      renderValuePrices();
    }

    fieldsets.forEach(function (fs) {
      var idx = parseInt(fs.getAttribute('data-apx-option'), 10);
      fs.addEventListener('change', function (event) {
        var input = event.target;
        if (!input.matches('[data-apx-value]')) return;
        selected[idx] = input.value;
        touched = true;
        var variant = findVariant(selected);
        if (!variant) {
          // Combinaison inexistante : on garde la valeur choisie et on prend la première variante qui l'a.
          variant = variants.filter(function (v) { return v.options[idx] === input.value && v.available; })[0];
          if (!variant) return;
          selected = variant.options.slice();
          fieldsets.forEach(function (other) {
            var oIdx = parseInt(other.getAttribute('data-apx-option'), 10);
            other.querySelectorAll('[data-apx-value]').forEach(function (r) { r.checked = r.value === selected[oIdx]; });
          });
        }
        current = variant;
        renderVariant(variant);
        publish('apx_option_change', { option: idx + 1, value: input.value, variantId: variant.id, price: variant.price / 100 });
      });
    });

    // Champs et choix : on note l'interaction pour la barre fixe.
    root.addEventListener('input', function (event) {
      if (event.target.closest('.apx-field')) touched = true;
    });

    // Envoi : état de chargement et message clair si un champ obligatoire manque.
    if (form) {
      // Nos champs sont vérifiés ci-dessous ; la validation du navigateur bloquerait sur les champs des applications.
      form.noValidate = true;
      var sending = false;

      var setBusy = function (on) {
        sending = on;
        root.querySelectorAll('[data-apx-submit]').forEach(function (btn) {
          if (on) btn.setAttribute('aria-busy', 'true');
          else btn.removeAttribute('aria-busy');
        });
      };

      form.addEventListener('submit', function (event) {
        if (sending) { event.preventDefault(); return; }
        // Propriétés ajoutées hors du formulaire par une application (photos UploadKit…) : on les y rattache.
        root.querySelectorAll('input[name^="properties["]:not([type="file"]), textarea[name^="properties["], select[name^="properties["]').forEach(function (el) {
          if (!el.form && !el.closest('form')) el.setAttribute('form', data.formId);
        });
        var error = root.querySelector('[data-apx-error]');
        var invalid = Array.prototype.slice.call(document.querySelectorAll('[form="' + data.formId + '"]'))
          .filter(function (el) { return el.willValidate && !el.checkValidity(); })[0];
        if (invalid) {
          event.preventDefault();
          if (error) {
            var label = root.querySelector('label[for="' + invalid.id + '"]');
            error.textContent = 'Il manque une information : ' + (label ? label.textContent.replace('(facultatif)', '').trim() : 'un champ obligatoire') + '.';
            error.hidden = false;
          }
          invalid.focus();
          return;
        }
        if (error) error.hidden = true;
        setBusy(true);
        publish('apx_add_to_cart', { variantId: current.id, price: current.price / 100 });

        // Ajout au panier par /cart/add.js puis paiement, comme l'ancienne fiche Kalles : les applications
        // (photos UploadKit) suivent ce chemin. Sans fetch, envoi classique du formulaire (return_to = paiement).
        if (!window.fetch || !window.FormData) return;
        event.preventDefault();
        var body = new FormData(form);
        // Pastilles et cartes d'options : déjà traduites en variante (champ id), inutiles au panier.
        var extra = [];
        body.forEach(function (value, key) { if (key.indexOf('apx-') === 0) extra.push(key); });
        extra.forEach(function (key) { body.delete(key); });
        var returnTo = form.querySelector('[name="return_to"]');
        var rootUrl = (window.Shopify && Shopify.routes && Shopify.routes.root) || '/';

        fetch(rootUrl + 'cart/add.js', { method: 'POST', body: body, headers: { Accept: 'application/json' }, credentials: 'same-origin' })
          .then(function (response) {
            if (response.ok) {
              window.location.href = returnTo ? returnTo.value : rootUrl + 'checkout';
              return;
            }
            return response.json().catch(function () { return {}; }).then(function (json) {
              setBusy(false);
              if (error) {
                error.textContent = json.description || json.message || 'Impossible d’ajouter ce portrait au panier. Réessaie.';
                error.hidden = false;
              }
            });
          })
          .catch(function () {
            // Réseau ou navigateur : on retombe sur l'envoi classique du formulaire.
            HTMLFormElement.prototype.submit.call(form);
          });
      });

      // Retour arrière depuis le panier : le bouton ne doit pas rester en chargement.
      window.addEventListener('pageshow', function () { setBusy(false); });
    }

    // Galerie
    var track = root.querySelector('[data-apx-track]');
    var indexEl = root.querySelector('[data-apx-slide-index]');
    var thumbs = Array.prototype.slice.call(root.querySelectorAll('[data-apx-thumb]'));

    function goToMedia(mediaId) {
      if (!track) return;
      var slide = track.querySelector('[data-media-id="' + mediaId + '"]');
      if (slide) track.scrollTo({ left: slide.offsetLeft - track.offsetLeft, behavior: 'smooth' });
    }

    thumbs.forEach(function (btn) {
      btn.addEventListener('click', function () { goToMedia(btn.getAttribute('data-apx-thumb')); });
    });

    if (track && 'IntersectionObserver' in window) {
      var slides = Array.prototype.slice.call(track.children);
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var i = slides.indexOf(entry.target);
          if (indexEl) indexEl.textContent = String(i + 1);
          var id = entry.target.getAttribute('data-media-id');
          thumbs.forEach(function (t) {
            if (t.getAttribute('data-apx-thumb') === id) t.setAttribute('aria-current', 'true');
            else t.removeAttribute('aria-current');
          });
        });
      }, { root: track, threshold: 0.6 });
      slides.forEach(function (s) { io.observe(s); });
    }

    // Barre fixe mobile
    var sticky = root.querySelector('[data-apx-sticky]');
    var config = root.querySelector('#apx-config') || root.querySelector('.apx-buy');
    var buyButton = root.querySelector('[data-apx-submit]');

    function scrollToConfig() {
      if (!config) return;
      config.scrollIntoView({ behavior: 'smooth', block: 'start' });
      var firstInput = config.querySelector('input:checked, input, textarea');
      if (firstInput) setTimeout(function () { firstInput.focus({ preventScroll: true }); }, 400);
    }

    if (sticky && 'IntersectionObserver' in window) {
      var anchors = [config, buyButton].filter(Boolean);
      var visible = {};
      var stickyIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { visible[anchors.indexOf(e.target)] = e.isIntersecting; });
        var anyVisible = Object.keys(visible).some(function (k) { return visible[k]; });
        var passed = config ? config.getBoundingClientRect().top < 0 : true;
        sticky.hidden = anyVisible || !passed;
      });
      anchors.forEach(function (a) { stickyIo.observe(a); });

      var stickyBtn = sticky.querySelector('[data-apx-sticky-btn]');
      stickyBtn.addEventListener('click', function () {
        publish('apx_sticky_click', { mode: sticky.getAttribute('data-mode') });
        if (sticky.getAttribute('data-mode') === 'submit' && touched && form && buyButton && !buyButton.disabled) {
          if (typeof form.requestSubmit === 'function') form.requestSubmit(buyButton);
          else buyButton.click();
          return;
        }
        scrollToConfig();
      });
    }

    document.querySelectorAll('[data-apx-goto-config]').forEach(function (link) {
      link.addEventListener('click', function (event) {
        if (!config) return;
        event.preventDefault();
        scrollToConfig();
      });
    });

    renderValuePrices();
    root.classList.add('apx-ready');
  }

  // Messages datés : masqués ou affichés selon la date réelle, y compris si la page vient du cache.
  function initDated() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll('[data-apx-dated]'));
    if (!nodes.length) return;

    function pad(n) { return n < 10 ? '0' + n : String(n); }

    function tick() {
      var now = Date.now() / 1000;
      nodes.forEach(function (el) {
        var start = parseInt(el.getAttribute('data-start'), 10) || 0;
        var end = parseInt(el.getAttribute('data-end'), 10) || 0;
        var show = !(start && now < start) && !(end && now > end);
        el.hidden = !show;

        var hours = parseInt(el.getAttribute('data-countdown'), 10) || 0;
        var cd = el.querySelector('[data-apx-countdown]');
        if (!cd) return;
        var left = end - now;
        if (show && hours && end && left > 0 && left <= hours * 3600) {
          var d = Math.floor(left / 86400);
          var h = Math.floor((left % 86400) / 3600);
          var m = Math.floor((left % 3600) / 60);
          cd.textContent = 'Fin dans ' + (d ? d + ' j ' : '') + pad(h) + ' h ' + pad(m) + ' min';
          cd.hidden = false;
        } else {
          cd.hidden = true;
        }
      });
    }
    tick();
    setInterval(tick, 30000);
  }

  function init() {
    var legacySticky = document.getElementById('sticky-atc');
    if (legacySticky) legacySticky.remove();
    document.querySelectorAll('[data-apx-root]').forEach(initProduct);
    initDated();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // Éditeur de thème : réinitialiser la section rechargée.
  document.addEventListener('shopify:section:load', function (event) {
    var root = event.target.querySelector('[data-apx-root]');
    if (root) initProduct(root);
    initDated();
  });
})();
