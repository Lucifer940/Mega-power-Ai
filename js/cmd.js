/* ============================================================
   MEGA POWER AI — cmd.js  |  Mega CMD
   "Any app can be built with one command."  (feature 19)
   ============================================================ */
'use strict';
window.Mega = window.Mega || {};
Mega.cmd = { hist: [], hi: -1, job: null };

Mega.cmd.init = () => {
  const p = Mega.$('#page-cmd');
  if (p.dataset.init) return; p.dataset.init = '1';
  const input = Mega.$('#termIn');
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { const v = input.value; input.value = ''; if (v.trim()) { Mega.cmd.hist.push(v); Mega.cmd.hi = Mega.cmd.hist.length; Mega.cmd.run(v); } }
    if (e.key === 'ArrowUp') { e.preventDefault(); if (Mega.cmd.hi > 0) input.value = Mega.cmd.hist[--Mega.cmd.hi]; }
    if (e.key === 'ArrowDown') { e.preventDefault(); if (Mega.cmd.hi < Mega.cmd.hist.length - 1) input.value = Mega.cmd.hist[++Mega.cmd.hi]; else input.value = ''; }
  });
  setTimeout(() => input.focus(), 300);
  const out = Mega.$('#termOut');
  out.addEventListener('click', () => input.focus());
  if (!out.dataset.hello) {
    out.dataset.hello = '1';
    Mega.cmd.print([
      ['MEGA POWER AI CMD v1.0  ⚡', 'tl-ok'],
      ['The world\'s fastest AI build box — created by Umesh Chaudhary', 'tl-dim'],
      ['Type "help" to see every command. Try: build a todo app', 'tl-dim'],
      ['']
    ]);
  }
};

Mega.cmd.print = (lines) => {
  const out = Mega.$('#termOut');
  for (const [text, cls] of lines) {
    const d = document.createElement('div');
    if (cls) d.className = cls;
    d.textContent = text;
    out.appendChild(d);
  }
  out.scrollTop = out.scrollHeight;
};

Mega.cmd.printMD = (md) => {
  const out = Mega.$('#termOut');
  const d = document.createElement('div');
  d.className = 'md';
  d.style.fontSize = '13px';
  d.innerHTML = Mega.md.render(md, { fixable: false });
  out.appendChild(d);
  out.scrollTop = out.scrollHeight;
};

Mega.cmd.run = async (raw) => {
  const out = Mega.$('#termOut');
  Mega.cmd.print(['mega> ' + raw, 'tl-cmd']);
  const [cmd, ...rest] = raw.trim().split(/\s+/);
  const arg = rest.join(' ');
  const c = cmd.toLowerCase();

  const HELP = [
    ['', 'BUILD & CREATE'],
    ['build <anything> [--to app|zip|github]', 'one command → full project (background job)'],
    ['create <anything>', 'alias of build'],
    ['image <prompt>', 'generate an AI image'],
    ['ask <question>', 'quick AI answer, right here'],
    ['', 'NAVIGATE'],
    ['open <chat|code|studio|projects|github|settings|about>', 'jump to a tab'],
    ['projects', 'list your projects'],
    ['download <project>', 'download a project as ZIP'],
    ['', 'CONTROL'],
    ['models', 'list AI models'],
    ['use <model>', 'switch model (e.g. use gemini)'],
    ['cancel', 'stop the running background job'],
    ['keys', 'open API-key settings'],
    ['login / logout', 'account'],
    ['install', 'install as an app'],
    ['', 'EXTRAS'],
    ['about', 'about Mega Power AI'],
    ['time', 'current date & time'],
    ['whoami', 'your session'],
    ['matrix', 'there is no spoon'],
    ['clear', 'clear terminal'],
  ];
  const OPEN = { chat: 'chat', code: 'code', codestudio: 'code', studio: 'studio', create: 'studio', projects: 'projects', project: 'projects', github: 'github', settings: 'settings', about: 'about', cmd: 'cmd' };

  try {
    if (c === 'help' || c === '?') {
      Mega.cmd.print(HELP.map(([a, b]) => [a ? '  ' + a.padEnd(46).replace(/ /g, ' ') : (b ? '┌─ ' + b : ''), a ? 'tl-dim' : 'tl-warn']));
    }
    else if (c === 'clear') { out.innerHTML = ''; }
    else if (c === 'about') {
      Mega.cmd.printMD('**⚡ MEGA POWER AI** — created by **Umesh Chaudhary**\n\nThe world\'s fastest and most powerful AI platform — no limits, no issues. Understands any language. Tell it your ideas — it makes them real.\n\n🔒 *Secret project* · Works as web + installable app (Android, iOS, Windows, Linux).');
    }
    else if (c === 'time') Mega.cmd.print([[new Date().toString(), 'tl-ok']]);
    else if (c === 'whoami') Mega.cmd.print([[Mega.user ? `${Mega.user.name} (${Mega.user.email}) via ${Mega.user.via}` : 'guest — not logged in', 'tl-ok']]);
    else if (c === 'version') Mega.cmd.print([['Mega Power AI v1.0.0 — "No Limits" edition', 'tl-ok']]);
    else if (c === 'open') {
      const r = OPEN[arg.toLowerCase().replace(/\s/g, '')];
      if (r) { Mega.go(r); Mega.cmd.print([['→ opened ' + r, 'tl-ok']]); } else Mega.cmd.print([['unknown tab. try: ' + Object.keys(OPEN).slice(0, 8).join(', '), 'tl-err']]);
    }
    else if (c === 'models') {
      const groups = {};
      Mega.ai.models.forEach(m => (groups[m.group] = groups[m.group] || []).push(m));
      for (const g in groups) {
        Mega.cmd.print([[g, 'tl-warn']]);
        groups[g].forEach(m => Mega.cmd.print([['  • ' + (m.id === Mega.settings.model ? '➤ ' : '  ') + m.id.padEnd(16) + ' ' + m.name + (m.tag ? '  [' + m.tag + ']' : ''), m.id === Mega.settings.model ? 'tl-ok' : 'tl-dim']]));
      }
      Mega.cmd.print([['use <model-id> to switch', 'tl-dim']]);
    }
    else if (c === 'use' || c === 'model') {
      const m = Mega.ai.models.find(x => x.id === arg.toLowerCase() || x.name.toLowerCase().includes(arg.toLowerCase())) ;
      if (m && arg) { Mega.settings.model = m.id; Mega.saveSettings(); if (Mega.uiRenderModels) Mega.uiRenderModels(); Mega.cmd.print([['✅ model → ' + m.name + ' (' + m.id + ')', 'tl-ok']]); }
      else Mega.cmd.print([['model not found. "models" lists all.', 'tl-err']]);
    }
    else if (c === 'build' || c === 'create' || c === 'make') {
      if (!arg) return Mega.cmd.print([['build WHAT? e.g. build a snake game', 'tl-err']]);
      let dest = 'app';
      let promptTxt = arg;
      const mTo = arg.match(/--to\s+(\w+)/);
      if (mTo) { dest = { app: 'app', zip: 'download', download: 'download', device: 'download', github: 'github', gh: 'github' }[mTo[1].toLowerCase()] || 'app'; promptTxt = arg.replace(mTo[0], '').trim(); }
      Mega.cmd.print([['⚙️ job started → "' + promptTxt + '" (destination: ' + dest + ')', 'tl-ok'], ['building in background… open <b>Projects</b> to watch / stop it. you can keep typing here.', 'tl-dim']]);
      await Mega.jobs.create(promptTxt.split(/\s+/).slice(0, 4).join('-').replace(/[^a-z0-9-]/gi, '').toLowerCase() || 'my-app', promptTxt, dest, '⌨️ CMD');
    }
    else if (c === 'image' || c === 'img') {
      if (!arg) return Mega.cmd.print([['image WHAT? e.g. image a neon city at night', 'tl-err']]);
      Mega.cmd.print([['🎨 painting "' + arg + '" …', 'tl-dim']]);
      const url = Mega.ai.image.url(arg, { width: 1024, height: 1024 });
      const d = document.createElement('div');
      d.innerHTML = `<a href="${Mega.esc(url)}" target="_blank"><img src="${Mega.esc(url)}" style="max-width:340px;border-radius:12px;margin-top:8px"></a>`;
      out.appendChild(d); out.scrollTop = out.scrollHeight;
      Mega.studio.images.unshift({ url, prompt: arg, at: Date.now() });
      Mega.store.set('studioImages', Mega.studio.images);
    }
    else if (c === 'ask' || c === 'chat') {
      if (!arg) return Mega.cmd.print([['ask WHAT?', 'tl-err']]);
      const m = Mega.ai.modelById(Mega.settings.model);
      Mega.cmd.print([['🤖 ' + m.name + ' thinking…', 'tl-dim']]);
      const line = document.createElement('div');
      line.className = 'md'; line.style.fontSize = '13px';
      out.appendChild(line);
      const r = await Mega.ai.chat([
        { role: 'system', content: Mega.ai.systemPrompt() + ' Keep it under 120 words — we are in a terminal.' },
        { role: 'user', content: arg }
      ], { model: m.id, onToken: (d, all) => { line.innerHTML = Mega.md.render(all, { fixable: false }); out.scrollTop = out.scrollHeight; } });
      line.innerHTML = Mega.md.render(r.text, { fixable: false });
    }
    else if (c === 'projects' || c === 'ls') {
      if (!Mega.projects.list.length) Mega.cmd.print([['no projects yet — try: build a quiz app', 'tl-dim']]);
      Mega.projects.list.forEach(p => Mega.cmd.print([['  📁 ' + p.name.padEnd(24) + p.files.length + ' files  ' + Mega.fmtTime(p.at), 'tl-ok']]));
    }
    else if (c === 'download' || c === 'zip') {
      const p = Mega.projects.list.find(x => x.name.toLowerCase().includes(arg.toLowerCase()));
      if (!p) return Mega.cmd.print([['project not found. "projects" lists them.', 'tl-err']]);
      Mega.projects.zip(p);
      Mega.cmd.print([['📦 downloading ' + p.name + '.zip …', 'tl-ok']]);
    }
    else if (c === 'cancel' || c === 'stop') {
      let any = false;
      for (const [id, ac] of Mega.jobs.active) { ac.abort(); any = true; }
      Mega.cmd.print([[any ? '⏹ stopped running job(s).' : 'nothing is running.', any ? 'tl-warn' : 'tl-dim']]);
    }
    else if (c === 'keys') { Mega.go('settings'); Mega.cmd.print([['→ opened Settings → AI Keys', 'tl-ok']]); }
    else if (c === 'login') { Mega.authOpen(); Mega.cmd.print([['→ login screen opened', 'tl-ok']]); }
    else if (c === 'logout') { Mega.setUser(null); Mega.cmd.print([['logged out.', 'tl-ok']]); }
    else if (c === 'install') { Mega.installApp(); }
    else if (c === 'matrix') {
      const chars = '01アイウエオカキクケコ⚡';
      let n = 0;
      const iv = setInterval(() => {
        Mega.cmd.print([[Array.from({ length: 62 }, () => chars[Math.floor(Math.random() * chars.length)]).join(''), 'tl-ok']]);
        if (++n > 14) { clearInterval(iv); Mega.cmd.print([['wake up, neo… Mega Power AI has you. ⚡', 'tl-warn']]); }
      }, 90);
    }
    else if (c === 'echo') Mega.cmd.print([[arg, '']]);
    else {
      Mega.cmd.print([['unknown command: ' + cmd + '  —  type "help"', 'tl-err']]);
    }
  } catch (e) {
    Mega.cmd.print([['error: ' + (e.message || e), 'tl-err']]);
  }
};
