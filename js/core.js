/* ============================================================
   MEGA POWER AI — core.js  |  state, storage, helpers, boot
   Created by Umesh Chaudhary
   ============================================================ */
'use strict';
window.Mega = window.Mega || {};

/* ---------------- tiny helpers ---------------- */
Mega.$  = (s, r) => (r || document).querySelector(s);
Mega.$$ = (s, r) => Array.from((r || document).querySelectorAll(s));
Mega.uid = (p) => (p || 'id') + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
Mega.esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
Mega.fmtBytes = (n) => { if (!n) return '0 B'; const u = ['B', 'KB', 'MB', 'GB']; let i = 0; while (n >= 1024 && i < 3) { n /= 1024; i++; } return n.toFixed(n < 10 && i > 0 ? 1 : 0) + ' ' + u[i]; };
Mega.fmtTime = (ts) => { const d = new Date(ts); return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); };
Mega.sleep = (ms) => new Promise(r => setTimeout(r, ms));
Mega.debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
Mega.ext = (name) => { const m = /\.([a-z0-9]+)$/i.exec(name); return m ? m[1].toLowerCase() : ''; };
Mega.icon = (n) => {
  const P = {
    chat:'M21 12a8 8 0 0 1-8 8H5l-2 2V12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8z',
    code:'m8 6-6 6 6 6M16 6l6 6-6 6M13 4l-2 16',
    image:'M3 5h18v14H3zM3 15l5-5 4 4 3-3 6 6',
    video:'M15 8v8l6-4zM3 6h12v12H3z',
    mic:'M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zM19 11a7 7 0 0 1-14 0M12 18v4',
    folder:'M3 7h6l2 2h10v10H3z',
    terminal:'M4 5h16v14H4zM7 9l3 3-3 3M13 15h4',
    github:'M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.8c-2.8.6-3.4-1.2-3.4-1.2-.4-1.1-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.6-1.4-2.2-.3-4.6-1.1-4.6-5a4 4 0 0 1 1-2.7c-.1-.3-.5-1.3.1-2.7 0 0 .9-.3 2.8 1a9.5 9.5 0 0 1 5 0c2-1.3 2.8-1 2.8-1 .6 1.4.2 2.4.1 2.7a4 4 0 0 1 1 2.7c0 3.9-2.3 4.7-4.6 5 .4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5A10 10 0 0 0 12 2z',
    settings:'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.6 1.6 0 0 0 .3 1.7l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.7-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.7.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.7 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.7.3h.1a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5h.1a1.6 1.6 0 0 0 1.7-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.7v.1a1.6 1.6 0 0 0 1.5 1h.1a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z',
    info:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 8h.01M11 12h1v5h1',
    send:'m3 3 3 9-3 9 19-9zM6 12h13',
    plus:'M12 5v14M5 12h14',
    download:'M12 3v12m0 0 4-4m-4 4-4-4M4 21h16',
    bolt:'M13 2 3 14h8l-1 8 10-12h-8z',
    stop:'M6 6h12v12H6z',
    check:'m4 12 5 5L20 6',
    x:'M18 6 6 18M6 6l12 12',
    trash:'M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15M10 11v6M14 11v6',
    refresh:'M21 12a9 9 0 1 1-3-6.7M21 3v6h-6',
    play:'M6 4l14 8-14 8z',
    sparkle:'M12 3l1.9 5.8L20 10l-5.8 1.9L12 18l-2.2-6.1L4 10l6.1-1.2zM19 15l.9 2.6L22 18l-2.1.9L19 22l-.9-3.1L16 18l2.1-.9z',
    link:'M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7L12.5 19',
    user:'M20 21a8 8 0 1 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10z',
    phone:'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.8.7a2 2 0 0 1 1.7 2z',
    key:'M21 2l-2 2m-7.6 7.6a5 5 0 1 1-7 7 5 5 0 0 1 7-7zm0 0L15 8m0 0 3 3 3-3-3-3m-3 3 3-3',
    copy:'M9 9h11v11H9zM5 15H4V4h11v1',
    eye:'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    save:'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8',
    file:'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6',
    globe:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z',
    search:'M21 21l-4.3-4.3M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0z',
    menu:'M4 6h16M4 12h16M4 18h16',
    arrowl:'M19 12H5m0 0 6-6m-6 6 6 6'
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="${P[n] || P.info}"/></svg>`;
};
Mega.logoSVG = (cls) => `<svg class="${cls || ''}" viewBox="0 0 96 96"><defs><linearGradient id="lg${cls||''}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6d5dfc"/><stop offset="1" stop-color="#35e0ff"/></linearGradient></defs><rect x="4" y="4" width="88" height="88" rx="24" fill="url(#lg${cls||''})"/><path d="M54 14 26 54h17l-3 28 30-42H52z" fill="#fff"/><path d="M54 14 26 54h17l-3 28 30-42H52z" fill="#fff" opacity=".2" transform="translate(3 3)"/></svg>`;

/* ---------------- settings / local storage ---------------- */
Mega.store = {
  get(k, d) { try { const v = localStorage.getItem('mega:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('mega:' + k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem('mega:' + k); } catch {} }
};

Mega.settings = Object.assign({
  model: 'mega-openai',
  sysPrompt: '',
  turbo: true,
  suggest: true,
  agent: false,
  keys: {},
  searchMode: 'smart',            // smart | always | off
  imageEngine: 'auto',            // auto | free | openai
  imageStyle: 'auto',
  imageSize: '1024x1024',
  imageCount: 2,
  videoDuration: 'standard',      // short | standard | long
  videoResolution: '1280x720',
  videoFps: 30,
  videoMusic: true,
  theme: 'dark',
  accent: 0,
  anim: true,
  fontScale: 1,
  ghToken: ''
}, Mega.store.get('settings', {}));
Mega.saveSettings = () => Mega.store.set('settings', Mega.settings);
Mega.VERSION = '1.2';

Mega.applyTheme = () => {
  document.documentElement.dataset.theme = Mega.settings.theme;
  document.documentElement.dataset.anim = Mega.settings.anim ? 'on' : 'off';
  const A = [['#6d5dfc', '#35e0ff'], ['#ff4ecd', '#6d5dfc'], ['#2fd98a', '#35e0ff'], ['#ff8a3d', '#ff4ecd'], ['#35e0ff', '#2fd98a']][Mega.settings.accent || 0];
  document.documentElement.style.setProperty('--acc1', A[0]);
  document.documentElement.style.setProperty('--acc2', A[1]);
};

/* ---------------- IndexedDB (kv: projects, files, convs, videos) ---------------- */
Mega.idb = (() => {
  let db = null;
  const open = () => new Promise((res, rej) => {
    if (db) return res(db);
    const r = indexedDB.open('megapowerai', 2);
    r.onupgradeneeded = (e) => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains('kv')) d.createObjectStore('kv');
    };
    r.onsuccess = () => { db = r.result; res(db); };
    r.onerror = () => rej(r.error);
  });
  const tx = async (store, mode) => { const d = await open(); return d.transaction(store, mode).objectStore(store); };
  return {
    async get(store, key) { const s = await tx(store, 'readonly'); return new Promise((res, rej) => { const q = s.get(key); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); },
    async set(store, key, val) { const s = await tx(store, 'readwrite'); return new Promise((res, rej) => { const q = s.put(val, key); q.onsuccess = () => res(key); q.onerror = () => rej(q.error); }); },
    async del(store, key) { const s = await tx(store, 'readwrite'); return new Promise((res, rej) => { const q = s.delete(key); q.onsuccess = () => res(); q.onerror = () => rej(q.error); }); },
    async keys(store) { const s = await tx(store, 'readonly'); return new Promise((res, rej) => { const q = s.getAllKeys(); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); },
    async all(store) { const s = await tx(store, 'readonly'); return new Promise((res, rej) => { const q = s.getAll(); q.onsuccess = () => { const ks = q.result; res(ks); }; q.onerror = () => rej(q.error); }) }
  };
})();

/* ---------------- toast ---------------- */
Mega.toast = (title, msg, type = 'info', ms = 3800) => {
  const icons = { info: '✨', ok: '✅', warn: '⚠️', err: '🚫', ai: '🤖' };
  let wrap = Mega.$('#toasts'); if (!wrap) { wrap = document.createElement('div'); wrap.id = 'toasts'; document.body.appendChild(wrap); }
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<div class="ti">${icons[type] || icons.info}</div><div><b>${Mega.esc(title)}</b>${msg ? `<span>${Mega.esc(msg)}</span>` : ''}</div>`;
  wrap.appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 350); }, ms);
};

/* ---------------- modal ---------------- */
Mega.modal = (title, sub, bodyHTML, opts = {}) => {
  return new Promise((resolve) => {
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap';
    wrap.innerHTML = `<div class="modal ${opts.lg ? 'lg' : ''}">
      <h3>${title}</h3>${sub ? `<div class="msub">${sub}</div>` : ''}
      <div class="mbody">${bodyHTML}</div></div>`;
    document.body.appendChild(wrap);
    const close = (val) => { wrap.classList.remove('open'); setTimeout(() => wrap.remove(), 200); resolve(val); };
    setTimeout(() => wrap.classList.add('open'), 10);
    wrap.addEventListener('mousedown', (e) => { if (e.target === wrap) close(null); });
    if (opts.onMount) opts.onMount(wrap, close);
    wrap._close = close;
  });
};

Mega.confirm = (title, msg, danger = true) => new Promise((res) => {
  Mega.modal(Mega.esc(title), Mega.esc(msg),
    `<div class="row" style="justify-content:flex-end;margin-top:18px">
      <button class="btn ghost" data-a="no">Cancel</button>
      <button class="btn ${danger ? 'danger' : 'primary'}" data-a="yes">Confirm</button></div>`,
    { onMount(w, close) { w.onclick = (e) => { if (e.target.dataset.a) close(e.target.dataset.a === 'yes'); }; } });
});

/* ---------------- online status ---------------- */
Mega.setOnline = () => {
  const chip = Mega.$('#netChip'); if (!chip) return;
  chip.classList.toggle('off', !navigator.onLine);
  const label = chip.querySelector('.netl'); if (label) label.textContent = navigator.onLine ? 'Online' : 'Offline';
};
window.addEventListener('online', Mega.setOnline);
window.addEventListener('offline', Mega.setOnline);

/* ---------------- PWA install ---------------- */
Mega._installEvt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); Mega._installEvt = e;
  const b = Mega.$('#installBtn'); if (b) b.classList.add('show');
});
Mega.installApp = async () => {
  if (Mega._installEvt) { Mega._installEvt.prompt(); const r = await Mega._installEvt.userChoice; Mega._installEvt = null; Mega.$('#installBtn')?.classList.remove('show'); if (r.outcome === 'accepted') Mega.toast('App installed!', 'Mega Power AI is now on your device.', 'ok'); }
  else Mega.modal('📲 Install Mega Power AI', 'Install this app on any device — Android, iOS, Windows, Linux or macOS.',
    `<div class="card" style="margin-bottom:10px"><b>🖥️ Windows / Linux / macOS (Chrome or Edge)</b><div style="color:var(--text2);font-size:13px;margin-top:6px">Click the <b>install icon (⊕)</b> in the address bar, or Menu → <b>Install app</b>. A desktop window + Start-menu entry appears.</div></div>
     <div class="card" style="margin-bottom:10px"><b>🤖 Android</b><div style="color:var(--text2);font-size:13px;margin-top:6px">Chrome menu (⋮) → <b>Install app</b> / Add to Home screen — or install the official <b>Mega Power AI APK</b>.</div></div>
     <div class="card"><b>🍎 iOS</b><div style="color:var(--text2);font-size:13px;margin-top:6px">Safari → Share (⬆️) → <b>Add to Home Screen</b>.</div></div>
     <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn primary" onclick="this.closest('.modal-wrap')._close(null)">Got it</button></div>`);
};

/* ---------------- user session ---------------- */
Mega.user = Mega.store.get('user', null);
Mega.setUser = (u) => { Mega.user = u; Mega.store.set('user', u); if (Mega.authRender) Mega.authRender(); };

/* ---------------- boot (single chat app) ---------------- */
/* purge any stale caches from a previous app version — prevents
   a mixed old-JS/new-HTML broken state after an app update */
Mega.purgeStale = async () => {
  if (Mega.store.get('ver') === Mega.VERSION) return;
  Mega.store.set('ver', Mega.VERSION);
  try {
    if (window.caches) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
    const regs = await navigator.serviceWorker?.getRegistrations?.();
    if (regs && regs.length) await Promise.all(regs.map(r => r.unregister()));
  } catch {}
};

Mega.boot = () => {
  Mega.applyTheme();
  Mega.setOnline();
  Mega.purgeStale();
  const app = Mega.$('#app'); if (app) app.classList.add('ready');
  setTimeout(() => Mega.$('#splash')?.classList.add('hide'), 1750);
  const P = new URLSearchParams(location.search);
  if (P.has('noauth')) Mega.store.set('seenAuth', true);
  if (P.get('auth') === 'signup' || P.get('auth') === 'login') {
    setTimeout(() => { if (!Mega.user) Mega.authOpen(P.get('auth')); }, 500);
  } else if (!Mega.user && !P.has('noauth')) {
    setTimeout(() => { if (!Mega.store.get('seenAuth')) Mega.authOpen('login'); }, 2200);
  }
};
document.addEventListener('DOMContentLoaded', Mega.boot);
