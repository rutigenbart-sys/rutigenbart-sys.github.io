(function () {
  'use strict';
  var TG = 'https://t.me/i_s_moscow', WA = 'https://wa.me/79268542333';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var enc = encodeURIComponent;
  var money = function (n) { return Math.round(n).toLocaleString('ru-RU').replace(/ /g, ' ') + ' ₽'; };

  /* ---------- preloader: подсветка надписи ---------- */
  (function () {
    var rd = function () { document.documentElement.classList.add('ready'); };
    setTimeout(rd, 6500);
    var pl = $('#preloader'); if (!pl || getComputedStyle(pl).display === 'none') { rd(); return; }
    var n = $('#pl-n'), bar = $('#pl-i'), t0 = performance.now(), loaded = false, shown = 0, closed = false, last = -1;
    function open() {
      if (closed) return; closed = true;
      pl.classList.add('open'); rd();
      try { sessionStorage.setItem('pl', '1'); } catch (e) {}
      setTimeout(function () { if (pl.parentNode) pl.parentNode.removeChild(pl); }, 1300);
    }
    /* прогресс: плавно по времени (линейно до 90%), добирает до 100% сразу после готовности шрифта и постера */
    function tick(now) {
      var el = now - t0, cap = loaded ? 100 : 90, goal = Math.min(cap, el / 22);
      shown += (goal - shown) * (loaded ? .12 : .1);
      if (loaded && shown > 99.5) shown = 100;
      var v = Math.round(shown);
      if (v !== last) { last = v; if (n) n.textContent = v; }
      if (bar) bar.style.transform = 'scaleX(' + (shown / 100).toFixed(3) + ')';
      if (shown >= 100 && el > 2300) { setTimeout(open, 160); return; }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    (function script() {
      var Ls = $$('.pl-l', pl), Cs = $$('.pl-c', pl), RUN = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ#%/+=<>', LET = 'IRONSHOP';
      var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches;
      if (reduce) { Ls.concat(Cs).forEach(function (x) { x.classList.add('on'); }); return; }
      Ls.forEach(function (l, i) {
        var r = $('.pl-r', l), t = 120 + i * 120, step = 0;
        setTimeout(function () {
          l.classList.add('run');
          var iv = setInterval(function () { step++; r.textContent = RUN.charAt((i * 7 + step * 5) % RUN.length); }, 55);
          setTimeout(function () { clearInterval(iv); l.classList.add('on'); }, 460);
        }, t);
      });
      Cs.forEach(function (c, i) { setTimeout(function () { c.classList.add('on'); }, 1450 + i * 150); });
    })();
    /* ждём только шрифт заголовка и постер героя, а не всю страницу */
    var need = 2, ok = function () { if (--need <= 0) loaded = true; };
    try { if (document.fonts && document.fonts.load) document.fonts.load('1em Radiotechnika', 'Эксклюзивные').then(ok, ok); else ok(); } catch (e) { ok(); }
    var pimg = $('.hero-vid img');
    if (!pimg || (pimg.complete && pimg.naturalWidth)) ok(); else { pimg.addEventListener('load', ok); pimg.addEventListener('error', ok); }
    setTimeout(function () { loaded = true; }, 3200); setTimeout(open, 4600);
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
    var sendJson = function (url) { return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok && j.ok, j: j }; }); }); };
    var viaMail = function () {
      return fetch('https://formsubmit.co/ajax/krouli2020@yandex.ru', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ _subject: (kind === 'cart' ? 'Заказ с сайта iRon Shop' : 'Сообщение с сайта iRon Shop'), _captcha: 'false', _template: 'table', name: payload.name, phone: payload.phone, message: text, page: payload.page }) })
        .then(function (r) { return r.json(); }).then(function (j) { return { ok: j.success === 'true' || j.success === true, j: j }; });
    };
    if (payload.website) { btn.disabled = false; btn.textContent = label; return; }
    sendJson('/api/send').catch(function () { return { ok: false }; })
      .then(function (r) { return r.ok ? r : sendJson('/send.php').catch(function () { return { ok: false }; }); })
      .then(function (r) { return r.ok ? r : viaMail(); })
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
        msgBox.innerHTML = '<div class="msg err" role="alert">Не получилось отправить автоматически. <a href="' + fallbackLink(text) + '" target="_blank" rel="noopener">Отправить в Telegram</a> или позвоните <a href="tel:+79268542333"><span class="phn">+7 926 854-23-33</span></a>.</div>';
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
      var term = q.value.trim().toLowerCase(), only = stock ? stock.checked : false, shown = [];
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
    [q, sort, stock].forEach(function (el) { if (el) el.addEventListener('input', apply); });
    apply();
  }

  /* ---------- размер браслета ---------- */
  (function () {
    var box = $('#sizepick'); if (!box) return;
    var opts = $$('.sp-opt', box), cur = '', val = $('#sp-val');
    window.ironSize = function () { return cur ? ' — размер ' + cur + ' см' : ''; };
    function sync() {
      if (window.__vrender) { window.__vrender(); return; }
      var add = $('.buy [data-add]');
      if (add) { if (!add.dataset.base) add.dataset.base = add.dataset.title; add.dataset.title = add.dataset.base + window.ironSize(); }
      $$('[data-order]').forEach(function (a) {
        if (!a.dataset.base) a.dataset.base = a.getAttribute('data-msg');
        var m = a.dataset.base + window.ironSize();
        a.setAttribute('data-msg', m);
        a.href = (a.getAttribute('data-order') === 'tg' ? TG : WA) + '?text=' + enc(m + '\n' + location.href);
      });
    }
    opts.forEach(function (b) {
      b.addEventListener('click', function () {
        cur = b.getAttribute('data-size');
        opts.forEach(function (x) { var on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-checked', on); });
        if (val) val.textContent = cur + ' см · ' + $('i', b).textContent;
        box.classList.remove('need'); sync();
      });
    });
    document.addEventListener('click', function (e) {
      var add = e.target.closest('[data-add]'); if (!add || cur || !add.closest('.buy')) return;
      e.preventDefault(); e.stopImmediatePropagation();
      box.classList.add('need'); box.classList.remove('sp-shake'); void box.offsetWidth; box.classList.add('sp-shake');
      box.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (typeof toast === 'function') toast('Выберите размер браслета');
    }, true);
  })();

  /* ---------- gallery + lightbox + description ---------- */
  var main = $('#main-photo');
  var warmed = {}, swapTok = 0;
  function warm(src) { if (warmed[src]) return warmed[src]; var im = new Image(); im.decoding = 'async'; im.src = src; warmed[src] = im; if (im.decode) im.decode().catch(function () {}); return im; }
  function swapMain(src) {
    var tok = ++swapTok, im = warm(src);
    var dir = window.__slDir || 0; var apply = function () { if (tok !== swapTok || !main) return; main.src = src; if (dir) { main.classList.remove('sl-l', 'sl-r'); void main.offsetWidth; main.classList.add(dir > 0 ? 'sl-l' : 'sl-r'); } };
    if (im.complete && im.naturalWidth) apply(); else if (im.decode) im.decode().then(apply, apply); else im.onload = apply;
  }
  (function () {
    if (!main) return;
    var list = $$('.thumbs button[data-src]').map(function (b) { return b.getAttribute('data-src'); }), i = 0;
    function next() { if (i >= list.length) return; warm(list[i++]); (window.requestIdleCallback || function (f) { setTimeout(f, 120); })(next); }
    function start() { (window.requestIdleCallback || function (f) { setTimeout(f, 300); })(next); }
    if (document.readyState === 'complete') start(); else window.addEventListener('load', start);
    document.addEventListener('pointerover', function (e) { var b = e.target.closest && e.target.closest('.thumbs button[data-src]'); if (b) warm(b.getAttribute('data-src')); }, { passive: true });
  })();
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('.thumbs button'); if (!b || !main) return;
    var mb = $('.gallery .main'), vEl = mb ? mb.querySelector('video') : null;
    if (b.hasAttribute('data-video')) {
      if (!vEl) { vEl = document.createElement('video'); vEl.setAttribute('playsinline', ''); vEl.muted = true; vEl.loop = true; vEl.controls = true; mb.appendChild(vEl); }
      vEl.poster = b.getAttribute('data-poster') || ''; vEl.src = b.getAttribute('data-video'); var pr = vEl.play(); if (pr && pr.catch) pr.catch(function () {});
      mb.classList.add('vid');
    } else {
      if (vEl) { vEl.pause(); vEl.remove(); } if (mb) mb.classList.remove('vid');
      swapMain(b.getAttribute('data-src')); if (mb) mb.style.setProperty('--bg', 'url(' + b.getAttribute('data-src') + ')'); main.alt = b.getAttribute('data-alt') || main.alt;
    }
    $$('.thumbs button').forEach(function (x) { x.removeAttribute('aria-current'); }); b.setAttribute('aria-current', 'true');
  });
  var mainBox = $('.gallery .main');
  if (mainBox) mainBox.addEventListener('click', function () {
    if (mainBox.classList.contains('vid')) return;
    var items = $$('.thumbs button[data-src]').filter(function (b) { return !b.hasAttribute('data-video'); });
    var idx = 0; items.forEach(function (b, k) { if (b.getAttribute('aria-current') === 'true') idx = k; });
    var many = items.length > 1, swAt = 0;
    var lb = document.createElement('div'); lb.className = 'lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-label', 'Увеличенное фото');
    lb.innerHTML = '<img src="' + main.src + '" alt="' + esc(main.alt) + '"><button type="button" class="lb-x" aria-label="Закрыть">×</button>' +
      (many ? '<button type="button" class="lb-nav p" aria-label="Предыдущее фото">‹</button><button type="button" class="lb-nav n" aria-label="Следующее фото">›</button><span class="lb-count"></span>' : '');
    var im = lb.querySelector('img'), cn = lb.querySelector('.lb-count');
    function show(k) {
      if (!many) return; idx = (k + items.length) % items.length;
      im.src = items[idx].getAttribute('data-src'); im.alt = items[idx].getAttribute('data-alt') || im.alt;
      if (cn) cn.textContent = (idx + 1) + ' / ' + items.length;
      items[idx].click();
    }
    if (cn) cn.textContent = (idx + 1) + ' / ' + items.length;
    lb.addEventListener('click', function (e) {
      var n = e.target.closest('.lb-nav');
      if (n) { e.stopPropagation(); show(idx + (n.classList.contains('n') ? 1 : -1)); return; }
      if (Date.now() - swAt < 450) return;
      lb.remove();
    });
    var sx = 0, sy = 0;
    lb.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      var t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
      if (many && Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.3) { swAt = Date.now(); show(idx + (dx < 0 ? 1 : -1)); }
    }, { passive: true });
    function key(e) {
      if (!document.body.contains(lb)) { document.removeEventListener('keydown', key, true); return; }
      if (e.key === 'ArrowLeft') { e.stopImmediatePropagation(); e.preventDefault(); show(idx - 1); }
      else if (e.key === 'ArrowRight') { e.stopImmediatePropagation(); e.preventDefault(); show(idx + 1); }
    }
    document.addEventListener('keydown', key, true);
    document.body.appendChild(lb);
  });
  var more = $('.desc .more'), moreBtn = $('#more-btn');
  if (more && moreBtn) moreBtn.addEventListener('click', function () { var o = more.classList.toggle('open'); moreBtn.textContent = o ? 'Свернуть' : 'Читать полностью'; });

  /* ---------- варианты: цвет и размер ---------- */
  (function () {
    var box = $('#variants-ui'), dEl = $('#v-data'); if (!box || !dEl) return;
    var D; try { D = JSON.parse(dEl.textContent); } catch (err) { return; } window.__vD = D;
    var V = D.v, cur = V[0];
    var swatches = $$('.swatch', box), chips = $$('.chip', box);
    var big = $('.buy .big'), skuEl = $('#v-sku'), addBtn = $('.buy [data-add]'), mainImg = $('#main-photo'), mainBox = $('.gallery .main'), gal = $('.gallery');
    function has(c, s) { return V.some(function (v) { return v.c === c && v.s === s; }); }
    function label(v) { var a = []; if (v.c) a.push(v.c.toLowerCase()); if (v.s) a.push('размер ' + v.s); return a.join(', '); }
    function choose(c, s, keep) {
      var list = V.filter(function (v) { return keep === 'c' ? v.c === c : v.s === s; });
      var exact = list.filter(function (v) { return keep === 'c' ? v.s === s : v.c === c; })[0];
      cur = exact || list[0] || cur; render();
    }
    function render() {
      swatches.forEach(function (b) { var on = b.getAttribute('data-color') === cur.c; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); b.classList.toggle('na', !has(b.getAttribute('data-color'), cur.s)); });
      chips.forEach(function (b) { var on = b.getAttribute('data-size') === cur.s; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); b.classList.toggle('na', !has(cur.c, b.getAttribute('data-size'))); });
      var cn = $('#v-color-name'), sn = $('#v-size-name'); if (cn) cn.textContent = cur.c; if (sn) sn.textContent = cur.s;
      if (big) {
        var b = $('b', big); if (b) b.textContent = money(cur.p);
        var s = $('s', big);
        if (cur.po && cur.po > cur.p) { if (!s) { s = document.createElement('s'); big.appendChild(s); } s.textContent = money(cur.po); } else if (s) s.remove();
      }
      if (skuEl) skuEl.textContent = cur.o;
      var t = D.title + (label(cur) ? ' — ' + label(cur) : '') + (window.ironSize ? window.ironSize() : '');
      if (addBtn) { addBtn.dataset.id = cur.o; addBtn.dataset.title = t; addBtn.dataset.price = cur.p; addBtn.dataset.img = D.small[cur.im[0]] || ''; }
      $$('[data-order]').forEach(function (a) {
        var m = 'Здравствуйте! Интересует: ' + t + ' (' + money(cur.p) + ')';
        a.setAttribute('data-msg', m);
        a.href = (a.getAttribute('data-order') === 'tg' ? TG : WA) + '?text=' + enc(m + '\n' + location.href);
      });
      if (mainImg && cur.im.length) {
        var vv = mainBox ? mainBox.querySelector('video') : null; if (vv) { vv.pause(); vv.remove(); mainBox.classList.remove('vid'); }
        var src = D.images[cur.im[0]];
        if (mainImg.getAttribute('src') !== src) { mainImg.src = src; mainImg.alt = D.alts[cur.im[0]] || mainImg.alt; if (mainBox) mainBox.style.setProperty('--bg', 'url(' + src + ')'); }
        var tb = $('.thumbs'); var vids = tb ? Array.prototype.map.call(tb.querySelectorAll('li.vid'), function (l) { return l.outerHTML; }).join('') : '';
        if (cur.im.length > 1) {
          if (!tb) { tb = document.createElement('ul'); tb.className = 'thumbs'; gal.appendChild(tb); }
          tb.innerHTML = cur.im.map(function (ix, i) { return '<li><button type="button" data-src="' + D.images[ix] + '" data-alt="' + esc(D.alts[ix]) + '"' + (i === 0 ? ' aria-current="true"' : '') + ' aria-label="Фото ' + (i + 1) + '"><img src="' + D.small[ix] + '" alt="" width="200" height="200" loading="lazy"></button></li>'; }).join('') + vids;
        } else if (tb && !vids) tb.remove(); else if (tb) tb.innerHTML = vids;
      }
    }
    swatches.forEach(function (b) { b.addEventListener('click', function () { choose(b.getAttribute('data-color'), cur.s, 'c'); }); });
    chips.forEach(function (b) { b.addEventListener('click', function () { choose(cur.c, b.getAttribute('data-size'), 's'); }); });
    window.__vrender = render;
    render();
  })();

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


/* ---------- плавные анимации при скролле ---------- */
(function () {
  var d = document, reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) return;
  var bar = d.createElement('div'); bar.className = 'scroll-bar'; bar.setAttribute('aria-hidden', 'true'); d.body.appendChild(bar);
  var head = d.querySelector('.site-head');
  var SEL = '.s-head,.card,.tile,.post,.seo,.box,.desc,.toolbar,.gallery,.buy,.cat-hero .in,.faq,section .wrap>h2';
  var vh = window.innerHeight, items = [];
  Array.prototype.forEach.call(d.querySelectorAll(SEL), function (el) {
    if (el.parentElement && el.parentElement.closest(SEL)) return;
    var r = el.getBoundingClientRect(); if (r.top < vh * 0.95 && r.bottom > 0) return;
    var k = el.matches('.gallery') ? 'rv-l' : el.matches('.buy') ? 'rv-r' : el.matches('.card,.tile,.post') ? 'rv-card' : 'rv-up';
    el.classList.add('rv', k); items.push(el);
  });
  var io = new IntersectionObserver(function (es) {
    var vis = es.filter(function (x) { return x.isIntersecting; }).sort(function (a, b) { return a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left; });
    vis.forEach(function (x, i) {
      var el = x.target; io.unobserve(el);
      var dl = Math.min(i, 6) * 70; el.style.setProperty('--d', dl + 'ms');
      requestAnimationFrame(function () { el.classList.add('in'); });
      setTimeout(function () { el.classList.remove('rv', 'rv-up', 'rv-l', 'rv-r', 'rv-card', 'in'); el.style.removeProperty('--d'); }, 1900 + dl);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
  items.forEach(function (el) { io.observe(el); });

  var par = Array.prototype.slice.call(d.querySelectorAll('.cat-hero .bgimg,.tile img,.post .pv img'));
  par.forEach(function (el) { el.setAttribute('data-par', ''); });
  var lastY = window.pageYOffset, tick = false;
  function frame() {
    tick = false;
    var y = window.pageYOffset, h = d.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, y / h) : 0) + ')';
    if (head) {
      var dy = y - lastY;
      if (y > 160 && dy > 6 && !d.querySelector('.mm.on,.drawer.on,.lb')) head.classList.add('hide');
      else if (dy < -6 || y < 160) head.classList.remove('hide');
    }
    lastY = y;
    par.forEach(function (el) {
      var p = el.parentElement; if (!p) return; var r = p.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      var off = (r.top + r.height / 2 - window.innerHeight / 2) * -0.07, lim = r.height * 0.055;
      el.style.translate = '0 ' + Math.max(-lim, Math.min(lim, off)).toFixed(1) + 'px';
    });
  }
  function onScroll() { if (!tick) { tick = true; requestAnimationFrame(frame); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll); frame();
})();


/* ---------- галерея товара: свайп и стрелки ---------- */
(function () {
  var d = document, box = d.querySelector('.gallery .main'); if (!box) return;
  var img = d.getElementById('main-photo');
  var cnt = d.createElement('span'); cnt.className = 'gcount'; cnt.setAttribute('aria-hidden', 'true'); box.appendChild(cnt);
  function btns() { return Array.prototype.slice.call(d.querySelectorAll('.thumbs button')); }
  function cur() { var b = btns(); for (var i = 0; i < b.length; i++) if (b[i].getAttribute('aria-current') === 'true') return i; return 0; }
  function upd() { var b = btns(); cnt.style.display = b.length > 1 ? '' : 'none'; cnt.textContent = (cur() + 1) + ' / ' + b.length; }
  function go(dir) {
    var b = btns(); if (b.length < 2) return; var n = (cur() + dir + b.length) % b.length;
    window.__slDir = dir; b[n].click(); window.__slDir = 0;
    upd();
  }
  ['p', 'n'].forEach(function (k) {
    var b = d.createElement('button'); b.type = 'button'; b.className = 'gnav ' + k; b.setAttribute('aria-label', k === 'p' ? 'Предыдущее фото' : 'Следующее фото'); b.textContent = k === 'p' ? '‹' : '›';
    b.addEventListener('click', function (e) { e.stopPropagation(); go(k === 'p' ? -1 : 1); }); box.appendChild(b);
  });
  var x0 = 0, y0 = 0, t0 = 0, on = false;
  box.addEventListener('touchstart', function (e) { if (e.touches.length !== 1 || e.target.closest('video')) { on = false; return; } on = true; x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; t0 = Date.now(); }, { passive: true });
  box.addEventListener('touchend', function (e) {
    if (!on) return; on = false; var t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0;
    if (Math.abs(dx) > 38 && Math.abs(dx) > Math.abs(dy) * 1.3 && Date.now() - t0 < 700) { go(dx < 0 ? 1 : -1); box.setAttribute('data-sw', '1'); setTimeout(function () { box.removeAttribute('data-sw'); }, 400); }
  }, { passive: true });
  box.addEventListener('click', function (e) { if (box.getAttribute('data-sw')) e.stopImmediatePropagation(); }, true);
  d.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') go(-1); else if (e.key === 'ArrowRight') go(1); });
  d.addEventListener('click', function (e) { if (e.target.closest('.thumbs button, .swatch')) setTimeout(upd, 30); });
  upd();
})();


/* ---------- актуальные цены из админ-панели (prices.json) ---------- */
(function () {
  var d = document, $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var money = function (n) { return Math.round(n).toLocaleString('ru-RU').replace(/ /g, ' ') + ' ₽'; };
  if (!d.querySelector('[data-pid]')) return;
  fetch('/prices.json?_=' + Math.floor(Date.now() / 60000), { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (J) {
    if (!J || !J.p) return;
    $$('.card[data-pid]').forEach(function (li) {
      var o = J.p[li.getAttribute('data-pid')]; if (!o || !(o.p > 0)) return;
      var pr = li.querySelector('.price'), b = pr && pr.querySelector('b'); if (!b) return;
      var multi = o.m && o.m > o.p;
      b.textContent = (multi ? 'от ' : '') + money(o.p);
      var s = pr.querySelector('s'), sale = li.querySelector('.sale');
      if (o.o > o.p && !multi) {
        if (!s) { s = d.createElement('s'); pr.appendChild(s); } s.textContent = money(o.o);
        var pc = '−' + Math.round((1 - o.p / o.o) * 100) + '%';
        if (!sale) { sale = d.createElement('span'); sale.className = 'sale'; var a = li.querySelector('a'); li.insertBefore(sale, a); } sale.textContent = pc;
      } else { if (s) s.remove(); if (sale) sale.remove(); }
      li.setAttribute('data-price', o.p); var add = li.querySelector('[data-add]'); if (add) add.setAttribute('data-price', o.p);
    });
    var big = d.querySelector('.big[data-pid]');
    if (big) {
      var o = J.p[big.getAttribute('data-pid')]; if (!o) return;
      if (window.__vD && o.v) {
        window.__vD.v.forEach(function (v) { var x = o.v[v.o]; if (x) { v.p = x.p; v.po = x.o || 0; } });
        if (window.__vrender) window.__vrender();
      } else if (o.p > 0) {
        var b = big.querySelector('b'); if (b) b.textContent = money(o.p);
        var s = big.querySelector('s');
        if (o.o > o.p) { if (!s) { s = d.createElement('s'); big.appendChild(s); } s.textContent = money(o.o); } else if (s) s.remove();
        var add = d.querySelector('.buy [data-add]'); if (add) add.setAttribute('data-price', o.p);
      }
    }
  }).catch(function () {});
})();

/* ---------- главный экран: старт анимации только когда готов шрифт ---------- */
(function () {
  'use strict';
  var r = document.documentElement, done = false;
  function ok() { if (!done) { done = true; r.classList.add('fonts-ok'); } }
  setTimeout(ok, 2500);
  try {
    if (document.fonts && document.fonts.load) document.fonts.load('1em Radiotechnika', 'Эксклюзивные').then(ok, ok); else ok();
  } catch (e) { ok(); }
})();

/* ---------- главный экран: буквы «переливаются» рунами и собираются в слова ---------- */
(function () {
  'use strict';
  var root = document.documentElement, started = false;
  var RUN = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches;
  function lines() { return Array.prototype.slice.call(document.querySelectorAll('.tg .tl .steel, .tg-sub .steel')); }

  function build(el) {
    var node = el.firstChild;
    if (!node || node.nodeType !== 3) return null;
    var txt = node.nodeValue, fs = parseFloat(getComputedStyle(el).fontSize) || 16;
    var rg = document.createRange(), base = el.getBoundingClientRect().left, items = [];
    for (var i = 0; i < txt.length; i++) {
      rg.setStart(node, i); rg.setEnd(node, i + 1);
      var r = rg.getBoundingClientRect();
      items.push({ ch: txt.charAt(i), x: (r.left - base) / fs, w: r.width / fs });
    }
    var total = el.getBoundingClientRect().width / fs, frag = document.createDocumentFragment(), out = [];
    items.forEach(function (it) {
      var sp = document.createElement('span');
      sp.className = 'hc'; sp.textContent = it.ch === ' ' ? ' ' : it.ch;
      sp.style.cssText = 'width:' + it.w.toFixed(4) + 'em;--x:' + it.x.toFixed(4) + ';--lw:' + total.toFixed(4);
      frag.appendChild(sp);
      out.push({ el: sp, ch: it.ch, space: it.ch === ' ' });
    });
    el.textContent = ''; el.classList.add('hl'); el.appendChild(frag);
    return out;
  }

  function start() {
    if (started) return; started = true;
    var els = lines(), chars = [];
    try {
      els.forEach(function (el, li) {
        var cs = build(el); if (!cs) return;
        cs.forEach(function (c, ci) {
          c.t0 = 90 + li * 190 + ci * 34;            /* когда начинает мерцать */
          c.dur = 430 + ((ci * 53 + li * 31) % 7) * 50; /* сколько мерцает до буквы */
          c.k = ci * 7 + li * 11; c.state = 0; c.tick = -1;
          chars.push(c);
        });
      });
    } catch (e) { root.classList.remove('hx'); return; }
    if (!chars.length) { root.classList.remove('hx'); return; }
    root.classList.add('hx');
    if (reduce) { chars.forEach(function (c) { c.el.classList.add('on'); }); return; }
    var t0 = performance.now(), left = chars.length;
    (function frame(now) {
      var t = now - t0;
      chars.forEach(function (c) {
        if (c.state === 2) return;
        var d = t - c.t0;
        if (d < 0) return;
        if (c.space) { c.el.classList.add('on'); c.state = 2; left--; return; }
        if (d >= c.dur) {
          c.el.textContent = c.ch; c.el.classList.remove('run'); c.el.classList.add('on', 'pop'); c.state = 2; left--; return;
        }
        if (c.state === 0) { c.state = 1; c.el.classList.add('run'); }
        var k = Math.floor(d / 62);
        if (k !== c.tick) { c.tick = k; c.el.textContent = RUN.charAt((c.k + k * 5) % RUN.length); }
      });
      if (left > 0) requestAnimationFrame(frame);
    })(t0);
  }

  function check() { if (root.classList.contains('ready') && root.classList.contains('fonts-ok')) { mo && mo.disconnect(); start(); } }
  var mo = null;
  if (!root.classList.contains('js')) return;
  if ('MutationObserver' in window) { mo = new MutationObserver(check); mo.observe(root, { attributes: true, attributeFilter: ['class'] }); }
  check(); setTimeout(function () { if (!started && root.classList.contains('fonts-ok')) start(); }, 7000);
})();

/* ---------- фото из админ-панели (photos.json) ---------- */
(function () {
  'use strict';
  var d = document; if (!d.querySelector('[data-pid]')) return;
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var small = function (f) { return f.indexOf('images/uploads/') === 0 ? '/' + f : '/' + f.replace('images/', 'images/small/'); };
  fetch('/photos.json?_=' + Math.floor(Date.now() / 60000), { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (J) {
    if (!J || !J.p) return;
    Array.prototype.forEach.call(d.querySelectorAll('li.card[data-pid]'), function (li) {
      var o = J.p[li.getAttribute('data-pid')]; if (!o || !o.c || !o.l || !o.l.length) return;
      var u = '/' + o.l[0], ph = li.querySelector('.ph'), im = ph && ph.querySelector('img');
      if (im) im.src = u; if (ph) ph.style.setProperty('--bg', 'url(' + u + ')');
      var add = li.querySelector('[data-add]'); if (add) add.setAttribute('data-img', small(o.l[0]));
      if (o.l.length > 1) li.setAttribute('data-ph', o.l.slice(0, 6).map(function (f) { return '/' + f; }).join('|')); else li.removeAttribute('data-ph');
    });
    var big = d.querySelector('.big[data-pid]'); if (!big) return;
    var o = J.p[big.getAttribute('data-pid')]; if (!o || !o.l || !o.l.length) return;
    var D = window.__vD, L = o.l.map(function (f) { return '/' + f; });
    if (D && D.v && D.images) {
      var pool = {}; D.images.forEach(function (u, i) { pool[u] = i; });
      var oldAlt = D.alts || [], newAlt = L.map(function (u) { return pool[u] != null ? (oldAlt[pool[u]] || D.title) : D.title; });
      D.v.forEach(function (v) {
        var own = {}; v.im.forEach(function (ix) { own[D.images[ix]] = 1; });
        var im = []; L.forEach(function (u, i) { if (own[u] || pool[u] == null) im.push(i); });
        v.im = im.length ? im : L.map(function (u, i) { return i; });
      });
      D.small = o.l.map(small); D.images = L; D.alts = newAlt;
      if (window.__vrender) window.__vrender();
    } else {
      var main = d.getElementById('main-photo'), box = d.querySelector('.gallery .main'), tb = d.querySelector('.thumbs'), gal = d.querySelector('.gallery');
      if (!main) return;
      var alt = main.alt || '';
      main.src = L[0]; if (box) box.style.setProperty('--bg', 'url(' + L[0] + ')');
      var vids = tb ? Array.prototype.map.call(tb.querySelectorAll('li.vid'), function (l) { return l.outerHTML; }).join('') : '';
      if (L.length > 1 || vids) {
        if (!tb) { tb = d.createElement('ul'); tb.className = 'thumbs'; gal.appendChild(tb); }
        tb.innerHTML = (L.length > 1 ? L.map(function (u, i) { return '<li><button type="button" data-src="' + u + '" data-alt="' + esc(alt) + '"' + (i === 0 ? ' aria-current="true"' : '') + ' aria-label="Фото ' + (i + 1) + '"><img src="' + small(o.l[i]) + '" alt="" width="200" height="200" loading="lazy"></button></li>'; }).join('') : '') + vids;
      } else if (tb) tb.remove();
    }
  }).catch(function () {});
})();


/* ---------- листание фото в карточке по движению мыши (только мышь, не тач) ---------- */
(function () {
  'use strict';
  if (!window.matchMedia || !matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  var d = document, cur = null;
  function setup(card) {
    var raw = card.getAttribute('data-ph'), ph = card.querySelector('.ph'), img = ph && ph.querySelector('img');
    if (card._sc && card._sc.raw === raw) return card._sc;
    if (card._sc) { var od = ph && ph.querySelector('.ph-dots'); if (od) od.remove(); card._sc = null; }
    if (!raw || !ph || !img) return null;
    var list = raw.split('|').filter(Boolean); if (list.length < 2) return null;
    var dots = d.createElement('div'); dots.className = 'ph-dots'; dots.setAttribute('aria-hidden', 'true');
    dots.innerHTML = list.map(function () { return '<i></i>'; }).join('');
    ph.appendChild(dots);
    list.slice(1).forEach(function (u) { var p = new Image(); p.decoding = 'async'; p.src = u; });
    card._sc = { raw: raw, list: list, ph: ph, img: img, dots: dots.children, i: 0, src0: img.getAttribute('src') };
    return card._sc;
  }
  function show(sc, i) {
    if (i === sc.i) return; sc.i = i;
    sc.img.src = i === 0 ? sc.src0 : sc.list[i];
    for (var k = 0; k < sc.dots.length; k++) sc.dots[k].className = k === i ? 'on' : '';
  }
  function reset(card) {
    var sc = card._sc; if (!sc) return;
    sc.img.src = sc.src0; sc.i = 0;
    for (var k = 0; k < sc.dots.length; k++) sc.dots[k].className = k === 0 ? 'on' : '';
  }
  d.addEventListener('mousemove', function (e) {
    var card = e.target.closest ? e.target.closest('li.card[data-ph]') : null;
    if (cur && cur !== card) { reset(cur); cur = null; }
    if (!card) return;
    var ph = card.querySelector('.ph'); if (!ph) return;
    var r = ph.getBoundingClientRect();
    if (e.clientY < r.top || e.clientY > r.bottom) return;
    var sc = setup(card); if (!sc) return;
    if (cur !== card) { cur = card; sc.i = 0; sc.src0 = sc.img.getAttribute('src'); for (var k = 0; k < sc.dots.length; k++) sc.dots[k].className = k === 0 ? 'on' : ''; }
    var n = sc.list.length, x = Math.max(0, Math.min(r.width - 1, e.clientX - r.left));
    show(sc, Math.min(n - 1, Math.floor(x / r.width * n)));
  }, { passive: true });
  d.addEventListener('mouseout', function (e) { if (!e.relatedTarget && cur) { reset(cur); cur = null; } });
})();
