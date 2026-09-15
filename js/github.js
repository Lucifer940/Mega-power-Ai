/* ============================================================
   MEGA POWER AI — github.js  |  real GitHub REST integration
   Token-based connect · list/create repos · push projects ·
   import repos → editable projects      (features 8, 18, 20)
   ============================================================ */
'use strict';
window.Mega = window.Mega || {};
Mega.github = {};

Mega.github.token = () => (Mega.settings.ghToken || '').trim();
Mega.github.api = async (path, opts = {}) => {
  const t = Mega.github.token();
  const res = await fetch('https://api.github.com' + path, {
    ...opts,
    headers: {
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(t ? { 'Authorization': 'Bearer ' + t } : {}),
      ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
      ...opts.headers
    }
  });
  if (!res.ok) {
    const e = new Error('GitHub ' + res.status + ' ' + (res.statusText || ''));
    e.status = res.status;
    try { e.detail = (await res.json()).message; } catch {}
    throw e;
  }
  if (res.status === 204) return null;
  return res.json();
};
Mega.github.b64 = (s) => {
  const b = new TextEncoder().encode(s);
  let bin = '';
  for (let i = 0; i < b.length; i += 4096) bin += String.fromCharCode(...b.subarray(i, i + 4096));
  return btoa(bin);
};

Mega.github.init = () => {
  const p = Mega.$('#page-github');
  if (p.dataset.init) return; p.dataset.init = '1';
  Mega.$('#ghRefresh').onclick = () => Mega.github.render();
  Mega.github.render();
};

Mega.github.render = async () => {
  const box = Mega.$('#ghBody');
  if (!Mega.github.token()) {
    box.innerHTML = `
    <div class="empty"><div class="big">🐙</div>
      <h3 style="color:var(--text)">Connect GitHub — like LMArena</h3>
      <p style="max-width:520px;font-size:13.5px;line-height:1.7">Paste a <b>Personal Access Token</b> (repo scope) and Mega Power AI can:<br>
      🔍 open your repos · ➕ create new repos · ⬆️ push projects as commits · ⬇️ import any repo as an editable project.<br>
      Your token is stored <b>only on your device</b>.</p>
      <div class="row" style="width:100%;max-width:460px">
        <input class="inp" id="ghTokenIn" type="password" placeholder="ghp_… or github_pat_…">
        <button class="btn primary" id="ghGo">🔗 Connect</button>
      </div>
      <p style="font-size:12px;color:var(--text3)">Get a token: github.com → Settings → Developer settings → Personal access tokens → <b>repo</b> scope</p>
    </div>`;
    Mega.$('#ghGo').onclick = async () => {
      const t = Mega.$('#ghTokenIn').value.trim();
      if (!t) return;
      Mega.settings.ghToken = t; Mega.saveSettings();
      await Mega.github.render();
      Mega.toast('Checking token…', '', 'info', 1500);
    };
    return;
  }
  box.innerHTML = '<div class="empty"><span class="typing"><i></i><i></i><i></i></span></div>';
  try {
    const me = await Mega.github.api('/user');
    const repos = await Mega.github.api('/user/repos?per_page=100&sort=updated');
    Mega.$('#ghHead').innerHTML = `
      <div class="card row" style="gap:16px">
        <img class="gh-avatar" src="${Mega.esc(me.avatar_url)}" alt="">
        <div class="grow"><div style="font-weight:800;font-size:17px">${Mega.esc(me.name || me.login)}</div>
        <div style="color:var(--text2);font-size:13px">@${Mega.esc(me.login)} · ${repos.length} repo(s)</div></div>
        <span class="pill ok">● Connected</span>
        <button class="btn sm danger" id="ghDisc">Disconnect</button>
      </div>`;
    Mega.$('#ghDisc').onclick = () => { Mega.settings.ghToken = ''; Mega.saveSettings(); Mega.github.render(); Mega.$('#ghHead').innerHTML = ''; Mega.toast('Disconnected', 'Token removed from this device.', 'ok'); };
    box.innerHTML = `
      <div class="row" style="margin-bottom:14px">
        <input class="inp" id="ghSearch" placeholder="🔍 Search your repos…">
        <button class="btn" id="ghNewRepo2">➕ New repo</button>
      </div>
      <div id="ghRepos"></div>`;
    const renderRepos = (f = '') => {
      const list = repos.filter(r => r.name.toLowerCase().includes(f));
      Mega.$('#ghRepos').innerHTML = list.map(r => `
        <div class="repo-row" data-repo="${Mega.esc(r.full_name)}" data-private="${r.private}">
          <span style="font-size:20px">${r.private ? '🔒' : '📖'}</span>
          <div class="grow"><div class="rn">${Mega.esc(r.name)}</div><div class="rd">${Mega.esc(r.description || 'no description')}</div></div>
          <div class="rm"><span>⭐ ${r.stargazers_count}</span><span>⑂ ${r.forks_count}</span><span>${r.language || '—'}</span></div>
        </div>`).join('') || '<div class="empty"><div class="big">📭</div>No matching repos</div>';
      Mega.$$('#ghRepos .repo-row').forEach(row => row.onclick = () => Mega.github.repoMenu(row.dataset.repo));
    };
    renderRepos();
    Mega.$('#ghSearch').oninput = (e) => renderRepos(e.target.value.toLowerCase());
    Mega.$('#ghNewRepo2').onclick = () => Mega.github.createRepoDialog();
  } catch (e) {
    box.innerHTML = `<div class="empty"><div class="big">⚠️</div><h3 style="color:var(--text)">Token check failed</h3>
      <p>${Mega.esc(e.detail || e.message)}<br>Make sure the token is valid and has <b>repo</b> scope.</p></div>`;
    Mega.settings.ghToken = ''; Mega.saveSettings();
  }
};

Mega.github.repoMenu = (fullName) => {
  Mega.modal('📦 ' + fullName, 'What should Mega Power AI do with this repo?',
    `<button class="btn primary" style="width:100%;margin-bottom:10px" data-a="import">⬇️ Import as project (editable in Code Studio)</button>
     <button class="btn" style="width:100%" data-a="open">🌐 Open on github.com</button>`,
    { onMount(w, close) {
        w.onclick = async (e) => {
          const a = e.target.closest('[data-a]')?.dataset.a;
          if (a === 'open') { window.open('https://github.com/' + fullName, '_blank'); close(null); }
          if (a === 'import') { close(null); Mega.github.importRepo(fullName); }
        };
      } });
};

Mega.github.importRepo = async (fullName) => {
  const tid = Mega.toast('Importing repo…', fullName, 'info', 15000);
  try {
    const tree = await Mega.github.api(`/repos/${fullName}/git/trees/HEAD?recursive=1`);
    const files = [];
    for (const it of (tree.tree || []).slice(0, 200)) {
      if (it.type !== 'blob' || it.size > 400000) continue;
      if (!/\.(html|css|js|jsx|ts|tsx|json|md|py|txt|svg|yml|yaml)$/i.test(it.path)) continue;
      try {
        const meta = await Mega.github.api(`/repos/${fullName}/contents/${encodeURIComponent(it.path)}`);
        if (meta.content) files.push({ path: it.path, content: atob(meta.content.replace(/\n/g, '')) });
      } catch {}
    }
    if (!files.length) throw new Error('No editable text files found');
    await Mega.projects.save(fullName.split('/')[1], files, 'imported from github:' + fullName);
    Mega.toast('Repo imported ✅', files.length + ' files → My Projects. Open it in Code Studio!', 'ok', 5000);
    Mega.go('projects');
  } catch (e) {
    Mega.toast('Import failed', e.detail || e.message || String(e), 'err', 6000);
  }
};

Mega.github.createRepoDialog = () => {
  if (!Mega.github.token()) return Mega.toast('Connect first', 'Paste your token to create repos.', 'warn');
  Mega.modal('➕ Create a new repository', 'Mega Power AI will create it under your account and push your project there.',
    `<label class="lbl">REPO NAME</label><input class="inp" id="nrName" placeholder="my-mega-app">
     <label class="lbl">DESCRIPTION</label><input class="inp" id="nrDesc" placeholder="Built with Mega Power AI ⚡">
     <div class="set-row" style="margin-top:14px"><div class="si">🔒</div><div class="grow"><div class="st">Private repository</div><div class="sd">Only you can see it</div></div><label class="switch"><input type="checkbox" id="nrPriv" checked><i></i></label></div>
     <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn primary" id="nrGo">Create 🚀</button></div>`,
    { onMount(w, close) {
        Mega.$('#nrGo', w).onclick = async () => {
          const name = Mega.$('#nrName', w).value.trim().replace(/\s+/g, '-');
          if (!name) return Mega.toast('Name needed', '', 'warn');
          try {
            Mega.$('#nrGo', w).disabled = true; Mega.$('#nrGo', w).textContent = 'Creating…';
            await Mega.github.api('/user/repos', { method: 'POST', body: JSON.stringify({ name, description: Mega.$('#nrDesc', w).value || 'Built with Mega Power AI ⚡', private: Mega.$('#nrPriv', w).checked, auto_init: true }) });
            close(null);
            Mega.toast('Repo created 🎉', name + ' is live on your GitHub.', 'ok');
            Mega.github.render();
          } catch (e) { Mega.toast('Create failed', e.detail || e.message, 'err'); Mega.$('#nrGo', w).disabled = false; Mega.$('#nrGo', w).textContent = 'Create 🚀'; }
        };
      } });
};

/* push files to a repo (Contents API, one commit per file) */
Mega.github.pushFiles = async (repoFullName, files, message) => {
  let n = 0;
  for (const f of files) {
    let sha = null;
    try { const ex = await Mega.github.api(`/repos/${repoFullName}/contents/${encodeURI(f.path)}`); sha = ex.sha; } catch {}
    await Mega.github.api(`/repos/${repoFullName}/contents/${encodeURI(f.path)}`, {
      method: 'PUT',
      body: JSON.stringify({ message: `${message} (${++n}/${files.length})`, content: Mega.github.b64(f.content), ...(sha ? { sha } : {}) })
    });
  }
  return n;
};

Mega.github.pushDialog = async (projName, files) => {
  if (!Mega.github.token()) { Mega.toast('Connect GitHub first', 'GitHub tab → paste your Personal Access Token.', 'warn', 5000); Mega.go('github'); return; }
  let repos = [];
  try { repos = await Mega.github.api('/user/repos?per_page=100&sort=updated'); } catch {}
  Mega.modal('🐙 Push “' + Mega.esc(projName) + '” to GitHub', 'Choose an existing repo — or create a brand new one.',
    `<label class="lbl">DESTINATION</label>
     <select class="inp" id="pdRepo">
       ${repos.map(r => `<option value="${Mega.esc(r.full_name)}">${r.private ? '🔒' : '📖'} ${Mega.esc(r.full_name)}</option>`).join('')}
       <option value="__new">✨ … create a NEW repo</option>
     </select>
     <label class="lbl">COMMIT MESSAGE</label>
     <input class="inp" id="pdMsg" value="⚡ Built with Mega Power AI">
     <div class="row" style="justify-content:flex-end;margin-top:16px">
       <button class="btn ghost" data-x>Cancel</button>
       <button class="btn primary" id="pdGo">⬆️ Push ${files.length} file(s)</button>
     </div>`,
    { onMount(w, close) {
        w.onclick = (e) => { if (e.target.hasAttribute('data-x')) close(null); };
        Mega.$('#pdGo', w).onclick = async () => {
          let repo = Mega.$('#pdRepo', w).value;
          const btn = Mega.$('#pdGo', w);
          try {
            btn.disabled = true; btn.textContent = '⬆️ Pushing…';
            if (repo === '__new') {
              const name = projName.replace(/[^\w.-]+/g, '-').toLowerCase();
              const r = await Mega.github.api('/user/repos', { method: 'POST', body: JSON.stringify({ name, description: 'Built with Mega Power AI ⚡', auto_init: true }) });
              repo = r.full_name;
            }
            const msg = Mega.$('#pdMsg', w).value || '⚡ Built with Mega Power AI';
            await Mega.github.pushFiles(repo, files, msg);
            close(null);
            Mega.toast('Pushed to GitHub ✅', repo + ' — ' + files.length + ' files committed.', 'ok', 5000);
          } catch (e) {
            Mega.toast('Push failed', e.detail || e.message || String(e), 'err', 6000);
            btn.disabled = false; btn.textContent = '⬆️ Push ' + files.length + ' file(s)';
          }
        };
      } });
};

/* used by background jobs (dest = github) */
Mega.github.pushAuto = async (name, files) => {
  const repoName = name.replace(/[^\w.-]+/g, '-').toLowerCase();
  let full;
  try {
    const r = await Mega.github.api('/user/repos', { method: 'POST', body: JSON.stringify({ name: repoName, description: 'Built with Mega Power AI ⚡', auto_init: true }) });
    full = r.full_name;
  } catch (e) {
    if (e.status === 422) full = (await Mega.github.api('/user')).login + '/' + repoName;
    else throw e;
  }
  await Mega.github.pushFiles(full, files, '⚡ Built with Mega Power AI');
  return full;
};
