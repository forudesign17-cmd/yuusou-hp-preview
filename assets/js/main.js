(function () {
  'use strict';

  // ---- ナビ開閉
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('gnav');
  if (toggle && nav) {
    var setOpen = function (open) {
      nav.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    toggle.addEventListener('click', function () { setOpen(!nav.classList.contains('open')); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) { setOpen(false); toggle.focus(); }
    });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
  }

  // ---- 計測イベント（個人情報は送らない）。メール・電話は「クリック」であり、送信完了ではない
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-event]');
    if (!el) return;
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: el.getAttribute('data-event') });
    } catch (err) { /* 何もしない */ }
  });

  // ---- 地図は表示領域に入ってから読み込む
  var map = document.querySelector('.map[data-src]');
  if (map && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries, obs) {
      if (entries[0].isIntersecting) {
        var f = document.createElement('iframe');
        f.src = map.getAttribute('data-src');
        f.title = '株式会社雄創の所在地の地図';
        f.loading = 'lazy';
        f.referrerPolicy = 'no-referrer-when-downgrade';
        map.insertBefore(f, map.firstChild);
        obs.disconnect();
      }
    }).observe(map);
  }

  // ---- メール本文ひな形のコピー
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var src = document.querySelector(btn.getAttribute('data-copy'));
      var status = btn.parentNode.querySelector('.copy-status');
      if (!src) return;
      var done = function (ok) { if (status) status.textContent = ok ? 'コピーしました' : 'コピーできませんでした。手動で選択してコピーしてください。'; };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(src.textContent).then(function () { done(true); }, function () { done(false); });
      } else { done(false); }
    });
  });
})();

// ---- 動き（スクロール連動）。動きを減らす設定のときは何もしない
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ヘッダーの影
  var header = document.querySelector('.site-header');
  var bar = document.createElement('div');
  bar.className = 'progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY || 0;
      if (header) header.classList.toggle('scrolled', y > 8);
      var h = document.documentElement.scrollHeight - window.innerHeight;
      if (!reduce) bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(y / h, 1) : 0) + ')';
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (reduce || !('IntersectionObserver' in window)) return;

  // 現れる要素を指定。同じ親の中では順番にずらす
  var groups = [
    '.section .wrap > *', '.cta-band .wrap > *', '.block > *', '.prose > *', '.form-wrap > *',
    '.svc', '.cards > .card', '.values > li', '.cta-grid > .cta-card:not(.entrances .cta-card)', '.toc'
  ];
  var targets = [];
  groups.forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (el) {
      if (el.closest('.hero') || el.closest('.page-head') || el.closest('.entrances') || el.classList.contains('reveal')) return;
      targets.push(el);
    });
  });
  document.documentElement.classList.add('js');
  var seen = new Map();
  targets.forEach(function (el) {
    var p = el.parentNode, i = seen.get(p) || 0;
    seen.set(p, i + 1);
    el.classList.add('reveal');
    el.style.setProperty('--d', Math.min(i, 5) * 0.09 + 's');
  });
  document.querySelectorAll('.split-media, .svc-media').forEach(function (el) { el.classList.remove('reveal'); el.classList.add('reveal-img'); });
  document.querySelectorAll('.split').forEach(function (sp) {
    var kids = sp.children;
    if (kids.length === 2) {
      var mediaFirst = kids[0].classList.contains('split-media');
      if (!kids[0].classList.contains('split-media')) kids[0].setAttribute('data-dir', 'left');
      if (!kids[1].classList.contains('split-media')) kids[1].setAttribute('data-dir', mediaFirst ? 'right' : 'right');
    }
  });
  document.querySelectorAll('.split .reveal').forEach(function (el) { el.style.setProperty('--d', '.15s'); });
  var first = document.querySelectorAll('.cards > .card'); first.forEach(function (el, i) { el.style.setProperty('--d', (i % 3) * 0.12 + 's'); });
  // パララックス：トップのヒーロー写真と、下層ページの見出し帯
  var heroImg = document.querySelector('.hero-media');
  var heads = document.querySelectorAll('.page-head');
  if (heroImg || heads.length) {
    var pTick = false;
    var para = function () {
      if (pTick) return;
      pTick = true;
      requestAnimationFrame(function () {
        var y = Math.min(window.scrollY, 600);
        if (heroImg) heroImg.style.transform = 'translateY(' + (y * 0.2) + 'px)';
        heads.forEach(function (h) { h.style.setProperty('--py', y + 'px'); });
        pTick = false;
      });
    };
    window.addEventListener('scroll', para, { passive: true });
    para();
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('.reveal, .reveal-img').forEach(function (el) { io.observe(el); });
})();
