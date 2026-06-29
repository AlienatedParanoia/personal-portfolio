# Prajjit Gon — Portfolio

A static, dark, animation-driven personal portfolio recreated from a Claude Design
(claude.ai/design) handoff. No build step — plain HTML/CSS/JS with libraries loaded from CDNs.

## Pages

| File | Page |
|---|---|
| `index.html` | Landing — shader hero, 3D about, rotating project wheel, interactive globe, recommendation card-stack, contact |
| `honeypot-wars.html` | Project 01/03 — HoneyPot Wars (AI security platform) |
| `fire.html` | Project 02/03 — F.I.R.E (student opportunity platform) |
| `ema-crossover.html` | Project 03/03 — EMA Crossover (quant backtest) |

## Run locally

The interactive globe (cobe) and the Spline 3D viewer load as **ES modules from a CDN**, which
browsers block over `file://`. Serve over HTTP instead:

```bash
# Python 3
python -m http.server 8000
# or Node
npx serve .
```

Then open <http://localhost:8000>.

## Tech

- Fonts: Space Grotesk + JetBrains Mono (Google Fonts)
- Three.js r128 — landing shader hero
- GSAP 3.12.5 + ScrollTrigger — pinned rotating project wheel + recommendation card-stack
- UnicornStudio (v1.4.33) — animated scene in the "About" section (lazy-loaded, pauses off-screen)
- cobe 0.6.3 — interactive globe
- Per-project hero canvas effects are hand-written 2D-canvas (no deps)

## Project screenshots

The three project pages use styled placeholders in their "showcase" sections. To use real images,
drop files into `assets/img/` and replace the `<div class="img-slot">…</div>` blocks with
`<img src="assets/img/your-shot.png" alt="…">` (the slot keeps the same dimensions, so layout is
unchanged).

## Deploy

It's fully static — deploy the folder as-is to GitHub Pages, Vercel, or Netlify (zero config).
