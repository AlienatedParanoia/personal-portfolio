/* ===========================================================================
   fire.js — F.I.R.E project page.
   Ported from the prototype: a rising-ember canvas field in the hero (three
   warm hues, drifting upward and fading in at the base) plus reveal-on-scroll.
   Perf: the hero canvas loop pauses when the hero scrolls off-screen and when
   the tab is hidden.
   =========================================================================== */
(function () {
  'use strict';
  var el = document;

  function gateRAF(target, frame, rootMargin) {
    var raf = null, inView = false, hidden = document.hidden;
    var loop = function () { frame(); raf = requestAnimationFrame(loop); };
    var sync = function () {
      var active = inView && !hidden;
      if (active && raf === null) raf = requestAnimationFrame(loop);
      else if (!active && raf !== null) { cancelAnimationFrame(raf); raf = null; }
    };
    document.addEventListener('visibilitychange', function () { hidden = document.hidden; sync(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (ents) {
        ents.forEach(function (e) { inView = e.isIntersecting; });
        sync();
      }, { rootMargin: rootMargin || '0px', threshold: 0 }).observe(target);
    } else { inView = true; sync(); }
  }

  function initReveal() {
    var els = el.querySelectorAll('[data-reveal]');
    if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    els.forEach(function (e) { io.observe(e); });
  }

  function initEmbers() {
    var canvas = el.querySelector('[data-fx]');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var w, h, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var N = 70;
    var pts = [];
    var cols = [[255, 90, 54], [255, 140, 50], [255, 166, 43]];
    var resize = function () {
      var r = canvas.parentElement.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    var spawn = function () { return { x: Math.random(), y: 1 + Math.random() * 0.2, s: 0.6 + Math.random() * 2.4, vy: 0.12 + Math.random() * 0.34, drift: (Math.random() - 0.5) * 0.5, a: 0.25 + Math.random() * 0.55, c: cols[(Math.random() * cols.length) | 0], ph: Math.random() * 6.28 }; };
    for (var i = 0; i < N; i++) { var p = spawn(); p.y = Math.random(); pts.push(p); }
    var t = 0;
    var frame = function () {
      t += 0.016;
      ctx.clearRect(0, 0, w, h);
      for (var k = 0; k < pts.length; k++) {
        var p = pts[k];
        p.y -= p.vy / 100;
        var sway = Math.sin(t * 1.4 + p.ph) * p.drift / 100;
        var px = (p.x + sway) * w, py = p.y * h;
        if (p.y < -0.05) Object.assign(p, spawn());
        var fade = p.y < 0.25 ? p.y / 0.25 : 1;
        var g = ctx.createRadialGradient(px, py, 0, px, py, p.s * 5);
        g.addColorStop(0, 'rgba(' + p.c[0] + ',' + p.c[1] + ',' + p.c[2] + ',' + (p.a * fade) + ')');
        g.addColorStop(1, 'rgba(' + p.c[0] + ',' + p.c[1] + ',' + p.c[2] + ',0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(px, py, p.s * 5, 0, Math.PI * 2); ctx.fill();
      }
    };
    window.addEventListener('resize', resize);
    gateRAF(canvas.parentElement, frame, '100px');
  }

  function boot() { initEmbers(); initReveal(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
