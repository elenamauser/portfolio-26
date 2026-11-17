// =========================================================
// Hero Variante 2 – Schriftfarbe passend zur Kamerafahrt
// Nur für die Zoom-Version (index.html). Auf dem hellen Papier dunkelblau, im Brillenglas gelb.
// =========================================================
(() => {
  const root = document.querySelector('[data-hero-zoom]');
  if (!root) return;

  const NAVY = [11, 21, 51];     // --navy
  const YELLOW = [255, 225, 74]; // --yellow
  // Wechsel, sobald das dunkle Glas die Fläche füllt (Anteil des Scrollwegs der Fahrt)
  const FROM = 0.55, TO = 0.68;
  // Ab hier steht das Glas fertig (hero-zoom.js: deckend ab 0.7, Skalierung fertig bei 0.9)
  const DONE = 0.92;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  const update = () => {
    const total = root.offsetHeight - innerHeight;
    const p = reduce || total <= 0 ? 1 : clamp(-root.getBoundingClientRect().top / total, 0, 1);
    const t = smooth(FROM, TO, p);
    const c = NAVY.map((n, i) => Math.round(n + (YELLOW[i] - n) * t));
    document.documentElement.style.setProperty('--hz-ink', `rgb(${c.join(',')})`);
    // Kein sichtbarer Schnitt am Ende: sobald das Glas komplett steht (deckend, nicht mehr skaliert),
    // wird die Bühne durchsichtig – darunter liegt die identische fixierte Glasfläche, die einfach stehen bleibt.
    root.classList.toggle('is-done', p >= DONE);
  };

  let ticking = false;
  addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(() => { update(); ticking = false; }); }
  }, { passive: true });
  addEventListener('resize', update);
  update();
})();
