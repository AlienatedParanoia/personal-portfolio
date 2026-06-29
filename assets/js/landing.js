/* ===========================================================================
   landing.js — behaviors for the portfolio landing page.
   Ported 1:1 from the Claude Design prototype's Component class:
   shader intro (three.js), ASCII "endless climb" hero, project wheel (GSAP),
   interactive globe (cobe), and the recommendation card-stack (GSAP).

   Performance pass (visual output unchanged):
   - Every continuous render loop pauses when its section scrolls off-screen
     and when the browser tab is hidden (IntersectionObserver + visibilitychange).
   - The About-section ASCII animation is hand-built (no dependency) and pauses off-screen.
   - devicePixelRatio is capped and the globe sample count reduced.
   =========================================================================== */
(function () {
  'use strict';

  var el = document;
  var loaded = {};
  var pageHidden = document.hidden;

  // Effects register a sync() so a single visibilitychange handler can
  // start/stop them all when the tab is backgrounded/foregrounded.
  var syncers = [];
  document.addEventListener('visibilitychange', function () {
    pageHidden = document.hidden;
    for (var i = 0; i < syncers.length; i++) syncers[i]();
  });

  // Observe `target`; call enter()/leave() as it crosses the viewport.
  function observe(target, enter, leave, rootMargin) {
    if (!('IntersectionObserver' in window)) { enter(); return; }
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) { e.isIntersecting ? enter() : leave(); });
    }, { root: null, rootMargin: rootMargin || '0px', threshold: 0 });
    io.observe(target);
  }

  function loadScript(src, asModule) {
    return new Promise(function (res, rej) {
      if (loaded[src]) return res();
      var s = document.createElement('script');
      if (asModule) s.type = 'module';
      s.src = src; s.async = false;
      s.onload = function () { loaded[src] = 1; res(); };
      s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  // ---- 1. Shader intro (three.js) ----
  async function initShader() {
    var wrap = el.querySelector('[data-shader]');
    if (!wrap) return;
    var section = wrap.closest('section') || wrap;
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js');
    var THREE = window.THREE;
    var camera = new THREE.Camera(); camera.position.z = 1;
    var scene = new THREE.Scene();
    var geo = new THREE.PlaneGeometry(2, 2);
    var uniforms = { time: { value: 1.0 }, resolution: { value: new THREE.Vector2() } };
    var mat = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: 'void main(){gl_Position=vec4(position,1.0);}',
      fragmentShader: 'precision highp float;uniform vec2 resolution;uniform float time;\n' +
        'void main(void){\n' +
        '  vec2 uv=(gl_FragCoord.xy*2.0-resolution.xy)/min(resolution.x,resolution.y);\n' +
        '  float t=time*0.045;float lw=0.0022;vec3 color=vec3(0.0);\n' +
        '  for(int j=0;j<3;j++){for(int i=0;i<5;i++){\n' +
        '    color[j]+=lw*float(i*i)/abs(fract(t-0.01*float(j)+float(i)*0.01)*5.0-length(uv)+mod(uv.x+uv.y,0.2));\n' +
        '  }}\n' +
        '  gl_FragColor=vec4(color*vec3(0.55,1.05,1.15),1.0);\n' +
        '}'
    });
    var mesh = new THREE.Mesh(geo, mat); scene.add(mesh);
    var renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    wrap.appendChild(renderer.domElement);
    var resize = function () {
      var w = wrap.clientWidth, h = wrap.clientHeight;
      renderer.setSize(w, h);
      uniforms.resolution.value.set(renderer.domElement.width, renderer.domElement.height);
    };
    resize(); window.addEventListener('resize', resize);

    var raf = null, inView = false;
    var frame = function () { uniforms.time.value += 0.045; renderer.render(scene, camera); raf = requestAnimationFrame(frame); };
    var sync = function () {
      var active = inView && !pageHidden;
      if (active && raf === null) raf = requestAnimationFrame(frame);
      else if (!active && raf !== null) { cancelAnimationFrame(raf); raf = null; }
    };
    syncers.push(sync);
    observe(section, function () { inView = true; sync(); }, function () { inView = false; sync(); }, '200px');
  }

  // ---- 2. ASCII "endless climb" hero (hand-built canvas, no dependencies) ----
  // A monospace field that perpetually scrolls upward along a diagonal ridge —
  // the boulder's path. Cyan highlights on the densest cells; throttled to
  // ~30fps and gated to on-screen + tab-visible so it costs almost nothing.
  function initAscii() {
    var wrap = el.querySelector('[data-ascii-wrap]');
    if (!wrap) return;
    var canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;z-index:1;';
    wrap.insertBefore(canvas, wrap.firstChild);
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var ramp = ' .:-=+*xX#%@';
    var W = 0, H = 0, cell = 15, cols = 0, rows = 0;
    var resize = function () {
      var r = wrap.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = Math.max(1, W * dpr); canvas.height = Math.max(1, H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cell = Math.max(12, Math.round(W / 44));
      cols = Math.ceil(W / cell) + 1;
      rows = Math.ceil(H / cell) + 1;
      ctx.font = cell + "px 'JetBrains Mono', ui-monospace, monospace";
      ctx.textBaseline = 'top';
    };
    resize();
    window.addEventListener('resize', resize);

    var draw = function (t) {
      ctx.clearRect(0, 0, W, H);
      var climb = t * 0.05;
      for (var gy = 0; gy < rows; gy++) {
        var w = gy / rows;
        for (var gx = 0; gx < cols; gx++) {
          var u = gx / cols;
          // upward-flowing field (subtract `climb` from the vertical phase)
          var v = Math.sin(w * 6.0 + climb + Math.sin(u * 4.0) * 0.8)
                + Math.sin(u * 5.0 - climb * 0.6) * 0.6
                + Math.sin((u + w) * 5.0 - climb * 0.3) * 0.4;
          var n = (v / 2.0 + 1) / 2; // -> ~0..1
          // brighter ridge along the bottom-left -> top-right diagonal (the climb)
          var d = (1 - w) - u;
          var ridge = Math.exp(-d * d * 8.0);
          n = n * 0.72 + ridge * 0.55;
          if (n < 0.16) continue; // leave negative space, skip the fillText
          if (n > 1) n = 1;
          var ch = ramp.charAt(Math.min(ramp.length - 1, (n * ramp.length) | 0));
          var a = 0.12 + n * 0.8;
          ctx.fillStyle = n > 0.7 ? 'rgba(54,224,230,' + a + ')' : 'rgba(120,150,162,' + (a * 0.55) + ')';
          ctx.fillText(ch, gx * cell, gy * cell);
        }
      }
    };

    var raf = null, inView = false, lastDraw = 0, tc = 0;
    var step = function (now) {
      raf = requestAnimationFrame(step);
      if (now - lastDraw < 33) return; // ~30fps is plenty for an ASCII field
      lastDraw = now; tc += 0.8;
      draw(tc);
    };
    var sync = function () {
      var active = inView && !pageHidden;
      if (active && raf === null) { lastDraw = 0; raf = requestAnimationFrame(step); }
      else if (!active && raf !== null) { cancelAnimationFrame(raf); raf = null; }
    };
    syncers.push(sync);
    observe(wrap, function () { inView = true; sync(); }, function () { inView = false; sync(); }, '200px');
    draw(0); // paint one frame immediately so it's never blank
  }

  // ---- 3. Radial wheel navigator ----
  function initWheel() {
    var pin = el.querySelector('[data-work-pin]');
    var mask = el.querySelector('[data-wheel-mask]');
    var wheel = el.querySelector('[data-wheel]');
    if (!pin || !wheel || !mask) return;
    var items = Array.prototype.slice.call(wheel.querySelectorAll('[data-wheel-item]'));
    var head = pin.querySelector('[data-work-head]');
    var layout = function () {
      // Start the (overflow-hidden) mask below the heading so cards can never
      // render over the title text.
      var reserve = (head ? head.offsetHeight : 200) + 24;
      mask.style.top = reserve + 'px';
      mask.style.height = '';
      var H = mask.clientHeight;
      var cardEl = items[0].querySelector('[data-card-inner]');
      var cardHalf = (cardEl ? cardEl.offsetHeight : 352) / 2;
      var radius = Math.max(150, Math.min(380, H * 0.46));
      var diameter = radius * 2;
      wheel.style.width = diameter + 'px';
      wheel.style.height = diameter + 'px';
      // Place the wheel so a card at the very top of the circle (angle -90°,
      // the highest any card can orbit) sits ~12px below the mask top — fully
      // visible, never clipping into the reserved heading band.
      wheel.style.bottom = (H - 2 * radius - cardHalf - 12) + 'px';
      var n = items.length;
      var arc = 46 * Math.PI / 180;
      items.forEach(function (it, i) {
        var angle = -Math.PI / 2 + ((i - (n - 1) / 2) * arc);
        var x = radius * Math.cos(angle);
        var y = radius * Math.sin(angle);
        it.style.transform = 'translate(-50%,-50%) translate3d(' + x + 'px,' + y + 'px,0)';
      });
    };
    layout();
    window.addEventListener('resize', layout);
    items.forEach(function (it) {
      var c = it.querySelector('[data-card-inner]');
      c.style.opacity = '0';
      c.style.transition = 'opacity .7s ease, box-shadow .5s ease';
      it.addEventListener('mouseenter', function () { it.dataset.hover = '1'; c.style.boxShadow = '0 34px 90px rgba(0,0,0,.75)'; });
      it.addEventListener('mouseleave', function () { it.dataset.hover = ''; c.style.boxShadow = '0 24px 60px rgba(0,0,0,.6)'; });
    });
    window.gsap.set(wheel, { xPercent: -50, transformOrigin: '50% 50%' });
    window.gsap.to(wheel, {
      rotation: 110, ease: 'none',
      scrollTrigger: { trigger: pin, pin: true, start: 'top top', end: '+=2100', scrub: 1, invalidateOnRefresh: true }
    });
    window.ScrollTrigger.create({
      trigger: pin, start: 'top 65%',
      onEnter: function () { items.forEach(function (it, i) { setTimeout(function () { it.querySelector('[data-card-inner]').style.opacity = '1'; }, i * 130); }); },
      onLeaveBack: function () { items.forEach(function (it) { it.querySelector('[data-card-inner]').style.opacity = '0'; }); }
    });
    // Counter-rotate each card so it stays upright — but only run the per-frame
    // loop while the work section is on-screen and the tab is visible.
    var raf = null, inView = false;
    var frame = function () {
      var ang = window.gsap.getProperty(wheel, 'rotation') || 0;
      items.forEach(function (it) {
        var c = it.querySelector('[data-card-inner]');
        var hov = it.dataset.hover === '1';
        c.style.transform = 'rotate(' + (-ang) + 'deg)' + (hov ? ' scale(1.07) translateY(-12px)' : '');
      });
      raf = requestAnimationFrame(frame);
    };
    var sync = function () {
      var active = inView && !pageHidden;
      if (active && raf === null) raf = requestAnimationFrame(frame);
      else if (!active && raf !== null) { cancelAnimationFrame(raf); raf = null; }
    };
    syncers.push(sync);
    observe(pin, function () { inView = true; sync(); }, function () { inView = false; sync(); }, '100px');
  }

  // ---- 4. Globe (cobe) ----
  async function initGlobe() {
    var canvas = el.querySelector('[data-globe]');
    if (!canvas) return;
    var createGlobe;
    try { var mod = await import('https://cdn.jsdelivr.net/npm/cobe@0.6.3/+esm'); createGlobe = mod.default; } catch (e) { return; }
    var markers = [
      { location: [1.29, 103.85], size: 0.08 },
      { location: [51.51, -0.13], size: 0.06 },
      { location: [40.71, -74.01], size: 0.06 },
      { location: [35.68, 139.65], size: 0.05 },
      { location: [-33.87, 151.21], size: 0.05 },
      { location: [12.97, 77.59], size: 0.05 },
      { location: [37.77, -122.42], size: 0.05 },
      { location: [25.2, 55.27], size: 0.04 }
    ];
    var width = 0, dragging = null, offset = 0, autoOffset = 0;
    var globe = null, inView = false;
    var onResize = function () { width = canvas.offsetWidth; };
    onResize(); window.addEventListener('resize', onResize);

    // cobe has no pause API, so to fully stop its render loop off-screen we
    // create the globe on enter and destroy it on leave (drag state persists).
    var build = function () {
      if (globe) return;
      onResize();
      globe = createGlobe(canvas, {
        devicePixelRatio: Math.min(window.devicePixelRatio || 1, 1.5),
        width: width, height: width,
        phi: 0, theta: 0.25, dark: 1, diffuse: 1.4,
        mapSamples: 10000, mapBrightness: 7,
        baseColor: [0.32, 0.34, 0.38], markerColor: [0.21, 0.88, 0.9], glowColor: [0.06, 0.09, 0.11],
        markers: markers,
        onRender: function (state) {
          if (!dragging) autoOffset += 0.004;
          state.phi = autoOffset + offset;
          state.width = width; state.height = width;
        }
      });
      requestAnimationFrame(function () { canvas.style.opacity = '1'; });
    };
    var teardown = function () { if (globe) { globe.destroy(); globe = null; canvas.style.opacity = '0'; } };
    var sync = function () { (inView && !pageHidden) ? build() : teardown(); };
    syncers.push(sync);

    var down = function (e) { dragging = e.clientX; canvas.style.cursor = 'grabbing'; };
    var up = function () { dragging = null; canvas.style.cursor = 'grab'; };
    var move = function (e) { if (dragging !== null) { offset += (e.clientX - dragging) / 200; dragging = e.clientX; } };
    canvas.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointermove', move);

    observe(canvas, function () { inView = true; sync(); }, function () { inView = false; sync(); }, '200px');

    var stats = el.querySelector('[data-globe-stats]');
    if (stats) {
      var data = [['8', 'COUNTRIES REACHED'], ['120+', 'STUDENTS ONBOARDED'], ['30+', 'REPOS SCANNED'], ['4.9★', 'AVG. FEEDBACK']];
      stats.innerHTML = data.map(function (d) { return '<div style="text-align:center;padding:14px 26px;"><div style="font-family:\'JetBrains Mono\',monospace;font-size:30px;color:#36E0E6;">' + d[0] + '</div><div style="font-family:\'JetBrains Mono\',monospace;font-size:10px;letter-spacing:.16em;color:#6b717b;margin-top:6px;">' + d[1] + '</div></div>'; }).join('');
    }
  }

  // ---- 5. Recommendation card stack ----
  // (ScrollTrigger-driven; only runs work on scroll, so no idle loop to gate.)
  function initReco() {
    var scroll = el.querySelector('[data-reco-scroll]');
    var cards = Array.prototype.slice.call(el.querySelectorAll('[data-reco-card]'));
    if (!scroll || !cards.length) return;
    var n = cards.length;
    var apply = function (p) {
      var cur = p * n;
      cards.forEach(function (card, i) {
        var rel = cur - i;
        var ty, scale, op, rot, z;
        if (rel <= 0) {
          var depth = Math.min(-rel, 3);
          ty = depth * 18; scale = 1 - depth * 0.05; op = depth > 2.4 ? 0 : 1; rot = 0; z = 100 - i;
        } else if (rel < 1) {
          ty = -rel * (window.innerHeight * 0.62); scale = 1 + rel * 0.04; op = 1 - rel * 0.9; rot = -rel * 9; z = 200;
        } else { ty = -window.innerHeight; scale = 1; op = 0; rot = -9; z = 0; }
        card.style.transform = 'translateY(' + ty + 'px) scale(' + scale + ') rotate(' + rot + 'deg)';
        card.style.opacity = op; card.style.zIndex = z;
      });
    };
    apply(0);
    window.ScrollTrigger.create({
      trigger: scroll, start: 'top top', end: 'bottom bottom', scrub: 0.6,
      onUpdate: function (self) { apply(self.progress); }
    });
  }

  async function boot() {
    initShader().catch(function () {});
    initAscii();
    try {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js');
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js');
      window.gsap.registerPlugin(window.ScrollTrigger);
      initWheel();
      initReco();
    } catch (e) {}
    initGlobe().catch(function () {});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
