// 轻量安全与交互工具集合

// 简易加法验证码
export function makeCaptcha() {
  const a = Math.floor(Math.random() * 9) + 1;   // 1-10
  const b = Math.floor(Math.random() * 9) + 1;
  return { a, b, sum: a + b, question: `${a} + ${b} = ?` };
}
export function verifyCaptcha(captcha, input) {
  const ans = Number(String(input || '').trim());
  return Number.isFinite(ans) && Number(captcha?.sum) === ans;
}

// 提交限流：同 key 的操作间隔 windowMs 毫秒
export function throttleSubmit(key, windowMs = 5000) {
  try {
    const now = Date.now();
    const k = `throttle:${key}`;
    const last = Number(localStorage.getItem(k) || 0);
    if (now - last < windowMs) {
      return { ok: false, wait: windowMs - (now - last) };
    }
    localStorage.setItem(k, String(now));
    return { ok: true, wait: 0 };
  } catch {
    // localStorage 不可用时直接放行
    return { ok: true, wait: 0 };
  }
}

// XSS 清洗（优先 DOMPurify，降级到简易白名单）
export function sanitizeHtml(html) {
  try {
    if (typeof window !== 'undefined' && window.DOMPurify && typeof window.DOMPurify.sanitize === 'function') {
      return window.DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
    }
  } catch {}
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(String(html || ''), 'text/html');

    // 移除危险标签
    const banned = ['script', 'style', 'iframe', 'object', 'embed', 'link', 'meta', 'base'];
    banned.forEach(tag => doc.querySelectorAll(tag).forEach(n => n.remove()));

    // 过滤危险属性
    const isSafeUrl = (v) => {
      if (!v) return true;
      const s = String(v).trim().toLowerCase();
      return s.startsWith('http:') || s.startsWith('https:') || s.startsWith('mailto:') || s.startsWith('tel:') || s.startsWith('/') || s.startsWith('#');
    };
    [...doc.body.querySelectorAll('*')].forEach(el => {
      // 移除 on* 事件与 javascript:
      [...el.attributes].forEach(attr => {
        const name = attr.name.toLowerCase();
        const val = attr.value;
        if (name.startsWith('on')) el.removeAttribute(attr.name);
        if ((name === 'href' || name === 'src') && !isSafeUrl(val)) el.removeAttribute(attr.name);
        if (name === 'srcset') el.removeAttribute(attr.name);
      });
    });
    return doc.body.innerHTML;
  } catch {
    return String(html || '');
  }
}

// 为正文图片启用懒加载与异步解码
export function applyLazyToImages(root) {
  try {
    const container = root && root.querySelectorAll ? root : document;
    const imgs = container.querySelectorAll('img');
    imgs.forEach(img => {
      if (!img.getAttribute('loading')) img.setAttribute('loading', 'lazy');
      if (!img.getAttribute('decoding')) img.setAttribute('decoding', 'async');
      img.referrerPolicy = img.referrerPolicy || 'no-referrer';
      // 避免超宽图片撑破
      img.style.maxWidth = img.style.maxWidth || '100%';
      img.style.height = img.style.height || 'auto';
    });
  } catch {}
}

// 昵称读写与变更事件
const NICK_EVENT = 'wt-nickname-changed';
export function getUserInfo() {
  try { return JSON.parse(localStorage.getItem('user_info') || 'null'); } catch { return null; }
}
export function setUserInfo(u) {
  try { localStorage.setItem('user_info', JSON.stringify(u)); } catch {}
}
export function getNickname() {
  const u = getUserInfo();
  return (u && (u.nickname || u.nick || u.displayName)) || (u && u.username) || '';
}
export function setNickname(nick) {
  const u = getUserInfo() || {};
  u.nickname = String(nick || '').trim();
  setUserInfo(u);
  try {
    window.dispatchEvent(new CustomEvent(NICK_EVENT, { detail: { nickname: u.nickname, user: u } }));
  } catch {}
}
export function onNicknameChanged(handler) {
  try {
    const fn = (e) => handler && handler(e?.detail);
    window.addEventListener(NICK_EVENT, fn);
    return () => window.removeEventListener(NICK_EVENT, fn);
  } catch { return () => {}; }
}