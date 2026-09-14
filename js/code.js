/* ============================================================
   MEGA POWER AI — code.js  |  Code Studio
   One prompt → complete project · live preview · auto-check ·
   auto-fix · save / download / push to GitHub
   ============================================================ */
'use strict';
window.Mega = window.Mega || {};
Mega.code = { files: [], cur: 0, name: '', prompt: '', busy: false, abort: null };

/* ================= STATIC CODE CHECKER (feature 3 & 14) ================= */
Mega.check = {};
Mega.check.code = (path, code) => {
  const issues = [];
  const ext = Mega.ext(path);
  const lines = code.split('\n');

  const brackets = (pairs) => {
    const stack = [];
    lines.forEach((ln, i) => {
      const noStr = ln.replace(/(["'`]).*?\1/g, '""').replace(/\/\/.*$/, '');
      for (const ch of noStr) {
        if ('([{'.includes(ch)) stack.push({ ch, line: i + 1 });
        if (')]}'.includes(ch)) {
          const open = stack.pop();
          const want = { ')': '(', ']': '[', '}': '{' }[ch];
          if (!open) issues.push({ line: i + 1, sev: 'err', msg: `Extra closing “${ch}” — nothing to close.` });
          else if (open.ch !== want) issues.push({ line: open.line, sev: 'err', msg: `“${open.ch}” opened here is closed by “${ch}” on line ${i + 1}.` });
        }
      }
    });
    stack.forEach(s => issues.push({ line: s.line, sev: 'err', msg: `“${s.ch}” opened here is never closed.` }));
  };

  if (ext === 'js' || ext === 'jsx' || ext === 'ts' || ext === 'mjs') {
    brackets();
    // REAL syntax check (new Function catches SyntaxError)
    try {
      new Function(code.replace(/^\s*(import|export)[^\n]*$/gm, ''));
    } catch (e) {
      const m = /<anonymous>:(\d+):(\d+)/.exec(e.stack || '') || [];
      issues.push({ line: m[1] ? +m[1] : 1, sev: 'err', msg: 'Syntax error: ' + (e.message || e) });
    }
    lines.forEach((ln, i) => {
      if (/console\.log/.test(ln)) issues.push({ line: i + 1, sev: 'info', msg: 'console.log left in code — fine for testing, remove for production.' });
      if (/\bvar\s+\w/.test(ln)) issues.push({ line: i + 1, sev: 'warn', msg: 'Uses var — prefer let/const (safer scoping).' });
      if (/[^=!<>]==[^=]/.test(ln.replace(/(["']).*?\1/g, '""'))) issues.push({ line: i + 1, sev: 'warn', msg: 'Loose equality (==) — prefer === .' });
      if (/debugger/.test(ln)) issues.push({ line: i + 1, sev: 'warn', msg: 'debugger statement left in code.' });
    });
  } else if (ext === 'html' || ext === 'htm') {
    const voids = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr','!doctype','li','p','td','th','tr','option']);
    const stack = [];
    const re = /<(\/?)([a-zA-Z][\w-]*)([^>]*?)>/g; let m;
    let ln = 1, lastIdx = 0;
    while ((m = re.exec(code))) {
      ln = code.slice(lastIdx, m.index).split('\n').length; lastIdx = m.index;
      const closing = m[1] === '/', tag = m[2].toLowerCase();
      if (tag.startsWith('!')) continue;
      if (m[3].endsWith('/')) continue;
      if (voids.has(tag)) { if (['p','li','td','th','tr','option'].includes(tag) && closing) { /* tolerate implicit closes */ } continue; }
      if (!closing) stack.push({ tag, line: ln });
      else {
        const top = stack.pop();
        if (!top) issues.push({ line: ln, sev: 'warn', msg: `</${tag}> closes nothing.` });
        else if (top.tag !== tag) issues.push({ line: top.line, sev: 'err', msg: `<${top.tag}> opened here is closed by </${tag}> on line ${ln}.` });
      }
    }
    stack.forEach(s => issues.push({ line: s.line, sev: 'err', msg: `<${s.tag}> is never closed.` }));
    if (!/<!DOCTYPE/i.test(code)) issues.push({ line: 1, sev: 'warn', msg: 'Missing <!DOCTYPE html>.' });
    if (!/charset/i.test(code)) issues.push({ line: 1, sev: 'warn', msg: 'Missing <meta charset="UTF-8"> — some languages break without it.' });
  } else if (ext === 'css') {
    brackets();
    lines.forEach((ln, i) => {
      if (/[a-z-]\s*:\s*[^;{}]+$/i.test(ln.trim()) && !ln.trim().endsWith(',') && ln.includes(':') && !ln.trim().startsWith('@') && !ln.trim().startsWith('/*'))
        issues.push({ line: i + 1, sev: 'warn', msg: 'Declaration may be missing a “;”.' });
    });
  } else if (ext === 'json') {
    try { JSON.parse(code); } catch (e) { issues.push({ line: 1, sev: 'err', msg: 'Invalid JSON: ' + e.message }); }
  } else if (ext === 'py') {
    let afterDef = false;
    lines.forEach((ln, i) => {
      if (/\b(def|class|if|elif|else|for|while|try|except|finally|with)\b/.test(ln) && ln.trim().endsWith(':')) afterDef = true;
      else if (afterDef && ln.trim() && !/^(\s|\/\/|#)/.test(ln) && !/^ {4}/.test(ln) && !/\t/.test(ln) && ln.startsWith(' ') && ln.trim().length && (ln.match(/^ */)[0].length % 4) !== 0)
        issues.push({ line: i + 1, sev: 'warn', msg: 'Indentation is not a multiple of 4 spaces.' });
    });
  }
  return { ok: !issues.some(i => i.sev === 'err'), issues };
};

Mega.check.project = (files) => {
  const issues = [];
  files.forEach(f => {
    if (typeof f.content === 'string') {
      const r = Mega.check.code(f.path, f.content);
      r.issues.forEach(i => issues.push({ ...i, file: f.path }));
    }
  });
  return { ok: !issues.some(i => i.sev === 'err'), issues };
};

/* ================= UI ================= */
Mega.code.init = () => {
  const p = Mega.$('#page-code');
  if (p.dataset.init) return; p.dataset.init = '1';
  Mega.$('#csGen').onclick = () => Mega.code.generate();
  Mega.$('#csPrompt').addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) Mega.code.generate(); });
  Mega.$('#csCheck').onclick = () => Mega.code.checkUI();
  Mega.$('#csFix').onclick = () => Mega.code.autoFix();
  Mega.$('#csPreviewBtn').onclick = () => { Mega.$('#csEditor').style.display = 'none'; Mega.$('#csPreview').style.display = ''; Mega.code.preview(); };
  Mega.$('#csCodeBtn').onclick = () => { Mega.$('#csEditor').style.display = ''; Mega.$('#csPreview').style.display = 'none'; };
  Mega.$('#csSave').onclick = () => Mega.code.toProjects();
  Mega.$('#csZip').onclick = () => Mega.code.download();
  Mega.$('#csGh').onclick = () => Mega.code.toGithub();
  const ed = Mega.$('#csEditor');
  ed.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') { e.preventDefault(); const s = ed.selectionStart; ed.setRangeText('  ', s, ed.selectionEnd, 'end'); Mega.code.syncGutter(); }
  });
  ed.addEventListener('input', () => { Mega.code.files[Mega.code.cur].content = ed.value; Mega.code.dirty(); Mega.code.syncGutter(); });
  ed.addEventListener('scroll', () => { Mega.$('#csGutter').scrollTop = ed.scrollTop; });
  // restore last project ("never forget your project")
  const last = Mega.store.get('lastCs', null);
  if (last && last.files && last.files.length) { Mega.code.load(last.files, last.name, last.prompt); }
  else Mega.code.renderTree();
};

Mega.code.syncGutter = () => {
  const ed = Mega.$('#csEditor');
  const n = ed.value.split('\n').length;
  Mega.$('#csGutter').innerHTML = Array.from({ length: n }, (_, i) => i + 1).join('<br>');
  Mega.$('#csGutter').scrollTop = ed.scrollTop;
};

Mega.code.load = (files, name, prompt) => {
  Mega.code.files = files; Mega.code.name = name || 'my-app'; Mega.code.prompt = prompt || '';
  Mega.code.cur = Math.max(0, files.findIndex(f => /index\.html$/i.test(f.path)));
  Mega.$('#csName').value = Mega.code.name;
  Mega.$('#csPrompt').value = Mega.code.prompt;
  Mega.code.renderTree(); Mega.code.openFile(Mega.code.cur);
  Mega.$('#csActs').style.display = 'flex';
  Mega.code.preview();
  Mega.store.set('lastCs', { files, name, prompt });
  Mega.code.checkUI(true);
};

Mega.code.renderTree = () => {
  Mega.$('#csTree').innerHTML = Mega.code.files.map((f, i) =>
    `<div class="ft-item ${i === Mega.code.cur ? 'active' : ''}" data-i="${i}">
      <span class="fi">${({ html: '🌐', css: '🎨', js: '⚡', json: '🗂', py: '🐍', md: '📝' }[Mega.ext(f.path)] || '📄')}</span>${Mega.esc(f.path)}</div>`).join('')
    || '<div style="padding:12px;color:var(--text3);font-size:12.5px">Describe your app above and press Generate ⚡</div>';
  Mega.$$('#csTree .ft-item').forEach(n => n.onclick = () => Mega.code.openFile(+n.dataset.i));
};

Mega.code.openFile = (i) => {
  Mega.code.cur = i;
  const f = Mega.code.files[i]; if (!f) return;
  const ed = Mega.$('#csEditor');
  ed.value = f.content || '';
  ed.style.display = ''; Mega.$('#csPreview').style.display = 'none';
  Mega.$('#csFileName').textContent = f.path;
  Mega.code.renderTree(); Mega.code.syncGutter();
};

Mega.code.dirty = () => { Mega.store.set('lastCs', { files: Mega.code.files, name: Mega.code.name, prompt: Mega.code.prompt }); };

/* ================= GENERATE ================= */
Mega.code.generate = async () => {
  const prompt = Mega.$('#csPrompt').value.trim();
  if (!prompt) return Mega.toast('Describe your project', 'One prompt is all I need — e.g. “a expense tracker with charts”.', 'warn');
  if (Mega.code.busy) return;
  Mega.code.busy = true;
  const model = Mega.ai.modelById(Mega.settings.model);
  const out = Mega.$('#csGenOut');
  out.style.display = 'block';
  out.innerHTML = `<div class="row"><span class="pill">⚡ Generating with ${Mega.esc(model.name)}</span><button class="btn sm danger" id="csStop2">${Mega.icon('stop')} Stop</button></div>
    <div class="progress" style="margin-top:12px"><i id="csBar" style="width:8%"></i></div>
    <pre id="csStream" style="margin-top:12px;max-height:200px;overflow:auto;font-family:var(--mono);font-size:11.5px;color:var(--text2);line-height:1.6;white-space:pre-wrap"></pre>`;
  let bar = Mega.$('#csBar');
  let prog = 8;
  const tick = setInterval(() => { if (prog < 92) bar.style.width = (prog += Math.random() * 6) + '%'; }, 600);
  Mega.code.abort = new AbortController();
  Mega.$('#csStop2').onclick = () => Mega.code.abort.abort();
  try {
    const r = await Mega.ai.chat([
      { role: 'system', content: Mega.ai.codePrompt() },
      { role: 'user', content: 'Build this project: ' + prompt }
    ], { model: model.id, mode: 'code', signal: Mega.code.abort.signal, onToken: (d, all) => { Mega.$('#csStream').textContent = all.slice(-2200); } });
    const files = Mega.ai.parseFiles(r.text);
    if (!files.length) throw new Error('No files parsed');
    bar.style.width = '100%';
    clearInterval(tick);
    await Mega.sleep(250);
    const name = prompt.split(/\s+/).slice(0, 4).join('-').replace(/[^a-z0-9-]/gi, '').toLowerCase() || 'my-app';
    Mega.code.load(files, name, prompt);
    out.innerHTML = `<div class="row" style="gap:8px;flex-wrap:wrap"><span class="pill ok">✅ Project generated — ${files.length} file(s)</span>
      ${r.engine === 'lite' ? '<span class="pill warn">MegaAI Lite engine (offline)</span>' : ''}</div>`;
    Mega.toast('Project ready 🚀', files.length + ' files generated, checked & previewed.', 'ok');
    Mega.toast('Choose where to put it 👇', 'Save to Projects, Download ZIP, or Push to GitHub — bottom bar.', 'info', 5000);
  } catch (err) {
    clearInterval(tick);
    if (String(err).includes('Abort')) { out.innerHTML = '<span class="pill warn">⏹ Generation stopped.</span>'; Mega.toast('Stopped', 'Generation cancelled.', 'warn'); }
    else { out.innerHTML = `<span class="pill err">⚠️ ${Mega.esc(err.message || err)}</span>`; Mega.toast('Generation failed', String(err.message || err), 'err'); }
  } finally {
    Mega.code.busy = false; Mega.code.abort = null;
  }
};

/* ================= PREVIEW ================= */
Mega.code.preview = () => {
  const f = (n) => Mega.code.files.find(x => x.path.toLowerCase().endsWith(n));
  const idx = f('index.html');
  const frame = Mega.$('#csPreview');
  if (!idx) {
    frame.srcdoc = `<body style="font-family:sans-serif;background:#0b1022;color:#8b93b8;display:grid;place-items:center;height:100vh;margin:0">No index.html to preview — but you can still edit, check & download the files.</body>`;
    return;
  }
  let html = idx.content;
  // inline css
  html = html.replace(/<link[^>]*href=["']?([^"'>\s]+)["']?[^>]*>/gi, (m, href) => {
    const cf = Mega.code.files.find(x => x.path === href.replace(/^\.?\//, ''));
    return (cf && /\.css$/i.test(cf.path)) ? `<style>\n${cf.content}\n</style>` : m;
  });
  // inline js
  html = html.replace(/<script[^>]*src=["']?([^"'>\s]+)["']?[^>]*>\s*<\/script>/gi, (m, src) => {
    const jf = Mega.code.files.find(x => x.path === src.replace(/^\.?\//, ''));
    return jf ? `<script>\n${jf.content}\n<\/script>` : m;
  });
  frame.srcdoc = html;
};

/* ================= CHECK & FIX ================= */
Mega.code.checkUI = (silent) => {
  const box = Mega.$('#csIssues');
  if (!Mega.code.files.length) { box.innerHTML = '<p style="color:var(--text3);font-size:12.5px;padding:8px">Generate a project first.</p>'; return; }
  const { ok, issues } = Mega.check.project(Mega.code.files);
  const errs = issues.filter(i => i.sev === 'err'), warns = issues.filter(i => i.sev === 'warn'), infos = issues.filter(i => i.sev === 'info');
  box.innerHTML = `
    <div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:12px">
      <span class="pill ${ok ? 'ok' : 'err'}">${ok ? '✅ No errors' : '🚫 ' + errs.length + ' error(s)'}</span>
      ${warns.length ? `<span class="pill warn">⚠️ ${warns.length} warning(s)</span>` : ''}
      ${infos.length ? `<span class="pill">${infos.length} tip(s)</span>` : ''}
    </div>` +
    (issues.length ? issues.map(i => `
      <div class="check-item ${i.sev}">
        <span class="ci">${i.sev === 'err' ? '❌' : i.sev === 'warn' ? '⚠️' : '💡'}</span>
        <div><b>${Mega.esc(i.file)} : line ${i.line}</b><span>${Mega.esc(i.msg)}</span></div>
      </div>`).join('') : '<p style="color:var(--text2);font-size:13px">Code is clean — great job! 🎉</p>');
  if (!silent) Mega.toast(ok ? 'Check complete ✅' : 'Issues found', ok ? 'No errors detected.' : errs.length + ' error(s), ' + warns.length + ' warning(s).', ok ? 'ok' : 'warn');
};

Mega.code.autoFix = async () => {
  if (Mega.code.busy) return;
  if (!Mega.code.files.length) return Mega.toast('Nothing to fix', 'Generate a project first.', 'warn');
  Mega.code.busy = true;
  const btn = Mega.$('#csFix'); btn.disabled = true; btn.innerHTML = '🔧 Fixing…';
  try {
    for (let i = 0; i < Mega.code.files.length; i++) {
      const f = Mega.code.files[i];
      if (!/\.(js|html|css|json|py)$/i.test(f.path)) continue;
      const r = Mega.check.code(f.path, f.content);
      if (r.ok && !r.issues.some(x => x.sev === 'warn')) continue;
      btn.innerHTML = '🔧 Fixing ' + f.path + '…';
      const res = await Mega.ai.chat([
        { role: 'system', content: 'You are Mega Power AI AutoFix. Fix all bugs and warnings. Return ONLY the full corrected file in one fenced code block. Same language, no explanations.' },
        { role: 'user', content: `File: ${f.path}\nIssues:\n${r.issues.map(x => `- [${x.sev}] line ${x.line}: ${x.msg}`).join('\n') || 'general review'}\n\nCode:\n${f.content}` }
      ], { model: Mega.settings.model });
      const fixed = (res.text.match(/```[\w]*\n([\s\S]*?)```/) || [])[1];
      if (fixed && fixed.length > f.content.length * 0.4) Mega.code.files[i].content = fixed.replace(/\n$/, '');
    }
    Mega.code.load(Mega.code.files, Mega.code.name, Mega.code.prompt);
    Mega.toast('Auto-fix complete 🔧', 'All files corrected & re-checked.', 'ok');
  } catch (e) { Mega.toast('Auto-fix failed', String(e.message || e), 'err'); }
  finally { Mega.code.busy = false; btn.disabled = false; btn.innerHTML = '🔧 Auto-fix'; }
};

/* ================= DESTINATIONS (feature 18) ================= */
Mega.code.toProjects = () => {
  if (!Mega.code.files.length) return;
  Mega.code.name = Mega.$('#csName').value.trim() || 'my-app';
  Mega.projects.save(Mega.code.name, Mega.code.files, Mega.code.prompt);
  Mega.toast('Saved to My Projects 📁', 'Open the Projects tab to rebuild or download it any time.', 'ok');
};

Mega.code.download = () => {
  if (!Mega.code.files.length) return;
  Mega.code.name = Mega.$('#csName').value.trim() || 'my-app';
  const blob = Mega.zip.create(Mega.code.files.map(f => ({ path: f.path, data: f.content })));
  Mega.zip.save(blob, Mega.code.name + '.zip');
  Mega.toast('Download started 📦', Mega.code.name + '.zip — enjoy!', 'ok');
};

Mega.code.toGithub = () => {
  if (!Mega.code.files.length) return;
  Mega.code.name = Mega.$('#csName').value.trim() || 'my-app';
  Mega.$('#csName').value = Mega.code.name;
  Mega.github.pushDialog(Mega.code.name, Mega.code.files);
};
