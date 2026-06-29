/* ===========================================================================
   ema.js — EMA Crossover project page.
   Ported from the prototype: an animated, scrolling EMA-crossover chart in the
   hero (synthetic price series, fast/slow EMA, golden/death-cross markers) plus
   reveal-on-scroll for [data-reveal] sections.
   =========================================================================== */
(function () {
  'use strict';
  var el = document;

  function initReveal() {
    var els = el.querySelectorAll('[data-reveal]');
    if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    els.forEach(function (e) { io.observe(e); });
  }

  function initChart() {
    var canvas = el.querySelector('[data-chart]');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var w, h, dpr = Math.min(window.devicePixelRatio || 1, 2);
    // synthetic price series
    var M = 680, price = [];
    var p = 100, drift = 0;
    for (var i = 0; i < M; i++) {
      drift += (Math.random() - 0.5) * 0.08;
      drift = Math.max(-0.5, Math.min(0.6, drift));
      p += drift + Math.sin(i * 0.045) * 0.5 + (Math.random() - 0.5) * 2.4;
      p = Math.max(40, p);
      price.push(p);
    }
    var ema = function (arr, span) { var k = 2 / (span + 1); var out = []; var prev = arr[0]; arr.forEach(function (v, i) { prev = i ? v * k + prev * (1 - k) : v; out.push(prev); }); return out; };
    var fast = ema(price, 12), slow = ema(price, 30);
    var cross = [];
    for (var c = 1; c < M; c++) { var a = fast[c - 1] - slow[c - 1], b = fast[c] - slow[c]; if (a <= 0 && b > 0) cross.push({ i: c, up: true }); else if (a >= 0 && b < 0) cross.push({ i: c, up: false }); }
    var lo = Infinity, hi = -Infinity;
    for (var v0 = 0; v0 < price.length; v0++) { lo = Math.min(lo, price[v0]); hi = Math.max(hi, price[v0]); }
    var pad = (hi - lo) * 0.14; lo -= pad; hi += pad;
    var W = 150;
    var start = 0;
    var resize = function () {
      var r = canvas.parentElement.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    var top = function () { return h * 0.30; }, bot = function () { return h * 0.96; };
    var Y = function (val) { return top() + (1 - (val - lo) / (hi - lo)) * (bot() - top()); };
    var lineSeg = function (arr, s0, color, width, glow) {
      ctx.beginPath();
      for (var k = 0; k < W; k++) {
        var idx = s0 + k; if (idx >= M) break;
        var x = (k - (start - s0)) / (W - 1) * w;
        var y = Y(arr[idx]);
        k === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineJoin = 'round';
      if (glow) { ctx.shadowColor = color; ctx.shadowBlur = 14; } else ctx.shadowBlur = 0;
      ctx.stroke(); ctx.shadowBlur = 0;
    };
    var draw = function () {
      start += 0.22; if (start > M - W - 1) start = 0;
      var s0 = Math.floor(start);
      ctx.clearRect(0, 0, w, h);
      // grid
      ctx.strokeStyle = 'rgba(43,227,139,0.06)'; ctx.lineWidth = 1;
      for (var g = 0; g <= 4; g++) { var gy = top() + (bot() - top()) * g / 4; ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke(); }
      // price (faint)
      lineSeg(price, s0, 'rgba(174,203,187,0.28)', 1.4, false);
      // slow EMA
      lineSeg(slow, s0, 'rgba(91,122,107,0.85)', 2, false);
      // fast EMA
      lineSeg(fast, s0, '#2BE38B', 2.4, true);
      // crossover markers
      for (var m = 0; m < cross.length; m++) {
        var cr = cross[m];
        if (cr.i < s0 || cr.i > s0 + W) continue;
        var x = (cr.i - start) / (W - 1) * w;
        var y = Y(fast[cr.i]);
        ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = cr.up ? '#2BE38B' : '#ff5a5a';
        ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 12; ctx.fill(); ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(5,16,11,0.9)'; ctx.lineWidth = 1.5; ctx.stroke();
      }
      requestAnimationFrame(draw);
    };
    draw();
    window.addEventListener('resize', resize);
  }

  function boot() { initChart(); initReveal(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
