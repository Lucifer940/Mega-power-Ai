/* ============================================================
   MEGA POWER AI — chat.js  |  ChatGPT-style chat, any language
   ============================================================ */
'use strict';
window.Mega = window.Mega || {};
Mega.chat = { convs: [], active: null, busy: false, abort: null };

Mega.chat.init = () => {
  const p = Mega.$('#page-chat');
  if (p.dataset.init) return; p.dataset.init = '1';

  Mega.$('#chatNewBtn').onclick = () => Mega.chat.newConv();
  Mega.$('#chatSend').onclick = () => Mega.chat.send();
  const ta = Mega.$('#chatInput');
  ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); Mega.chat.send(); } });
  ta.addEventListener('input', () => { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'; });
  Mega.$('#chatConvBtn').onclick = () => Mega.$('.chat-side').classList.toggle('open');
  Mega.$$('.sug').forEach(s => s.onclick = () => { Mega.$('#chatInput').value = s.dataset.q; Mega.chat.send(); });
  /* code-block copy / auto-fix actions (delegated) */
  Mega.$('#chatMsgs').addEventListener('click', (e) => {
    const cp = e.target.closest('[data-copycb]');
    if (cp) {
      const raw = Mega.$(`[data-rawcb="${cp.dataset.copycb}"]`, cp.closest('.codeblock'));
      navigator.clipboard.writeText(raw.value).then(() => { cp.textContent = '✅ Copied'; setTimeout(() => cp.textContent = '📋 Copy', 1400); });
    }
    const fx = e.target.closest('[data-fixcb]');
    if (fx) {
      const raw = Mega.$(`[data-rawcb="${fx.dataset.fixcb}"]`, fx.closest('.codeblock'));
      Mega.chat.fixCode(raw.value, fx);
    }
  });
  Mega.chat.loadList();
  if (!Mega.chat.active) Mega.chat.newConv(true);
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
  const el = Mega.$('#chatList');
  el.innerHTML = Mega.chat.convs.map(c =>
    `<div class="cconv ${c.id === Mega.chat.active ? 'active' : ''}" data-id="${c.id}">
      <span>💬</span><span class="cn">${Mega.esc(c.title || 'New chat')}</span><span class="cx" data-del="${c.id}">✕</span></div>`).join('')
    || '<div style="padding:14px;color:var(--text3);font-size:12.5px">No chats yet — say hello! 👋</div>';
  Mega.$$('.cconv', el).forEach(n => n.onclick = (e) => {
    if (e.target.dataset.del) return Mega.chat.del(e.target.dataset.del);
    Mega.chat.active = n.dataset.id;
    Mega.chat.renderList(); Mega.chat.renderMsgs();
    Mega.$('.chat-side').classList.remove('open');
  });
};

Mega.chat.newConv = (silent) => {
  const c = { id: Mega.uid('conv'), title: '', msgs: [], at: Date.now() };
  Mega.chat.convs.unshift(c); Mega.chat.active = c.id;
  Mega.chat.renderList(); Mega.chat.renderMsgs();
  if (!silent) Mega.$('#chatInput').focus();
};

Mega.chat.del = async (id) => {
  await Mega.idb.del('kv', 'conv:' + id);
  Mega.chat.convs = Mega.chat.convs.filter(c => c.id !== id);
  if (Mega.chat.active === id) { if (Mega.chat.convs.length) { Mega.chat.active = Mega.chat.convs[0].id; Mega.chat.renderMsgs(); } else Mega.chat.newConv(true); }
  Mega.chat.renderList();
  Mega.toast('Chat deleted', '', 'ok', 1500);
};

Mega.chat.getConv = () => Mega.chat.convs.find(c => c.id === Mega.chat.active);
Mega.chat.persist = async () => { const c = Mega.chat.getConv(); if (c) { c.at = Date.now(); await Mega.idb.set('kv', 'conv:' + c.id, c); } };

/* ---------------- rendering ---------------- */
Mega.chat.renderMsgs = () => {
  const c = Mega.chat.getConv(); if (!c) return;
  const box = Mega.$('#chatMsgs');
  if (!c.msgs.length) {
    box.innerHTML = `
    <div class="chat-hero">
      <div class="hl">${Mega.logoSVG('hl')}</div>
      <h2>What should we build today?<br>Anything. No limits. ⚡</h2>
      <p>Ask anything — instant answers, no limits. Pick a starter:</p>
      <div class="sugs">
        <div class="sug" data-q="Make a beautiful todo app with dark mode"><b>🧑‍💻 Build an app</b>“Make a beautiful todo app with dark mode”</div>
        <div class="sug" data-q="Explain how JavaScript promises work with examples"><b>📚 Learn something</b>“Explain JavaScript promises with examples”</div>
        <div class="sug" data-q="Write a Python script that renames all files in a folder by date"><b>🐍 Write a script</b>“Python script to rename files by date”</div>
        <div class="sug" data-q="Design a cute animated birthday card webpage"><b>🎨 Create something fun</b>“Design a cute animated birthday card webpage”</div>
      </div>
    </div>`;
    Mega.$$('.sug', box).forEach(s => s.onclick = () => { Mega.$('#chatInput').value = s.dataset.q; Mega.chat.send(); });
    return;
  }
  box.innerHTML = c.msgs.map((m, i) => Mega.chat.msgHTML(m, i)).join('');
  Mega.chat.bindMsgActs();
  box.scrollTop = box.scrollHeight;
};

Mega.chat.msgHTML = (m, i) => {
  if (m.role === 'user') {
    return `<div class="msg user"><div class="mav">🙋</div><div class="mbody"><div class="mname">You</div><div class="mbubble">${Mega.esc(m.content).replace(/\n/g, '<br>')}</div></div></div>`;
  }
  const mm = Mega.ai.modelById(m.model);
  return `<div class="msg bot"><div class="mav">⚡</div><div class="mbody">
    <div class="mname">Mega Power AI · ${Mega.esc(mm.name)}${m.engine === 'lite' ? ' <span class="pill">LITE</span>' : ''}</div>
    <div class="mbubble md">${Mega.md.render(m.content)}</div>
    <div class="macts"><button class="mact" data-copy="${i}">📋 Copy</button><button class="mact" data-regen="${i}">🔁 Regenerate</button></div></div></div>`;
};

Mega.chat.bindMsgActs = () => {
  Mega.$$('#chatMsgs .mact').forEach(b => b.onclick = () => {
    if (b.dataset.copy !== undefined) {
      const c = Mega.chat.getConv(); navigator.clipboard.writeText(c.msgs[+b.dataset.copy].content);
      b.textContent = '✅ Copied'; setTimeout(() => b.textContent = '📋 Copy', 1300);
    } else if (b.dataset.regen !== undefined) Mega.chat.regen(+b.dataset.regen);
  });
};

/* ---------------- send / stream ---------------- */
Mega.chat.send = async (override) => {
  if (Mega.chat.busy) return;
  const ta = Mega.$('#chatInput');
  const text = (override !== undefined ? override : ta.value).trim();
  if (!text) return;
  ta.value = ''; ta.style.height = 'auto';
  const c = Mega.chat.getConv(); if (!c) return;
  if (!c.title) { c.title = text.slice(0, 42) + (text.length > 42 ? '…' : ''); Mega.chat.renderList(); }
  c.msgs.push({ role: 'user', content: text });
  Mega.chat.renderMsgs();
  await Mega.chat.reply();
  Mega.chat.persist();
};

Mega.chat.reply = async () => {
  const c = Mega.chat.getConv();
  const model = Mega.ai.modelById(Mega.settings.model);
  const msgs = [
    { role: 'system', content: Mega.ai.systemPrompt() },
    ...c.msgs.slice(-20).map(m => ({ role: m.role, content: m.content }))
  ];
  const box = Mega.$('#chatMsgs');
  const stub = document.createElement('div');
  stub.className = 'msg bot';
  stub.innerHTML = `<div class="mav">⚡</div><div class="mbody"><div class="mname">Mega Power AI · ${Mega.esc(model.name)}</div><div class="mbubble"><span class="typing"><i></i><i></i><i></i></span></div></div>`;
  box.appendChild(stub); box.scrollTop = box.scrollHeight;

  Mega.chat.busy = true;
  Mega.chat.setBusy(true);
  Mega.chat.abort = new AbortController();
  const bubble = stub.querySelector('.mbubble');
  let acc = '';
  let engine = 'cloud';
  try {
    const r = await Mega.ai.chat(msgs, {
      model: model.id, signal: Mega.chat.abort.signal,
      onToken: (delta, all) => {
        acc = all;
        bubble.classList.add('md');
        bubble.innerHTML = Mega.md.render(acc) + '<span class="cursor-blink" style="margin-left:2px"></span>';
        box.scrollTop = box.scrollHeight;
      }
    });
    acc = r.text; engine = r.engine;
    bubble.classList.add('md');
    bubble.innerHTML = Mega.md.render(acc);
    c.msgs.push({ role: 'assistant', content: acc, model: model.id, engine });
  } catch (err) {
    if (String(err) .includes('Abort')) { bubble.innerHTML = Mega.md.render(acc) + '<div class="pill warn" style="margin-top:8px">⏹ stopped</div>'; if (acc) c.msgs.push({ role: 'assistant', content: acc, model: model.id, engine: 'partial' }); }
    else { bubble.innerHTML = `<span style="color:var(--err)">⚠️ ${Mega.esc(err.message || err)}</span> — tap Regenerate to retry.`; }
  } finally {
    Mega.chat.busy = false; Mega.chat.setBusy(false); Mega.chat.abort = null;
    box.scrollTop = box.scrollHeight;
  }
};

Mega.chat.regen = async (i) => {
  const c = Mega.chat.getConv();
  // remove messages from i (an assistant msg index) to end
  c.msgs = c.msgs.slice(0, i);
  Mega.chat.renderMsgs();
  await Mega.chat.reply();
  Mega.chat.persist();
};

Mega.chat.stop = () => { if (Mega.chat.abort) Mega.chat.abort.abort(); };

Mega.chat.setBusy = (busy) => {
  const send = Mega.$('#chatSend');
  send.innerHTML = busy ? Mega.icon('stop') : Mega.icon('send');
  send.title = busy ? 'Stop' : 'Send';
  send.onclick = busy ? () => Mega.chat.stop() : () => Mega.chat.send();
};

/* auto-fix a code block from chat (feature: auto code check & correct) */
Mega.chat.fixCode = async (code, btn) => {
  btn.textContent = '🔧 Fixing…';
  const issues = Mega.check.code('app.js', code);
  const prompt = `Fix ALL bugs and issues in this code and return the full corrected code in one fenced code block. Keep the same language.\n\nDetected issues:\n${issues.issues.length ? issues.issues.map(i => `- [${i.sev}] line ${i.line}: ${i.msg}`).join('\n') : '- run a general review for correctness, edge cases and best practices'}\n\nCode:\n${code}`;
  const r = await Mega.ai.chat([
    { role: 'system', content: 'You are Mega Power AI AutoFix. You return ONLY the corrected code in one fenced block. No explanations.' },
    { role: 'user', content: prompt }
  ], { model: Mega.settings.model });
  const fixed = (r.text.match(/```[\w]*\n([\s\S]*?)```/) || [])[1] || r.text;
  const block = btn.closest('.codeblock');
  block.querySelector('pre').innerHTML = Mega.hl(fixed, block.querySelector('.clang').textContent);
  block.querySelector('[data-rawcb]').value = fixed;
  btn.textContent = '✅ Fixed!';
  Mega.toast('Auto-fix applied ✅', 'Code corrected & reviewed by Mega Power AI.', 'ok');
};
