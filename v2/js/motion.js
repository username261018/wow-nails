/* Wow! Nails demo · motion engine (vanilla, shared by both variants) */
(function () {
  'use strict';
  var d = document, h = d.documentElement, W = window;
  var on = h.classList.contains('m-on');
  var fine = W.matchMedia('(hover:hover) and (pointer:fine)').matches;
  function mq(q) { return W.matchMedia(q).matches; }
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function $$(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }

  /* top bar height -> --top-h */
  var top = d.querySelector('.top');
  function topH() { return top ? top.offsetHeight : 0; }
  if (top && 'ResizeObserver' in W) {
    new ResizeObserver(function () { h.style.setProperty('--top-h', topH() + 'px'); }).observe(top);
  }

  /* mobile menu (native details) */
  var md = d.querySelector('.mnav');
  if (md) {
    md.addEventListener('click', function (e) { if (e.target.closest('a')) md.open = false; });
    d.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && md.open) { md.open = false; md.querySelector('summary').focus(); }
    });
    d.addEventListener('click', function (e) { if (md.open && !md.contains(e.target)) md.open = false; });
  }

  /* click-to-load map */
  $$('[data-map]').forEach(function (b) {
    b.addEventListener('click', function () {
      var box = b.closest('.map'), f = d.createElement('iframe');
      f.src = box.getAttribute('data-src');
      f.title = 'Wow! Nails на карте';
      f.setAttribute('allowfullscreen', '');
      box.classList.add('map--on');
      box.replaceChildren(f);
    });
  });

  if (!on) return;

  /* word split: H1/H2 [data-words] */
  $$('[data-words]').forEach(function (el) {
    var full = el.textContent.replace(/[ \t\r\n]+/g, ' ').trim(), i = 0;
    function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var parts = n.nodeValue.split(/([ \t\r\n]+)/), frag = d.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^[ \t\r\n]+$/.test(p)) { frag.appendChild(d.createTextNode(' ')); return; }
            var w = d.createElement('span'), wi = d.createElement('span');
            w.className = 'w'; wi.className = 'wi'; wi.style.setProperty('--i', i++); wi.textContent = p;
            w.appendChild(wi); frag.appendChild(w);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1) walk(n);
      });
    }
    walk(el);
    var sr = d.createElement('span'); sr.className = 'sr'; sr.textContent = full;
    $$('.w', el).forEach(function (w) { w.setAttribute('aria-hidden', 'true'); });
    el.insertBefore(sr, el.firstChild);
  });

  /* light-up paragraph */
  var lights = $$('[data-light]').map(function (el) {
    var words = el.textContent.trim().split(/[ \t\r\n]+/);
    el.textContent = '';
    var spans = words.map(function (w, k) {
      var s = d.createElement('span'); s.className = 'lw'; s.textContent = w;
      el.appendChild(s); if (k < words.length - 1) el.appendChild(d.createTextNode(' '));
      return s;
    });
    return { el: el, spans: spans };
  });

  /* marks caption (T4): noise twin assembles into the real text */
  var NOISE = '+×/·:;-|#';
  function runMarks(el) {
    var t = el.querySelector('.mk-t'), n = el.querySelector('.mk-n');
    if (!t || !n) return;
    var src = t.textContent, start = performance.now(), dur = 900;
    el.classList.add('mk-run');
    (function frame(now) {
      var p = clamp((now - start) / dur), out = '';
      for (var k = 0; k < src.length; k++) {
        var c = src[k];
        out += (c === ' ' || k / src.length < p) ? c : NOISE[(k + Math.floor(now / 60)) % NOISE.length];
      }
      n.textContent = out;
      if (p < 1) requestAnimationFrame(frame); else done();
    })(start);
    var t2 = setTimeout(done, 1300);
    function done() { clearTimeout(t2); el.classList.remove('mk-run'); el.classList.add('mk-done'); n.textContent = ''; }
  }
  $$('[data-marks]').forEach(function (el) {
    var txt = el.textContent.trim();
    el.innerHTML = '<span class="mk-t"></span><span class="mk-n" aria-hidden="true"></span>';
    el.querySelector('.mk-t').textContent = txt;
  });

  /* stagger index from parent */
  $$('[data-stagger]').forEach(function (p) {
    Array.prototype.slice.call(p.children).forEach(function (c, k) { c.style.setProperty('--i', k); });
  });

  /* reveal */
  var hero = d.querySelector('.hero');
  var items = $$('[data-rv],[data-words],[data-marks]').filter(function (el) { return !(hero && hero.contains(el)); });
  function show(el) {
    if (el.classList.contains('in')) return;
    el.classList.add('in');
    if (io) io.unobserve(el);
    if (el.hasAttribute('data-marks')) runMarks(el);
    if (el.getAttribute('data-rv') === 'curtain') {
      var c = el.querySelector('.cur');
      var fin = function () { el.classList.add('done'); };
      if (c) { c.addEventListener('transitionend', fin, { once: true }); }
      setTimeout(fin, 1600);
    }
  }
  var io = 'IntersectionObserver' in W ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) show(e.target); });
  }, { rootMargin: '0px 0px -6% 0px' }) : null;
  items.forEach(function (el) { if (io) io.observe(el); });
  function sweep() {
    var H = W.innerHeight;
    for (var k = 0; k < items.length; k++) {
      var el = items[k];
      if (!el.classList.contains('in') && el.getBoundingClientRect().top < H) show(el);
    }
  }

  /* hero intro chain (starts 300 ms after DOMContentLoaded) */
  function intro() {
    setTimeout(function () {
      if (!hero) return;
      hero.classList.add('go');
      $$('[data-rv],[data-words],[data-marks]', hero).forEach(function (el) {
        el.classList.add('in'); if (el.hasAttribute('data-marks')) runMarks(el);
      });
    }, 300);
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', intro); else intro();

  /* sticky stacks: equal frame height so one card covers the previous one fully */
  var stacks = $$('[data-stack]');
  function stackSet() {
    stacks.forEach(function (s) {
      var lis = Array.prototype.slice.call(s.children), m = 0;
      s.style.removeProperty('--stack-h');
      lis.forEach(function (li) { m = Math.max(m, li.firstElementChild ? li.firstElementChild.offsetHeight : li.offsetHeight); });
      s.style.setProperty('--stack-h', m + 'px');
    });
  }

  /* scroll-driven lane (>=900) */
  var lanes = $$('[data-lane]').map(function (sec) {
    return { sec: sec, pin: sec.querySelector('.lane-pin'), view: sec.querySelector('.lane-view'),
      track: sec.querySelector('.lane-track'), bar: sec.querySelector('.lane-prog span'),
      k: parseFloat(sec.getAttribute('data-k') || '1'), max: 0, on: false };
  });
  function laneSet() {
    lanes.forEach(function (L) {
      L.on = mq('(min-width:900px)');
      L.sec.classList.toggle('lane-on', L.on);
      L.sec.style.height = '';
      L.track.style.transform = '';
      if (!L.on) return;
      L.max = Math.max(0, L.track.scrollWidth - L.view.clientWidth);
      L.sec.style.height = Math.round(L.pin.offsetHeight + L.max * L.k) + 'px';
    });
  }
  function laneTick() {
    lanes.forEach(function (L) {
      if (!L.on) return;
      var r = L.sec.getBoundingClientRect(), span = L.sec.offsetHeight - L.pin.offsetHeight;
      var p = span > 0 ? clamp((topH() - r.top) / span) : 0;
      L.track.style.transform = 'translate3d(' + (-p * L.max).toFixed(1) + 'px,0,0)';
      if (L.bar) L.bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    });
  }

  /* contacts final panel: clip from --fxmax to 0 until its top reaches 40% */
  var fin = d.querySelector('.final');
  function finTick() {
    if (!fin) return;
    var r = fin.getBoundingClientRect().top / W.innerHeight;
    var mx = parseFloat(getComputedStyle(fin).getPropertyValue('--fxmax')) || 48;
    fin.style.setProperty('--fx', (mx * clamp((r - 0.4) / 0.6)).toFixed(1) + 'px');
  }
  function lightTick() {
    var H = W.innerHeight;
    lights.forEach(function (L) {
      var r = L.el.getBoundingClientRect();
      var p = clamp((H * 0.9 - (r.top + r.height / 2)) / (H * 0.45)), n = L.spans.length;
      L.spans.forEach(function (s, k) { s.style.opacity = (0.25 + 0.75 * clamp(p * n - k)).toFixed(3); });
    });
  }

  var ticking = false;
  function tick() { ticking = false; sweep(); laneTick(); finTick(); lightTick(); }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(tick); } }
  W.addEventListener('scroll', req, { passive: true });
  W.addEventListener('hashchange', req);
  W.addEventListener('beforeprint', function () { items.forEach(show); });
  var lastW = W.innerWidth, lastH = W.innerHeight;
  W.addEventListener('resize', function () {
    var coarse = mq('(pointer:coarse)');
    if (coarse && W.innerWidth === lastW && Math.abs(W.innerHeight - lastH) < 160) return;
    lastW = W.innerWidth; lastH = W.innerHeight;
    stackSet(); laneSet(); req();
  });
  function layout() { stackSet(); laneSet(); tick(); }
  layout();
  W.addEventListener('load', layout);
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(layout);

  /* fine pointer: light spot on its own fixed layer + hero photo tilt */
  if (fine) {
    var spot = d.querySelector('.spot'), mx = 0, my = 0, raf = 0;
    var tilt = d.querySelector('[data-tilt]');
    d.addEventListener('pointermove', function (e) {
      mx = e.clientX; my = e.clientY;
      if (!raf) raf = requestAnimationFrame(function () {
        raf = 0;
        if (spot) spot.style.transform = 'translate3d(' + (mx - 300) + 'px,' + (my - 300) + 'px,0)';
        if (tilt) {
          var r = tilt.getBoundingClientRect();
          var x = clamp((mx - r.left) / r.width) - 0.5, y = clamp((my - r.top) / r.height) - 0.5;
          if (r.bottom > 0 && r.top < W.innerHeight)
            tilt.style.transform = 'perspective(900px) rotateY(' + (x * 7).toFixed(2) + 'deg) rotateX(' + (-y * 6).toFixed(2) + 'deg)';
        }
      });
    }, { passive: true });
  }

  h.classList.add('m-ready');
})();
