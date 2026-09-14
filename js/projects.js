/* ============================================================
   MEGA POWER AI — projects.js
   Project folders · background jobs (start/stop/cancel/resume) ·
   ZIP download · rebuild · destination choice (app/device/GitHub)
   ============================================================ */
'use strict';
window.Mega = window.Mega || {};
Mega.projects = { list: [] };
Mega.jobs = { active: new Map() };

/* ---------------- storage ---------------- */
Mega.projects.load = async () => {
  const keys = (await Mega.idb.keys('kv')).filter(k => String(k).startsWith('proj:'));
  Mega.projects.list = [];
  for (const k of keys) { const p = await Mega.idb.get('kv', k); if (p) Mega.projects.list.push(p); }
  Mega.projects.list.sort((a, b) => b.at - a.at);
  Mega.projects.render();
};

Mega.projects.save = async (name, files, prompt) => {
  const p = { id: Mega.uid('proj'), name, files, prompt, at: Date.now() };
  await Mega.idb.set('kv', 'proj:' + p.id, p);
  Mega.projects.list.unshift(p);
  Mega.projects.render();
  return p;
};

Mega.projects.update = async (p) => { p.at = Date.now(); await Mega.idb.set('kv', 'proj:' + p.id, p); };
Mega.projects.remove = async (id) => {
  await Mega.idb.del('kv', 'proj:' + id);
  Mega.projects.list = Mega.projects.list.filter(p => p.id !== id);
  Mega.projects.render();
};

/* ---------------- render ---------------- */
Mega.projects.init = () => {
  const p = Mega.$('#page-projects');
  if (p.dataset.init) { return; } p.dataset.init = '1';
  Mega.$('#projNew').onclick = () => Mega.projects.wizard();
  Mega.projects.load().then(() => Mega.jobs.load());
};

Mega.projects.render = () => {
  const grid = Mega.$('#projGrid');
  if (!Mega.projects.list.length) {
    grid.innerHTML = `<div class="empty" style="grid-column:1/-1"><div class="big">📁</div>
      <b>No projects yet</b><span>Press “+ New project”, give ONE prompt,<br>and choose where to create it — in-app, your device (ZIP) or GitHub.</span></div>`;
    return;
  }
  const icons = ['🚀', '🎮', '📊', '🎨', '🛒', '📝', '🎧', '🌐', '🔧', '💡'];
  grid.innerHTML = Mega.projects.list.map((p, i) => `
    <div class="card proj-card hoverable" data-id="${p.id}">
      <div class="ph">${icons[i % icons.length]}</div>
      <h4>${Mega.esc(p.name)}</h4>
      <div class="pm"><span>📄 ${p.files.length} files</span><span>${Mega.fmtBytes(p.files.reduce((a, f) => a + (f.content || '').length, 0))}</span><span>🕒 ${Mega.fmtTime(p.at)}</span></div>
      ${p.prompt ? `<div style="font-size:11.5px;color:var(--text3);line-height:1.5;max-height:34px;overflow:hidden">“${Mega.esc(p.prompt.slice(0, 110))}”</div>` : ''}
      <div class="pa">
        <button class="btn sm primary" data-open>📂 Open</button>
        <button class="btn sm" data-zip>📦 ZIP</button>
        <button class="btn sm" data-gh>🐙 Push</button>
        <button class="btn sm" data-rebuild title="Regenerate this project from its prompt">🔁 Rebuild</button>
        <button class="btn sm danger" data-del>🗑</button>
      </div>
    </div>`).join('');
  Mega.$$('#projGrid .proj-card').forEach(card => {
    const proj = Mega.projects.list.find(p => p.id === card.dataset.id);
    card.onclick = (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.hasAttribute('data-open')) Mega.projects.open(proj);
      if (b.hasAttribute('data-zip')) Mega.projects.zip(proj);
      if (b.hasAttribute('data-gh')) Mega.github.pushDialog(proj.name, proj.files);
      if (b.hasAttribute('data-rebuild')) Mega.projects.rebuild(proj);
      if (b.hasAttribute('data-del')) Mega.projects.del(proj);
    };
  });
};

Mega.projects.open = (p) => {
  Mega.go('code');
  setTimeout(() => Mega.code.load(p.files, p.name, p.prompt), 80);
  Mega.settings.lastProject = p.id; Mega.saveSettings();
};
Mega.projects.zip = (p) => {
  Mega.zip.save(Mega.zip.create(p.files.map(f => ({ path: f.path, data: f.content }))), p.name.replace(/[^\w.-]+/g, '-') + '.zip');
  Mega.toast('Download started 📦', p.name + '.zip', 'ok');
};
Mega.projects.rebuild = (p) => {
  Mega.jobs.create(p.name, p.prompt, 'app', '🔁 Rebuild');
};
Mega.projects.del = async (p) => {
  const yes = await Mega.confirm('Delete “' + p.name + '”?', 'The project and its files will be removed from this device.');
  if (yes) { await Mega.projects.remove(p.id); Mega.toast('Project deleted', '', 'ok'); }
};

/* ---------------- wizard (feature 18: choose destination) ---------------- */
Mega.projects.wizard = () => {
  Mega.modal('📁 New project', 'One prompt is enough. Choose where Mega Power AI should create it.',
    `<label class="lbl">DESCRIBE YOUR PROJECT — ANY LANGUAGE</label>
     <textarea class="inp" id="wzPrompt" rows="3" placeholder="e.g. a beautiful expense tracker with charts and dark mode"></textarea>
     <label class="lbl">CREATE IT…</label>
     <div class="grid3" id="wzDest" style="gap:9px">
       <div class="card hoverable" data-dest="app" style="text-align:center;padding:16px;cursor:pointer;border-color:var(--acc1)"><div style="font-size:26px">📲</div><b style="font-size:13px">In the app</b><div style="font-size:11px;color:var(--text2)">My Projects</div></div>
       <div class="card hoverable" data-dest="download" style="text-align:center;padding:16px;cursor:pointer"><div style="font-size:26px">💾</div><b style="font-size:13px">My device</b><div style="font-size:11px;color:var(--text2)">ZIP download</div></div>
       <div class="card hoverable" data-dest="github" style="text-align:center;padding:16px;cursor:pointer"><div style="font-size:26px">🐙</div><b style="font-size:13px">GitHub</b><div style="font-size:11px;color:var(--text2)">new/existing repo</div></div>
     </div>
     <div class="row" style="margin-top:16px">
       <span class="pill">⏱ runs as a background job — you can keep chatting</span>
     </div>
     <div class="row" style="justify-content:flex-end;margin-top:14px">
       <button class="btn ghost" data-x>Cancel</button>
       <button class="btn primary" id="wzGo">🚀 Create project</button>
     </div>`,
    { lg: true, onMount(w, close) {
        let dest = 'app';
        Mega.$$('#wzDest .card', w).forEach(c => c.onclick = () => {
          dest = c.dataset.dest;
          Mega.$$('#wzDest .card', w).forEach(x => x.style.borderColor = '');
          c.style.borderColor = 'var(--acc1)';
        });
        w.onclick = async (e) => {
          if (e.target.hasAttribute('data-x')) close(null);
          if (e.target.id === 'wzGo') {
            const q = Mega.$('#wzPrompt', w).value.trim();
            if (!q) return Mega.toast('Describe it first', 'One prompt — that is all I need.', 'warn');
            close(null);
            Mega.jobs.create(q.split(/\s+/).slice(0, 4).join('-').replace(/[^a-z0-9-]/gi, '').toLowerCase() || 'my-app', q, dest);
          }
        };
        Mega.$('#wzPrompt', w).focus();
      } });
};

/* ============================================================
   BACKGROUND JOBS (feature 20 — cancel/stop, auto-resume)
   ============================================================ */
Mega.jobs.load = async () => {
  const keys = (await Mega.idb.keys('kv')).filter(k => String(k).startsWith('job:'));
  const jobs = [];
  for (const k of keys) { const j = await Mega.idb.get('kv', k); if (j) jobs.push(j); }
  const stale = jobs.filter(j => j.status === 'running' || j.status === 'queued');
  for (const j of stale) { j.status = 'queued'; await Mega.idb.set('kv', 'job:' + j.id, j); }
  Mega.jobs.renderAll(jobs.sort((a, b) => b.at - a.at));
  // auto-resume unfinished jobs — "never forget your project"
  for (const j of stale) Mega.jobs.run(j.id).catch(() => {});
};

Mega.jobsResume = () => { /* handled in load on init; called post-boot for safety */ };

Mega.jobs.create = async (name, prompt, dest, label) => {
  const j = { id: Mega.uid('job'), name: name || 'project', prompt, dest: dest || 'app', label: label || '🚀 Build', status: 'queued', progress: 0, at: Date.now() };
  await Mega.idb.set('kv', 'job:' + j.id, j);
  Mega.go('projects');
  Mega.jobs.renderOne(j, true);
  Mega.toast('Job started ⚙️', 'Building in background — chat, create, keep working. Stop any time.', 'ok');
  Mega.jobs.run(j.id).catch(() => {});
  return j;
};

Mega.jobs.run = async (id) => {
  const j = await Mega.idb.get('kv', 'job:' + id);
  if (!j || j.status === 'running' || j.status === 'done') return;
  j.status = 'running'; j.progress = 5;
  await Mega.idb.set('kv', 'job:' + id, j); Mega.jobs.renderOne(j);
  const ac = new AbortController();
  Mega.jobs.active.set(id, ac);
  const model = Mega.ai.modelById(Mega.settings.model);
  try {
    const r = await Mega.ai.chat([
      { role: 'system', content: Mega.ai.codePrompt() },
      { role: 'user', content: 'Build this project: ' + j.prompt }
    ], { model: model.id, mode: 'code', signal: ac.signal, onToken: (d, all) => { j.progress = Math.min(90, j.progress + 0.15); Mega.jobs.updateUI(j); } });
    const files = Mega.ai.parseFiles(r.text);
    if (!files.length) throw new Error('no files generated');
    j.progress = 95;
    // destination
    const proj = await Mega.projects.save(j.name, files, j.prompt);
    if (j.dest === 'download') Mega.projects.zip(proj);
    if (j.dest === 'github') {
      if (Mega.github.token()) await Mega.github.pushAuto(proj.name, files);
      else Mega.toast('GitHub not connected', 'Project saved in-app — connect GitHub (GitHub tab) then push from Projects.', 'warn', 5000);
    }
    j.status = 'done'; j.progress = 100; j.projId = proj.id;
    Mega.toast('✅ ' + j.name + ' is ready!', j.dest === 'download' ? 'ZIP downloaded.' : j.dest === 'github' ? 'Pushed to GitHub.' : 'Saved to My Projects.', 'ok', 5000);
  } catch (err) {
    j.status = String(err).includes('Abort') ? 'cancelled' : 'error';
    j.error = String(err.message || err);
    if (j.status === 'error') Mega.toast('Job failed', j.name + ': ' + j.error, 'err');
  } finally {
    Mega.jobs.active.delete(id);
    await Mega.idb.set('kv', 'job:' + id, j);
    Mega.jobs.renderOne(j);
    setTimeout(() => Mega.jobs.gc(), 60000);
  }
};

Mega.jobs.stop = async (id) => {
  const ac = Mega.jobs.active.get(id);
  if (ac) ac.abort();
  const j = await Mega.idb.get('kv', 'job:' + id);
  if (j && j.status === 'queued') { j.status = 'cancelled'; await Mega.idb.set('kv', 'job:' + id, j); Mega.jobs.renderOne(j); }
  Mega.toast('Job stopped ⏹', 'Nothing else runs — you are in control.', 'warn');
};

Mega.jobs.gc = async () => {
  const keys = (await Mega.idb.keys('kv')).filter(k => String(k).startsWith('job:'));
  for (const k of keys) {
    const j = await Mega.idb.get('kv', k);
    if (j && (j.status === 'done' || j.status === 'cancelled' || j.status === 'error')) {
      if (Date.now() - j.at > 30 * 60 * 1000) await Mega.idb.del('kv', k);
    }
  }
};

Mega.jobs.updateUI = Mega.debounce((j) => {
  const el = Mega.$(`[data-job="${j.id}"]`);
  if (el) { el.querySelector('.progress i').style.width = j.progress + '%'; el.querySelector('.js').textContent = j.status === 'running' ? 'building… ' + Math.round(j.progress) + '%' : j.status; }
  const jb = Mega.idb.set('kv', 'job:' + j.id, j); // persist live progress
}, 700);

Mega.jobs.renderAll = (jobs) => {
  Mega.$('#jobList').innerHTML = '';
  jobs.filter(j => j.status !== 'done' && j.status !== 'cancelled' && j.status !== 'error')
    .forEach(j => Mega.jobs.renderOne(j, true));
};

Mega.jobs.renderOne = (j, prepend) => {
  let el = Mega.$(`[data-job="${j.id}"]`);
  const icon = { queued: '⏳', running: '⚙️', done: '✅', error: '⚠️', cancelled: '⏹' }[j.status];
  const statusText = { queued: 'queued (auto-resumes)', running: 'building… ' + Math.round(j.progress) + '%', done: 'done 🎉', error: 'error: ' + (j.error || '').slice(0, 60), cancelled: 'stopped' }[j.status];
  const html = `<div class="job-row" data-job="${j.id}">
    <div class="ji">${icon}</div>
    <div class="grow"><div class="jn">${Mega.esc(j.label || '🚀')} ${Mega.esc(j.name)}</div><div class="js">${Mega.esc(statusText)}</div>
      <div class="progress" style="margin-top:6px"><i style="width:${j.progress}%"></i></div></div>
    ${j.status === 'queued' || j.status === 'running' ? `<button class="btn sm danger" data-stop>⏹ Stop</button>` : `<button class="btn sm ghost" data-clear>✕</button>`}
  </div>`;
  const list = Mega.$('#jobList');
  if (el) el.outerHTML = html;
  else if (prepend) list.insertAdjacentHTML('afterbegin', html);
  else list.insertAdjacentHTML('beforeend', html);
  el = Mega.$(`[data-job="${j.id}"]`);
  const stop = el.querySelector('[data-stop]');
  if (stop) stop.onclick = () => Mega.jobs.stop(j.id);
  const clear = el.querySelector('[data-clear]');
  if (clear) clear.onclick = async () => { await Mega.idb.del('kv', 'job:' + j.id); el.remove(); };
};
