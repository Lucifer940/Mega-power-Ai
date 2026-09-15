/* ============================================================
   MEGA POWER AI — agent.js  |  AGENT MODE
   One request → the agent plans, uses real tools (web search,
   image generation, app building, video), shows every step
   live, then writes the final answer with all results.
   Created by Umesh Chaudhary.
   ============================================================ */
'use strict';
window.Mega = window.Mega || {};
Mega.agent = {};

/* ---------- toggle ---------- */
Mega.agent.toggle = (force) => {
  Mega.settings.agent = force !== undefined ? !!force : !Mega.settings.agent;
  Mega.saveSettings();
  Mega.agent.syncUI();
  Mega.toast(Mega.settings.agent ? '🤖 Agent mode ON' : 'Agent mode off',
    Mega.settings.agent ? 'I will plan, use tools and finish the whole task myself.' : 'Back to normal chat.', 'ok', 2200);
};

Mega.agent.syncUI = () => {
  const on = !!Mega.settings.agent;
  const chip = Mega.$('#agentToggle');
  if (chip) { chip.textContent = '🤖 Agent: ' + (on ? 'On' : 'Off'); chip.classList.toggle('on', on); }
  const tmi = Mega.$('#tmAgent');
  if (tmi) tmi.classList.toggle('on', on);
  const mic = Mega.$('#micBtn');
  if (mic) mic.classList.toggle('on', false);
};

/* ---------- agent status bubble (steps + streaming answer) ---------- */
Mega.agent.statusBubble = () => {
  let el = Mega.$('#chatStatus');
  const box = Mega.$('#chatMsgs');
  if (!el) { el = document.createElement('div'); el.id = 'chatStatus'; el.className = 'msg bot'; box.appendChild(el); }
  el.innerHTML = `<div class="mhead"><div class="mav">🤖</div><div class="mname">Agent mode</div></div>
    <div class="mbody"><div class="agent-steps" id="agSteps"></div><div class="mbubble md" id="agAns"></div></div>`;
  box.scrollTop = box.scrollHeight;
  return { steps: Mega.$('#agSteps'), ans: Mega.$('#agAns') };
};

Mega.agent.renderSteps = (stepsEl, steps) => {
  if (!stepsEl) return;
  stepsEl.innerHTML = steps.map(s => `
    <div class="astep ${s.state || 'done'}">
      <span class="asi">${s.state === 'run' ? '<span class="typing"><i></i><i></i><i></i></span>' : (s.state === 'fail' ? '✕' : '✓')}</span>
      <span>${Mega.esc(s.label)}${s.note ? ` <span class="as-note">— ${Mega.esc(s.note)}</span>` : ''}</span>
    </div>`).join('');
  const box = Mega.$('#chatMsgs');
  box.scrollTop = box.scrollHeight;
};

/* ---------- the plan ---------- */
Mega.agent.plan = (raw, it) => {
  const plan = [];
  const needSearch = Mega.settings.searchMode === 'always' ||
    (Mega.settings.searchMode !== 'off' && (it.type === 'search' || Mega.search.needed(raw)));
  if (needSearch) plan.push({ tool: 'search', label: 'Search the web for fresh facts' });
  if (it.type === 'image') plan.push({ tool: 'image', label: 'Generate image' });
  plan.push({ tool: 'answer', label: 'Write the final answer' });
  return plan;
};

/* ---------- run ---------- */
Mega.agent.run = async (raw) => {
  const c = Mega.chat.getConv(); if (!c) return;
  const it = Mega.ai.intent(raw);

  /* heavy specialist jobs → hand over to the dedicated engine */
  if (it.type === 'build' || it.type === 'video') {
    c.msgs.push({
      role: 'assistant', kind: 'agent', content: `🤖 **Agent mode** — routing this to the ${it.type === 'build' ? '**project builder**' : '**video studio**'} and running the full pipeline for you…`,
      model: Mega.settings.model, engine: 'builtin',
      meta: { steps: [{ tool: it.type, label: 'Delegated to ' + (it.type === 'build' ? 'project builder' : 'video studio'), state: 'done' }] }
    });
    Mega.chat.renderMsgs(); Mega.chat.persist();
    return it.type === 'build' ? Mega.chat.handleBuild(it.arg || raw) : Mega.chat.handleVideo(it.arg || raw);
  }

  const plan = Mega.agent.plan(raw, it);
  Mega.chat.busy = true; Mega.chat.setBusy(true);
  const ac = new AbortController(); Mega.chat.abort = ac;
  const ui = Mega.agent.statusBubble();
  const steps = [];
  const done = (tool, label, note, ok = true) => {
    const s = steps.find(x => x.tool === tool); if (s) { s.state = ok ? 'done' : 'fail'; if (note) s.note = note; }
    Mega.agent.renderSteps(ui.steps, steps);
  };
  const add = (tool, label) => { steps.push({ tool, label, state: 'run' }); Mega.agent.renderSteps(ui.steps, steps); };

  let searchCtx = null;
  const images = [];
  try {
    /* ---- tool: web search ---- */
    if (plan.some(p => p.tool === 'search')) {
      add('search', 'Search the web for fresh facts');
      try {
        searchCtx = await Mega.search.web(raw);
        done('search', '', (searchCtx.sources || []).length + ' sources');
      } catch (e) {
        if (String(e).includes('Abort')) throw e;
        done('search', '', 'search unavailable', false);
      }
    }

    /* ---- tool: image ---- */
    if (plan.some(p => p.tool === 'image')) {
      add('image', 'Generate image');
      try {
        const n = Math.max(1, Math.min(4, +Mega.settings.imageCount || 1));
        for (let i = 0; i < n; i++) {
          if (ac.signal.aborted) throw new Error('AbortError');
          const img = await Mega.ai.image.get(raw, { signal: ac.signal });
          images.push(img.src);
          done('image', '', images.length + (images.length > 1 ? ' images' : ' image') + (i < n - 1 ? ' — painting…' : ''));
        }
      } catch (e) {
        if (String(e).includes('Abort')) throw e;
        done('image', '', 'image engine busy', false);
      }
    }

    /* ---- final answer (streamed) ---- */
    add('answer', 'Write the final answer');
    const toolNotes = [];
    if (searchCtx) toolNotes.push('TOOL RESULT — web search: you searched the web and got ' + (searchCtx.sources || []).length + ' sources. Prefer this fresh context and cite sources naturally.');
    if (images.length) toolNotes.push('TOOL RESULT — image generation: you already generated ' + images.length + ' image(s) for the user (they are attached to this answer). Describe them briefly.');
    if (!searchCtx && !images.length) toolNotes.push('No tools were needed for this request — answer directly and well.');
    const msgs = [
      { role: 'system', content: Mega.ai.systemPrompt() + '\n\nAGENT MODE: you plan and use tools yourself. ' + toolNotes.join('\n') + (searchCtx ? '\n\nFRESH WEB CONTEXT:\n' + String(searchCtx.context).slice(0, 5000) : '') },
      ...c.msgs.slice(-20).map(m => ({ role: m.role, content: m.content }))
    ];
    await Mega.chat.streamInto(msgs, {
      model: Mega.settings.model, kind: 'agent', st: ui.ans, signal: ac.signal,
      sources: searchCtx?.sources,
      meta: { steps: steps.map(s => ({ ...s, state: s.state === 'run' ? 'done' : s.state })), images: images.length ? images : undefined, agent: true }
    });
  } catch (err) {
    Mega.chat.statusEnd();
    if (!String(err).includes('Abort')) Mega.toast('Agent error', String(err.message || err), 'err');
  } finally {
    Mega.chat.busy = false; Mega.chat.setBusy(false); Mega.chat.abort = null;
  }
};
