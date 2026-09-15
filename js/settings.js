/* ============================================================
   MEGA POWER AI — settings.js  |  the searchable settings hub
   Everything configurable: models, API keys, search, image,
   video, appearance, account, data — plus About App.
   Created by Umesh Chaudhary.
   ============================================================ */
'use strict';
window.Mega = window.Mega || {};
Mega.settingsUI = {};

Mega.settingsUI.init = () => {
  const body = Mega.$('#settingsBody');
  body.innerHTML = Mega.settingsUI.html();
  Mega.settingsUI.bind();
  Mega.$('#setSearch').oninput = (e) => Mega.settingsUI.filter(e.target.value.toLowerCase());
};

Mega.settingsUI.html = () => {
  const s = Mega.settings;
  const keyRows = Object.entries(Mega.ai.providers).filter(([id, p]) => p.keyUrl).map(([id, p]) => `
    <div class="set-item card" data-tags="api key ${id} ${Mega.esc(p.name.toLowerCase())} token provider">
      <div class="row"><b>${Mega.esc(p.name)}</b>
        ${Mega.ai.hasKey(id) ? '<span class="pill ok">● key saved</span>' : `<span class="pill">${p.free ? 'free tier available' : 'paid provider'}</span>`}</div>
      <div class="row" style="margin-top:10px;flex-wrap:wrap">
        <input class="inp" type="password" style="flex:1;min-width:170px" data-keyin="${id}" placeholder="paste ${id} key — stays on this device" value="${Mega.esc((s.keys || {})[id] || '')}">
        <button class="btn sm" data-keysave="${id}">💾 Save</button>
        <button class="btn sm" data-keytest="${id}">⚡ Test</button>
        ${(s.keys || {})[id] ? `<button class="btn sm danger" data-keydel="${id}">🗑 Delete</button>` : ''}
        <a class="btn sm ghost" href="${p.keyUrl}" target="_blank" rel="noopener">Get key ↗</a>
      </div>
    </div>`).join('');

  return `
  <div class="set-head">
    <h2>⚙️ Settings</h2>
    <input class="inp" id="setSearch" placeholder="🔍 Search settings — theme, keys, search, image, video, about…">
    <div id="setCount" style="font-size:11.5px;color:var(--text3);margin-top:6px"></div>
  </div>

  <div class="set-item card" data-tags="model ai engine default chatgpt gpt gemini claude deepseek grok llama">
    <div class="set-sec-t">🧠 AI & Models</div>
    <label class="lbl">DEFAULT MODEL (${Mega.ai.models.length} available — switch anytime from the top bar)</label>
    <select class="inp" id="setModel">${Mega.ai.models.map(m => `<option value="${m.id}" ${m.id === s.model ? 'selected' : ''}>${Mega.esc(m.group)} — ${Mega.esc(m.name)}</option>`).join('')}</select>
    <label class="lbl">CUSTOM INSTRUCTIONS (system prompt — how I should behave)</label>
    <textarea class="inp" id="setSys" rows="2" placeholder="e.g. Always answer short and simple. I am a beginner.">${Mega.esc(s.sysPrompt || '')}</textarea>
    <div class="set-row"><div class="si">⚡</div><div class="grow"><div class="st">Turbo mode (4X faster streaming)</div></div><label class="switch"><input type="checkbox" id="setTurbo" ${s.turbo ? 'checked' : ''}><i></i></label></div>
    <div class="set-row"><div class="si">💡</div><div class="grow"><div class="st">Smart suggestions</div><div class="sd">Show "what next?" chips after every answer</div></div><label class="switch"><input type="checkbox" id="setSuggest" ${s.suggest !== false ? 'checked' : ''}><i></i></label></div>
  </div>

  <div class="set-item card" data-tags="agent mode autonomous tools plan search generate steps autonomous">
    <div class="set-sec-t">🤖 Agent Mode</div>
    <div class="set-row"><div class="si">🤖</div><div class="grow"><div class="st">Agent mode by default</div><div class="sd">Every message: I plan, use tools (web search, images, apps, videos) and finish the whole task — showing each step</div></div><label class="switch"><input type="checkbox" id="setAgent" ${s.agent ? 'checked' : ''}><i></i></label></div>
    <p style="font-size:12px;color:var(--text3);margin-top:8px">Toggle it any time with the <b>🤖 Agent</b> chip under the chat box or the ＋ menu. Command: <code>/agent</code></p>
  </div>

  <div class="set-item card" data-tags="api keys openai gemini anthropic groq openrouter deepseek xai mistral token paste delete edit">
    <div class="set-sec-t">🔑 API Keys — permanent, editable, deletable</div>
    <p style="font-size:12.5px;color:var(--text2);margin-bottom:12px;line-height:1.6">Paste a key once — it is saved permanently on this device and every model of that provider works instantly with it. Nothing is uploaded anywhere by Mega Power AI. <b>You never need a key</b> (MegaAI Free is the default).</p>
    ${keyRows}
  </div>

  <div class="set-item card" data-tags="search engine web google wikipedia live news real-time">
    <div class="set-sec-t">🔍 Web Search</div>
    <label class="lbl">WHEN SHOULD I SEARCH THE WEB?</label>
    <select class="inp" id="setSearchMode">
      <option value="smart" ${s.searchMode === 'smart' ? 'selected' : ''}>Smart (auto — news, prices, "who is", latest…)</option>
      <option value="always" ${s.searchMode === 'always' ? 'selected' : ''}>Always search (search-engine mode)</option>
      <option value="off" ${s.searchMode === 'off' ? 'selected' : ''}>Never (answers from model knowledge)</option>
    </select>
    <p style="font-size:12px;color:var(--text3);margin-top:8px">Live results from Wikipedia + DuckDuckGo, cited as source chips under the answer.</p>
  </div>

  <div class="set-item card" data-tags="image generation poster flyer quality style engine size count watermark">
    <div class="set-sec-t">🖼 Image Generation</div>
    <div class="grid2">
      <div><label class="lbl">ENGINE</label>
        <select class="inp" id="setImgEngine">
          <option value="auto" ${s.imageEngine === 'auto' ? 'selected' : ''}>Auto — best available</option>
          <option value="openai" ${s.imageEngine === 'openai' ? 'selected' : ''}>OpenAI gpt-image-1 (needs key)</option>
          <option value="free" ${s.imageEngine === 'free' ? 'selected' : ''}>Free Flux engine</option>
        </select></div>
      <div><label class="lbl">DEFAULT STYLE</label>
        <select class="inp" id="setImgStyle">
          ${[['poster', '🪧 Poster / flyer'], ['social', '📱 Social post'], ['realistic', '📷 Realistic photo'], ['cinematic', '🎞 Cinematic'], ['anime', '🌸 Anime'], ['3d', '🧊 3D render'], ['digital', '🖌 Digital art'], ['cyberpunk', '🌃 Cyberpunk'], ['watercolor', '💧 Watercolor'], ['minimal', '⬜ Minimal'], ['logo', '✳️ Logo'], ['thumbnail', '📺 Thumbnail'], ['', 'No style (pure prompt)']]
            .map(([v, l]) => `<option value="${v}" ${s.imageStyle === v ? 'selected' : ''}>${l}</option>`).join('')}
        </select></div>
    </div>
    <div class="grid2">
      <div><label class="lbl">DEFAULT SIZE</label>
        <select class="inp" id="setImgSize">${['1:1', '16:9', '9:16', '4:3', '3:4'].map(r => `<option ${s.imageSize === r ? 'selected' : ''}>${r}</option>`).join('')}</select></div>
      <div><label class="lbl">IMAGES PER REQUEST (less waste)</label>
        <select class="inp" id="setImgCount">${[1, 2, 3, 4].map(n => `<option ${(+s.imageCount || 1) === n ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
    </div>
    <p style="font-size:12px;color:var(--text3);margin-top:8px">✨ No watermarks, ever. With an OpenAI key you get ChatGPT-grade (gpt-image-1) results.</p>
  </div>

  <div class="set-item card" data-tags="video duration resolution fps music watermark long short reel">
    <div class="set-sec-t">🎬 Video Generation</div>
    <div class="grid2">
      <div><label class="lbl">LENGTH</label>
        <select class="inp" id="setVidDur">
          ${Object.entries(Mega.media.videoPresets).map(([k, v]) => `<option value="${k}" ${s.videoDuration === k ? 'selected' : ''}>${v.label}</option>`).join('')}
        </select></div>
      <div><label class="lbl">RESOLUTION</label>
        <select class="inp" id="setVidRes">${['854x480', '1280x720', '1920x1080'].map(r => `<option ${s.videoResolution === r ? 'selected' : ''}>${r}</option>`).join('')}</select></div>
    </div>
    <div class="grid2">
      <div><label class="lbl">FPS</label><select class="inp" id="setVidFps">${[24, 30].map(f => `<option ${+s.videoFps === f ? 'selected' : ''}>${f}</option>`).join('')}</select></div>
      <div><label class="lbl">MUSIC</label>
        <div class="set-row" style="padding:0;border:none;margin:4px 0 0"><div class="sd">Ambient auto-soundtrack</div><label class="switch" style="margin-left:auto"><input type="checkbox" id="setVidMusic" ${s.videoMusic !== false ? 'checked' : ''}><i></i></label></div></div>
    </div>
    <p style="font-size:12px;color:var(--text3);margin-top:8px">Free & unlimited. Every video is encoded on your device — <b>no watermark</b>, download as .webm, ready for YouTube / Reels / Shorts.</p>
  </div>

  <div class="set-item card" data-tags="theme dark light mode accent color animation appearance">
    <div class="set-sec-t">🎨 Appearance</div>
    <div class="set-row"><div class="si">🌗</div><div class="grow"><div class="st">Theme</div></div>
      <div class="row" id="themePick">
        <button class="btn sm ${s.theme !== 'light' ? 'primary' : ''}" data-theme="dark">🌙 Dark</button>
        <button class="btn sm ${s.theme === 'light' ? 'primary' : ''}" data-theme="light">☀️ Light</button>
      </div></div>
    <div class="set-row"><div class="si">🌈</div><div class="grow"><div class="st">Accent color</div></div>
      <div class="accent-dots">${[0, 1, 2, 3, 4].map(i => `<div class="accent-dot ${+s.accent === i ? 'sel' : ''}" data-acc="${i}"></div>`).join('')}</div></div>
    <div class="set-row"><div class="si">✨</div><div class="grow"><div class="st">Animations</div><div class="sd">Background motion & transitions</div></div><label class="switch"><input type="checkbox" id="setAnim" ${s.anim ? 'checked' : ''}><i></i></label></div>
  </div>

  <div class="set-item card" data-tags="account profile login signup logout user google facebook phone">
    <div class="set-sec-t">👤 Account</div>
    <div class="set-row"><div class="si">🙂</div><div class="grow"><div class="st" id="accName">${Mega.esc(Mega.user ? (Mega.user.name || 'User') : 'Guest')}</div><div class="sd" id="accEmail">${Mega.esc(Mega.user ? (Mega.user.email || '') : 'not logged in')}</div></div>
      ${Mega.user ? '<button class="btn sm danger" id="setLogout">Log out</button>' : '<button class="btn sm primary" id="setLogin">Log in</button> <button class="btn sm" id="setSignup">Sign up</button>'}</div>
  </div>

  <div class="set-item card" data-tags="data privacy export import backup delete clear storage">
    <div class="set-sec-t">💾 Data & Privacy</div>
    <p style="font-size:12.5px;color:var(--text2);margin-bottom:12px">Everything (chats, projects, keys, images) is stored <b>only on this device</b>. Nothing is uploaded by Mega Power AI.</p>
    <div class="row" style="flex-wrap:wrap">
      <button class="btn" id="setExport">⬇️ Export backup</button>
      <button class="btn" id="setImport">⬆️ Import backup</button>
      <button class="btn danger" id="setClear">🗑 Delete all data</button>
    </div>
  </div>

  <div class="set-item card" data-tags="about app version creator umesh chaudhary secret project features credits">
    <div class="set-sec-t">ℹ️ About App</div>
    <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">
      <img src="assets/icons/icon-192.png" style="width:74px;height:74px;border-radius:20px;box-shadow:0 0 30px rgba(109,93,252,.5)" alt="">
      <div><b style="font-size:16px">Mega Power AI</b> <span class="pill">v1.2</span>
        <div style="color:var(--text2);font-size:13px;margin-top:4px">Created by <b>Umesh Chaudhary</b> 👑</div>
        <div style="color:var(--text3);font-size:12px;margin-top:2px">🔒 Secret project · No limits · Free forever</div></div>
    </div>
    <p style="font-size:13px;color:var(--text2);margin-top:14px;line-height:1.8">
      The world's fastest and most powerful AI platform of the generation — <b>no limits, no issues</b>.
      One chat box that chats like ChatGPT, builds apps from a single prompt, designs professional posters &amp; images,
      makes real videos, searches the web live and connects to GitHub. Tell it your ideas — <b>it makes them real</b>.
    </p>
    <div class="row" style="flex-wrap:wrap;gap:7px;margin-top:12px">
      <span class="pill">${Mega.ai.models.length}+ AI models</span><span class="pill ok">Web search</span><span class="pill">Image engine</span><span class="pill">Video maker</span><span class="pill">GitHub connect</span><span class="pill">Offline mode</span><span class="pill">Installable app</span>
    </div>
    <div class="row" style="margin-top:14px;flex-wrap:wrap">
      <a class="btn sm" href="https://github.com/Lucifer940/Mega-power-Ai" target="_blank" rel="noopener">🐙 GitHub repository</a>
      <a class="btn sm ghost" href="privacy-policy.html" target="_blank">Privacy policy</a>
    </div>
  </div>`;
};

Mega.settingsUI.bind = () => {
  const body = Mega.$('#settingsBody');
  const s = Mega.settings;

  body.oninput = (e) => {
    const t = e.target;
    if (t.id === 'setSys') { s.sysPrompt = t.value; Mega.saveSettings(); }
    if (t.closest('[data-keyin]')) { /* typed — saved on button */ }
  };
  body.onchange = (e) => {
    const t = e.target;
    if (t.id === 'setModel') { s.model = t.value; Mega.saveSettings(); if (Mega.uiRenderModels) Mega.uiRenderModels(); Mega.toast('Model switched ⚡', Mega.ai.modelById(s.model).name, 'ok', 1800); }
    if (t.id === 'setSearchMode') { s.searchMode = t.value; Mega.saveSettings(); }
    if (t.id === 'setImgEngine') { s.imageEngine = t.value; Mega.saveSettings(); }
    if (t.id === 'setImgStyle') { s.imageStyle = t.value; Mega.saveSettings(); }
    if (t.id === 'setImgSize') { s.imageSize = t.value; Mega.saveSettings(); }
    if (t.id === 'setImgCount') { s.imageCount = +t.value; Mega.saveSettings(); }
    if (t.id === 'setVidDur') { s.videoDuration = t.value; Mega.saveSettings(); }
    if (t.id === 'setVidRes') { s.videoResolution = t.value; Mega.saveSettings(); }
    if (t.id === 'setVidFps') { s.videoFps = +t.value; Mega.saveSettings(); }
    if (t.id === 'setVidMusic') { s.videoMusic = t.checked; Mega.saveSettings(); }
    if (t.id === 'setTurbo') { s.turbo = t.checked; Mega.saveSettings(); }
    if (t.id === 'setSuggest') { s.suggest = t.checked; Mega.saveSettings(); }
    if (t.id === 'setAgent') { s.agent = t.checked; Mega.saveSettings(); if (Mega.agent && Mega.agent.syncUI) Mega.agent.syncUI(); }
    if (t.id === 'setAnim') { s.anim = t.checked; Mega.saveSettings(); Mega.applyTheme(); }
  };
  body.onclick = async (e) => {
    const t = e.target;
    const themeBtn = t.closest('#themePick [data-theme]');
    if (themeBtn) { s.theme = themeBtn.dataset.theme; Mega.saveSettings(); Mega.applyTheme(); Mega.$$('#themePick .btn').forEach(b => b.classList.toggle('primary', b === themeBtn)); return; }
    const acc = t.closest('.accent-dot');
    if (acc) { s.accent = +acc.dataset.acc; Mega.saveSettings(); Mega.applyTheme(); Mega.$$('.accent-dot').forEach(d => d.classList.toggle('sel', d === acc)); return; }
    const save = t.closest('[data-keysave]');
    if (save) {
      const id = save.dataset.keysave;
      const inp = Mega.$(`[data-keyin="${id}"]`, body);
      s.keys = s.keys || {};
      s.keys[id] = inp.value.trim();
      Mega.saveSettings();
      Mega.toast('Key saved ✅', Mega.ai.providers[id].name + ' — all its models now use your key. Saved permanently.', 'ok');
      Mega.settingsUI.init(); body.scrollIntoView();
      return;
    }
    const test = t.closest('[data-keytest]');
    if (test) {
      test.textContent = '⏳ testing…';
      const id = test.dataset.keytest;
      const inp = Mega.$(`[data-keyin="${id}"]`, body);
      if (inp.value.trim() && inp.value.trim() !== (s.keys || {})[id]) { s.keys = s.keys || {}; s.keys[id] = inp.value.trim(); Mega.saveSettings(); }
      const r = await Mega.ai.test(id);
      test.textContent = '⚡ Test';
      Mega.toast(r.ok ? 'Connected ✅' : 'Not working', r.msg, r.ok ? 'ok' : 'err', 5500);
      return;
    }
    const del = t.closest('[data-keydel]');
    if (del) {
      const id = del.dataset.keydel;
      delete s.keys[id];
      Mega.saveSettings();
      Mega.toast('Key deleted', Mega.ai.providers[id].name + ' key removed from this device.', 'ok');
      Mega.settingsUI.init();
      return;
    }
    if (t.closest('#setLogin')) { Mega.drawer.close(); Mega.authOpen('login'); return; }
    if (t.closest('#setSignup')) { Mega.drawer.close(); Mega.authOpen('signup'); return; }
    if (t.closest('#setLogout')) { Mega.setUser(null); Mega.toast('Logged out', 'See you soon! 👋', 'ok'); Mega.settingsUI.init(); return; }
    if (t.closest('#setExport')) return Mega.settingsUI.exportAll();
    if (t.closest('#setImport')) return Mega.settingsUI.importAll();
    if (t.closest('#setClear')) return Mega.settingsUI.clearAll();
  };
};

/* live search filter (feature: search & change anything) */
Mega.settingsUI.filter = (q) => {
  const items = Mega.$$('#settingsBody .set-item');
  if (!q) { items.forEach(i => i.style.display = ''); Mega.$('#setCount').textContent = ''; return; }
  let hits = 0;
  items.forEach(i => {
    const hay = (i.dataset.tags + ' ' + i.textContent).toLowerCase();
    const show = hay.includes(q);
    i.style.display = show ? '' : 'none';
    if (show) hits++;
  });
  Mega.$('#setCount').textContent = hits ? `${hits} setting section${hits > 1 ? 's' : ''} found` : 'nothing found — try: theme, keys, search, image, video, about';
};

Mega.settingsUI.exportAll = async () => {
  const data = { settings: Mega.settings, user: Mega.user, exported: new Date().toISOString(), store: {} };
  for (const k of await Mega.idb.keys('kv')) data.store[k] = await Mega.idb.get('kv', k);
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  Mega.zip.save(blob, 'mega-power-ai-backup.json');
  Mega.toast('Backup exported 💾', 'All chats, projects & settings in one file.', 'ok');
};
Mega.settingsUI.importAll = () => {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = '.json';
  inp.onchange = async () => {
    try {
      const data = JSON.parse(await inp.files[0].text());
      if (data.settings) { Object.assign(Mega.settings, data.settings); Mega.saveSettings(); }
      if (data.store) for (const [k, v] of Object.entries(data.store)) await Mega.idb.set('kv', k, v);
      Mega.toast('Backup restored ✅', 'Reloading…', 'ok');
      setTimeout(() => location.reload(), 1100);
    } catch { Mega.toast('Import failed', 'Not a valid backup file.', 'err'); }
  };
  inp.click();
};
Mega.settingsUI.clearAll = async () => {
  if (!(await Mega.confirm('Delete ALL data?', 'Every chat, project, image history and key on this device will be erased. This cannot be undone.'))) return;
  localStorage.clear();
  for (const k of await Mega.idb.keys('kv')) await Mega.idb.del('kv', k);
  location.reload();
};
