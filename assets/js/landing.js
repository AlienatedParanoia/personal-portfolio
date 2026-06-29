/* ===========================================================================
   landing.js — behaviors for the portfolio landing page.
   Ported 1:1 from the Claude Design prototype's Component class:
   shader intro (three.js), Spline 3D hero, radial project wheel (GSAP),
   interactive globe (cobe), and the recommendation card-stack (GSAP).
   =========================================================================== */
(function () {
  'use strict';

  var el = document;
  var loaded = {};

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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    wrap.appendChild(renderer.domElement);
    var resize = function () {
      var w = wrap.clientWidth, h = wrap.clientHeight;
      renderer.setSize(w, h);
      uniforms.resolution.value.set(renderer.domElement.width, renderer.domElement.height);
    };
    resize(); window.addEventListener('resize', resize);
    var animate = function () { requestAnimationFrame(animate); uniforms.time.value += 0.045; renderer.render(scene, camera); };
    animate();
  }

  // ---- 2. Spline 3D hero ----
  async function initSpline() {
    var wrap = el.querySelector('[data-spline-wrap]');
    if (!wrap) return;
    await loadScript('https://unpkg.com/@splinetool/viewer@1.9.48/build/spline-viewer.js', true);
    var v = document.createElement('spline-viewer');
    v.setAttribute('url', 'https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode');
    v.setAttribute('loading-anim-type', 'none');
    v.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:2;';
    v.addEventListener('load-complete', function () { var f = wrap.querySelector('[data-spline-fallback]'); if (f) f.style.display = 'none'; });
    wrap.appendChild(v);
    setTimeout(function () { var f = wrap.querySelector('[data-spline-fallback]'); if (f) f.style.display = 'none'; }, 6000);
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
    var wheelRaf;
    var tick = function () {
      var ang = window.gsap.getProperty(wheel, 'rotation') || 0;
      items.forEach(function (it) {
        var c = it.querySelector('[data-card-inner]');
        var hov = it.dataset.hover === '1';
        c.style.transform = 'rotate(' + (-ang) + 'deg)' + (hov ? ' scale(1.07) translateY(-12px)' : '');
      });
      wheelRaf = requestAnimationFrame(tick);
    };
    tick();
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
    var phi = 0, width = 0, dragging = null, offset = 0, autoOffset = 0;
    var onResize = function () { width = canvas.offsetWidth; };
    onResize(); window.addEventListener('resize', onResize);
    var globe = createGlobe(canvas, {
      devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
      width: width, height: width,
      phi: 0, theta: 0.25, dark: 1, diffuse: 1.4,
      mapSamples: 16000, mapBrightness: 7,
      baseColor: [0.32, 0.34, 0.38], markerColor: [0.21, 0.88, 0.9], glowColor: [0.06, 0.09, 0.11],
      markers: markers,
      onRender: function (state) {
        if (!dragging) autoOffset += 0.004;
        state.phi = autoOffset + offset;
        state.width = width; state.height = width;
      }
    });
    setTimeout(function () { canvas.style.opacity = '1'; }, 120);
    var down = function (e) { dragging = e.clientX; canvas.style.cursor = 'grabbing'; };
    var up = function () { dragging = null; canvas.style.cursor = 'grab'; };
    var move = function (e) { if (dragging !== null) { offset += (e.clientX - dragging) / 200; dragging = e.clientX; } };
    canvas.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointermove', move);

    var stats = el.querySelector('[data-globe-stats]');
    if (stats) {
      var data = [['8', 'COUNTRIES REACHED'], ['120+', 'STUDENTS ONBOARDED'], ['30+', 'REPOS SCANNED'], ['4.9★', 'AVG. FEEDBACK']];
      stats.innerHTML = data.map(function (d) { return '<div style="text-align:center;padding:14px 26px;"><div style="font-family:\'JetBrains Mono\',monospace;font-size:30px;color:#36E0E6;">' + d[0] + '</div><div style="font-family:\'JetBrains Mono\',monospace;font-size:10px;letter-spacing:.16em;color:#6b717b;margin-top:6px;">' + d[1] + '</div></div>'; }).join('');
    }
  }

  // ---- 5. Recommendation card stack ----
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
    initSpline().catch(function () {});
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
