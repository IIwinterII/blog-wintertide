// Wintertide Snow (DOM version)
// - Mouse move: tiny flakes spawn at cursor and drift outward
// - Click: small burst around cursor
// - Topmost layer, pointer-events: none; throttled; reduced-motion aware
(() => {
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Remove legacy canvas layer if exists
  const oldCanvas = document.getElementById('wt-snow');
  if (oldCanvas && oldCanvas.tagName === 'CANVAS') oldCanvas.remove();

  // Config (tweak here)
  const cfg = {
    maxSnowflakes: prefersReduced ? 120 : (isTouch ? 220 : 320),
    trailPerMove: prefersReduced ? 0 : 1,       // flakes per mouse move tick
    explosionCount: prefersReduced ? 8 : (isTouch ? 14 : 20),
    throttleMs: 18,                              // mousemove throttle
    sizeMin: 0.6,                                // px
    sizeMax: 1.8,
    flyMin: 32,                                  // movement distance (px)
    flyMax: 92,
    burstMin: 40,
    burstMax: 120,
    zIndex: 2147483647                           // topmost
  };

  // Host container (topmost)
  const host = document.createElement('div');
  host.id = 'wt-snow-dom';
  Object.assign(host.style, {
    position: 'fixed',
    inset: '0',
    zIndex: String(cfg.zIndex),
    pointerEvents: 'none',
    overflow: 'hidden'
  });
  document.body.appendChild(host);

  // Inject minimal CSS for flakes
  const style = document.createElement('style');
  style.setAttribute('data-wt-snow', 'dom');
  style.textContent = `
  .wt-snowflake {
    position: absolute;
    left: 0; top: 0;
    width: var(--sz, 1px);
    height: var(--sz, 1px);
    border-radius: 50%;
    background: radial-gradient(closest-side, rgba(255,255,255,0.95), rgba(255,255,255,0.0) 70%);
    filter: drop-shadow(0 0 2px rgba(200,230,255,0.45));
    opacity: var(--op, 0.9);
    will-change: transform, opacity;
    transform: translate(var(--x, 0px), var(--y, 0px));
    animation: wt-fly var(--dur, 1.4s) ease-out forwards;
  }
  @keyframes wt-fly {
    to {
      transform: translate(var(--tx, 0px), var(--ty, 60px));
      opacity: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .wt-snowflake { animation-duration: 0.8s !important; }
  }`;
  document.head.appendChild(style);

  // State
  const flakes = [];
  let lastSpawn = 0;

  function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }
  function rand(a, b){ return a + Math.random() * (b - a); }

  // Create one flake at (x,y) with target offset (tx, ty)
  function createFlake(x, y, tx, ty, dur) {
    // Cap total
    if (flakes.length >= cfg.maxSnowflakes) {
      const oldest = flakes.shift();
      oldest?.remove();
    }
    const el = document.createElement('div');
    el.className = 'wt-snowflake';
    el.style.setProperty('--x', x + 'px');
    el.style.setProperty('--y', y + 'px');
    el.style.setProperty('--tx', (x + tx) + 'px');
    el.style.setProperty('--ty', (y + ty) + 'px');
    el.style.setProperty('--sz', rand(cfg.sizeMin, cfg.sizeMax) + 'px');
    el.style.setProperty('--op', rand(0.6, 0.98).toFixed(2));
    el.style.setProperty('--dur', (dur || rand(0.9, 1.8)) + 's');
    host.appendChild(el);
    flakes.push(el);
    el.addEventListener('animationend', () => {
      const i = flakes.indexOf(el);
      if (i >= 0) flakes.splice(i, 1);
      el.remove();
    }, { once: true });
  }

  // Emit tiny drift at cursor
  function emitTrail(cx, cy) {
    for (let i = 0; i < cfg.trailPerMove; i++) {
      const ang = Math.random() * Math.PI * 2;
      const dist = rand(cfg.flyMin, cfg.flyMax);
      const tx = Math.cos(ang) * dist;
      const ty = Math.sin(ang) * dist + rand(16, 46); // slight downward bias
      createFlake(cx, cy, tx, ty);
    }
  }

  // Emit small burst around cursor
  function emitBurst(cx, cy) {
    const n = cfg.explosionCount;
    for (let i = 0; i < n; i++) {
      const ang = Math.random() * Math.PI * 2;
      const dist = rand(cfg.burstMin, cfg.burstMax);
      const tx = Math.cos(ang) * dist;
      const ty = Math.sin(ang) * dist + rand(20, 60);
      createFlake(cx, cy, tx, ty, rand(0.8, 1.4));
    }
  }

  // Occasional ambient snow from top
  function emitAmbient() {
    if (prefersReduced) return;
    if (Math.random() < 0.04 && flakes.length < cfg.maxSnowflakes) {
      const x = Math.random() * window.innerWidth;
      const y = -10;
      const tx = rand(-30, 30);
      const ty = window.innerHeight + rand(40, 120);
      createFlake(x, y, tx, ty, rand(2.2, 3.6));
    }
    requestAnimationFrame(emitAmbient);
  }
  requestAnimationFrame(emitAmbient);

  // Input handlers
  function onMove(e) {
    const now = performance.now();
    if (now - lastSpawn < cfg.throttleMs) return;
    lastSpawn = now;
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    emitTrail(clamp(x, 0, innerWidth), clamp(y, 0, innerHeight));
  }
  function onClick(e) {
    const x = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const y = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
    emitBurst(clamp(x, 0, innerWidth), clamp(y, 0, innerHeight));
  }

  const moveEvt = isTouch ? 'touchmove' : 'mousemove';
  const clickEvt = isTouch ? 'touchend' : 'click';
  window.addEventListener(moveEvt, onMove, { passive: true });
  window.addEventListener(clickEvt, onClick, { passive: true });

  // Minimal API (optional)
  window.wtSnow = {
    setMax(n){ cfg.maxSnowflakes = +n || cfg.maxSnowflakes; },
    burst(x, y){ emitBurst(x ?? innerWidth/2, y ?? innerHeight/2); },
    clear(){
      while (flakes.length) flakes.pop()?.remove();
    }
  };
})();