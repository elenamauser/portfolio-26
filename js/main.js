// Beim Öffnen immer oben im Hero starten – auch nach Neuladen oder wenn noch ein #anker in der Adresse steht.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
if (location.hash) history.replaceState(null, '', location.pathname + location.search);
window.scrollTo(0, 0);
window.addEventListener('load', () => { if (!window.__userScrolled) window.scrollTo(0, 0); });
window.addEventListener('wheel', () => { window.__userScrolled = true; }, { once: true, passive: true });
window.addEventListener('touchstart', () => { window.__userScrolled = true; }, { once: true, passive: true });
window.addEventListener('keydown', () => { window.__userScrolled = true; }, { once: true });
// Auch ein Klick (z. B. auf „Kontakt“, bevor alle Bilder geladen sind) zählt – sonst setzt das load-Ereignis
// die Seite wieder nach oben und bricht das Hinscrollen ab.
window.addEventListener('pointerdown', () => { window.__userScrolled = true; }, { once: true, passive: true });

// Interne Links (#projekte, Sommersprossen …): weich hinscrollen, ohne die Adresse zu ändern.
// Der Fokus wandert mit, damit Tastatur- und Screenreader-Nutzer:innen am Ziel weitermachen.
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href').slice(1);
  const target = id ? document.getElementById(id) : document.body;
  if (!target) return;
  e.preventDefault();
  const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (id === 'top' || !id) window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
  // „Projekte“ im Menü: Vorschau überspringen – direkt ans Ende der Bühne springen,
  // dann fährt die ausführliche Moodly-Ansicht von unten ins Bild, als hätte man die Vorschau schon durch
  else if (id === 'projekte' && a.closest('.site-nav')) {
    const first = document.getElementById('moodly');
    const dest = first.getBoundingClientRect().top + window.scrollY - header.offsetHeight;
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, Math.max(0, first.offsetTop - window.innerHeight));
    if (window.stageJump) window.stageJump();
    document.documentElement.style.scrollBehavior = '';
    requestAnimationFrame(() => window.scrollTo({ top: dest, behavior: smooth ? 'smooth' : 'auto' }));
    first.setAttribute('tabindex', '-1'); first.focus({ preventScroll: true });
    return;
  }
  else if (id === 'projekte' && window.stageCardTop) window.scrollTo({ top: window.stageCardTop(0), behavior: smooth ? 'smooth' : 'auto' });
  // Kontakt sitzt im Footer ganz unten: direkt ans Seitenende scrollen
  else if (id === 'kontakt') {
    const toEnd = b => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: b });
    toEnd(smooth ? 'smooth' : 'auto');
    // Laden unterwegs noch Bilder nach, wird die Seite länger – dann am Ende den Rest nachholen
    window.addEventListener('scrollend', () => toEnd('auto'), { once: true });
  }
  else target.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
});

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Jahr im Footer
document.getElementById('year').textContent = new Date().getFullYear();

// ---------- Mobile Navigation ----------
const toggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.site-nav');

function setMenu(open) {
  nav.classList.toggle('is-open', open);
  toggle.setAttribute('aria-expanded', open);
  toggle.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
}
toggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
});

// ---------- Header: weiß hinterlegt, sobald gescrollt wird ----------
const header = document.querySelector('.site-header');
const stageEl = document.querySelector('.stage');
// Ende der Bühne: ab hier liegen deckende Inhalte über dem fixierten Hero
const stageEnd = () => stageEl ? stageEl.offsetTop + stageEl.offsetHeight - window.innerHeight : 0;
// über dem Glas bleibt der Header durchsichtig, danach bekommt er eine helle Fläche
const onScroll = () => {
  // Weiße Projektseite liegt unter dem Header → Header weiß. Davor (Hero, Vorschau) und danach (Lebenslauf) durchsichtig.
  const first = document.querySelector('.project'), last = [...document.querySelectorAll('.project')].pop();
  const y = window.scrollY, hh = header.offsetHeight;
  const onWhite = first && y + hh > first.offsetTop && y < last.offsetTop + last.offsetHeight;
  header.classList.toggle('is-scrolled', !!onWhite);
  // Lebenslauf im Bild → Hero abdunkeln
  const cv = document.querySelector('.cv');
  document.body.classList.toggle('is-cv', !!cv && y + window.innerHeight * .6 > cv.offsetTop);
  document.body.classList.toggle('is-scrolled-away', window.scrollY > 40);
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ---------- Projekt-Bühne ----------
// Immer nur eine Karte im Bild: Sie kommt von oben (abbremsen), hält in der Mitte, fährt unten hinaus
// (beschleunigen) – erst danach startet die nächste. Die Bewegung folgt dem Scrollen weich nachgezogen.
if (stageEl) {
  const cards = [...stageEl.querySelectorAll('.card')];
  const DUR = 1.1;     // Scrollstrecke pro Karte (× Bildschirmhöhe); Karten folgen nahtlos aufeinander
  const SMOOTH = .12;  // Nachziehen (kleiner = weicher)
  const ease = t => t * t * (3 - 2 * t);                                  // weich an beiden Enden
  // Richtung: Standard von oben nach unten. <body data-cards="up"> (Zoom-Version, index.html): von unten nach oben.
  const DIR = document.body.dataset.cards === 'up' ? -1 : 1;
  let vh = window.innerHeight;
  window.stageCardTop = i => stageEl.offsetTop + (i + .5) * DUR * vh;      // Karte i genau in der Mitte

  if (reduceMotion) {
    stageEl.classList.add('is-static');
  } else {
    const size = () => {
      vh = window.innerHeight;
      stageEl.style.height = `${cards.length * DUR * vh + vh}px`;
    };
    let shown = null, raf = null;                                          // nachgezogene Scrollposition
    const render = local => {
      cards.forEach((card, i) => {
        const t = local / vh / DUR - i;                                    // 0 … 1 = Lebenszeit dieser Karte
        const away = vh / 2 + card.offsetHeight / 2 + 60;
        let y;
        if (t <= 0) y = -away;
        else if (t < .4) y = -away * (1 - ease(t / .4));
        else if (t <= .6) y = 0;
        else if (t < 1) y = away * ease((t - .6) / .4);
        else y = away;
        y *= DIR;
        const tilt = (i % 2 ? 1 : -1) * 1.2 * (y / away);
        card.style.transform = `translate3d(-50%, calc(-50% + ${y.toFixed(1)}px), 0) rotate(${tilt.toFixed(2)}deg)`;
        card.style.visibility = (t <= 0 || t >= 1) ? 'hidden' : 'visible';
      });
    };
    const target = () => window.scrollY - stageEl.offsetTop;
    const tick = () => {
      const goal = target();
      shown += (goal - shown) * SMOOTH;
      if (Math.abs(goal - shown) < .5) shown = goal;
      render(shown);
      raf = shown === goal ? null : requestAnimationFrame(tick);
    };
    const kick = () => { if (shown === null) shown = target(); if (!raf) raf = requestAnimationFrame(tick); onScroll(); };
    const jump = () => { shown = target(); render(shown); };              // ohne Nachziehen (Sprünge, Größe)
    size(); jump();
    window.addEventListener('scroll', kick, { passive: true });
    window.addEventListener('resize', () => { size(); jump(); onScroll(); });
    window.addEventListener('load', () => { size(); jump(); });
    window.stageJump = jump;
    // Tastatur: fokussierte Karte in die Mitte holen
    cards.forEach((card, i) => card.addEventListener('focusin', () => {
      window.scrollTo({ top: window.stageCardTop(i), behavior: 'auto' }); jump();
    }));
  }
}


// ---------- Aktiven Menüpunkt markieren ----------
const sections = document.querySelectorAll('main section[id], main article[id]');
const navLinks = nav.querySelectorAll('a');

const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    // Projekt-Artikel zählen zum Menüpunkt "Projekte"
    const id = entry.target.matches('article') ? 'projekte' : entry.target.id;
    navLinks.forEach(a => {
      const active = a.getAttribute('href') === '#' + id;
      a.classList.toggle('is-active', active);
      if (active) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
  });
}, { rootMargin: '-50% 0px -50% 0px' });
sections.forEach(s => sectionObserver.observe(s));

// ---------- Hero: Foto hinter Riffelglas (WebGL), Iris folgt dem Mauszeiger ----------
// Drei Schritte:
//  1. Szene (2D-Canvas): Foto + Iris, leicht verschoben und vom Lid beschnitten
//  2. Streuung (WebGL, nur wenn sich die Szene ändert): Gauß-Unschärfe waagerecht + senkrecht auf halber Auflösung
//  3. Glas (WebGL, Shader): jede Rippe ist eine Zylinderlinse mit eigener Normale –
//     Linsenkurve (Mitte gestaucht, Rand gestreckt/gespiegelt), Licht von oben links (weicher Verlauf,
//     breites Glanzlicht, Fresnel-Spiegelung), weicher Fugenschatten, Glaskörper (kühler Stich, Schleier),
//     kleine Abweichungen pro Rippe, Lichtabfall zu den Rändern.
// Ohne WebGL (oder als Datei geöffnet) übernimmt ein 2D-Fallback.
let heroCanvas = document.querySelector('.hero-canvas');
if (heroCanvas) {
  const S = 2000 / 3096;                                       // Fotokoordinaten → Pixel der Ebenen
  const IRIS = { x: 1890, y: 570, offX: 968, offY: 129 };
  const EYE = [1572,600,1569,570,1571,540,1576,511,1585,482,1598,454,1615,426,1636,400,1660,375,1701,350,1749,331,1802,318,1860,311,1922,311,1986,316,2053,327,2120,345,2186,368,2249,395,2309,426,2364,461,2416,500,2464,543,2507,589,2545,640,2562,679,2571,721,2573,764,2568,806,2557,848,2540,886,2518,921,2490,950,2444,971,2389,987,2327,997,2259,1002,2187,1002,2112,997,2036,988,1960,975,1905,958,1853,939,1805,916,1759,890,1718,861,1679,830,1645,796,1615,760,1606,744,1599,727,1592,708,1586,688,1582,666,1578,645,1575,622];
  const FOCUS_X = 1580, FOCUS_Y = 1170;
  // ---- Stellschrauben ----
  const GLASS = {
    ribMin: 40, ribMax: 56,        // Rippenbreite (CSS-px)
    lensCenter: 2.4,               // Stauchung in der Rippenmitte (>1 = gestaucht, Motiv wiederholt sich)
    lensEdge: 0.4,                 // Abbildung am Rippenrand – so gewählt, dass Konturen an jeder Kante springen
    jitter: .08,                   // Abweichung pro Rippe (Linse, Lage, Glanz)
    blur: [2.4, 0.15],             // Streuung: waagerecht (quer zu den Rippen) ≈ 7 px, senkrecht fast scharf
    aberration: 1.2,               // Rot/Blau-Versatz am Rippenrand (CSS-px)
    tint: [0.56, 0.62, 0.65],      // Glasfarbe: leicht kühl; schluckt etwas Licht (Lesbarkeit der gelben Schrift)
    veil: [0.018, 0.026, 0.03],    // Schleier: dezent, Schwarz bleibt fast schwarz
    contrast: 1.25,                // Kontrast nach dem Glas
    // Lichtsituation: Hauptlicht = großes, weiches Fensterlicht oben links (45° von links, 35° von oben),
    // kühles Tageslicht ~5600 K. Gegenlicht = schwaches warmes Streiflicht von rechts, ~3200 K, 20 %.
    keyColor: [0.90, 0.96, 1.0],
    rimColor: [1.0, 0.80, 0.48],
    key: .85,                      // Stärke Glanzlicht (oben links, fällt diagonal ab)
    rim: .2,                       // Stärke Gegenlicht (Anteil vom Hauptlicht)
    seam: .3,                      // weicher Schatten in der Fuge, lichtabgewandte Seite
    gradient: .38,                 // Lichtverlauf über die Fläche: oben links hell → unten rechts dunkel
    edge: .5,                      // zusätzlicher Abfall oben/unten (Lesbarkeit der gelben Schrift)
  };
  const IRIS_MAX = { x: 26, y: 14 };

  const load = src => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.src = src; });
  const scene = document.createElement('canvas'), sctx = scene.getContext('2d');
  let base, iris, crop, ribPx = 48;
  let ox = 0, oy = 0, tx = 0, ty = 0, shift = 0, tShift = 0;
  let sceneDirty = true, raf = null;

  const layout = () => {
    // Glas ist weich – CSS-Auflösung reicht, die Schrift darüber bleibt scharf (normales HTML)
    const w = heroCanvas.clientWidth, h = heroCanvas.clientHeight;
    heroCanvas.width = w; heroCanvas.height = h;
    scene.width = w; scene.height = h;      // volle Auflösung: senkrecht soll es fast scharf bleiben
    const ar = w / h; let vx = 0, vy = 0, vw = 3096, vh = 4128;
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    if (ar > 3096 / 4128) { vh = 3096 / ar; vy = clamp(FOCUS_Y - vh * 0.35, 0, 4128 - vh); }
    else { vw = 4128 * ar; vx = clamp(FOCUS_X - vw / 2, 0, 3096 - vw); }
    crop = { vx, vy, vw, k: scene.width / vw };
    ribPx = Math.max(GLASS.ribMin, Math.min(GLASS.ribMax, w / 30));
    sceneDirty = true;
  };
  const drawScene = () => {
    const k = crop.k;
    sctx.setTransform(k, 0, 0, k, -crop.vx * k, -crop.vy * k);
    sctx.drawImage(base, 0, 0, 3096, 4128);
    sctx.save();
    sctx.beginPath();
    for (let i = 0; i < EYE.length; i += 2) sctx[i ? 'lineTo' : 'moveTo'](EYE[i], EYE[i + 1]);
    sctx.closePath(); sctx.clip();
    const squeeze = 1 - .05 * Math.abs(ox) / IRIS_MAX.x;
    sctx.translate(IRIS.x + ox, IRIS.y + oy); sctx.scale(squeeze, 1); sctx.translate(-IRIS.x, -IRIS.y);
    sctx.drawImage(iris, IRIS.offX / S, IRIS.offY / S, iris.width / S, iris.height / S);
    sctx.restore();
    sceneDirty = false;
  };
  // Linsenkurve: sx = Mitte + ½·Rippe·(a·n − b·n³);  Steigung Mitte = a, am Rand = a − 3b
  const lensA = GLASS.lensCenter, lensB = (GLASS.lensCenter - GLASS.lensEdge) / 3;

  // ---------- WebGL ----------
  const makeGL = () => {
    const gl = heroCanvas.getContext('webgl', { antialias: false, alpha: false });
    if (!gl) return null;
    const VS = `attribute vec2 p; varying vec2 uv; void main(){ uv = p * .5 + .5; gl_Position = vec4(p, 0., 1.); }`;
    const BLUR = `precision mediump float; varying vec2 uv; uniform sampler2D tex; uniform vec2 dir;
      void main(){ vec3 c = vec3(0.); float w = 0.;
        for (int i = -7; i <= 7; i++) { float o = float(i); float g = exp(-o * o / 18.); c += g * texture2D(tex, uv + dir * o).rgb; w += g; }
        gl_FragColor = vec4(c / w, 1.); }`;
    const GLASSFS = `precision highp float; varying vec2 uv;
      uniform sampler2D tex; uniform vec2 res;
      uniform float rib, shift, lensA, lensB, jitter, ab, contrast, key, rim, seam, grad, edge;
      uniform vec3 tint, veil, keyColor, rimColor;
      float hash(float k){ return fract(sin(k * 127.1 + 31.7) * 43758.5453); }
      void main(){
        vec2 px = vec2(uv.x * res.x, (1. - uv.y) * res.y);
        vec2 p01 = px / res;
        float x = px.x + shift;
        float k = floor(x / rib), f = x / rib - k, n = 2. * f - 1.;
        float h1 = hash(k), h2 = hash(k + 17.3), h3 = hash(k + 41.9);

        // --- Brechung: Linsenkurve pro Rippe. Mitte gestaucht → Motiv wiederholt sich in Nachbarrippen;
        //     Rand passt bewusst nicht an die Nachbarrippe → Konturen springen an jeder Kante ---
        float a = lensA * (1. + (h1 - .5) * 2. * jitter);
        float b = lensB * (1. + (h2 - .5) * 2. * jitter);
        float center = (k + .5) * rib - shift + (h3 - .5) * rib * jitter * 1.5;
        float sx = center + .5 * rib * (a * n - b * n * n * n) + sin(px.y * .009 + k * 1.7) * 1.2;
        float ca = ab * n * n * n;
        vec2 q = vec2(sx, px.y) / res;
        vec3 col = vec3(texture2D(tex, q + vec2(ca / res.x, 0.)).r,
                        texture2D(tex, q).g,
                        texture2D(tex, q - vec2(ca / res.x, 0.)).b);

        // --- Glas: durchsichtig. Kaum eigene Schattierung, Helligkeit kommt vom Bild ---
        col = (col - .5) * contrast + .5;
        col = veil + clamp(col, 0., 1.) * tint;

        // Lichtverlauf über die Fläche (Fenster oben links)
        float diag = clamp(dot(p01, vec2(.55, .45)), 0., 1.);           // 0 oben links … 1 unten rechts
        col *= 1. + grad * (.45 - diag);
        float yN = p01.y;
        col *= 1. - edge * (smoothstep(.13, 0., yN) + smoothstep(.8, 1., yN));

        // Fuge: weicher Schatten nur auf der lichtabgewandten (rechten) Seite jeder Rippe
        col *= 1. - seam * smoothstep(.72, 1., f) * smoothstep(1., .9, f) * 1.6;
        col *= 1. - seam * .5 * smoothstep(.05, 0., f);

        // --- Glanzlicht: schmal und scharf (≈ 1,5 px) auf der LINKEN Wölbung, kühl.
        //     Lage folgt dem Fenster (45° links), Stärke fällt diagonal ab, pro Rippe leicht verschieden ---
        float pxIn = f * rib;                                              // Pixel innerhalb der Rippe
        float hlPos = rib * (.24 + (h2 - .5) * .04);
        float line = 1. - smoothstep(.4, 1.6, abs(pxIn - hlPos));           // harte, schmale Linie
        float halo = exp(-pow((pxIn - hlPos) / (rib * .06), 2.)) * .18;    // ganz feiner Schein daneben
        float flick = .75 + .25 * sin(px.y * .011 + k * 2.3) * sin(px.y * .0047 + k * .9);
        float fall = pow(1. - diag, 2.2);                                 // oben links stark → unten rechts fast weg
        float kI = key * fall * flick * (1. + (h1 - .5) * .5);
        kI *= 1. - .65 * (smoothstep(.09, .02, yN) + smoothstep(.88, .97, yN));
        col += keyColor * kI * (line + halo);

        // Gegenlicht: sehr feiner, schwacher warmer Saum auf der rechten Wölbung
        float rimPos = rib * .9;
        float rline = 1. - smoothstep(.3, 1.3, abs(pxIn - rimPos));
        col += rimColor * key * rim * (.35 + .65 * diag) * rline;

        gl_FragColor = vec4(clamp(col, 0., 1.), 1.);
      }`;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    const program = fs => { const p = gl.createProgram();
      gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); return p; };
    const pBlur = program(BLUR), pGlass = program(GLASSFS);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const bindQuad = p => { const loc = gl.getAttribLocation(p, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0); };
    const mkTex = () => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); return t; };
    const tScene = mkTex(), tTmp = mkTex(), tBlur = mkTex();
    const fbTmp = gl.createFramebuffer(), fbBlur = gl.createFramebuffer();
    let fbW = 0, fbH = 0;
    const sizeTargets = () => {
      if (fbW === scene.width && fbH === scene.height) return;
      fbW = scene.width; fbH = scene.height;
      for (const [t, fb] of [[tTmp, fbTmp], [tBlur, fbBlur]]) {
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, fbW, fbH, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
      }
    };
    const U = (p, n) => gl.getUniformLocation(p, n);
    const blurPass = (src, fb, dx, dy) => {
      gl.useProgram(pBlur); bindQuad(pBlur);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.viewport(0, 0, fbW, fbH);
      gl.bindTexture(gl.TEXTURE_2D, src);
      gl.uniform2f(U(pBlur, 'dir'), dx / fbW, dy / fbH);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    return {
      draw() {
        if (sceneDirty) {
          drawScene();
          gl.bindTexture(gl.TEXTURE_2D, tScene);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, scene);   // wirft bei file:// → Fallback
          sizeTargets();
          blurPass(tScene, fbTmp, GLASS.blur[0], 0);
          blurPass(tTmp, fbBlur, 0, GLASS.blur[1]);
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, heroCanvas.width, heroCanvas.height);
        gl.useProgram(pGlass); bindQuad(pGlass);
        gl.bindTexture(gl.TEXTURE_2D, tBlur);
        gl.uniform2f(U(pGlass, 'res'), heroCanvas.width, heroCanvas.height);
        gl.uniform1f(U(pGlass, 'rib'), ribPx);
        gl.uniform1f(U(pGlass, 'shift'), shift);
        gl.uniform1f(U(pGlass, 'lensA'), lensA);
        gl.uniform1f(U(pGlass, 'lensB'), lensB);
        gl.uniform1f(U(pGlass, 'jitter'), GLASS.jitter);
        gl.uniform1f(U(pGlass, 'ab'), GLASS.aberration);
        gl.uniform1f(U(pGlass, 'contrast'), GLASS.contrast);
        gl.uniform1f(U(pGlass, 'key'), GLASS.key);
        gl.uniform1f(U(pGlass, 'rim'), GLASS.rim);
        gl.uniform1f(U(pGlass, 'seam'), GLASS.seam);
        gl.uniform1f(U(pGlass, 'grad'), GLASS.gradient);
        gl.uniform1f(U(pGlass, 'edge'), GLASS.edge);
        gl.uniform3fv(U(pGlass, 'tint'), GLASS.tint);
        gl.uniform3fv(U(pGlass, 'veil'), GLASS.veil);
        gl.uniform3fv(U(pGlass, 'keyColor'), GLASS.keyColor);
        gl.uniform3fv(U(pGlass, 'rimColor'), GLASS.rimColor);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
    };
  };

  // ---------- 2D-Fallback: gleiche Linsenkurve in feinen Streifen, Licht als Verläufe ----------
  const make2D = () => {
    const ctx = heroCanvas.getContext('2d');
    const soft = document.createElement('canvas'), soc = soft.getContext('2d');
    const rgb = (v, a = 1) => `rgba(${v.map(x => Math.round(x * 255))},${a})`;
    return {
      draw() {
        const W = heroCanvas.width, H = heroCanvas.height, r = ribPx;
        if (sceneDirty) {
          drawScene();
          soft.width = W; soft.height = H;
          // nur waagerecht weich: schmal zeichnen, wieder breit ziehen
          const thin = document.createElement('canvas'); thin.width = Math.max(1, Math.round(W / 7)); thin.height = H;
          thin.getContext('2d').drawImage(scene, 0, 0, thin.width, H);
          soc.imageSmoothingQuality = 'high';
          soc.filter = 'contrast(1.25)';
          soc.drawImage(thin, 0, 0, W, H);
          soc.filter = 'none';
          soc.globalCompositeOperation = 'multiply'; soc.fillStyle = rgb(GLASS.tint); soc.fillRect(0, 0, W, H);
          soc.globalCompositeOperation = 'lighter'; soc.fillStyle = rgb(GLASS.veil); soc.fillRect(0, 0, W, H);
          soc.globalCompositeOperation = 'source-over';
        }
        const map = (c, f) => { const n = 2 * f - 1; return c + .5 * r * (lensA * n - lensB * n * n * n); };
        const STEPS = 10;
        ctx.clearRect(0, 0, W, H);
        for (let x0 = -(((shift % r) + r) % r); x0 < W; x0 += r) {
          const c = x0 + r / 2 + shift - shift;
          for (let q = 0; q < STEPS; q++) {
            const f0 = q / STEPS, f1 = (q + 1) / STEPS;
            const s0 = map(c, f0), s1 = map(c, f1), dx = x0 + f0 * r, dw = r / STEPS + .6;
            const lo = Math.max(0, Math.min(W - 1, Math.min(s0, s1))), sw = Math.max(1, Math.abs(s1 - s0));
            if (s1 >= s0) ctx.drawImage(soft, lo, 0, sw, H, dx, 0, dw, H);
            else { ctx.save(); ctx.translate(dx + dw, 0); ctx.scale(-1, 1); ctx.drawImage(soft, lo, 0, sw, H, 0, 0, dw, H); ctx.restore(); }
          }
          // Fugenschatten rechts, schmales kühles Glanzlicht links (Stärke fällt diagonal ab), warmer Saum rechts
          const diag = Math.min(1, Math.max(0, (x0 / W) * .55 + .2));
          const fall = (1 - diag) ** 2.2;
          const gr = ctx.createLinearGradient(x0, 0, x0 + r, 0);
          gr.addColorStop(0, 'rgba(4,8,10,.15)'); gr.addColorStop(.05, 'rgba(4,8,10,0)');
          gr.addColorStop(.72, 'rgba(4,8,10,0)'); gr.addColorStop(.95, `rgba(4,8,10,${GLASS.seam})`); gr.addColorStop(1, 'rgba(4,8,10,.1)');
          ctx.fillStyle = gr; ctx.fillRect(x0, 0, r, H);
          const hy = ctx.createLinearGradient(0, 0, 0, H);
          hy.addColorStop(0, `rgba(230,245,255,${GLASS.key * fall})`); hy.addColorStop(1, `rgba(230,245,255,${GLASS.key * fall * .15})`);
          ctx.fillStyle = hy; ctx.fillRect(Math.round(x0 + r * .24), 0, 1.5, H);
          ctx.fillStyle = `rgba(255,204,122,${GLASS.key * GLASS.rim * .6})`; ctx.fillRect(Math.round(x0 + r * .9), 0, 1, H);
        }
        // Lichtverlauf über die Fläche: oben links hell → unten rechts dunkel
        const v = ctx.createLinearGradient(0, 0, W, H);
        v.addColorStop(0, `rgba(255,255,255,${GLASS.gradient * .15})`); v.addColorStop(.45, 'rgba(0,0,0,0)');
        v.addColorStop(1, `rgba(4,8,10,${GLASS.gradient * .6})`);
        ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
        const e = ctx.createLinearGradient(0, 0, 0, H);
        e.addColorStop(0, `rgba(4,8,10,${GLASS.edge})`); e.addColorStop(.15, 'rgba(4,8,10,0)');
        e.addColorStop(.82, 'rgba(4,8,10,0)'); e.addColorStop(1, `rgba(4,8,10,${GLASS.edge})`);
        ctx.fillStyle = e; ctx.fillRect(0, 0, W, H);
      }
    };
  };

  // ---------- Animation ----------
  let glass;
  const frame = () => {
    raf = null;
    const px = ox, py = oy;
    ox += (tx - ox) * .1; oy += (ty - oy) * .1; shift += (tShift - shift) * .1;
    if (Math.abs(px - ox) > .01 || Math.abs(py - oy) > .01) sceneDirty = true;
    glass.draw();
    if (Math.abs(tx - ox) > .05 || Math.abs(ty - oy) > .05 || Math.abs(tShift - shift) > .02) raf = requestAnimationFrame(frame);
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };

  Promise.all([load('assets/images/hero-base.jpg'), load('assets/images/hero-iris.png')]).then(([b, i]) => {
    base = b; iris = i;
    layout();
    // WebGL zuerst. Geht das nicht (kein WebGL, oder Seite als Datei geöffnet: dann darf WebGL
    // die Bilder aus Sicherheitsgründen nicht lesen), übernimmt der 2D-Fallback auf einem frischen Canvas.
    try { glass = makeGL(); if (!glass) throw 0; glass.draw(); }
    catch (e) {
      const fresh = heroCanvas.cloneNode(false);
      heroCanvas.replaceWith(fresh); heroCanvas = fresh;
      layout(); glass = make2D(); glass.draw();
    }
    window.addEventListener('resize', () => { layout(); glass.draw(); });

    if (reduceMotion) return;
    const hero = heroCanvas.closest('.hero');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    // Das Glas steht fest – nur die Iris bewegt sich
    if (!finePointer) return;
    window.addEventListener('pointermove', e => {
      if (header.classList.contains('is-scrolled')) return;   // Hero gerade verdeckt
      const r = heroCanvas.getBoundingClientRect(), kk = r.width / crop.vw;
      const ex = r.left + (IRIS.x - crop.vx) * kk, ey = r.top + (IRIS.y - crop.vy) * kk;
      const dx = e.clientX - ex, dy = e.clientY - ey, dist = Math.hypot(dx, dy) || 1;
      const reach = Math.min(1, dist / (Math.max(window.innerWidth, window.innerHeight) * .45));
      tx = dx / dist * IRIS_MAX.x * reach; ty = dy / dist * IRIS_MAX.y * reach;
      kick();
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', () => { tx = 0; ty = 0; kick(); });
  });
}

// ---------- Hover-Vorschau in der Projektliste ----------
// Nur mit Maus/Trackpad: das Bild folgt dem Zeiger. Mit Tastatur erscheint es beim Fokus neben der Zeile.
// Escape blendet es aus (WCAG 1.4.13). Die Vorschau ist dekorativ (aria-hidden).
const preview = document.querySelector('.preview');
const previewImg = preview && preview.querySelector('img');
const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

if (preview && canHover) {
  let x = 0, y = 0, cx = 0, cy = 0, raf = null;
  const place = () => {
    // weich nachziehen (bei reduzierter Bewegung direkt)
    cx = reduceMotion ? x : cx + (x - cx) * 0.18;
    cy = reduceMotion ? y : cy + (y - cy) * 0.18;
    preview.style.transform = `translate(${cx}px, ${cy}px)`;
    raf = (Math.abs(x - cx) > .5 || Math.abs(y - cy) > .5) ? requestAnimationFrame(place) : null;
  };
  const moveTo = (nx, ny, jump) => {
    const w = preview.offsetWidth, h = preview.offsetHeight || w * .7;
    // im Bildschirm halten
    x = Math.min(nx + 24, window.innerWidth - w - 16);
    y = Math.max(16, Math.min(ny - h / 2, window.innerHeight - h - 16));
    if (jump) { cx = x; cy = y; }
    if (!raf) raf = requestAnimationFrame(place);
  };
  const show = a => {
    if (previewImg.getAttribute('src') !== a.dataset.preview) previewImg.src = a.dataset.preview;
    preview.classList.add('is-visible');
  };
  const hide = () => preview.classList.remove('is-visible');

  document.querySelectorAll('a[data-preview]').forEach(a => {
    a.addEventListener('mouseenter', e => { moveTo(e.clientX, e.clientY, !preview.classList.contains('is-visible')); show(a); });
    a.addEventListener('mousemove', e => moveTo(e.clientX, e.clientY));
    a.addEventListener('mouseleave', hide);
    a.addEventListener('focus', () => {
      const r = a.getBoundingClientRect();
      moveTo(r.left + r.width * .55, r.top + r.height / 2, true);
      show(a);
    });
    a.addEventListener('blur', hide);
    // Bilder vorladen, damit die Vorschau sofort da ist
    new Image().src = a.dataset.preview;
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') hide(); });
  window.addEventListener('scroll', hide, { passive: true });
}

// ---------- Videos: Pause-Knopf, bei reduzierter Bewegung kein Autoplay ----------
document.querySelectorAll('.video-wrap').forEach(wrap => {
  const video = wrap.querySelector('video');
  const btn = wrap.querySelector('.media-toggle');
  const sync = () => {
    const paused = video.paused;
    btn.classList.toggle('is-paused', paused);
    btn.setAttribute('aria-label', paused ? 'Video abspielen' : 'Video pausieren');
  };
  if (reduceMotion) { video.removeAttribute('autoplay'); video.pause(); }
  btn.addEventListener('click', () => { video.paused ? video.play() : video.pause(); });
  video.addEventListener('play', sync);
  video.addEventListener('pause', sync);
  sync();
});

// ---------- Picknick Kollektiv: Logo-Prinzip „Form bleibt. Raum entsteht.“ ----------
// Sechs Zustände der sieben Teile (aus dem Styleguide), 3 s pro Zustand, Smoothstep.
const pkMoving = document.querySelector('.pk-mark--moving');
if (pkMoving) {
  const states = [
    [[217,222],[922,227],[218,420],[803,420],[926,421],[218,819],[930,824]],
    [[217,222],[922,227],[568,420],[803,420],[1080,421],[218,819],[930,824]],
    [[217,65],[922,227],[568,420],[803,420],[1080,421],[218,1040],[930,824]],
    [[217,65],[922,227],[218,420],[453,420],[650,421],[218,1040],[930,824]],
    [[45,65],[922,227],[218,420],[453,420],[650,421],[390,1040],[930,824]],
    [[217,65],[922,227],[218,420],[803,420],[926,421],[218,1040],[930,824]],
  ];
  const pieces = [...pkMoving.querySelectorAll('use')];
  const btn = document.querySelector('.pk-toggle');
  let running = !reduceMotion, visible = false, pos = 0, prev = 0;
  const label = () => {
    btn.classList.toggle('is-paused', !running);
    btn.setAttribute('aria-label', running ? 'Animation pausieren' : 'Animation abspielen');
  };
  btn.addEventListener('click', () => { running = !running; label(); });
  label();
  const tick = now => {
    const dt = prev ? Math.min((now - prev) / 1000, .1) : 0;
    prev = now;
    if (running && visible) {
      pos = (pos + dt / 3) % states.length;
      const k = Math.floor(pos);
      let t = Math.max(0, Math.min(1, (pos - k - .2) / .7));
      t = t * t * (3 - 2 * t);
      pieces.forEach((p, i) => {
        const a = states[k][i], b = states[(k + 1) % states.length][i];
        p.setAttribute('transform', `translate(${a[0] + (b[0] - a[0]) * t} ${a[1] + (b[1] - a[1]) * t})`);
      });
    }
    requestAnimationFrame(tick);
  };
  // nur rechnen, wenn sichtbar
  const stageBox = pkMoving.closest('.pk-stage') || pkMoving;
  if ('IntersectionObserver' in window) new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { rootMargin: '100px 0px' }).observe(stageBox);
  else visible = true;
  requestAnimationFrame(tick);
}

// ---------- Einblend-Animation ----------
const revealItems = document.querySelectorAll('.project-head, .project-text, .media, .cv-block, .cv-contact');
revealItems.forEach(el => el.classList.add('reveal'));

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
revealItems.forEach(el => revealObserver.observe(el));
