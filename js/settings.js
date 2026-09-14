/* ============================================================
   MEGA POWER AI — settings.js  |  models, keys, theme, data
   ============================================================ */
'use strict';
window.Mega = window.Mega || {};
Mega.settingsUI = {};

Mega.settingsUI.init = () => {
  const p = Mega.$('#page-settings');
  if (p.dataset.init) return; p.dataset.init = '1';

  /* theme */
  Mega.$$('#themePick .btn').forEach(b => b.onclick = () => {
    Mega.$$('#themePick .btn').forEach(x => x.classList.remove('primary'));
    b.classList.add('primary');
    Mega.settings.theme = b.dataset.theme;
    Mega.saveSettings(); Mega.applyTheme();
  });
  /* accent */
  Mega.$$('.accent-dot').forEach(d => d.onclick = () => {
    Mega.$$('.accent-dot').forEach(x => x.classList.remove('sel'));
    d.classList.add('sel');
    Mega.settings.accent = +d.dataset.acc;
    Mega.saveSettings(); Mega.applyTheme();
  });
  /* toggles */
  const bindSwitch = (id, key, cb) => { const el = Mega.$(id); el.checked = !!Mega.settings[key]; el.onchange = () => { Mega.settings[key] = el.checked; Mega.saveSettings(); cb && cb(); }; };
  bindSwitch('#setAnim', 'anim');
  bindSwitch('#setTurbo', 'turbo');
  bindSwitch('#setAuto', 'autocorrect');
  /* model default */
  Mega.$('#setModel').innerHTML = Mega.ai.models.map(m => `<option value="${m.id}">${Mega.esc(m.group)} — ${Mega.esc(m.name)}</option>`).join('');
  Mega.$('#setModel').value = Mega.settings.model;
  Mega.$('#setModel').onchange = () => { Mega.settings.model = Mega.$('#setModel').value; Mega.saveSettings(); if (Mega.uiRenderModels) Mega.uiRenderModels(); Mega.toast('Model switched ⚡', Mega.ai.modelById(Mega.settings.model).name, 'ok', 1800); };
  /* API keys */
  const keyBox = Mega.$('#keyList');
  keyBox.innerHTML = Object.entries(Mega.ai.providers).filter(([id, pv]) => pv.keyUrl).map(([id, pv]) => `
    <div class="set-row" style="align-items:flex-start;flex-wrap:wrap">
      <div class="si">🔑</div>
      <div class="grow" style="min-width:200px">
        <div class="st">${Mega.esc(pv.name)}</div>
        <div class="sd">${pv.free ? 'Has a free tier 🎁' : 'Paid provider'} · key stays on this device</div>
        <div class="row" style="margin-top:8px;flex-wrap:wrap">
          <input class="inp" type="password" style="max-width:340px" data-key="${id}" placeholder="paste ${Mega.esc(id)} key…" value="${Mega.esc((Mega.settings.keys || {})[id] || '')}">
          <button class="btn sm" data-test="${id}">Test</button>
          <a class="btn sm ghost" href="${pv.keyUrl}" target="_blank" rel="noopener">Get key ↗</a>
        </div>
      </div>
    </div>`).join('');
  keyBox.addEventListener('input', (e) => {
    const inp = e.target.closest('[data-key]'); if (!inp) return;
    Mega.settings.keys = Mega.settings.keys || {};
    Mega.settings.keys[inp.dataset.key] = inp.value.trim();
    Mega.saveSettings();
  });
  keyBox.addEventListener('click', async (e) => {
    const t = e.target.closest('[data-test]'); if (!t) return;
    t.textContent = '⏳ testing…';
    const r = await Mega.ai.test(t.dataset.test);
    t.textContent = 'Test';
    Mega.toast(r.ok ? 'Connected ✅' : 'Not working', r.msg, r.ok ? 'ok' : 'err', 5000);
  });
  /* data */
  Mega.$('#setExport').onclick = async () => {
    const data = { settings: Mega.settings, user: Mega.user, exported: new Date().toISOString() };
    const keys = await Mega.idb.keys('kv');
    data.store = {};
    for (const k of keys) data.store[k] = await Mega.idb.get('kv', k);
    const blob = new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' });
    Mega.zip.save(blob, 'mega-power-ai-backup.json');
    Mega.toast('Backup exported 💾', 'All chats, projects & settings in one file.', 'ok');
  };
  Mega.$('#setImport').onclick = () => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.json';
    inp.onchange = async () => {
      try {
        const data = JSON.parse(await inp.files[0].text());
        if (data.settings) { Mega.settings = Object.assign(Mega.settings, data.settings); Mega.saveSettings(); }
        if (data.store) for (const [k, v] of Object.entries(data.store)) await Mega.idb.set('kv', k, v);
        Mega.toast('Backup restored ✅', 'Reloading…', 'ok');
        setTimeout(() => location.reload(), 1200);
      } catch (e) { Mega.toast('Import failed', 'Not a valid backup file.', 'err'); }
    };
    inp.click();
  };
  Mega.$('#setClear').onclick = async () => {
    if (!(await Mega.confirm('Delete ALL data?', 'Every chat, project, image history and key on this device will be erased. This cannot be undone.'))) return;
    localStorage.clear();
    const keys = await Mega.idb.keys('kv');
    for (const k of keys) await Mega.idb.del('kv', k);
    location.reload();
  };
  Mega.$('#setLogout').onclick = () => { Mega.setUser(null); Mega.toast('Logged out', 'See you soon! 👋', 'ok'); };
  Mega.$('#setLogin').onclick = () => Mega.authOpen();
};
