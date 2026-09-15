/* ============================================================
   MEGA POWER AI — projects.js  |  saved projects (drawer)
   Every generated project is stored forever on the device —
   rebuild, download or push to GitHub any time.
   Created by Umesh Chaudhary.
   ============================================================ */
'use strict';
window.Mega = window.Mega || {};
Mega.projects = { list: [] };

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

Mega.projects.updateFiles = async (id, files) => {
  const p = Mega.projects.list.find(x => x.id === id);
  if (p) { p.files = files; p.at = Date.now(); await Mega.idb.set('kv', 'proj:' + p.id, p); }
};

Mega.projects.remove = async (id) => {
  await Mega.idb.del('kv', 'proj:' + id);
  Mega.projects.list = Mega.projects.list.filter(p => p.id !== id);
  Mega.projects.render();
};

Mega.projects.render = () => {
  const grid = Mega.$('#projGrid'); if (!grid) return;
  if (!Mega.projects.list.length) {
    grid.innerHTML = `<div class="empty" style="grid-column:1/-1"><div class="big">📁</div>
      <b>No projects yet</b><span>Ask me in the chat: <i>“build a todo app”</i> —<br>every project is saved here automatically.</span></div>`;
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
        <button class="btn sm" data-rebuild title="Regenerate from the original prompt">🔁 Rebuild</button>
        <button class="btn sm danger" data-del>🗑</button>
      </div>
    </div>`).join('');
  Mega.$$('#projGrid .proj-card').forEach(card => {
    const proj = Mega.projects.list.find(p => p.id === card.dataset.id);
    card.onclick = (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.hasAttribute('data-open')) { Mega.chat.openPreview(proj); }
      if (b.hasAttribute('data-zip')) Mega.projects.zip(proj);
      if (b.hasAttribute('data-gh')) Mega.github.pushDialog(proj.name, proj.files);
      if (b.hasAttribute('data-rebuild')) { Mega.drawer.close(); Mega.chat.send('build ' + (proj.prompt || proj.name)); }
      if (b.hasAttribute('data-del')) Mega.projects.del(proj);
    };
  });
};

Mega.projects.zip = (p) => {
  Mega.zip.save(Mega.zip.create(p.files.map(f => ({ path: f.path, data: f.content }))), p.name.replace(/[^\w.-]+/g, '-') + '.zip');
  Mega.toast('Download started 📦', p.name + '.zip', 'ok');
};
Mega.projects.del = async (p) => {
  const yes = await Mega.confirm('Delete “' + p.name + '”?', 'The project and its files will be removed from this device.');
  if (yes) { await Mega.projects.remove(p.id); Mega.toast('Project deleted', '', 'ok'); }
};

/* init when the drawer first opens */
Mega.projects.init = () => { Mega.projects.load(); };
