/* Mega Power AI — DOM boot test (node test/dom.mjs)
   Loads index.html + every script in jsdom and drives the real UI:
   boot, model picker, hero, settings search + agent, drawers,
   signup/login flows (wrong & right passwords), Google multi-step
   flow (NO instant login), agent mode with dead network, build
   flow → Lite fallback, preview, zip. Requires jsdom. */
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
    window.fetch = async () => { throw new TypeError('Failed to fetch'); }; // dead network → Lite fallback must kick in
    window.addEventListener('error', (e) => errors.push('window error: ' + e.message));
  }
});
const { window } = dom; const { document } = window;
let fails = 0;
const t = (name, cond, extra = '') => { console.log((cond ? '✅' : '❌') + ' ' + name + (cond ? '' : '  → ' + extra)); if (!cond) fails++; };
const click = (el) => el.dispatchEvent(new window.Event('click', { bubbles: true }));

for (const f of ['core', 'md', 'zip', 'ai', 'media', 'code', 'auth', 'agent', 'chat', 'projects', 'github', 'settings']) {
  try { window.eval(readFileSync(root + 'js/' + f + '.js', 'utf8')); } catch (e) { errors.push(f + '.js THREW: ' + e.message); }
}
t('load: all 12 modules, zero errors', errors.length === 0, errors.join(' | '));
try { window.eval([...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n')); } catch (e) { errors.push('inline boot THREW: ' + e.message); }

window.Mega.boot(); window.Mega.chat.init();
await new Promise(r => setTimeout(r, 300));
t('boot: app ready + theme', document.getElementById('app').classList.contains('ready') && document.documentElement.dataset.theme === 'dark');
t('model picker: 25+ models in menu', document.querySelectorAll('#modelMenu .mm-item').length >= 25, 'count=' + document.querySelectorAll('#modelMenu .mm-item').length);
t('chat: hero + 4+ starter cards', !!document.querySelector('.chat-hero') && document.querySelectorAll('.sug').length >= 4);
t('tools menu: 5 items built', document.querySelectorAll('#toolsMenu .tm-item').length === 5);
t('agent: chip starts Off', document.getElementById('agentToggle').textContent.includes('Off'));

/* ---------- settings ---------- */
window.Mega.drawer.open('settings');
await new Promise(r => setTimeout(r, 200));
const setBody = document.getElementById('settingsBody');
t('settings: renders + search box + agent section', !!setBody && setBody.querySelectorAll('.set-item').length >= 9 && !!document.getElementById('setSearch'), setBody ? 'sections=' + setBody.querySelectorAll('.set-item').length : 'none');
window.Mega.settingsUI.filter('agent');
const visAgent = [...setBody.querySelectorAll('.set-item')].filter(i => i.style.display !== 'none');
t('settings: search "agent" finds agent section', visAgent.length >= 1 && visAgent.length < setBody.querySelectorAll('.set-item').length);
window.Mega.settingsUI.filter('');
const agentSw = document.getElementById('setAgent');
agentSw.checked = true;
agentSw.dispatchEvent(new window.Event('change', { bubbles: true }));
t('settings: agent toggle persists + chip syncs', window.Mega.settings.agent === true && document.getElementById('agentToggle').textContent.includes('On'));
agentSw.checked = false; agentSw.dispatchEvent(new window.Event('change', { bubbles: true }));
t('settings: agent toggle off again', window.Mega.settings.agent === false && document.getElementById('agentToggle').textContent.includes('Off'));
window.Mega.drawer.close();

/* ---------- auth: login & signup are DIFFERENT pages ---------- */
window.Mega.authOpen('login');
await new Promise(r => setTimeout(r, 100));
const auth = document.getElementById('authScreen');
t('auth: login page renders', auth.classList.contains('open') && !!document.getElementById('auLogin') && !!document.getElementById('auGoogle'));
t('auth: login has NO name field', !document.getElementById('auName'));
document.getElementById('asGoLogin') === null;
document.getElementById('auGoSignup').click();
await new Promise(r => setTimeout(r, 50));
t('auth: signup page is different (name + confirm fields)', !!document.getElementById('asName') && !!document.getElementById('asPass2') && !!document.getElementById('asCreate'));

/* signup flow: real account */
document.getElementById('asName').value = 'Test User';
document.getElementById('asEmail').value = 'test@mega.ai';
document.getElementById('asPass').value = 'secret123';
document.getElementById('asPass2').value = 'secret123';
document.getElementById('asCreate').click();
await new Promise(r => setTimeout(r, 300));
t('auth: signup → logged in + session persisted', window.Mega.user && window.Mega.user.email === 'test@mega.ai' && !auth.classList.contains('open'), JSON.stringify(window.Mega.user));

/* logout → login: wrong password rejected, right password works */
window.Mega.setUser(null);
window.Mega.authOpen('login');
await new Promise(r => setTimeout(r, 100));
document.getElementById('auEmail').value = 'test@mega.ai';
document.getElementById('auPass').value = 'WRONG';
document.getElementById('auLogin').click();
await new Promise(r => setTimeout(r, 300));
t('auth: wrong password rejected (stays on login + error)', !window.Mega.user && auth.classList.contains('open') && document.getElementById('auErr').classList.contains('show'));
document.getElementById('auPass').value = 'secret123';
document.getElementById('auLogin').click();
await new Promise(r => setTimeout(r, 300));
t('auth: correct password logs in', window.Mega.user && window.Mega.user.email === 'test@mega.ai');

/* google flow: FULL process — no instant login */
window.Mega.setUser(null);
window.Mega.authOpen('login');
await new Promise(r => setTimeout(r, 100));
document.getElementById('auGoogle').click();
await new Promise(r => setTimeout(r, 100));
t('google: account chooser (NOT instant login)', !window.Mega.user && !!document.querySelector('.gflow') && document.body.textContent.includes('Choose an account'));
document.getElementById('gOther').click();
await new Promise(r => setTimeout(r, 50));
t('google: email step shown', !!document.getElementById('gEmail'));
document.getElementById('gEmail').value = 'umesh@gmail.com';
document.getElementById('gNext').click();
await new Promise(r => setTimeout(r, 50));
t('google: new email → create step (name+password)', !!document.getElementById('gcName') && !!document.getElementById('gcPass'));
document.getElementById('gcName').value = 'Umesh Chaudhary';
document.getElementById('gcPass').value = 'googlepass1';
document.getElementById('gcPass2').value = 'googlepass1';
document.getElementById('gGo').click();
await new Promise(r => setTimeout(r, 300));
t('google: full flow → logged in as google account', window.Mega.user && window.Mega.user.email === 'umesh@gmail.com' && window.Mega.user.via === 'google');

/* google re-login: chooser lists the account, wrong pass rejected */
window.Mega.setUser(null);
window.Mega.authOpen('login');
document.getElementById('auGoogle').click();
await new Promise(r => setTimeout(r, 100));
const accBtn = document.querySelector('.gacc[data-e="umesh@gmail.com"]');
t('google: chooser lists saved google account', !!accBtn);
accBtn.click();
await new Promise(r => setTimeout(r, 50));
t('google: existing account → password step', !!document.getElementById('gPass'));
document.getElementById('gPass').value = 'bad';
document.getElementById('gGo').click();
await new Promise(r => setTimeout(r, 300));
t('google: wrong password rejected', !window.Mega.user && !!document.getElementById('gErr').classList.contains('show'));
document.getElementById('gPass').value = 'googlepass1';
document.getElementById('gGo').click();
await new Promise(r => setTimeout(r, 300));
t('google: correct password logs in', window.Mega.user && window.Mega.user.email === 'umesh@gmail.com');

/* ---------- agent mode with dead network ---------- */
window.Mega.settings.agent = true; window.Mega.agent.syncUI();
await window.Mega.chat.send('What is 2+2?');
await new Promise(r => setTimeout(r, 1500));
const convKey = [...kvData.keys()].find(k => String(k).startsWith('conv:'));
const conv = kvData.get(convKey);
const agentMsg = conv.msgs.find(m => m.kind === 'agent' && m.meta && m.meta.agent);
t('agent: ran + persisted agent message with steps', !!agentMsg && Array.isArray(agentMsg.meta.steps), JSON.stringify(conv.msgs.map(m => m.kind)));
t('agent: answer present (Lite fallback, dead network)', typeof agentMsg?.content === 'string' && agentMsg.content.length > 0, 'len=' + (agentMsg ? agentMsg.content.length : 0));
window.Mega.settings.agent = false; window.Mega.agent.syncUI();

/* ---------- build flow with dead network → Lite engine ---------- */
await window.Mega.chat.handleBuild('build a todo app');
await new Promise(r => setTimeout(r, 1500));
const projKeys = [...kvData.keys()].filter(k => String(k).startsWith('proj:'));
const proj = projKeys.length ? kvData.get(projKeys[0]) : null;
t('build: offline → Lite project built + auto-saved', proj && proj.files.some(f => f.path === 'index.html' && f.content.includes('<')), 'keys=' + [...kvData.keys()].slice(0, 5).join(','));
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
t('routing: all 5 intents correct', routes.every(([q, want]) => window.Mega.ai.intent(q).type === want), routes.map(([q]) => q + '→' + window.Mega.ai.intent(q).type).join(' '));

console.log(fails ? '\n❌ ' + fails + ' DOM test(s) FAILED' : '\n🎉 ALL DOM TESTS PASSED');
if (errors.length) console.log('ERRORS: ' + errors.join('\n'));
process.exit(fails ? 1 : 0);
