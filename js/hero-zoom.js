/* =========================================================
   Hero: Kamerafahrt ins Brillenglas
   Beim Scrollen fährt die Kamera in einem leichten Bogen auf das
   linke Brillenglas zu, bis es den ganzen Hero füllt.
   Gehört zu css/hero-zoom.css – Markup siehe hero-zoom-demo.html
   ========================================================= */

(() => {
  // ---- Stellschrauben ------------------------------------------------
  const CONFIG = {
    // Bildgröße des Fotos in Pixeln (assets/images/hero-portrait.png)
    imgW: 1033,
    imgH: 1522,
    // Zielpunkt: ruhige Stelle im linken Brillenglas (Pixel im Foto)
    lensX: 549,
    lensY: 80,
    lensSize: 120,      // ungefähre Breite dieser Stelle
    // Foto-Höhe am Anfang (Anteil der Fensterhöhe)
    startHeight: 0.86,
    // Anteil des Scrollwegs, in dem die Kamera fährt (Rest: Glas steht)
    moveEnd: 0.78,
    // Neigung während der Fahrt (Grad)
    tiltX: 7,
    tiltY: -11,
    perspective: 1100,
    // Wann das scharfe Glas übernimmt (Anteil des Scrollwegs)
    lensFadeFrom: 0.5,
    lensFadeTo: 0.7,
    // Wann Inhalte mit data-hz-reveal einblenden
    revealFrom: 0.7,
    revealStep: 0.05,
  };
  // ---------------------------------------------------------------------

  const root = document.querySelector('[data-hero-zoom]');
  if (!root) return;

  const figure = root.querySelector('.hz-figure');
  const photo = figure.querySelector('img');
  const lens = root.querySelector('.hz-lens');
  const reveals = Array.from(root.querySelectorAll('[data-hz-reveal]'));

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const easeInOut = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  let L = {};

  function measure() {
    const vw = innerWidth, vh = innerHeight;
    const H = Math.min(vh * CONFIG.startHeight, vw * 1.2);
    const W = H * CONFIG.imgW / CONFIG.imgH;
    const left = (vw - W) / 2;
    const top = (vh - H) / 2 - vh * 0.02;
    Object.assign(figure.style, { width: W + 'px', height: H + 'px', left: left + 'px', top: top + 'px' });

    const ox = W * CONFIG.lensX / CONFIG.imgW;
    const oy = H * CONFIG.lensY / CONFIG.imgH;
    figure.style.transformOrigin = ox + 'px ' + oy + 'px';

    const lensPx = W * CONFIG.lensSize / CONFIG.imgW;
    L = { vw, vh, lensX: left + ox, lensY: top + oy, sMax: Math.max(vw, vh) * 2.2 / lensPx };
  }

  function render() {
    const total = root.offsetHeight - innerHeight;
    const p = reduce ? 1 : clamp(-root.getBoundingClientRect().top / total, 0, 1);

    const z = easeInOut(clamp(p / CONFIG.moveEnd, 0, 1));
    const s = Math.exp(Math.log(L.sMax) * z);
    const tx = (L.vw / 2 - L.lensX) * z;
    const ty = (L.vh / 2 - L.lensY) * z;
    const arc = Math.sin(Math.PI * z);
    figure.style.transform =
      `translate3d(${tx}px, ${ty}px, 0) perspective(${CONFIG.perspective}px) ` +
      `rotateX(${CONFIG.tiltX * arc}deg) rotateY(${CONFIG.tiltY * arc}deg) scale(${s})`;

    lens.style.opacity = smooth(CONFIG.lensFadeFrom, CONFIG.lensFadeTo, p);
    lens.style.transform = `scale(${lerp(1.25, 1, smooth(CONFIG.lensFadeFrom, 0.9, p))})`;

    reveals.forEach((el, i) => {
      const a0 = CONFIG.revealFrom + i * CONFIG.revealStep;
      const a = smooth(a0, a0 + 0.1, p);
      el.style.opacity = a;
      el.style.transform = `translateY(${(1 - a) * 24}px)`;
    });
  }

  let ticking = false;
  addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(() => { render(); ticking = false; }); }
  }, { passive: true });
  addEventListener('resize', () => { measure(); render(); });

  const start = () => { measure(); render(); };
  if (photo.complete) start(); else photo.addEventListener('load', start);
  start();
})();
