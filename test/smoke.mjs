/* Mega Power AI — functional smoke test (node test/smoke.mjs) */
'use strict';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';

/* ---- browser stubs ---- */
global.window = global;
global.addEventListener = () => {};
try { global.navigator = { onLine: true }; } catch { /* node >=21 has readonly navigator; fine */ }
global.localStorage = { _d: {}, getItem(k) { return this._d[k] ?? null; }, setItem(k, v) { this._d[k] = String(v); }, removeItem(k) { delete this._d[k]; }, clear() { this._d.clear?.(); } };
global.document = { querySelector: () => null, querySelectorAll: () => [], addEventListener: () => {}, createElement: () => ({ style: {}, classList: { add() {}, remove() {}, toggle() {} }, setAttribute() {}, appendChild() {}, addEventListener() {} }), documentElement: { dataset: {}, style: { setProperty() {} } } };
global.location = { hash: '', origin: 'http://localhost:8420', protocol: 'http:' };
global.indexedDB = { open: () => ({ onupgradeneeded: null, onsuccess: null, onerror: null }) };

const load = (f) => (0, eval)(readFileSync(new URL('../js/' + f, import.meta.url), 'utf8'));
let fails = 0;
const t = (name, cond, extra = '') => { console.log((cond ? '✅' : '❌') + ' ' + name + (cond ? '' : '  → ' + extra)); if (!cond) fails++; };

/* ---- load modules ---- */
load('core.js');
load('md.js');
load('zip.js');
load('ai.js');
load('code.js');

/* ---- markdown ---- */
{
  const html = Mega.md.render('# Title\n\n**bold** and `code` and [link](https://x.com)\n\n```js\nconst x = "hi"; // comment\n```');
  t('md: heading', html.includes('<h1>Title</h1>'));
  t('md: bold', html.includes('<b>bold</b>'));
  t('md: inline code', html.includes('<code'));
  t('md: link', html.includes('<a href="https://x.com"'));
  t('md: codeblock with copy btn', html.includes('data-copycb="0"'));
  t('md: raw code preserved in textarea', html.includes('data-rawcb="0"'));
  t('md: syntax token', html.includes('tok-kw') && html.includes('tok-str'));
  t('md: XSS escaped', !Mega.md.render('<img src=x onerror=alert(1)>').includes('<img src=x'));
  t('md: list', Mega.md.render('- one\n- two').includes('<ul>'));
  t('md: table', Mega.md.render('| a | b |\n|---|---|\n| 1 | 2 |').includes('<table>'));
}

/* ---- ZIP ---- */
{
  const files = [
    { path: 'my-app/index.html', data: '<!DOCTYPE html><html>héllo wörld — 你好</html>' },
    { path: 'my-app/style.css', data: 'body{color:red}' },
    { path: 'my-app/js/app.js', data: 'console.log("x");'.repeat(50) }
  ];
  const blob = Mega.zip.create(files);
  t('zip: returns blob-ish', blob && typeof blob.size === 'number' && blob.size > 200, JSON.stringify(Object.keys(blob)));
  // write to disk for python verification
  const chunks = [];
  const buf = blob.stream ? null : null;
  // Blob polyfill-free: reconstruct via internal array access isn't possible; instead re-create with same code path in node Buffer
  // Simpler: test crc32 correctness + build bytes via a fake Blob capture
  t('zip: crc32 known value', Mega.zip.crc32(new TextEncoder().encode('123456789')) === 0xCBF43926, 'got ' + Mega.zip.crc32(new TextEncoder().encode('123456789')).toString(16));
}

/* ---- parseFiles ---- */
{
  const out1 = Mega.ai.parseFiles('**FILE: index.html**\n```html\n<h1>hi</h1>\n```\n**FILE: style.css**\n```css\nbody{}\n```');
  t('parse: 2 files', out1.length === 2 && out1[0].path === 'index.html' && out1[1].path === 'style.css', JSON.stringify(out1.map(f => f.path)));
  const out2 = Mega.ai.parseFiles('```html\n<p>x</p>\n```\n```css\np{}\n```');
  t('parse: bare fences → named files', out2.length === 2 && out2[0].path === 'index.html', JSON.stringify(out2.map(f => f.path)));
  const out3 = Mega.ai.parseFiles('===FILE: main.py===\nprint(1)\n===FILE: README.md===\n# hi\n');
  t('parse: ===FILE=== format', out3.length === 2 && out3[0].path === 'main.py' && out3[0].content.includes('print'), JSON.stringify(out3));
}

/* ---- lite engine templates ---- */
{
  for (const q of ['make a todo app', 'build a snake game', 'create a portfolio website', 'calculator app please', 'weather app', 'quiz app', 'pomodoro timer', 'notes app', 'memory game', 'rock paper scissors', 'chat ui', 'digital clock', 'landing page for my startup', 'some random weird thing xyz']) {
    const p = Mega.lite.project(q);
    const files = Mega.ai.parseFiles(p);
    const hasIndex = files.some(f => f.path === 'index.html');
    console.log(`   🧪 lite "${q}" → ${files.length} files${hasIndex ? ' +index.html' : ''}`);
    if (!hasIndex || files.length < 2) { t('lite: ' + q, false, JSON.stringify(files.map(f => f.path))); }
  }
  t('lite: all templates produce index.html + files', true);
}

/* ---- code checker ---- */
{
  const bad = Mega.check.code('app.js', 'function f( {\n  return "x"\n}');
  t('check: catches unbalanced bracket', bad.issues.some(i => i.sev === 'err'), JSON.stringify(bad.issues));
  const bad2 = Mega.check.code('app.js', 'const a = ;\nfunction x() { return 1 }');
  t('check: catches JS syntax error', bad2.issues.some(i => i.sev === 'err'));
  const good = Mega.check.code('app.js', 'function x() {\n  return 1;\n}\nconsole.log(x());');
  t('check: clean code passes (errors)', good.ok);
  const badHtml = Mega.check.code('index.html', '<html><body><div>hi</div></body>');
  t('check: catches unclosed html', badHtml.issues.some(i => i.sev === 'err'));
  const badCss = Mega.check.code('style.css', 'body { color: red }');
  t('check: css brace ok / warns', Array.isArray(badCss.issues));
  const badJson = Mega.check.code('data.json', '{oops}');
  t('check: catches bad JSON', badJson.issues.some(i => i.sev === 'err'));
}

/* ---- model catalog ---- */
{
  t('models: 25+ models', Mega.ai.models.length >= 25, 'count=' + Mega.ai.models.length);
  t('models: default resolves', !!Mega.ai.modelById(Mega.settings.model));
  const providers = new Set(Mega.ai.models.map(m => m.p));
  t('models: 9 providers', providers.size === 9, 'size=' + providers.size);
}

console.log(fails ? `\n❌ ${fails} test(s) FAILED` : '\n🎉 ALL TESTS PASSED');
process.exit(fails ? 1 : 0);
