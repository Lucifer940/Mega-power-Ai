/* ============================================================
   MEGA POWER AI — code.js  |  code intelligence
   Real static analyzer + preview builder + auto-fix.
   Used by the all-in-one chat. Created by Umesh Chaudhary.
   ============================================================ */
'use strict';
window.Mega = window.Mega || {};
Mega.code = { files: [], cur: 0, name: '', prompt: '' };

/* ================= STATIC CODE CHECKER ================= */
Mega.check = {};
Mega.check.code = (path, code) => {
  const issues = [];
  const ext = Mega.ext(path);
  const lines = code.split('\n');

  const brackets = () => {
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
    try { new Function(code.replace(/^\s*(import|export)[^\n]*$/gm, '')); }
    catch (e) {
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
      if (voids.has(tag)) continue;
      if (!closing) stack.push({ tag, line: ln });
      else {
        const top = stack.pop();
        if (!top) issues.push({ line: ln, sev: 'warn', msg: `</${tag}> closes nothing.` });
        else if (top.tag !== tag) issues.push({ line: top.line, sev: 'err', msg: `<${top.tag}> opened here is closed by </${tag}> on line ${ln}.` });
      }
    }
    stack.forEach(s => issues.push({ line: s.line, sev: 'err', msg: `<${s.tag}> is never closed.` }));
    if (!/<!DOCTYPE/i.test(code)) issues.push({ line: 1, sev: 'warn', msg: 'Missing <!DOCTYPE html>.' });
    if (!/charset/i.test(code)) issues.push({ line: 1, sev: 'warn', msg: 'Missing <meta charset="UTF-8">.' });
  } else if (ext === 'css') {
    brackets();
    lines.forEach((ln, i) => {
      if (/[a-z-]\s*:\s*[^;{}]+$/i.test(ln.trim()) && !ln.trim().endsWith(',') && ln.includes(':') && !ln.trim().startsWith('@') && !ln.trim().startsWith('/*'))
        issues.push({ line: i + 1, sev: 'warn', msg: 'Declaration may be missing a “;”.' });
    });
  } else if (ext === 'json') {
    try { JSON.parse(code); } catch (e) { issues.push({ line: 1, sev: 'err', msg: 'Invalid JSON: ' + e.message }); }
  } else if (ext === 'py') {
    lines.forEach((ln, i) => {
      const ind = ln.match(/^ */)[0].length;
      if (ln.trim() && ind % 4 !== 0 && !ln.trim().startsWith('#'))
        issues.push({ line: i + 1, sev: 'warn', msg: 'Indentation is not a multiple of 4 spaces.' });
    });
  }
  return { ok: !issues.some(i => i.sev === 'err'), issues };
};

Mega.check.project = (files) => {
  const issues = [];
  files.forEach(f => {
    if (typeof f.content === 'string') {
      Mega.check.code(f.path, f.content).issues.forEach(i => issues.push({ ...i, file: f.path }));
    }
  });
  return { ok: !issues.some(i => i.sev === 'err'), issues };
};

/* ================= LIVE PREVIEW (build a single srcdoc) ================= */
Mega.code.previewDoc = (files) => {
  const f = (n) => files.find(x => x.path.toLowerCase().endsWith(n));
  const idx = f('index.html');
  if (!idx) return null;
  let html = idx.content;
  html = html.replace(/<link[^>]*href=["']?([^"'>\s]+)["']?[^>]*>/gi, (m, href) => {
    const cf = files.find(x => x.path === href.replace(/^\.?\//, ''));
    return (cf && /\.css$/i.test(cf.path)) ? `<style>\n${cf.content}\n</style>` : m;
  });
  html = html.replace(/<script[^>]*src=["']?([^"'>\s]+)["']?[^>]*>\s*<\/script>/gi, (m, src) => {
    const jf = files.find(x => x.path === src.replace(/^\.?\//, ''));
    return jf ? `<script>\n${jf.content}\n<\/script>` : m;
  });
  return html;
};

/* ================= AUTO-FIX (via AI, file by file) ================= */
Mega.code.autoFix = async (files, onStep) => {
  const out = [];
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    if (!/\.(js|html|css|json|py)$/i.test(f.path)) { out.push(f); continue; }
    const r = Mega.check.code(f.path, f.content);
    if (r.ok && !r.issues.some(x => x.sev === 'warn')) { out.push(f); continue; }
    onStep && onStep(f.path, i + 1, files.length);
    try {
      const res = await Mega.ai.chat([
        { role: 'system', content: 'You are Mega Power AI AutoFix. Fix all bugs and warnings. Return ONLY the full corrected file in one fenced code block. Same language, no explanations.' },
        { role: 'user', content: `File: ${f.path}\nIssues:\n${r.issues.map(x => `- [${x.sev}] line ${x.line}: ${x.msg}`).join('\n') || 'general review'}\n\nCode:\n${f.content}` }
      ], { model: Mega.settings.model });
      const fixed = (res.text.match(/```[\w]*\n([\s\S]*?)```/) || [])[1];
      out.push(fixed && fixed.length > f.content.length * 0.4 ? { path: f.path, content: fixed.replace(/\n$/, '') } : f);
    } catch { out.push(f); }
  }
  return out;
};
