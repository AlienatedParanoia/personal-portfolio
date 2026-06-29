/* ===========================================================================
   honeypot.js — HoneyPot Wars project page.
   Ported from the prototype: a rising-particle canvas field in the hero plus
   reveal-on-scroll for [data-reveal] sections.
   =========================================================================== */
(function () {
  'use strict';
  var el = document;

  function hexToRgb(hex) {
    var n = parseInt(hex.slice(1), 16);
    return ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255);
  }

  function initReveal() {
    var els = el.querySelectorAll('[data-reveal]');
    if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    els.forEach(function (e) { io.observe(e); });
  }

  function initFx(color) {
    var canvas = el.querySelector('[data-fx]');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var rgb = hexToRgb(color);
    var w, h, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var N = 46;
    var pts = [];
    var resize = function () {
      var r = canvas.parentElement.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    for (var i = 0; i < N; i++) pts.push({ x: Math.random(), y: Math.random(), s: 0.6 + Math.random() * 2.2, vy: 0.04 + Math.random() * 0.16, vx: (Math.random() - 0.5) * 0.05, a: 0.15 + Math.random() * 0.5 });
    var draw = function () {
      ctx.clearRect(0, 0, w, h);
      for (var k = 0; k < pts.length; k++) {
        var p = pts[k];
        p.y -= p.vy / 100; p.x += p.vx / 100;
        if (p.y < -0.05) { p.y = 1.05; p.x = Math.random(); }
        var px = p.x * w, py = p.y * h;
        var g = ctx.createRadialGradient(px, py, 0, px, py, p.s * 5);
        g.addColorStop(0, 'rgba(' + rgb + ',' + p.a + ')');
        g.addColorStop(1, 'rgba(' + rgb + ',0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(px, py, p.s * 5, 0, Math.PI * 2); ctx.fill();
      }
      requestAnimationFrame(draw);
    };
    draw();
    window.addEventListener('resize', resize);
  }

  function boot() { initFx('#FFB23E'); initReveal(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
