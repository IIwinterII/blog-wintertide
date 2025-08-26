import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// 全局样式
import './style.css'
import './styles/theme.css'
import './styles/soft-transitions.css'
import './styles/ux-overrides.css'

createApp(App).use(router).mount('#app')

// ===== Wintertide snow (inline DOM) =====
;(() => {
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // 顶层容器
  const hostId = 'wt-snow-dom';
  if (document.getElementById(hostId)) return;
  const host = document.createElement('div');
  host.id = hostId;
  Object.assign(host.style, {
    position: 'fixed',
    inset: '0',
    zIndex: '2147483647',   // 最高层级
    pointerEvents: 'none',
    overflow: 'hidden'
  });
  document.body.appendChild(host);

  // 样式与动画
  const style = document.createElement('style');
  style.textContent = `
  .wt-snowflake{
    position:absolute;
    left:0; top:0;
    width:var(--sz,4px); height:var(--sz,4px);
    border-radius:50%;
    background: radial-gradient(closest-side, rgba(255,255,255,.95), rgba(255,255,255,0) 68%);
    filter: drop-shadow(0 0 3px rgba(200,230,255,.55));
    opacity: var(--op,.95);
    transform: translate(var(--x,0px), var(--y,0px));
    animation: wt-fall var(--dur,1.8s) linear forwards;
    will-change: transform, opacity;
  }
  @keyframes wt-fall {
    to { transform: translate(var(--tx,0px), var(--ty,120px)); opacity: 0; }
  }
  `;
  document.head.appendChild(style);

  // 配置（更大更明显）
  const cfg = {
    max: prefersReduced ? 160 : (isTouch ? 260 : 480),
    throttleMs: 14,        // mousemove 触发节流
    sizeMin: 3,            // 放大粒子尺寸
    sizeMax: 7,
    trailCount: prefersReduced ? 0 : 2, // 移动时生成数量
    burstCount: prefersReduced ? 10 : 28, // 点击爆炸数量
    windRange: 160,        // 水平偏移范围（像素）
    fallMin: 90,           // 下落位移
    fallMax: 180
  };

  const flakes = [];
  let last = 0;

  function clamp(n,a,b){ return Math.max(a, Math.min(b,n)); }
  function rand(a,b){ return a + Math.random()*(b-a); }

  function createFlake(x,y, opt){
    // 上限控制
    if (flakes.length >= cfg.max) {
      const oldest = flakes.shift();
      oldest && oldest.remove();
    }
    const el = document.createElement('div');
    el.className = 'wt-snowflake';
    const sz = rand(opt?.sizeMin ?? cfg.sizeMin, opt?.sizeMax ?? cfg.sizeMax);
    const dur = rand(opt?.durMin ?? 1.2, opt?.durMax ?? 2.2);
    const wind = rand(-(opt?.windRange ?? cfg.windRange), (opt?.windRange ?? cfg.windRange));
    const fall = rand(opt?.fallMin ?? cfg.fallMin, opt?.fallMax ?? cfg.fallMax);

    el.style.setProperty('--x', x + 'px');
    el.style.setProperty('--y', y + 'px');
    el.style.setProperty('--tx', (x + wind) + 'px');
    el.style.setProperty('--ty', (y + fall) + 'px');
    el.style.setProperty('--sz', sz + 'px');
    el.style.setProperty('--op', rand(.75,.98).toFixed(2));
    el.style.setProperty('--dur', dur + 's');

    host.appendChild(el);
    flakes.push(el);
    el.addEventListener('animationend', () => {
      const i = flakes.indexOf(el);
      if (i >= 0) flakes.splice(i,1);
      el.remove();
    }, { once: true });
  }

  function trailAt(x,y){
    for (let i=0;i<cfg.trailCount;i++){
      createFlake(x, y, { durMin:1.3, durMax:2.0, windRange:120, fallMin:100, fallMax:200 });
    }
  }

  function burstAt(x,y){
    const n = cfg.burstCount;
    for (let i=0;i<n;i++){
      const ang = Math.random()*Math.PI*2;
      const dist = rand(40, 140);
      createFlake(
        x + Math.cos(ang)*2,
        y + Math.sin(ang)*2,
        { durMin:1.0, durMax:1.6, windRange:dist*1.4, fallMin:dist*0.6, fallMax:dist*1.2, sizeMin:3.5, sizeMax:7.5 }
      );
    }
  }

  function onMove(e){
    const now = performance.now();
    if (now - last < cfg.throttleMs) return;
    last = now;
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    trailAt(clamp(x,0,innerWidth), clamp(y,0,innerHeight));
  }
  function onClick(e){
    const x = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const y = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
    burstAt(clamp(x,0,innerWidth), clamp(y,0,innerHeight));
  }

  const moveEvt = isTouch ? 'touchmove' : 'mousemove';
  const clickEvt = isTouch ? 'touchend' : 'click';
  window.addEventListener(moveEvt, onMove, { passive: true });
  window.addEventListener(clickEvt, onClick, { passive: true });

  // 可选 API
  window.wtSnow = {
    burst: (x,y) => burstAt(x ?? innerWidth/2, y ?? innerHeight/2),
    clear: () => { while (flakes.length) flakes.pop()?.remove(); }
  };
})();
