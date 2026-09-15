/* Mega Power AI — DOM boot test (node test/dom.mjs)
   Optional deep test: loads index.html + every script in jsdom and drives
   the real UI (boot, model picker, hero, settings search, drawers, build
   flow with dead network → Lite fallback, preview, zip).
   Requires jsdom (npm i jsdom --no-save). Skips politely if missing. */
'use strict';
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let JSDOM;
try { ({ JSDOM } = require('jsdom')); }
catch {
  console.log('⏭  jsdom not installed — skipping DOM tests (npm i jsdom --no-save to enable)');
  process.exit(0);
}

const root = new URL('..', import.meta.url).pathname;
const html = readFileSync(root + 'index.html', 'utf8');
const errors = [];
const kvData = new Map();
const req = (result) => { const r = { result }; return new Proxy(r, { set(t, p, v) { if (p === 'onsuccess') setTimeout(() => v({ target: r }), 0); return true; } }); };
function makeStore() {
  return {
    get: (k) => req(kvData.get(k) ?? null),
    put: (v, k) => { kvData.set(k, v); return req(k); },
    delete: (k) => { kvData.delete(k); return req(undefined); },
    getAllKeys: () => req([...kvData.keys()]),
    getAll: () => req([...kvData.values()])
  };
}
const fakeDb = { transaction: () => ({ objectStore: () => makeStore() }) };
const idbReq = { result: fakeDb, set onsuccess(f) { setTimeout(() => f({ target: { result: fakeDb } }), 0); }, set onerror(f) {}, set onupgradeneeded(f) {} };

const dom = new JSDOM(html, {
  url: 'http://localhost:8420/index.html?noauth=1', runScripts: 'outside-only', pretendToBeVisual: true,
  beforeParse(window) {
    window.indexedDB = { open: () => idbReq };
    window.matchMedia = window.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {} }));
    window.HTMLCanvasElement.prototype.getContext = () => null;
    window.AudioContext = class { constructor() { this.destination = {}; this.currentTime = 0; } createOscillator() { return { connect() {}, start() {}, stop() {}, frequency: { value: 0, setValueAtTime() {} }, type: '' }; } createGain() { return { connect() {}, gain: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {} } }; } close() { return Promise.resolve(); } };
    window.MediaRecorder = class { constructor() { this.state = 'inactive'; this.mimeType = 'video/webm'; } start() { this.state = 'recording'; } stop() { this.state = 'inactive'; if (this.onstop) this.onstop({}); } requestData() {} };
    window.fetch = async () => { throw new TypeError('Failed to fetch'); }; // simulate dead network → Lite fallback must kick in
    window.addEventListener('error', (e) => errors.push('window error: ' + e.message));
  }
});
const { window } = dom; const { document } = window;
let fails = 0;
const t = (name, cond, extra = '') => { console.log((cond ? '✅' : '❌') + ' ' + name + (cond ? '' : '  → ' + extra)); if (!cond) fails++; };

for (const f of ['core', 'md', 'zip', 'ai', 'media', 'code', 'auth', 'chat', 'projects', 'github', 'settings']) {
  try { window.eval(readFileSync(root + 'js/' + f + '.js', 'utf8')); } catch (e) { errors.push(f + '.js THREW: ' + e.message); }
}
t('load: all 11 modules, zero errors', errors.length === 0, errors.join(' | '));
try { window.eval([...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n')); } catch (e) { errors.push('inline boot THREW: ' + e.message); }

window.Mega.boot(); window.Mega.chat.init();
await new Promise(r => setTimeout(r, 300));
t('boot: app ready + theme', document.getElementById('app').classList.contains('ready') && document.documentElement.dataset.theme === 'dark');
t('model picker: 25+ models in menu', document.querySelectorAll('#modelMenu .mm-item').length >= 25, 'count=' + document.querySelectorAll('#modelMenu .mm-item').length);
t('chat: hero + 4+ starter cards', !!document.querySelector('.chat-hero') && document.querySelectorAll('.sug').length >= 4);

window.Mega.drawer.open('settings');
await new Promise(r => setTimeout(r, 200));
const setBody = document.getElementById('settingsBody');
t('settings: 8+ sections + search box', !!setBody && setBody.querySelectorAll('.set-item').length >= 8 && !!document.getElementById('setSearch'));
window.Mega.settingsUI.filter('theme');
t('settings: search filters sections', [...setBody.querySelectorAll('.set-item')].some(i => i.style.display !== 'none') && [...setBody.querySelectorAll('.set-item')].some(i => i.style.display === 'none'));
window.Mega.settingsUI.filter('');
window.Mega.drawer.close();

/* build flow with dead network → Lite engine */
await window.Mega.chat.handleBuild('build a todo app');
await new Promise(r => setTimeout(r, 1500));
const projKeys = [...kvData.keys()].filter(k => String(k).startsWith('proj:'));
const proj = projKeys.length ? kvData.get(projKeys[0]) : null;
t('build: offline → Lite project built + auto-saved', proj && proj.files.some(f => f.path === 'index.html' && f.content.includes('<')), 'keys=' + [...kvData.keys()].slice(0, 5).join(','));
t('build: conversation persisted', [...kvData.keys()].some(k => String(k).startsWith('conv:')));
t('build: suggestion chips rendered', document.querySelector('#chatMsgs .sug-chip') !== null);

/* preview drawer */
window.Mega.chat.openPreview(proj);
document.getElementById('pvRun').click();
await new Promise(r => setTimeout(r, 100));
const pv = document.getElementById('pvFrame');
t('preview: file tree + Run iframe', document.querySelectorAll('.ft-item').length === proj.files.length && !!(pv.srcdoc || '').includes('<'));
window.Mega.drawer.close();

const blob = window.Mega.zip.create(proj.files.map(f => ({ path: f.path, data: f.content })));
t('zip: real archive bytes', blob && blob.size > 500, 'size=' + (blob && blob.size));

const routes = [['/image a cat', 'image'], ['make a video of the ocean', 'video'], ['search ai news', 'search'], ['hello there', 'chat'], ['build a quiz app', 'build']];
t('routing: all 5 intents correct', routes.every(([q, want]) => window.Mega.ai.intent(q).type === want), routes.map(([q, w]) => q + '→' + window.Mega.ai.intent(q).type).join(' '));

console.log(fails ? '\n❌ ' + fails + ' DOM test(s) FAILED' : '\n🎉 ALL DOM TESTS PASSED');
if (errors.length) console.log('ERRORS: ' + errors.join('\n'));
process.exit(fails ? 1 : 0);
