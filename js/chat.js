/* ============================================================
   MEGA POWER AI — chat.js  |  THE all-in-one chat box
   One box does everything, like ChatGPT / LMArena:
   chat · images · videos · app building · web search · commands.
   Created by Umesh Chaudhary.
   ============================================================ */
'use strict';
window.Mega = window.Mega || {};
Mega.chat = { convs: [], active: null, busy: false, abort: null, lastCtx: {} };

Mega.chat.init = () => {
  if (Mega.chat._init) return; Mega.chat._init = true;
  const send = Mega.$('#chatSend');
  send.innerHTML = Mega.icon('send');
  Mega.$('#chatNewBtn').onclick = () => Mega.chat.newConv();
  Mega.$('#chatConvBtn') && (Mega.$('#chatConvBtn').onclick = () => Mega.$('#sidebar')?.classList.toggle('open'));
  Mega.$$('#sidebar .nav-item, #sidebar .brand, #sidebar #sbUser, #sidebar #chatNewBtn').forEach(n => n.addEventListener('click', () => Mega.$('#sidebar')?.classList.remove('open')));
  Mega.$('#main')?.addEventListener('click', () => { const sb = Mega.$('#sidebar'); if (sb?.classList.contains('open')) sb.classList.remove('open'); });
  const ta = Mega.$('#chatInput');
  ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); Mega.chat.send(); } });
  ta.addEventListener('input', () => { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 170) + 'px'; });
  send.onclick = () => (Mega.chat.busy ? Mega.chat.stop() : Mega.chat.send());
  Mega.$('#chatMsgs').addEventListener('click', Mega.chat.onBubbleClick);

  /* tools menu (＋ button) */
  const tm = Mega.$('#toolsMenu');
  if (tm) {
    tm.innerHTML = `
      <button class="tm-item" data-t="image"><span class="ti2">🖼</span>Generate an image</button>
      <button class="tm-item" data-t="video"><span class="ti2">🎬</span>Create a video</button>
      <button class="tm-item" data-t="build"><span class="ti2">🧑‍💻</span>Build an app / website</button>
      <button class="tm-item" data-t="search"><span class="ti2">🔍</span>Search the web</button>
      <button class="tm-item" id="tmAgent"><span class="ti2">🤖</span>Agent mode — plan &amp; use tools</button>`;
    Mega.$$('#toolsMenu [data-t]').forEach(b => b.onclick = () => {
      const cmd = { image: '/image ', video: '/video ', build: '/build ', search: '/search ' }[b.dataset.t];
      tm.classList.remove('open');
      ta.value = cmd; ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length);
    });
    Mega.$('#tmAgent').onclick = () => { tm.classList.remove('open'); Mega.agent.toggle(); };
    Mega.$('#toolsBtn').onclick = (e) => { e.stopPropagation(); tm.classList.toggle('open'); };
  }
  /* agent toggle chip */
  const ag = Mega.$('#agentToggle');
  if (ag) ag.onclick = () => Mega.agent.toggle();
  if (Mega.agent.syncUI) Mega.agent.syncUI();

  /* voice input (real speech recognition where supported) */
  const mic = Mega.$('#micBtn');
  if (mic) mic.onclick = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return Mega.toast('Voice input not supported', 'Your browser has no speech recognition — type instead.', 'warn');
    if (mic.classList.contains('on')) return; /* already listening */
    const rec = new SR();
    rec.lang = navigator.language || 'en-US';
    rec.interimResults = true;
    mic.classList.add('on');
    ta.placeholder = 'Listening… speak now';
    rec.onresult = (e) => { ta.value = [...e.results].map(r => r[0].transcript).join(''); ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 170) + 'px'; };
    rec.onend = () => { mic.classList.remove('on'); ta.placeholder = 'Message Mega Power AI…'; if (ta.value.trim()) Mega.chat.send(); };
    rec.onerror = () => { mic.classList.remove('on'); ta.placeholder = 'Message Mega Power AI…'; Mega.toast('Voice input', 'No speech detected or mic permission denied.', 'warn'); };
    try { rec.start(); } catch { mic.classList.remove('on'); }
  };

  Mega.chat.loadList().then(() => {
    if (!Mega.chat.convs.length) Mega.chat.newConv(true);
    else { Mega.chat.active = Mega.chat.convs[0].id; Mega.chat.renderList(); Mega.chat.renderMsgs(); }
  });

  /* URL hooks for demos/screenshots */
  const P = new URLSearchParams(location.search);
  if (P.get('open') === 'projects') setTimeout(() => Mega.drawer.open('projects'), 2600);
  if (P.get('open') === 'settings') setTimeout(() => Mega.drawer.open('settings'), 2600);
  const demoSend = (q, tries = 0) => {
    if (Mega.chat.busy) return;
    if (!Mega.chat.getConv() && tries < 12) return setTimeout(() => demoSend(q, tries + 1), 700);
    Mega.chat.send(q);
  };
  if (P.get('demo') === 'answer') setTimeout(() => demoSend('What can you do?'), 1800);
  if (P.get('demo') === 'project') setTimeout(() => demoSend('build a todo app'), 1800);
};

/* ---------------- conversations ---------------- */
Mega.chat.loadList = async () => {
  const keys = (await Mega.idb.keys('kv')).filter(k => String(k).startsWith('conv:'));
  Mega.chat.convs = [];
  for (const k of keys) { const c = await Mega.idb.get('kv', k); if (c) Mega.chat.convs.push(c); }
  Mega.chat.convs.sort((a, b) => b.at - a.at);
  Mega.chat.renderList();
};
Mega.chat.renderList = () => {
  const el = Mega.$('#chatList'); if (!el) return;
  el.innerHTML = Mega.chat.convs.map(c =>
    `<div class="cconv ${c.id === Mega.chat.active ? 'active' : ''}" data-id="${c.id}">
      <span>💬</span><span class="cn">${Mega.esc(c.title || 'New chat')}</span><span class="cx" data-del="${c.id}">✕</span></div>`).join('')
    || '<div style="padding:14px;color:var(--text3);font-size:12.5px">No chats yet — say hello! 👋</div>';
  Mega.$$('.cconv', el).forEach(n => n.onclick = (e) => {
    if (e.target.dataset.del) return Mega.chat.del(e.target.dataset.del);
    Mega.chat.active = n.dataset.id;
    Mega.chat.renderList(); Mega.chat.renderMsgs();
    Mega.$('#sidebar')?.classList.remove('open');
  });
};
Mega.chat.newConv = () => {
  const c = { id: Mega.uid('conv'), title: '', msgs: [], at: Date.now() };
  Mega.chat.convs.unshift(c); Mega.chat.active = c.id;
  Mega.chat.renderList(); Mega.chat.renderMsgs();
  Mega.$('#chatInput').focus();
};
Mega.chat.del = async (id) => {
  await Mega.idb.del('kv', 'conv:' + id);
  Mega.chat.convs = Mega.chat.convs.filter(c => c.id !== id);
  if (Mega.chat.active === id) { if (Mega.chat.convs.length) { Mega.chat.active = Mega.chat.convs[0].id; Mega.chat.renderMsgs(); } else Mega.chat.newConv(); }
  Mega.chat.renderList();
};
Mega.chat.getConv = () => Mega.chat.convs.find(c => c.id === Mega.chat.active);
Mega.chat.persist = async () => { const c = Mega.chat.getConv(); if (c) { c.at = Date.now(); await Mega.idb.set('kv', 'conv:' + c.id, c); Mega.chat.renderList(); } };

/* ---------------- render ---------------- */
Mega.chat.renderMsgs = () => {
  const c = Mega.chat.getConv(); if (!c) return;
  const box = Mega.$('#chatMsgs');
  if (!c.msgs.length) { box.innerHTML = Mega.chat.heroHTML(); box.scrollTop = 0; return; }
  box.innerHTML = c.msgs.map((m, i) => Mega.chat.msgHTML(m, i)).join('');
  Mega.chat.bindMsgActs();
  box.scrollTop = box.scrollHeight;
};

Mega.chat.heroHTML = () => `
  <div class="chat-hero">
    <div class="hl">${Mega.logoSVG('hl')}</div>
    <h2>How can I help you today?</h2>
    <p>One box does everything — ask anything, or pick a starter:</p>
    <div class="sugs">
      <div class="sug" data-q="Make a professional poster image for a coffee shop sale"><b>🪧 Design a poster</b>“Make a professional poster for a coffee shop sale”</div>
      <div class="sug" data-q="Build a beautiful todo app with dark mode"><b>🧑‍💻 Build an app</b>“Build a beautiful todo app with dark mode”</div>
      <div class="sug" data-q="Explain how JavaScript promises work with examples"><b>📚 Learn something</b>“Explain how JavaScript promises work”</div>
      <div class="sug" data-q="Make a video of a rocket launch at sunset, then Earth from orbit"><b>🎬 Make a video</b>“Make a video of a rocket launch at sunset…”</div>
      <div class="sug" data-q="search latest AI news this week"><b>🔍 Search the web</b>“search latest AI news this week”</div>
      <div class="sug" data-q="What can you do?"><b>✨ Show my powers</b>“What can you do?”</div>
    </div>
    <div class="row" style="justify-content:center;gap:8px;margin-top:18px;flex-wrap:wrap">
      <span class="pill">${Mega.ai.models.length}+ models</span><span class="pill ok">Free · no key needed</span><span class="pill">Web search</span><span class="pill">No watermarks</span>
    </div>
  </div>`;

Mega.chat.msgHTML = (m, i) => {
  if (m.role === 'user') {
    return `<div class="msg user"><div class="mbody"><div class="mbubble">${Mega.esc(m.content)}</div></div></div>`;
  }
  const mm = Mega.ai.modelById(m.model);
  const engineBadge = m.engine === 'lite' ? ' <span class="pill">LITE</span>' : '';
  let body = '';
  if (m.kind === 'image') {
    body = `<div class="mbubble">
      <div class="chat-img-grid">${(m.meta.images || []).map((u, j) => `
        <div class="img-card"><img src="${Mega.esc(u)}" data-full="${Mega.esc(u)}" alt="AI image">
        <div class="img-acts">
          <button class="btn sm" data-a="img-dl" data-u="${Mega.esc(u)}">⬇️</button>
          <button class="btn sm" data-a="img-reroll" data-i="${i}">🔁</button>
          <button class="btn sm" data-a="img-edit" data-i="${i}" data-j="${j}">✏️ Edit</button>
          <button class="btn sm" data-a="img-video" data-i="${i}" data-j="${j}">🎬 Video</button>
        </div></div>`).join('')}</div>
      ${m.meta.editing ? `<div class="row" style="margin-top:10px"><input class="inp" id="editInp${i}" placeholder="Describe the edit… e.g. change background to sunset"><button class="btn primary sm" data-a="img-edit-go" data-i="${i}" data-j="${m.meta.editing}">Apply ✨</button></div>` : ''}
      <div style="margin-top:8px;font-size:11.5px;color:var(--text3)">${m.meta.engineNote || ''}</div></div>`;
  } else if (m.kind === 'video') {
    const v = m.meta.video || {};
    body = `<div class="mbubble">
      <video controls loop style="width:100%;max-width:460px;border-radius:14px;background:#000" src="${Mega.esc(v.url || '')}"></video>
      <div class="row" style="margin-top:10px;gap:8px;flex-wrap:wrap">
        <button class="btn sm primary" data-a="vid-dl" data-i="${i}">⬇️ Download</button>
        <span class="pill ok">no watermark</span>
        <span class="pill">${v.duration || ''}s · ${Mega.fmtBytes(v.size || 0)}</span>
      </div></div>`;
  } else if (m.kind === 'project') {
    const files = m.meta.files || [];
    body = `<div class="mbubble">
      <div class="card" style="padding:14px;background:rgba(109,93,252,.06);border-color:rgba(109,93,252,.3)">
        <div class="row"><b>📦 ${Mega.esc(m.meta.name || 'project')}</b><span class="pill" style="margin-left:auto">${files.length} files</span></div>
        <div style="font-family:var(--mono);font-size:11.5px;color:var(--text2);margin-top:8px;line-height:1.8">${files.map(f => '📄 ' + Mega.esc(f.path)).join('<br>')}</div>
        <div class="row" style="margin-top:12px;gap:7px;flex-wrap:wrap">
          <button class="btn sm primary" data-a="pj-run" data-i="${i}">▶ Run</button>
          <button class="btn sm" data-a="pj-check" data-i="${i}">🔍 Check</button>
          <button class="btn sm" data-a="pj-fix" data-i="${i}">🔧 Fix</button>
          <button class="btn sm" data-a="pj-zip" data-i="${i}">📦 ZIP</button>
          <button class="btn sm" data-a="pj-gh" data-i="${i}">🐙 GitHub</button>
        </div>
        ${m.meta.checkNote ? `<div style="margin-top:10px;font-size:12px">${m.meta.checkNote}</div>` : ''}
      </div></div>`;
  } else if (m.kind === 'help') {
    body = `<div class="mbubble md">${Mega.md.render(m.content, { fixable: false })}</div>`;
  } else if (m.kind === 'agent') {
    const steps = m.meta.steps || [];
    const imgs = m.meta.images || [];
    body = `<div class="mbubble">
      ${steps.length ? `<div class="agent-steps">${steps.map(s => `<div class="astep ${s.state === 'fail' ? 'fail' : 'done'}"><span class="asi">${s.state === 'fail' ? '✕' : '✓'}</span><span>${Mega.esc(s.label)}${s.note ? ` <span class="as-note">— ${Mega.esc(s.note)}</span>` : ''}</span></div>`).join('')}</div>` : ''}
      <div class="md">${Mega.md.render(m.content)}</div>
      ${imgs.length ? `<div class="chat-img-grid" style="margin-top:12px">${imgs.map(u => `
        <div class="img-card"><img src="${Mega.esc(u)}" data-full="${Mega.esc(u)}" alt="AI image">
        <div class="img-acts">
          <button class="btn sm" data-a="img-dl" data-u="${Mega.esc(u)}">⬇️</button>
          <button class="btn sm" data-a="img-video" data-i="${i}" data-j="0">🎬 Video</button>
        </div></div>`).join('')}</div>` : ''}
      </div>
      ${m.meta?.sources?.length ? `<div class="src-row">🔍 ${m.meta.sources.map(s => `<a class="src-chip" href="${Mega.esc(s.url)}" target="_blank" rel="noopener">${Mega.esc(s.title.slice(0, 42))}</a>`).join('')}</div>` : ''}`;
  } else {
    body = `<div class="mbubble md">${Mega.md.render(m.content)}</div>
      ${m.meta?.sources?.length ? `<div class="src-row">🔍 ${m.meta.sources.map(s => `<a class="src-chip" href="${Mega.esc(s.url)}" target="_blank" rel="noopener">${Mega.esc(s.title.slice(0, 42))}</a>`).join('')}</div>` : ''}`;
  }
  const acts = `
    <div class="macts">
      ${m.kind === 'text' || m.kind === 'search' || m.kind === 'agent' ? `<button class="mact" data-copy="${i}">📋 Copy</button>` : ''}
      <button class="mact" data-regen="${i}">🔁 Regenerate</button>
      ${m.kind === 'text' || m.kind === 'search' || m.kind === 'agent' ? `<button class="mact" data-speak="${i}">🗣 Speak</button>` : ''}
    </div>`;
  const sugg = m.meta?.sugg?.length ? `
    <div class="sug-row">
      <span class="sug-title">💡 Next:</span>
      ${m.meta.sugg.map((s, k) => `<button class="sug-chip" data-sugg="${k}" data-i="${i}">${Mega.esc(s)}</button>`).join('')}
    </div>` : '';
  return `<div class="msg bot">
    <div class="mhead"><div class="mav">⚡</div><div class="mname">Mega Power AI <span class="mm-sub">· ${Mega.esc(mm.name)}${engineBadge}</span></div></div>
    <div class="mbody">${body}${acts}${sugg}</div></div>`;
};

Mega.chat.bindMsgActs = () => {
  Mega.$$('#chatMsgs .sug').forEach(s => s.onclick = () => { Mega.$('#chatInput').value = s.dataset.q; Mega.chat.send(); });
  Mega.$$('#chatMsgs .mact').forEach(b => b.onclick = (e) => { e.stopPropagation(); Mega.chat.msgAct(b); });
  Mega.$$('#chatMsgs .sug-chip').forEach(b => b.onclick = () => Mega.chat.runSuggestion(+b.dataset.i, +b.dataset.sugg));
  Mega.$$('#chatMsgs img[data-full]').forEach(im => im.onclick = () => Mega.modal('🖼 Image', '', `<img src="${Mega.esc(im.dataset.full)}" style="width:100%;border-radius:14px">`, {}));
};

Mega.chat.onBubbleClick = (e) => {
  const btn = e.target.closest('[data-a]');
  if (!btn) return;
  const c = Mega.chat.getConv();
  const i = +btn.dataset.i;
  const m = c?.msgs[i];
  const a = btn.dataset.a;
  if (a === 'img-dl') {
    fetch(btn.dataset.u).then(r => r.blob()).then(b => Mega.media.dlBlob(b, 'mega-image-' + Date.now() + '.png')).catch(() => window.open(btn.dataset.u, '_blank'));
  } else if (a === 'img-reroll' && m) {
    Mega.chat.rerollImage(i);
  } else if (a === 'img-edit' && m) {
    m.meta.editing = btn.dataset.j; Mega.chat.renderMsgs();
    setTimeout(() => Mega.$('#editInp' + i)?.focus(), 60);
  } else if (a === 'img-edit-go' && m) {
    const q = Mega.$('#editInp' + i)?.value.trim();
    const j = +btn.dataset.j;
    m.meta.editing = null;
    if (q) Mega.chat.editImage(m.meta.images[j], q);
  } else if (a === 'img-video' && m) {
    Mega.chat.imageToVideo(m.meta.images[+btn.dataset.j]);
  } else if (a === 'vid-dl' && m) {
    const key = m.meta.video.blobKey;
    if (m.meta.video.url) Mega.media.dl(m.meta.video.url, (m.meta.video.name || 'mega-video') + '.webm');
    else if (key) Mega.idb.get('kv', key).then(b => b && Mega.media.dlBlob(b, 'mega-video.webm'));
  } else if (a === 'pj-run' && m) Mega.chat.openPreview(m.meta);
  else if (a === 'pj-check' && m) Mega.chat.checkProject(i);
  else if (a === 'pj-fix' && m) Mega.chat.fixProject(i);
  else if (a === 'pj-zip' && m) {
    Mega.zip.save(Mega.zip.create(m.meta.files.map(f => ({ path: f.path, data: f.content }))), (m.meta.name || 'project').replace(/[^\w.-]+/g, '-') + '.zip');
    Mega.toast('Download started 📦', '', 'ok');
  } else if (a === 'pj-gh' && m) Mega.github.pushDialog(m.meta.name, m.meta.files);
};

Mega.chat.msgAct = (b) => {
  const c = Mega.chat.getConv();
  if (b.dataset.copy !== undefined) {
    navigator.clipboard.writeText(c.msgs[+b.dataset.copy].content);
    b.textContent = '✅ Copied'; setTimeout(() => b.textContent = '📋 Copy', 1300);
  } else if (b.dataset.speak !== undefined) {
    Mega.media.speak(c.msgs[+b.dataset.speak].content.replace(/[#*`>|]/g, ''));
  } else if (b.dataset.regen !== undefined) {
    Mega.chat.regen(+b.dataset.regen);
  }
};

/* ---------------- send & intent routing ---------------- */
Mega.chat.send = async (override) => {
  if (Mega.chat.busy) return;
  const ta = Mega.$('#chatInput');
  const raw = (override !== undefined ? override : ta.value).trim();
  if (!raw) return;
  ta.value = ''; ta.style.height = 'auto';
  let c = Mega.chat.getConv();
  if (!c) { if (!Mega.chat.convs.length) Mega.chat.newConv(); c = Mega.chat.getConv(); if (!c) return; }
  if (!c.title) { c.title = raw.slice(0, 42) + (raw.length > 42 ? '…' : ''); Mega.chat.renderList(); }
  c.msgs.push({ role: 'user', content: raw });
  Mega.chat.renderMsgs();
  if (Mega.settings.agent && Mega.agent && Mega.agent.run) await Mega.agent.run(raw);
  else await Mega.chat.route(raw);
  Mega.chat.persist();
};

Mega.chat.route = async (raw) => {
  if (/^\/agent\b/i.test(raw)) { Mega.agent.toggle(); return; }
  const it = Mega.ai.intent(raw);
  try {
    switch (it.type) {
      case 'help': return Mega.chat.helpReply();
      case 'new': return Mega.chat.newConv();
      case 'settings': return Mega.drawer.open('settings');
      case 'model': return Mega.chat.modelCmd(it.arg);
      case 'search': return Mega.chat.handleSearch(it.arg || raw, raw);
      case 'image': return Mega.chat.handleImage(it.arg || raw);
      case 'video': return Mega.chat.handleVideo(it.arg || raw);
      case 'build': return Mega.chat.handleBuild(it.arg || raw);
      default: return Mega.chat.handleChat(raw);
    }
  } catch (err) {
    if (!String(err).includes('Abort')) Mega.toast('Something went wrong', String(err.message || err), 'err');
  }
};

Mega.chat.helpReply = () => {
  const c = Mega.chat.getConv();
  const md = `## ⚡ I do everything — from this one box

Just type naturally and I detect what you want:

| You say | I do |
|---|---|
| *"make a poster image of a coffee sale"* | 🪧 Generate a professional, poster-quality image |
| *"edit it — make the background sunset"* | ✏️ Edit the last image |
| *"make a video of a rocket launch"* | 🎬 Paint scenes + encode a real video (no watermark) |
| *"turn this image into a video"* | 🎞 Animate the image (zoom / pan / rotate) |
| *"build a snake game"* | 🧑‍💻 Generate the full project — Run, Check, Fix, ZIP, push to GitHub |
| *"search latest AI news"* | 🔍 Live web search with sources |
| 🤖 **Agent mode ON** | I plan, search, generate images & finish the whole task step by step |
| anything else | 💬 Stream a smart answer like ChatGPT |

**Slash commands:** \`/image\` \`/video\` \`/build\` \`/search\` \`/agent\` \`/model\` \`/settings\` \`/new\` \`/help\`

⚙️ **Settings** (sidebar → Settings) has everything: Agent mode, API keys, models, web search, image & video options, theme, account, data, about.`;
  c.msgs.push({ role: 'assistant', kind: 'help', content: md, model: Mega.settings.model, engine: 'builtin' });
  Mega.chat.renderMsgs(); Mega.chat.persist();
};

Mega.chat.modelCmd = (arg) => {
  if (!arg) return Mega.drawer.open('settings');
  const m = Mega.ai.models.find(x => x.id === arg.toLowerCase() || x.name.toLowerCase().includes(arg.toLowerCase()));
  if (m) {
    Mega.settings.model = m.id; Mega.saveSettings();
    if (Mega.uiRenderModels) Mega.uiRenderModels();
    Mega.toast('Model switched ⚡', m.name, 'ok');
  } else Mega.toast('Model not found', 'Open Settings → AI Models to see all models.', 'warn');
};

/* ---------------- status bubble ---------------- */
Mega.chat.status = (html) => {
  let el = Mega.$('#chatStatus');
  const box = Mega.$('#chatMsgs');
  if (!el) {
    el = document.createElement('div');
    el.id = 'chatStatus'; el.className = 'msg bot';
    box.appendChild(el);
  }
  el.innerHTML = `<div class="mhead"><div class="mav">⚡</div><div class="mname">Mega Power AI</div></div>
    <div class="mbody"><div class="mbubble" id="chatStatusB"></div></div>`;
  Mega.$('#chatStatusB').innerHTML = html;
  box.scrollTop = box.scrollHeight;
  return Mega.$('#chatStatusB');
};
Mega.chat.statusEnd = () => Mega.$('#chatStatus')?.remove();

/* ---------------- CHAT (with smart web search) ---------------- */
Mega.chat.handleChat = async (raw, forceSearch) => {
  const c = Mega.chat.getConv();
  const model = Mega.ai.modelById(Mega.settings.model);
  let searchCtx = null;
  const st = Mega.chat.status('<span class="typing"><i></i><i></i><i></i></span> <span style="color:var(--text2);font-size:13px">thinking…</span>');
  if (forceSearch || Mega.search.needed(raw)) {
    st.innerHTML = '<span style="color:var(--text2);font-size:13.5px">🔍 <b>Searching the web…</b></span>';
    try { searchCtx = await Mega.search.web(raw); } catch { searchCtx = null; }
    st.innerHTML = `<span class="typing"><i></i><i></i><i></i></span> <span style="color:var(--text2);font-size:13px">reading ${searchCtx?.sources.length || 0} sources…</span>`;
  }
  const msgs = [
    { role: 'system', content: Mega.ai.systemPrompt() + (searchCtx ? '\n\nFRESH WEB CONTEXT (use it, prefer it over old knowledge, and mention sources naturally):\n' + searchCtx.context.slice(0, 5000) : '') },
    ...c.msgs.slice(-20).map(m => ({ role: m.role, content: m.content }))
  ];
  await Mega.chat.streamInto(msgs, { model: model.id, kind: searchCtx ? 'search' : 'text', sources: searchCtx?.sources, st });
};

Mega.chat.handleSearch = (q) => Mega.chat.handleChat(q, true);

/* ---------------- streaming text ---------------- */
Mega.chat.streamInto = async (msgs, o = {}) => {
  const c = Mega.chat.getConv();
  const box = Mega.$('#chatMsgs');
  Mega.chat.busy = true; Mega.chat.setBusy(true);
  Mega.chat.abort = new AbortController();
  const st = o.st || Mega.chat.status('<span class="typing"><i></i><i></i><i></i></span>');
  const bubble = st;
  let acc = '';
  try {
    const r = await Mega.ai.chat(msgs, {
      model: o.model, mode: o.mode, signal: Mega.chat.abort.signal,
      onToken: (d, all) => {
        acc = all;
        bubble.classList.add('md');
        bubble.innerHTML = Mega.md.render(acc) + '<span class="cursor-blink" style="margin-left:2px"></span>';
        box.scrollTop = box.scrollHeight;
      }
    });
    acc = r.text;
    Mega.chat.statusEnd();
    const sugg = Mega.settings.suggest !== false ? Mega.ai.suggest(o.kind || 'text', acc, o.meta) : null;
    c.msgs.push({ role: 'assistant', kind: o.kind || 'text', content: acc, model: o.model || Mega.settings.model, engine: r.engine, meta: Object.assign({ sources: o.sources }, o.meta || {}, { sugg }) });
    Mega.chat.lastCtx = { kind: o.kind, text: acc };
    Mega.chat.renderMsgs();
  } catch (err) {
    if (String(err).includes('Abort')) {
      Mega.chat.statusEnd();
      if (acc) { c.msgs.push({ role: 'assistant', kind: o.kind || 'text', content: acc, model: o.model, engine: 'partial' }); Mega.chat.renderMsgs(); }
      else { Mega.chat.statusEnd(); Mega.toast('Stopped', '', 'warn', 1200); }
    } else { Mega.chat.statusEnd(); Mega.toast('Error', String(err.message || err), 'err'); }
  } finally {
    Mega.chat.busy = false; Mega.chat.setBusy(false); Mega.chat.abort = null;
    Mega.chat.persist();
  }
};

/* ---------------- IMAGE ---------------- */
Mega.chat.handleImage = async (prompt) => {
  const count = Math.max(1, Math.min(4, +Mega.settings.imageCount || 1));
  const engine = Mega.ai.image.engine();
  const note = engine === 'openai' ? 'gpt-image-1 via your OpenAI key' : 'free Flux engine — add an OpenAI key in Settings for ChatGPT-grade image quality';
  const st = Mega.chat.status(`<div style="font-size:13.5px;color:var(--text2)">🎨 <b>Painting your image…</b><br><span style="font-size:11.5px;color:var(--text3)">${Mega.esc(prompt.slice(0, 90))}</span></div><div class="img-shimmer" style="position:relative;height:180px;border-radius:12px;margin-top:10px"></div>`);
  const urls = [];
  const ac = new AbortController();
  Mega.chat.abort = ac; Mega.chat.busy = true; Mega.chat.setBusy(true);
  try {
    for (let i = 0; i < count; i++) {
      const img = await Mega.ai.image.get(prompt, { signal: ac.signal });
      urls.push(img.src);
    }
    Mega.chat.statusEnd();
    const c = Mega.chat.getConv();
    c.msgs.push({
      role: 'assistant', kind: 'image', content: prompt, model: 'image',
      meta: { images: urls, prompt, sugg: Mega.ai.suggest('image'), engineNote: '⚡ ' + note }
    });
    Mega.chat.renderMsgs(); Mega.chat.persist();
  } catch (err) {
    Mega.chat.statusEnd();
    if (!String(err).includes('Abort')) Mega.toast('Image failed', 'The free engine is busy — try again in a moment, or add an OpenAI key for dedicated quality.', 'err', 6000);
  } finally { Mega.chat.busy = false; Mega.chat.setBusy(false); Mega.chat.abort = null; }
};

Mega.chat.rerollImage = async (i) => {
  const c = Mega.chat.getConv();
  const m = c.msgs[i]; if (!m) return;
  const st = Mega.chat.status('<div style="font-size:13.5px;color:var(--text2)">🎨 Painting a new variation…</div><div class="img-shimmer" style="position:relative;height:180px;border-radius:12px;margin-top:10px"></div>');
  try {
    const img = await Mega.ai.image.get(m.meta.prompt, { seed: Math.floor(Math.random() * 1e9) });
    m.meta.images = [img.src, ...m.meta.images].slice(0, 4);
    Mega.chat.statusEnd(); Mega.chat.renderMsgs(); Mega.chat.persist();
  } catch { Mega.chat.statusEnd(); Mega.toast('Image failed', 'Free engine busy — try again shortly.', 'err'); }
};

Mega.chat.editImage = async (url, q) => {
  const st = Mega.chat.status('<div style="font-size:13.5px;color:var(--text2)">✏️ <b>Editing image…</b><br><span style="font-size:11.5px;color:var(--text3)">' + Mega.esc(q.slice(0, 90)) + '</span></div><div class="img-shimmer" style="position:relative;height:180px;border-radius:12px;margin-top:10px"></div>');
  try {
    const out = await Mega.ai.editImage(url, q);
    Mega.chat.statusEnd();
    const c = Mega.chat.getConv();
    c.msgs.push({ role: 'user', content: '✏️ Edit: ' + q });
    c.msgs.push({ role: 'assistant', kind: 'image', content: q, model: 'image', meta: { images: [out], prompt: q, sugg: Mega.ai.suggest('image') } });
    Mega.chat.renderMsgs(); Mega.chat.persist();
  } catch { Mega.chat.statusEnd(); Mega.toast('Edit failed', 'Try a simpler edit instruction.', 'err'); }
};

/* ---------------- VIDEO ---------------- */
Mega.chat.handleVideo = async (prompt) => {
  const preset = Mega.settings.videoDuration || 'standard';
  const st = Mega.chat.status(`<div style="font-size:13.5px;color:var(--text2)">🎬 <b>Making your video…</b></div>
    <div class="progress" style="margin-top:12px"><i id="vidProg" style="width:2%"></i></div>
    <div id="vidStat" style="font-size:12px;color:var(--text3);margin-top:8px">planning scenes…</div>`);
  const ac = new AbortController();
  Mega.chat.abort = ac; Mega.chat.busy = true; Mega.chat.setBusy(true);
  const prog = (p) => {
    const bar = Mega.$('#vidProg'), txt = Mega.$('#vidStat');
    if (p.phase === 'images' && bar) { bar.style.width = (4 + (p.done / p.total) * 60) + '%'; txt.textContent = `🎨 scene ${p.done + 1}/${p.total}: ${p.current.slice(0, 46)}…`; }
    if (p.phase === 'render' && bar) { bar.style.width = (64 + p.pct * 0.35) + '%'; txt.textContent = `🎞 encoding… ${p.pct}%`; }
    if (p.phase === 'done' && bar) bar.style.width = '100%';
  };
  try {
    const scenes = Mega.media.scenes(prompt);
    const r = await Mega.media.sceneVideo(scenes, { signal: ac.signal, onProgress: prog, title: prompt.slice(0, 40) });
    Mega.chat.statusEnd();
    await Mega.chat.pushVideo(r, prompt, { kind: 'video' });
  } catch (err) {
    Mega.chat.statusEnd();
    if (String(err).includes('Abort')) Mega.toast('Video stopped', '', 'warn');
    else Mega.toast('Video failed', String(err.message || err), 'err', 6000);
  } finally { Mega.chat.busy = false; Mega.chat.setBusy(false); Mega.chat.abort = null; }
};

Mega.chat.imageToVideo = async (url) => {
  Mega.$('#chatInput').value = '';
  const st = Mega.chat.status(`<div style="font-size:13.5px;color:var(--text2)">🎞 <b>Animating your image…</b> (zoom motion, no watermark)</div>
    <div class="progress" style="margin-top:12px"><i id="vidProg" style="width:4%"></i></div><div id="vidStat" style="font-size:12px;color:var(--text3);margin-top:8px">rendering…</div>`);
  const ac = new AbortController();
  Mega.chat.busy = true; Mega.chat.setBusy(true); Mega.chat.abort = ac;
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
    const r = await Mega.media.imageToVideo(img, { duration: 10, motion: 'zoom-in', music: Mega.settings.videoMusic !== false, signal: ac.signal, onProgress: (p) => { const b = Mega.$('#vidProg'); if (b && p.phase === 'render') b.style.width = (4 + p.pct * 0.94) + '%'; } });
    Mega.chat.statusEnd();
    await Mega.chat.pushVideo(r, 'image-to-video', { kind: 'image2video' });
  } catch (err) {
    Mega.chat.statusEnd();
    if (!String(err).includes('Abort')) Mega.toast('Video failed', String(err.message || err), 'err');
  } finally { Mega.chat.busy = false; Mega.chat.setBusy(false); Mega.chat.abort = null; }
};

Mega.chat.pushVideo = async (r, prompt, o) => {
  const c = Mega.chat.getConv();
  const blobKey = 'video:' + Mega.uid('v');
  await Mega.idb.set('kv', blobKey, r.blob);
  c.msgs.push({
    role: 'assistant', kind: 'video', content: prompt, model: 'video',
    meta: { video: { url: r.url, blobKey, name: prompt.replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 30) || 'video', duration: r.duration, size: r.size }, sugg: Mega.ai.suggest('video') }
  });
  Mega.chat.renderMsgs(); Mega.chat.persist();
  Mega.toast('Video ready 🎬', r.duration + 's · no watermark · free', 'ok');
};

/* ---------------- BUILD (project) ---------------- */
Mega.chat.handleBuild = async (prompt) => {
  const model = Mega.ai.modelById(Mega.settings.model);
  const st = Mega.chat.status(`<div style="font-size:13.5px;color:var(--text2)">🧑‍💻 <b>Building your project…</b> <span style="font-size:11px;color:var(--text3)">with ${Mega.esc(model.name)}</span></div>
    <div class="progress" style="margin-top:12px"><i id="pjBar" style="width:6%"></i></div>
    <pre id="pjStream" style="margin-top:10px;max-height:130px;overflow:hidden;font-family:var(--mono);font-size:10.5px;color:var(--text3);line-height:1.5;white-space:pre-wrap"></pre>`);
  let prog = 6;
  const tick = setInterval(() => { const b = Mega.$('#pjBar'); if (b && prog < 92) b.style.width = (prog += 3) + '%'; }, 700);
  const ac = new AbortController();
  Mega.chat.abort = ac; Mega.chat.busy = true; Mega.chat.setBusy(true);
  try {
    const r = await Mega.ai.chat([
      { role: 'system', content: Mega.ai.codePrompt() },
      { role: 'user', content: 'Build this project: ' + prompt }
    ], { model: model.id, mode: 'code', signal: ac.signal, onToken: (d, all) => { const s = Mega.$('#pjStream'); if (s) s.textContent = all.slice(-1400); } });
    clearInterval(tick);
    const files = Mega.ai.parseFiles(r.text);
    if (!files.length) throw new Error('No files generated');
    const name = prompt.split(/\s+/).slice(0, 4).join('-').replace(/[^a-z0-9-]/gi, '').toLowerCase() || 'my-app';
    const chk = Mega.check.project(files);
    const errs = chk.issues.filter(x => x.sev === 'err').length;
    const warns = chk.issues.filter(x => x.sev === 'warn').length;
    const proj = await Mega.projects.save(name, files, prompt);
    Mega.chat.statusEnd();
    const c = Mega.chat.getConv();
    c.msgs.push({
      role: 'assistant', kind: 'project', content: r.text, model: model.id, engine: r.engine,
      meta: {
        name, files, projId: proj.id, sugg: Mega.ai.suggest('project'),
        checkNote: `<span class="pill ${errs ? 'err' : 'ok'}">${errs ? '🚫 ' + errs + ' error(s)' : '✅ no errors'}</span> ${warns ? `<span class="pill warn">⚠️ ${warns} warning(s)</span>` : ''} <span style="color:var(--text3);font-size:11px">— auto-checked & saved to Projects</span>`
      }
    });
    Mega.chat.renderMsgs(); Mega.chat.persist();
    Mega.toast('Project ready 🚀', name + ' — ' + files.length + ' files, saved & checked.', 'ok');
  } catch (err) {
    clearInterval(tick);
    Mega.chat.statusEnd();
    if (String(err).includes('Abort')) Mega.toast('Build stopped', '', 'warn');
    else Mega.toast('Build failed', String(err.message || err), 'err');
  } finally { Mega.chat.busy = false; Mega.chat.setBusy(false); Mega.chat.abort = null; }
};

Mega.chat.checkProject = (i) => {
  const m = Mega.chat.getConv().msgs[i]; if (!m) return;
  const { ok, issues } = Mega.check.project(m.meta.files);
  const errs = issues.filter(x => x.sev === 'err'), warns = issues.filter(x => x.sev === 'warn');
  let html = `<div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:10px">
    <span class="pill ${ok ? 'ok' : 'err'}">${ok ? '✅ No errors' : '🚫 ' + errs.length + ' error(s)'}</span>
    ${warns.length ? `<span class="pill warn">⚠️ ${warns.length} warning(s)</span>` : ''}</div>` +
    (issues.length ? issues.slice(0, 30).map(x => `<div class="check-item ${x.sev}"><span class="ci">${x.sev === 'err' ? '❌' : x.sev === 'warn' ? '⚠️' : '💡'}</span><div><b>${Mega.esc(x.file)}:${x.line}</b><span>${Mega.esc(x.msg)}</span></div></div>`).join('') : '<p style="font-size:13px;color:var(--text2)">Code is clean — great job! 🎉</p>');
  Mega.modal('🔍 Code check — ' + Mega.esc(m.meta.name), '', html, { lg: true });
};

Mega.chat.fixProject = async (i) => {
  const m = Mega.chat.getConv().msgs[i]; if (!m) return;
  if (Mega.chat.busy) return;
  Mega.chat.busy = true;
  const st = Mega.chat.status('<div style="font-size:13.5px;color:var(--text2)">🔧 <b>Auto-fixing…</b> <span id="fixStep" style="color:var(--text3);font-size:12px"></span></div>');
  try {
    m.meta.files = await Mega.code.autoFix(m.meta.files, (f, n, t) => { const s = Mega.$('#fixStep'); if (s) s.textContent = `file ${n}/${t}: ${f}`; });
    await Mega.projects.updateFiles(m.meta.projId, m.meta.files);
    const chk = Mega.check.project(m.meta.files);
    const errs = chk.issues.filter(x => x.sev === 'err').length;
    m.meta.checkNote = `<span class="pill ${errs ? 'err' : 'ok'}">${errs ? '🚫 ' + errs + ' error(s)' : '✅ no errors after fix'}</span> <span style="color:var(--text3);font-size:11px">— auto-fixed & re-checked</span>`;
    Mega.chat.statusEnd();
    Mega.chat.renderMsgs(); Mega.chat.persist();
    Mega.toast('Auto-fix complete 🔧', 'All files corrected & re-checked.', 'ok');
  } catch (e) { Mega.chat.statusEnd(); Mega.toast('Fix failed', String(e.message || e), 'err'); }
  finally { Mega.chat.busy = false; }
};

/* ---------------- project preview drawer ---------------- */
Mega.chat.openPreview = (meta) => {
  Mega.drawer.open('preview');
  const tree = Mega.$('#pvTree');
  tree.innerHTML = meta.files.map((f, i) => `<div class="ft-item ${i === 0 ? 'active' : ''}" data-i="${i}"><span class="fi">${({ html: '🌐', css: '🎨', js: '⚡', json: '🗂', py: '🐍', md: '📝' }[Mega.ext(f.path)] || '📄')}</span>${Mega.esc(f.path)}</div>`).join('');
  const ed = Mega.$('#pvEditor'), pv = Mega.$('#pvFrame');
  const open = (i) => {
    ed.value = meta.files[i].content;
    ed.style.display = ''; pv.style.display = 'none';
    Mega.$$('#pvTree .ft-item').forEach((n, k) => n.classList.toggle('active', k === i));
  };
  Mega.$$('#pvTree .ft-item').forEach(n => n.onclick = () => open(+n.dataset.i));
  Mega.$('#pvRun').onclick = () => {
    const doc = Mega.code.previewDoc(meta.files);
    pv.style.display = ''; ed.style.display = 'none';
    pv.srcdoc = doc || '<body style="font-family:sans-serif;color:#888;display:grid;place-items:center;height:100vh;margin:0">No index.html to preview</body>';
  };
  Mega.$('#pvCode').onclick = () => { pv.style.display = 'none'; ed.style.display = ''; };
  Mega.$('#pvName').textContent = meta.name;
  open(Math.max(0, meta.files.findIndex(f => /index\.html$/i.test(f.path))));
};

/* ---------------- regenerate ---------------- */
Mega.chat.regen = async (i) => {
  const c = Mega.chat.getConv();
  const m = c.msgs[i]; if (!m) return;
  if (m.kind === 'image') return Mega.chat.rerollImage(i);
  if (m.kind === 'agent') {
    const wasAgent = m.meta?.agent;
    c.msgs = c.msgs.slice(0, i); Mega.chat.renderMsgs();
    let u = i - 1; while (u >= 0 && c.msgs[u]?.role !== 'user') u--;
    const q = u >= 0 ? c.msgs[u].content : m.content;
    return wasAgent && Mega.agent ? Mega.agent.run(q) : Mega.chat.route(q);
  }
  if (m.kind === 'project') { c.msgs = c.msgs.slice(0, i); Mega.chat.renderMsgs(); return Mega.chat.handleBuild(m.meta ? m.meta.prompt || m.content : m.content); }
  if (m.kind === 'video') { c.msgs = c.msgs.slice(0, i); Mega.chat.renderMsgs(); return Mega.chat.handleVideo(m.content); }
  // text/search: find the user message before it
  let u = i - 1;
  while (u >= 0 && c.msgs[u].role !== 'user') u--;
  const q = u >= 0 ? c.msgs[u].content : m.content;
  c.msgs = c.msgs.slice(0, u >= 0 ? u : i);
  Mega.chat.renderMsgs();
  const it = Mega.ai.intent(q);
  if (it.type === 'search') return Mega.chat.handleSearch(it.arg || q);
  if (it.type === 'build') return Mega.chat.handleBuild(it.arg || q);
  if (it.type === 'image') return Mega.chat.handleImage(it.arg || q);
  if (it.type === 'video') return Mega.chat.handleVideo(it.arg || q);
  return Mega.chat.handleChat(q);
};

/* ---------------- suggestions (the brain) ---------------- */
Mega.chat.runSuggestion = (i, k) => {
  const m = Mega.chat.getConv().msgs[i]; if (!m || !m.meta?.sugg) return;
  const label = m.meta.sugg[k];
  const kind = m.kind;
  const L = label.toLowerCase();
  if (kind === 'image' && m.meta.prompt) {
    if (L.includes('poster')) return Mega.chat.handleImage(m.meta.prompt + ', professional poster design');
    if (L.includes('variation') || L.includes('another')) return Mega.chat.rerollImage(i);
    if (L.includes('edit')) { m.meta.editing = '0'; Mega.chat.renderMsgs(); return; }
    if (L.includes('video')) return Mega.chat.imageToVideo(m.meta.images[0]);
    if (L.includes('describe') || L.includes('refine')) return Mega.chat.send('Describe this image in vivid detail and suggest 3 improvements: ' + m.meta.prompt);
  }
  if (kind === 'project' && m.meta.files) {
    if (L.includes('run')) return Mega.chat.openPreview(m.meta);
    if (L.includes('check')) return Mega.chat.checkProject(i);
    if (L.includes('fix')) return Mega.chat.fixProject(i);
    if (L.includes('zip') || L.includes('download')) { Mega.zip.save(Mega.zip.create(m.meta.files.map(f => ({ path: f.path, data: f.content }))), m.meta.name + '.zip'); return Mega.toast('Download started 📦', '', 'ok'); }
    if (L.includes('github')) return Mega.github.pushDialog(m.meta.name, m.meta.files);
    if (L.includes('redesign')) { const p = m.meta.prompt || m.content; return Mega.chat.handleBuild(p + ' — redesign with a fresh modern UI'); }
  }
  if (kind === 'video') {
    if (L.includes('longer')) return Mega.chat.handleVideo(m.content + ', longer and more cinematic');
    if (L.includes('music')) { Mega.settings.videoMusic = true; Mega.saveSettings(); return Mega.toast('Music on 🎵', 'Next videos include ambient music.', 'ok'); }
    if (L.includes('scene')) return Mega.chat.handleVideo(m.content + ', new dramatic scenes');
    if (L.includes('post')) return Mega.chat.send('How do I post this video on YouTube, Instagram Reels and TikTok for maximum reach?');
  }
  // generic text suggestions
  if (L.includes('summarize')) return Mega.chat.send('Summarize that in 3 short bullets');
  if (L.includes('like i\'m 5') || L.includes('simply')) return Mega.chat.send('Explain that like I am 5 years old, with a fun example');
  if (L.includes('translate')) return Mega.chat.send('Translate that into Hindi');
  if (L.includes('image')) return Mega.chat.handleImage((m.meta?.prompt || m.content).slice(0, 200) + ', beautiful illustration');
  if (L.includes('search')) return Mega.chat.handleSearch(m.content.slice(0, 120));
  if (L.includes('speak')) return Mega.media.speak(m.content.replace(/[#*`>|]/g, ''));
  if (L.includes('more detail')) return Mega.chat.send('Give me more detail on that');
  if (L.includes('build')) return Mega.chat.handleBuild('todo app');
  if (L.includes('explain this code') || L.includes('code')) return Mega.chat.send('Explain that code step by step');
  if (L.includes('bugs')) return Mega.chat.send('Find and fix any bugs in that code');
  if (L.includes('make it a full app')) return Mega.chat.handleBuild(m.content.slice(0, 200));
  Mega.chat.send(label);
};

Mega.chat.stop = () => { if (Mega.chat.abort) Mega.chat.abort.abort(); };
Mega.chat.setBusy = (busy) => {
  const send = Mega.$('#chatSend');
  send.innerHTML = busy ? Mega.icon('stop') : Mega.icon('send');
  send.title = busy ? 'Stop' : 'Send';
};
