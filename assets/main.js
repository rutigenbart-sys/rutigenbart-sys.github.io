(function () {
  'use strict';
  var TG = 'https://t.me/ironshopstore', WA = 'https://wa.me/79268542333';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var enc = encodeURIComponent;
  var money = function (n) { return Math.round(n).toLocaleString('ru-RU').replace(/ /g, ' ') + ' ₽'; };

  /* ---------- preloader ---------- */
  (function () {
    var pl = $('#preloader'); if (!pl) return;
    var t0 = performance.now(), done = false;
    function hide() {
      if (done) return; done = true;
      setTimeout(function () {
        pl.classList.add('hide');
        try { sessionStorage.setItem('pl', '1'); } catch (e) {}
        setTimeout(function () { if (pl.parentNode) pl.parentNode.removeChild(pl); }, 550);
      }, Math.max(0, 800 - (performance.now() - t0)));
    }
    if (document.readyState === 'complete') hide(); else window.addEventListener('load', hide);
    setTimeout(hide, 3200);
  })();

  /* ---------- toast ---------- */
  var toastEl;
  function toast(text) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
    toastEl.textContent = text; toastEl.classList.add('on');
    clearTimeout(toast.t); toast.t = setTimeout(function () { toastEl.classList.remove('on'); }, 2200);
  }

  /* ---------- order links (telegram / whatsapp) ---------- */
  $$('[data-order]').forEach(function (a) {
    var text = (a.getAttribute('data-msg') || 'Здравствуйте!') + '\n' + location.href;
    a.href = (a.getAttribute('data-order') === 'tg' ? TG : WA) + '?text=' + enc(text);
  });

  /* ---------- header: mobile menu, fab ---------- */
  var burger = $('.burger'), mm = $('.mm');
  if (burger && mm) {
    burger.addEventListener('click', function () {
      var on = mm.classList.toggle('on');
      burger.setAttribute('aria-expanded', on); burger.classList.toggle('on', on);
      document.documentElement.style.overflow = on ? 'hidden' : '';
    });
    $$('a', mm).forEach(function (a) { a.addEventListener('click', function () { mm.classList.remove('on'); burger.setAttribute('aria-expanded', 'false'); document.documentElement.style.overflow = ''; }); });
  }
  var fab = $('.fab'), fabBtn = $('.fab-main');
  if (fab && fabBtn) {
    fabBtn.addEventListener('click', function () { var on = fab.classList.toggle('on'); fabBtn.setAttribute('aria-expanded', on); });
    document.addEventListener('click', function (e) { if (!fab.contains(e.target)) { fab.classList.remove('on'); fabBtn.setAttribute('aria-expanded', 'false'); } });
  }

  /* ---------- cart ---------- */
  var KEY = 'ironshop.cart.v1', cart = [];
  try { cart = JSON.parse(localStorage.getItem(KEY) || '[]') || []; } catch (e) { cart = []; }
  var drawer = $('#cart'), scrim = $('#scrim'), lastFocus = null;
  function save() { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {} }
  function count() { return cart.reduce(function (s, i) { return s + i.qty; }, 0); }
  function total() { return cart.reduce(function (s, i) { return s + (i.price ? i.price * i.qty : 0); }, 0); }
  function badge() { $$('.badge').forEach(function (b) { var n = count(); b.textContent = n || ''; b.setAttribute('data-n', n); }); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function renderCart() {
    if (!drawer) return;
    var list = $('#cart-list'), foot = $('#cart-foot'), empty = $('#cart-empty');
    badge();
    if (!cart.length) { list.innerHTML = ''; empty.hidden = false; foot.hidden = true; return; }
    empty.hidden = true; foot.hidden = false;
    list.innerHTML = cart.map(function (i, idx) {
      return '<div class="ci" data-idx="' + idx + '"><img src="' + esc(i.img) + '" alt="" width="68" height="84">' +
        '<div><a href="' + esc(i.url) + '">' + esc(i.title) + '</a><div class="pr">' + (i.price ? money(i.price) : 'Цена по запросу') + '</div>' +
        '<div class="qty"><button type="button" data-q="-1" aria-label="Меньше">−</button><span>' + i.qty + '</span><button type="button" data-q="1" aria-label="Больше">+</button></div></div>' +
        '<button class="rm" type="button" data-rm aria-label="Удалить">×</button></div>';
    }).join('');
    var t = total();
    $('#cart-sum').textContent = t ? money(t) : 'по запросу';
    $('#cart-n').textContent = count();
  }
  function openCart() {
    if (!drawer) return; lastFocus = document.activeElement;
    renderCart(); drawer.classList.add('on'); scrim.classList.add('on'); drawer.removeAttribute('inert');
    document.documentElement.style.overflow = 'hidden';
    var f = $('#cart-close'); if (f) f.focus();
  }
  function closeCart() {
    if (!drawer) return; drawer.classList.remove('on'); scrim.classList.remove('on');
    document.documentElement.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function addToCart(d, btn) {
    var found = cart.filter(function (i) { return i.id === d.id; })[0];
    if (found) found.qty = Math.min(99, found.qty + 1);
    else cart.push({ id: d.id, title: d.title, price: d.price ? parseFloat(d.price) : null, img: d.img, url: d.url, qty: 1 });
    save(); badge();
    toast('Добавлено в корзину');
    if (btn) { btn.classList.add('ok'); var t = btn.querySelector('.txt'); var old = t && t.textContent; if (t) t.textContent = 'В корзине'; setTimeout(function () { btn.classList.remove('ok'); if (t) t.textContent = old; }, 1400); }
  }
  document.addEventListener('click', function (e) {
    var add = e.target.closest('[data-add]');
    if (add) { e.preventDefault(); addToCart(add.dataset, add); if (add.hasAttribute('data-open')) openCart(); return; }
    if (e.target.closest('[data-cart-open]')) { e.preventDefault(); openCart(); return; }
    if (e.target.closest('#cart-close') || e.target === scrim) { closeCart(); return; }
    var row = e.target.closest('.ci');
    if (row) {
      var idx = +row.dataset.idx;
      if (e.target.closest('[data-rm]')) { cart.splice(idx, 1); save(); renderCart(); }
      var q = e.target.closest('[data-q]');
      if (q) { cart[idx].qty += +q.dataset.q; if (cart[idx].qty < 1) cart.splice(idx, 1); save(); renderCart(); }
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeCart(); var lb = $('.lb'); if (lb) lb.remove(); if (fab) fab.classList.remove('on'); }
  });
  badge();

  /* ---------- forms: cart + messages ---------- */
  function fallbackLink(text) { return TG + '?text=' + enc(text); }
  function submitForm(form, kind) {
    var msgBox = $('.msg-slot', form), btn = $('button[type=submit]', form);
    var fd = new FormData(form);
    var payload = { kind: kind, name: fd.get('name'), phone: fd.get('phone'), comment: fd.get('comment') || '', consent: !!fd.get('consent'), website: fd.get('website') || '', page: location.href };
    if (kind === 'cart') payload.items = cart.map(function (i) { return { title: i.title, qty: i.qty, price: i.price, url: i.url }; });
    var text = 'Здравствуйте! Меня зовут ' + payload.name + '. Телефон: ' + payload.phone + '.' +
      (kind === 'cart' ? '\nЗаказ:\n' + cart.map(function (i, n) { return (n + 1) + '. ' + i.title + ' × ' + i.qty + (i.price ? ' — ' + money(i.price * i.qty) : ''); }).join('\n') + (total() ? '\nИтого: ' + money(total()) : '') : '') +
      (payload.comment ? '\n' + payload.comment : '');
    var label = btn.textContent; btn.disabled = true; btn.textContent = 'Отправляем…';
    msgBox.innerHTML = '';
    fetch('/send.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok && j.ok, j: j }; }); })
      .then(function (res) {
        if (!res.ok) throw new Error('fail');
        if (kind === 'cart') {
          cart = []; save(); renderCart();
          $('#cart-form-wrap').hidden = true; $('#cart-list').hidden = true;
          $('#cart-done').hidden = false;
        } else {
          form.reset(); msgBox.innerHTML = '<div class="msg ok" role="status">Спасибо! Сообщение отправлено, мы свяжемся с вами в течение рабочего дня.</div>';
        }
      })
      .catch(function () {
        msgBox.innerHTML = '<div class="msg err" role="alert">Не получилось отправить автоматически. <a href="' + fallbackLink(text) + '" target="_blank" rel="noopener">Отправить в Telegram</a> или позвоните <a href="tel:+79268542333">+7 926 854-23-33</a>.</div>';
      })
      .then(function () { btn.disabled = false; btn.textContent = label; });
  }
  $$('form[data-kind]').forEach(function (form) {
    form.addEventListener('submit', function (e) { e.preventDefault(); if (form.dataset.kind === 'cart' && !cart.length) return; submitForm(form, form.dataset.kind); });
  });

  /* ---------- catalog filters ---------- */
  var grid = $('[data-grid]');
  if (grid) {
    var items = $$(':scope > li', grid);
    items.forEach(function (li, i) { li.dataset.i = i; });
    var q = $('#q'), sort = $('#sort'), stock = $('#stock'), cnt = $('#count'), empty = $('#empty');
    var word = function (n) { var m = n % 100, d = n % 10; if (m > 10 && m < 20) return 'товаров'; return d === 1 ? 'товар' : (d > 1 && d < 5 ? 'товара' : 'товаров'); };
    var apply = function () {
      var term = q.value.trim().toLowerCase(), only = stock.checked, shown = [];
      items.forEach(function (li) {
        var ok = (!term || li.dataset.title.indexOf(term) > -1) && (!only || li.dataset.stock === '1');
        li.hidden = !ok; if (ok) shown.push(li);
      });
      var by = sort.value, P = function (li) { var p = parseFloat(li.dataset.price); return isNaN(p) ? Infinity : p; };
      shown.sort(function (a, b) {
        if (by === 'asc') return (P(a) === Infinity ? 1e12 : P(a)) - (P(b) === Infinity ? 1e12 : P(b));
        if (by === 'desc') return (P(b) === Infinity ? -1 : P(b)) - (P(a) === Infinity ? -1 : P(a));
        return a.dataset.i - b.dataset.i;
      });
      shown.forEach(function (li) { grid.appendChild(li); });
      cnt.textContent = shown.length + ' ' + word(shown.length); empty.hidden = shown.length > 0;
    };
    [q, sort, stock].forEach(function (el) { el.addEventListener('input', apply); });
    apply();
  }

  /* ---------- gallery + lightbox + description ---------- */
  var main = $('#main-photo'), thumbs = $$('.thumbs button');
  thumbs.forEach(function (b) {
    b.addEventListener('click', function () {
      main.src = b.getAttribute('data-src'); main.alt = b.getAttribute('data-alt') || main.alt;
      thumbs.forEach(function (x) { x.removeAttribute('aria-current'); }); b.setAttribute('aria-current', 'true');
    });
  });
  var mainBox = $('.gallery .main');
  if (mainBox) mainBox.addEventListener('click', function () {
    var lb = document.createElement('div'); lb.className = 'lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-label', 'Увеличенное фото');
    lb.innerHTML = '<img src="' + main.src + '" alt="' + esc(main.alt) + '"><button type="button" aria-label="Закрыть">×</button>';
    lb.addEventListener('click', function () { lb.remove(); }); document.body.appendChild(lb);
  });
  var more = $('.desc .more'), moreBtn = $('#more-btn');
  if (more && moreBtn) moreBtn.addEventListener('click', function () { var o = more.classList.toggle('open'); moreBtn.textContent = o ? 'Свернуть' : 'Читать полностью'; });

  /* ---------- hero slider ---------- */
  var hero = $('.hero');
  if (hero && $('.slide', hero)) {
    var slides = $$('.slide', hero), bgs = $$('.hero-bg img', hero), dots = $$('.pager button', hero), cap = $('.hero-cap', hero), ctr = $('.counter', hero);
    var idx = 0, DUR = 5500, timer = null, paused = false, reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    hero.style.setProperty('--dur', DUR + 'ms');
    var show = function (n) {
      idx = (n + slides.length) % slides.length;
      slides.forEach(function (s, i) { s.classList.toggle('on', i === idx); s.setAttribute('aria-hidden', i === idx ? 'false' : 'true'); });
      bgs.forEach(function (b, i) { b.classList.toggle('on', i === idx); });
      dots.forEach(function (d, i) { d.classList.remove('on', 'done'); void d.offsetWidth; if (i < idx) d.classList.add('done'); if (i === idx && !reduce) d.classList.add('on'); if (reduce && i <= idx) d.classList.add('done'); d.setAttribute('aria-current', i === idx ? 'true' : 'false'); });
      var s = slides[idx];
      cap.innerHTML = '<small>' + esc(s.dataset.cat) + '</small><a href="' + esc(s.dataset.url) + '">' + esc(s.dataset.title) + '</a><span class="p">' + esc(s.dataset.price) + '</span>';
      ctr.textContent = (idx + 1) + ' / ' + slides.length;
    };
    var schedule = function () { clearTimeout(timer); if (reduce || paused) return; timer = setTimeout(function () { show(idx + 1); schedule(); }, DUR); };
    var go = function (n) { show(n); schedule(); };
    $('.prev', hero).addEventListener('click', function () { go(idx - 1); });
    $('.next', hero).addEventListener('click', function () { go(idx + 1); });
    dots.forEach(function (d, i) { d.addEventListener('click', function () { go(i); }); });
    var pause = function (v) { paused = v; hero.classList.toggle('paused', v); if (v) clearTimeout(timer); else { show(idx); schedule(); } };
    var stage = $('.stage-wrap', hero);
    stage.addEventListener('mouseenter', function () { pause(true); });
    stage.addEventListener('mouseleave', function () { pause(false); });
    document.addEventListener('visibilitychange', function () { if (document.hidden) { paused = true; clearTimeout(timer); } else { paused = false; show(idx); schedule(); } });
    var x0 = null;
    stage.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1)); x0 = null; });
    show(0); schedule();
  }
})();
