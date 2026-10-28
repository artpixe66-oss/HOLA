/* Artpixe · Navigation et défilement de la page produit (section « Artpixe · Navigation »)
   - barre de liens vers les sections, affichée sous l'en-tête une fois la fiche dépassée,
     avec la section en cours surlignée et une barre de progression ;
   - défilement en douceur qui tient compte de l'en-tête fixe ;
   - boutons « Commander » des sections : ramènent à la zone d'achat au lieu de quitter la page ;
   - FAQ : une seule réponse ouverte à la fois ;
   - textes longs repliés avec « Lire la suite » (le texte reste dans la page).
   Le contenu des sections n'est jamais modifié. Sans JavaScript, la page s'affiche comme avant. */
(function () {
  'use strict';

  var nav = document.querySelector('[data-apx-pnav]');
  if (!nav) return;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var behavior = reduceMotion ? 'auto' : 'smooth';

  function findSection(key) {
    if (!key) return null;
    return document.getElementById('shopify-section-' + key) ||
      document.querySelector('[id^="shopify-section-"][id$="__' + key + '"]') ||
      document.getElementById(key);
  }

  // Bas de l'en-tête fixe ou collant, s'il y en a un en haut de l'écran
  function headerOffset() {
    if (!document.elementsFromPoint) return 0;
    var bottom = 0;
    document.elementsFromPoint(Math.round(window.innerWidth / 2), 1).forEach(function (el) {
      if (nav.contains(el)) return;
      for (var n = el; n && n !== document.body && n !== document.documentElement; n = n.parentElement) {
        var pos = getComputedStyle(n).position;
        if (pos === 'fixed' || pos === 'sticky') {
          var r = n.getBoundingClientRect();
          if (r.top <= 1 && r.height < window.innerHeight / 2) bottom = Math.max(bottom, r.bottom);
          break;
        }
      }
    });
    return Math.max(0, Math.round(bottom));
  }

  function scrollToEl(el, extra) {
    var top = el.getBoundingClientRect().top + window.pageYOffset - headerOffset() - (extra || 0) - 8;
    window.scrollTo({ top: Math.max(0, top), behavior: behavior });
  }

  // La barre est rattachée au body : un parent animé (transform) casserait position: fixed
  document.body.appendChild(nav);
  var list = nav.querySelector('.apx-pnav__list');
  var progress = nav.querySelector('.apx-pnav__progress');
  var after = findSection(nav.getAttribute('data-after'));
  var links = Array.prototype.slice.call(nav.querySelectorAll('.apx-pnav__link'))
    .map(function (a) { return { a: a, el: findSection(a.getAttribute('data-target')) }; })
    .filter(function (l) { return l.el; });
  links.forEach(function (l) { l.el.classList.add('apx-pagesec'); });

  function openReviews(sectionEl) {
    var title = sectionEl.querySelector('.t4s-tab__title[href^="#t4s-tab-review"]');
    if (!title) return sectionEl;
    var wrapper = title.closest('.t4s-tab-wrapper');
    if (wrapper && !wrapper.classList.contains('t4s-active')) title.click();
    return title;
  }

  function go(link) {
    var target = link.hasAttribute('data-open-reviews') ? openReviews(findSection(link.getAttribute('data-target'))) : findSection(link.getAttribute('data-target'));
    if (!target) return;
    scrollToEl(target, nav.offsetHeight);
  }

  links.forEach(function (l) {
    l.a.addEventListener('click', function (e) {
      e.preventDefault();
      go(l.a);
    });
  });

  // Le badge d'avis du haut de fiche (#avis) ouvre aussi les avis
  var reviewsLink = nav.querySelector('[data-open-reviews]');
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href="#avis"]');
    if (!a || !reviewsLink || nav.contains(a)) return;
    e.preventDefault();
    go(reviewsLink);
  });

  // Boutons « Commander » des sections : retour à la zone d'achat
  var orderSel = nav.getAttribute('data-order-links');
  var buy = document.querySelector(nav.getAttribute('data-buy') || '#apx-config');
  if (orderSel && buy) {
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest(orderSel);
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      scrollToEl(buy);
      var first = buy.querySelector('input:checked, input');
      if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, reduceMotion ? 0 : 500);
    });
  }

  // Affichage, section en cours, progression
  var activeLink = null;
  function update() {
    var offset = headerOffset();
    nav.style.top = offset + 'px';
    var show = after ? after.getBoundingClientRect().bottom <= offset + 1 : window.pageYOffset > 400;
    if (show === nav.hidden) {
      nav.hidden = !show;
      document.documentElement.classList.toggle('apx-pnav-on', show);
    }
    if (!show) return;

    var line = offset + nav.offsetHeight + 24;
    var current = null;
    links.forEach(function (l) { if (l.el.getBoundingClientRect().top <= line) current = l; });
    if (current !== activeLink) {
      if (activeLink) activeLink.a.removeAttribute('aria-current');
      activeLink = current;
      if (current) {
        current.a.setAttribute('aria-current', 'true');
        var a = current.a.parentNode;
        list.scrollTo({ left: a.offsetLeft - (list.clientWidth - a.offsetWidth) / 2, behavior: behavior });
      }
    }

    var start = after ? after.getBoundingClientRect().bottom + window.pageYOffset : 0;
    var end = document.documentElement.scrollHeight - window.innerHeight;
    var p = end > start ? (window.pageYOffset - start) / (end - start) : 0;
    progress.style.transform = 'scaleX(' + Math.max(0, Math.min(1, p)).toFixed(3) + ')';
  }
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; update(); });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();

  // FAQ : une seule réponse ouverte à la fois
  links.forEach(function (l) {
    var items = l.el.querySelectorAll('details');
    if (items.length < 3) return;
    l.el.setAttribute('data-apx-faq', '');
    Array.prototype.forEach.call(items, function (d) {
      d.addEventListener('toggle', function () {
        if (!d.open) return;
        Array.prototype.forEach.call(items, function (o) { if (o !== d && o.open) o.open = false; });
      });
    });
  });

  // Textes longs : repliés, « Lire la suite » pour tout afficher
  var foldSel = nav.getAttribute('data-fold');
  var foldH = parseInt(nav.getAttribute('data-fold-height'), 10) || 320;
  if (foldSel) {
    Array.prototype.forEach.call(document.querySelectorAll(foldSel), function (el, i) {
      if (el.scrollHeight < foldH + 160) return;
      if (!el.id) el.id = 'apx-fold-' + i;
      el.classList.add('apx-fold');
      el.style.setProperty('--apx-fold-h', foldH + 'px');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'apx-fold__btn';
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-controls', el.id);
      btn.textContent = nav.getAttribute('data-more');
      el.parentNode.insertBefore(btn, el.nextSibling);
      btn.addEventListener('click', function () {
        var open = el.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        btn.textContent = nav.getAttribute(open ? 'data-less' : 'data-more');
        if (!open) scrollToEl(el, nav.hidden ? 0 : nav.offsetHeight);
      });
    });
  }
})();
