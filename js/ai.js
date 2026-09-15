/* ============================================================
   MEGA POWER AI — ai.js  |  the brain
   Multi-provider chat + web search + image engine + intent
   router + suggestions. Free keyless mode + BYO keys + offline
   Lite engine fallback. Created by Umesh Chaudhary.
   ============================================================ */
'use strict';
window.Mega = window.Mega || {};
Mega.ai = {};

/* ---------------- providers ---------------- */
Mega.ai.providers = {
  mega:       { name: 'MegaAI Free',        base: 'https://text.pollinations.ai/openai', free: true,  keyUrl: '' },
  openai:     { name: 'OpenAI (ChatGPT)',   base: 'https://api.openai.com/v1/chat/completions', keyUrl: 'https://platform.openai.com/api-keys' },
  gemini:     { name: 'Google Gemini',      base: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', keyUrl: 'https://aistudio.google.com/apikey' },
  anthropic:  { name: 'Anthropic Claude',   base: 'https://api.anthropic.com/v1/messages', keyUrl: 'https://console.anthropic.com/settings/keys', anthropic: true },
  groq:       { name: 'Groq (free tier)',   base: 'https://api.groq.com/openai/v1/chat/completions', keyUrl: 'https://console.groq.com/keys', free: true },
  openrouter: { name: 'OpenRouter',         base: 'https://openrouter.ai/api/v1/chat/completions', keyUrl: 'https://openrouter.ai/keys' },
  deepseek:   { name: 'DeepSeek',           base: 'https://api.deepseek.com/chat/completions', keyUrl: 'https://platform.deepseek.com/api_keys' },
  xai:        { name: 'xAI Grok',           base: 'https://api.x.ai/v1/chat/completions', keyUrl: 'https://console.x.ai' },
  mistral:    { name: 'Mistral',            base: 'https://api.mistral.ai/v1/chat/completions', keyUrl: 'https://console.mistral.ai/api-keys' }
};

/* ---------------- model catalog ---------------- */
Mega.ai.models = [
  { id: 'mega-openai',    p: 'mega', m: 'openai',      name: 'MegaAI Core',       group: '⚡ MegaAI Free — no key needed', emoji: 'M', tag: 'FREE' },
  { id: 'mega-fast',      p: 'mega', m: 'openai-fast', name: 'MegaAI Turbo (4X)', group: '⚡ MegaAI Free — no key needed', emoji: 'T', tag: 'FREE' },
  { id: 'mega-mistral',   p: 'mega', m: 'mistral',     name: 'Mistral',           group: '⚡ MegaAI Free — no key needed', emoji: 'M' },
  { id: 'mega-qwen',      p: 'mega', m: 'qwen-coder',  name: 'Qwen Coder',        group: '⚡ MegaAI Free — no key needed', emoji: 'Q' },
  { id: 'mega-llama',     p: 'mega', m: 'llama',       name: 'Llama',             group: '⚡ MegaAI Free — no key needed', emoji: 'L' },
  { id: 'mega-deepseek',  p: 'mega', m: 'deepseek',    name: 'DeepSeek',          group: '⚡ MegaAI Free — no key needed', emoji: 'D' },
  { id: 'gpt-4o',         p: 'openai', m: 'gpt-4o',          name: 'ChatGPT (GPT-4o)',   group: 'OpenAI — your API key', emoji: 'G' },
  { id: 'gpt-4o-mini',    p: 'openai', m: 'gpt-4o-mini',     name: 'GPT-4o mini',        group: 'OpenAI — your API key', emoji: 'G' },
  { id: 'gpt-4.1',        p: 'openai', m: 'gpt-4.1',         name: 'GPT-4.1',            group: 'OpenAI — your API key', emoji: 'G' },
  { id: 'o3-mini',        p: 'openai', m: 'o3-mini',         name: 'o3-mini (reasoning)', group: 'OpenAI — your API key', emoji: 'O' },
  { id: 'gem-2.5-flash',  p: 'gemini', m: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash',   group: 'Google Gemini — your API key', emoji: '✦' },
  { id: 'gem-2.5-pro',    p: 'gemini', m: 'gemini-2.5-pro',   name: 'Gemini 2.5 Pro',     group: 'Google Gemini — your API key', emoji: '✦' },
  { id: 'claude-sonnet',  p: 'anthropic', m: 'claude-sonnet-4-5', name: 'Claude Sonnet 4.5', group: 'Anthropic — your API key', emoji: 'C' },
  { id: 'claude-opus',    p: 'anthropic', m: 'claude-opus-4-1',   name: 'Claude Opus 4.1',   group: 'Anthropic — your API key', emoji: 'C' },
  { id: 'groq-llama70',   p: 'groq', m: 'llama-3.3-70b-versatile',       name: 'Llama 3.3 70B',  group: 'Groq — free key, 4X speed', emoji: 'L', tag: 'FREE KEY' },
  { id: 'groq-dsr1',      p: 'groq', m: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 70B', group: 'Groq — free key, 4X speed', emoji: 'D', tag: 'FREE KEY' },
  { id: 'groq-qwen',      p: 'groq', m: 'qwen-2.5-coder-32b',            name: 'Qwen Coder 32B', group: 'Groq — free key, 4X speed', emoji: 'Q', tag: 'FREE KEY' },
  { id: 'groq-search',    p: 'groq', m: 'compound-mini',                 name: 'Compound (built-in web search)', group: 'Groq — free key, 4X speed', emoji: '🌐', tag: 'SEARCH' },
  { id: 'or-dsv3',        p: 'openrouter', m: 'deepseek/deepseek-chat-v3-0324:free', name: 'DeepSeek V3',  group: 'OpenRouter — free models', emoji: 'D', tag: 'FREE' },
  { id: 'or-llama',       p: 'openrouter', m: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B', group: 'OpenRouter — free models', emoji: 'L', tag: 'FREE' },
  { id: 'or-online',      p: 'openrouter', m: 'openai/gpt-4o-mini:online', name: 'Any model + live web search', group: 'OpenRouter — web-search models', emoji: '🌐', tag: 'SEARCH' },
  { id: 'ds-chat',        p: 'deepseek', m: 'deepseek-chat',     name: 'DeepSeek Chat',  group: 'DeepSeek — your API key', emoji: 'D' },
  { id: 'ds-reasoner',    p: 'deepseek', m: 'deepseek-reasoner', name: 'DeepSeek R1',    group: 'DeepSeek — your API key', emoji: 'D' },
  { id: 'grok-3',         p: 'xai', m: 'grok-3',       name: 'Grok 3',      group: 'xAI — your API key', emoji: 'X' },
  { id: 'grok-3-mini',    p: 'xai', m: 'grok-3-mini',  name: 'Grok 3 mini', group: 'xAI — your API key', emoji: 'X' },
  { id: 'mistral-l',      p: 'mistral', m: 'mistral-large-latest', name: 'Mistral Large', group: 'Mistral — your API key', emoji: 'M' },
  { id: 'codestral',      p: 'mistral', m: 'codestral-latest',    name: 'Codestral (code)', group: 'Mistral — your API key', emoji: '#' }
];
Mega.ai.modelById = (id) => Mega.ai.models.find(m => m.id === id) || Mega.ai.models[0];
Mega.ai.hasKey = (p) => !!(Mega.settings.keys || {})[p];

/* ---------------- prompts ---------------- */
Mega.ai.systemPrompt = () => {
  const custom = (Mega.settings.sysPrompt || '').trim();
  return 'You are Mega Power AI — the world\'s fastest, most powerful AI assistant, created by Umesh Chaudhary. ' +
    'Reply in the same language the user writes in (the app UI itself is English). ' +
    'Be genuinely helpful, accurate and complete — like the best of ChatGPT, Gemini and DeepSeek. ' +
    'Use clean markdown. When you write code, use fenced code blocks with a language tag — complete and runnable. ' +
    'When asked who made you: "I was created by Umesh Chaudhary — Mega Power AI."' +
    (custom ? '\n\nUser instructions (follow them): ' + custom : '');
};

Mega.ai.codePrompt = () =>
  'You are Mega Power AI — an elite full-stack engineer that turns ONE prompt into a complete, working project. ' +
  'Rules: (1) Output every file using EXACTLY this format, one after another:\n' +
  '**FILE: filename.ext**\n```ext\n<full file content>\n```\n' +
  '(2) Web projects MUST include index.html; keep CSS/JS in separate files when there are multiple files. ' +
  '(3) Code must be complete, runnable, modern and beautiful (dark UI, gradients, rounded corners). No placeholders, no TODOs. ' +
  '(4) Prefer zero-dependency vanilla code so it runs anywhere. (5) After the files, add a short "## ✅ Project ready" summary.';

/* ---------------- intent router (one box, right result) ---------------- */
Mega.ai.intent = (q) => {
  const t = q.trim().toLowerCase();
  if (/^\/(help|commands)\b/.test(t)) return { type: 'help' };
  if (/^\/new\b|^\/clear\b/.test(t)) return { type: 'new' };
  if (/^\/model\b/.test(t)) return { type: 'model', arg: q.replace(/^\/model\s*/i, '') };
  if (/^\/(keys?|settings)\b/.test(t)) return { type: 'settings' };
  if (/^\/(search|google|web)\b/.test(t)) return { type: 'search', arg: q.replace(/^\/(search|google|web)\s*/i, '') };
  if (/^\/(image|img|draw|paint)\b/.test(t)) return { type: 'image', arg: q.replace(/^\/(image|img|draw|paint)\s*/i, '') };
  if (/^\/(video|vid|animate)\b/.test(t)) return { type: 'video', arg: q.replace(/^\/(video|vid|animate)\s*/i, '') };
  if (/^\/(build|app|project|code)\b/.test(t)) return { type: 'build', arg: q.replace(/^\/(build|app|project|code)\s*/i, '') };
  // natural language intents (video before image, build before image)
  if (/(make|create|generate|produce|do)\b[^.;]{0,30}\b(video|clip|animation|reel|short|movie)\b/.test(t) ||
      /\bimg2vid|\bimage to video|\bphoto to video/.test(t)) return { type: 'video', arg: q };
  if (/\b(build|make|create|develop|code|write)\b[^.;]{0,24}\b(app|application|website|web ?site|web ?page|game|landing page|portfolio|clone|calculator|tracker|todo|quiz|blog|shop|store|dashboard|form)\b/.test(t) ||
      /^build\b/.test(t)) return { type: 'build', arg: q };
  if (/\b(draw|generate|create|make|paint|design)\b[^.;]{0,40}\b(image|picture|photo|art|logo|poster|flyer|thumbnail|wallpaper|icon|banner|illustration|image of|picture of)\b/.test(t) ||
      /^\d+\s*(x|×)\s*\d+\b/.test(t) ||
      /\bdesign (a|an|me) \b/.test(t)) return { type: 'image', arg: q };
  if (/^(search|google|look up|find)\b/.test(t)) return { type: 'search', arg: q.replace(/^(search|google|look up|find)\s*(for)?\s*/i, '') };
  return { type: 'chat', arg: q };
};

/* ---------------- suggestions (the "brain" next-step chips) ---------------- */
Mega.ai.suggest = (kind, text, meta) => {
  const s = [];
  if (kind === 'image') {
    s.push('🎨 Make a poster version', '🔁 Another variation', '✏️ Edit this image', '🎬 Turn it into a video', '💬 Describe & refine it');
  } else if (kind === 'video') {
    s.push('🎞 Make a longer version', '🎵 Add music', '🖼 New scenes', '⬇️ How do I post it?');
  } else if (kind === 'project') {
    s.push('▶ Run it', '🔍 Check the code', '🔧 Fix any issues', '📦 Download ZIP', '🐙 Push to GitHub', '🎨 Redesign the UI');
  } else {
    const t = (text || '').toLowerCase();
    if (/<code|```|\bfunction\b|\bconst\b/.test(text || '')) s.push('🔧 Explain this code', '▶ Make it a full app', '🐞 Find bugs in it');
    s.push('📝 Summarize in 3 bullets', '💡 Explain like I\'m 5', '🌍 Translate to Hindi', '🎨 Make an image of this', '🔍 Search the web for more', '🗣 Speak this aloud', '➕ More detail please');
    if (t.includes('todo')) s.unshift('▶ Build the todo app now');
  }
  return s.slice(0, 5);
};

/* ============================================================
   WEB SEARCH — real results from Wikipedia + DuckDuckGo
   ============================================================ */
Mega.search = {
  needed(q) {
    const mode = Mega.settings.searchMode || 'smart';
    if (mode === 'off') return false;
    if (mode === 'always') return true;
    return /\b(latest|news|today|yesterday|tonight|now|current(ly)?|live|update|released|price|stock|score|weather|who is|who was|what is|when is|where is|how much|how many|2024|2025|2026|definition of|meaning of|trending|viral|search|google|wiki(pedia)?)\b/i.test(q);
  },
  async wiki(q) {
    const url = 'https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrsearch=' +
      encodeURIComponent(q) + '&gsrlimit=3&prop=extracts|info&inprop=url&exintro=1&explaintext=1&exchars=700';
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const j = await r.json();
    const pages = Object.values(j.query?.pages || {});
    return pages.map(p => ({ title: p.title, url: p.fullurl, snippet: (p.extract || '').slice(0, 700) }));
  },
  async ddg(q) {
    const u = 'https://api.allorigins.win/raw?url=' +
      encodeURIComponent('https://api.duckduckgo.com/?q=' + encodeURIComponent(q) + '&format=json&no_html=1&skip_disambig=1');
    const r = await fetch(u, { signal: AbortSignal.timeout(8000) });
    const j = await r.json();
    const out = [];
    if (j.AbstractText) out.push({ title: j.Heading || q, url: j.AbstractURL, snippet: j.AbstractText });
    (j.RelatedTopics || []).slice(0, 4).forEach(t => {
      if (t.Text && t.FirstURL) out.push({ title: t.Text.split(' - ')[0].slice(0, 80), url: t.FirstURL, snippet: t.Text });
    });
    return out;
  },
  async web(q) {
    const [w, d] = await Promise.allSettled([Mega.search.wiki(q), Mega.search.ddg(q)]);
    const sources = [];
    if (w.status === 'fulfilled') sources.push(...w.value);
    if (d.status === 'fulfilled') sources.push(...d.value);
    const seen = new Set();
    const uniq = sources.filter(s => { if (seen.has(s.url)) return false; seen.add(s.url); return true; }).slice(0, 6);
    const context = uniq.map(s => `SOURCE: ${s.title}\nURL: ${s.url}\n${s.snippet}`).join('\n\n');
    return { sources: uniq, context };
  }
};

/* ============================================================
   CHAT — streaming, provider-aware, search-grounded
   ============================================================ */
Mega.ai.chat = async (messages, opts = {}) => {
  const model = Mega.ai.modelById(opts.model || Mega.settings.model);
  const provider = Mega.ai.providers[model.p];
  const keys = Mega.settings.keys || {};
  let out = '';
  const onToken = opts.onToken || (() => {});
  const signal = opts.signal;

  const hasKey = !provider.keyUrl || keys[model.p];
  if (hasKey) {
    try {
      if (provider.anthropic) out = await Mega.ai._anthropic(messages, model.m, keys.anthropic, onToken, signal);
      else out = await Mega.ai._openaiCompat(provider.base, messages, model.m, keys[model.p], onToken, signal, model.p);
      if (out.trim()) return { text: out, model, engine: 'cloud' };
      throw new Error('empty');
    } catch (err) {
      if (signal && signal.aborted) throw err;
      if (opts.noFallback) throw err;
      if (model.p === 'mega') {
        try { out = await Mega.ai._pollinationsGet(messages, onToken, signal); if (out.trim()) return { text: out, model, engine: 'free-get' }; } catch (e) { if (signal && signal.aborted) throw e; }
      }
      const msg = String(err.message || err);
      if (msg.includes('key') || String(err.status) === '401' || String(err.status) === '403') {
        Mega.toast('API key needed', `Add your ${provider.name} key in Settings → API Keys, or stay on MegaAI Free.`, 'warn');
      } else if (model.p !== 'mega') {
        Mega.toast('Provider failed — switching to free engine', msg.slice(0, 80), 'warn');
      }
    }
  } else if (model.p !== 'mega') {
    Mega.toast('API key needed', `Add your ${provider.name} key in Settings → API Keys — or use MegaAI Free (no key).`, 'warn', 5000);
  }
  out = await Mega.ai.lite(messages, opts, onToken, signal);
  return { text: out, model, engine: 'lite' };
};

Mega.ai._openaiCompat = async (base, messages, model, key, onToken, signal, prov) => {
  const headers = { 'Content-Type': 'application/json' };
  if (key) headers['Authorization'] = 'Bearer ' + key;
  if (prov === 'openrouter') { headers['HTTP-Referer'] = location.origin; headers['X-Title'] = 'Mega Power AI'; }
  const res = await fetch(base, { method: 'POST', headers, signal, body: JSON.stringify({ model, messages, stream: true }) });
  if (!res.ok) { const e = new Error('HTTP ' + res.status); e.status = res.status; try { e.detail = (await res.text()).slice(0, 240); } catch {} throw e; }
  return await Mega.ai._readSSE(res, (json) => json.choices?.[0]?.delta?.content || '', onToken);
};

Mega.ai._anthropic = async (messages, model, key, onToken, signal) => {
  const sys = messages.filter(m => m.role === 'system').map(m => m.content).join('\n');
  const msgs = messages.filter(m => m.role !== 'system');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST', signal,
    headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
    body: JSON.stringify({ model, max_tokens: 8000, stream: true, system: sys || undefined, messages: msgs })
  });
  if (!res.ok) { const e = new Error('HTTP ' + res.status); e.status = res.status; throw e; }
  return await Mega.ai._readSSE(res, (json) => (json.type === 'content_block_delta' && json.delta?.text) || '', onToken);
};

Mega.ai._readSSE = async (res, pick, onToken) => {
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '', out = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split('\n'); buf = lines.pop() || '';
    for (const line of lines) {
      const t = line.trim();
      if (!t.startsWith('data:')) continue;
      const payload = t.slice(5).trim();
      if (payload === '[DONE]') continue;
      try { const j = JSON.parse(payload); const d = pick(j); if (d) { out += d; onToken(d, out); } } catch {}
    }
  }
  return out;
};

Mega.ai._pollinationsGet = async (messages, onToken, signal) => {
  const q = messages.filter(m => m.role === 'user').map(m => m.content).join('\n') || 'hello';
  const sys = messages.find(m => m.role === 'system');
  const url = 'https://text.pollinations.ai/' + encodeURIComponent(q.slice(0, 3500)) +
    '?model=openai&referrer=megapowerai' + (sys ? '&system=' + encodeURIComponent(sys.content.slice(0, 500)) : '');
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const text = await res.text();
  onToken(text, text);
  return text;
};

/* ---------------- MegaAI Lite — offline engine ---------------- */
Mega.ai.lite = async (messages, opts, onToken, signal) => {
  const lastUser = [...messages].reverse().find(m => m.role === 'user');
  const q = (lastUser ? lastUser.content : '').trim();
  const text = opts.mode === 'code' ? Mega.lite.project(q) : Mega.lite.chat(q, messages);
  const words = text.split(/(\s+)/);
  const step = Mega.settings.turbo ? 14 : 6;
  for (let i = 0; i < words.length; i += step) {
    if (signal && signal.aborted) throw new DOMException('aborted', 'AbortError');
    onToken(words.slice(i, i + step).join(''), words.slice(0, i + step).join(''));
    await Mega.sleep(Mega.settings.turbo ? 12 : 26);
  }
  return text;
};

Mega.lite = {
  chat(q, messages) {
    const l = q.toLowerCase();
    if (/^(hi+|hello+|hey+|yo|sup|good (morning|afternoon|evening))[\s!.,]*$/.test(l))
      return '👋 **Hello! I am Mega Power AI** — created by Umesh Chaudhary.\n\nI am running in **MegaAI Lite** (offline built-in) mode right now, so the cloud engine is unreachable or warming up. I can still:\n\n- 💬 Answer questions & explain ideas\n- ⚡ Build complete app projects (try: *make a todo app*, *build a snake game*, *create a portfolio website*)\n- 🖼️ Generate images and 🎬 videos (online)\n\nFor full cloud intelligence, open **⚙️ Settings → API Keys** and add any free key (Groq / Gemini / OpenRouter) — or keep using MegaAI Free when you are online.';
    if (/(who).*(made|created|built)|creator|owner/.test(l))
      return '**Mega Power AI** was created by **Umesh Chaudhary** 🚀\n\nIt is one of the world\'s fastest and most powerful AI platforms — no limits, and it turns your ideas into real projects.';
    if (/(what can you do|help|features|capability)/.test(l))
      return '## ⚡ Everything I can do — right from this chat box\n\nJust type naturally. I detect what you want automatically:\n\n| You say | I do |\n|---|---|\n| *"make an image of a neon city"* | 🖼️ Generate a real image (poster, flyer, logo styles) |\n| *"make a video of a rocket launch"* | 🎬 Paint scenes + encode a real video |\n| *"build a snake game"* | 🧑‍💻 Generate the full project, check it, let you preview/download/push it |\n| *"latest news about X"* | 🔍 Search the web live and answer with sources |\n| anything else | 💬 Stream a smart answer like ChatGPT |\n\n**Slash commands** for power users: `/image`, `/video`, `/build`, `/search`, `/model`, `/help`.\n\nEverything is free — no usage limits in-app. 🔒 *Secret project by Umesh Chaudhary.*';
    if (isProjRequest(l)) {
      return 'Here is your project — generated by the built-in **MegaAI Lite** engine (works even offline) 🚀\n\n' + Mega.lite.project(q) + '\n\n> 💡 Online? The cloud engine can build *anything* you describe — this offline engine covers the most popular app types.';
    }
    return `### MegaAI Lite answer 🤖\n\nI heard you: *"${Mega.esc(q.slice(0, 180))}"*\n\nI am currently in **offline Lite mode** (no cloud engine reachable), so deep reasoning is limited — but I never fail you:\n\n1. **⚡ Try again** — the free cloud engine may be back (it throttles briefly when busy).\n2. **🔑 Add a free API key** — *Settings → API Keys* → Groq or OpenRouter (free) or Gemini → full GPT-class power.\n3. **🧑‍💻 Want an app?** I can still build: todo app, calculator, snake game, quiz app, portfolio, landing page, notes app, weather app, timer, memory game, rock-paper-scissors — just ask!\n\n*— Mega Power AI, created by Umesh Chaudhary*`;
  },
  project(q) {
    const l = ' ' + q.toLowerCase() + ' ';
    const t = [
      [/todo|to-do|task/, 'lite.todo'],
      [/calc/, 'lite.calc'],
      [/snake/, 'lite.snake'],
      [/quiz/, 'lite.quiz'],
      [/pomodoro|timer|stopwatch/, 'lite.timer'],
      [/note|memo|diary/, 'lite.notes'],
      [/clock|watch/, 'lite.clock'],
      [/portfolio|resume|cv/, 'lite.portfolio'],
      [/landing|business|startup|marketing|saas/, 'lite.landing'],
      [/weather/, 'lite.weather'],
      [/memory|match game/, 'lite.memory'],
      [/rock|paper|scissor/, 'lite.rps'],
      [/chat|messeng/, 'lite.chatapp'],
    ].find(([re]) => re.test(l));
    if (t) { const fn = t[1].split('.')[1]; if (Mega.lite[fn]) return Mega.lite[fn](q); }
    return Mega.lite.generic(q);
  }
};

function isProjRequest(l) {
  return /(make|create|build|generate|code for|write).*(app|game|website|site|page|calculator|todo|clock|quiz|portfolio|timer|notes|weather|snake|chat)/.test(l);
}

/* --- shared page shell --- */
Mega.lite._page = (title, css, body, js) => {
  const files = [];
  files.push(`**FILE: index.html**\n\`\`\`html\n<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>${Mega.esc(title)}</title>\n<link rel="stylesheet" href="style.css">\n</head>\n<body>\n${body}\n<script src="script.js"><\/script>\n</body>\n</html>\n\`\`\``);
  files.push(`**FILE: style.css**\n\`\`\`css\n${css}\n\`\`\``);
  files.push(`**FILE: script.js**\n\`\`\`javascript\n${js}\n\`\`\``);
  return files.join('\n\n') + '\n\n## ✅ Project ready\n\n**' + title + '** — 3 files: `index.html`, `style.css`, `script.js`. Use **▶ Run** to preview it live, **🔍 Check** to auto-check the code, or **📦 ZIP** to download.';
};
Mega.lite._baseCSS = `*{box-sizing:border-box;margin:0;padding:0;font-family:'Segoe UI',system-ui,sans-serif}
body{min-height:100vh;background:radial-gradient(900px 500px at 20% -10%,rgba(109,93,252,.25),transparent 60%),radial-gradient(800px 600px at 110% 110%,rgba(53,224,255,.18),transparent 55%),#0b1022;color:#eef2ff;display:flex;flex-direction:column;align-items:center;padding:40px 18px}
h1{font-size:clamp(26px,5vw,40px);margin-bottom:8px;background:linear-gradient(100deg,#8f7bff,#35e0ff);-webkit-background-clip:text;background-clip:text;color:transparent}
p.sub{color:#8b93b8;margin-bottom:28px}
.app{width:100%;max-width:520px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);backdrop-filter:blur(14px);border-radius:22px;padding:22px;box-shadow:0 20px 60px rgba(0,0,0,.4)}
.row{display:flex;gap:10px}
input,button,select{font-size:15px;border:none;outline:none;border-radius:12px;padding:12px 14px}
input{flex:1;background:rgba(255,255,255,.08);color:#fff;border:1px solid rgba(255,255,255,.12)}
input::placeholder{color:#5f6a92}
button{background:linear-gradient(100deg,#6d5dfc,#35e0ff);color:#fff;font-weight:700;cursor:pointer;transition:.2s}
button:hover{filter:brightness(1.15);transform:translateY(-1px)}
button.grey{background:rgba(255,255,255,.1)}
ul{list-style:none;margin-top:16px}
li{display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:12px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);margin-bottom:8px;animation:in .25s ease}
@keyframes in{from{opacity:0;transform:translateY(6px)}to{opacity:1}}
.done span{text-decoration:line-through;opacity:.5}
li span{flex:1}
.del{background:none;color:#ff5470;font-size:16px;padding:4px 8px}`;

Mega.lite.todo = (q) => Mega.lite._page('Todo App', Mega.lite._baseCSS,
`<h1>⚡ My Tasks</h1><p class="sub">Built by Mega Power AI</p>
<div class="app">
  <div class="row"><input id="inp" placeholder="Add a task..." autofocus><button onclick="add()">Add</button></div>
  <ul id="list"></ul>
  <p id="count" style="color:#8b93b8;font-size:13px;margin-top:10px"></p>
</div>`,
`const inp=document.getElementById('inp'),list=document.getElementById('list'),count=document.getElementById('count');
let todos=JSON.parse(localStorage.getItem('todos')||'[]');
function save(){localStorage.setItem('todos',JSON.stringify(todos));render();}
function add(){const v=inp.value.trim();if(!v)return;todos.push({t:v,d:false});inp.value='';save();}
function toggle(i){todos[i].d=!todos[i].d;save();}
function del(i,event){event.stopPropagation();todos.splice(i,1);save();}
function render(){list.innerHTML='';todos.forEach((td,i)=>{const li=document.createElement('li');if(td.d)li.className='done';li.innerHTML='<input type="checkbox" '+(td.d?'checked':'')+' onchange="toggle('+i+')"><span>'+td.t.replace(/</g,'&lt;')+'</span><button class="del" onclick="del('+i+',event)">✕</button>';li.onclick=()=>toggle(i);list.appendChild(li);});
count.textContent=todos.filter(t=>!t.d).length+' task(s) remaining';}
inp.addEventListener('keydown',e=>{if(e.key==='Enter')add();});
render();`);

Mega.lite.calc = (q) => Mega.lite._page('Calculator', `*{box-sizing:border-box;margin:0;padding:0;font-family:'Segoe UI',sans-serif}
body{min-height:100vh;display:grid;place-items:center;background:radial-gradient(700px 500px at 80% -10%,rgba(109,93,252,.3),transparent 60%),#0b1022;color:#fff}
.calc{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:26px;padding:22px;backdrop-filter:blur(14px);box-shadow:0 24px 70px rgba(0,0,0,.5)}
.disp{font-size:34px;font-weight:700;text-align:right;padding:18px 10px;min-height:70px;word-break:break-all;color:#35e0ff}
.grid{display:grid;grid-template-columns:repeat(4,72px);gap:10px}
button{height:64px;border:none;border-radius:16px;font-size:21px;font-weight:700;color:#fff;background:rgba(255,255,255,.09);cursor:pointer;transition:.15s}
button:hover{background:rgba(255,255,255,.16);transform:translateY(-2px)}
.op{background:linear-gradient(100deg,#6d5dfc,#35e0ff)}
.eq{grid-column:span 2;background:linear-gradient(100deg,#ff4ecd,#6d5dfc)}`,
`<h1 style="position:absolute;top:26px;font-family:sans-serif">⚡ Calculator</h1>
<div class="calc"><div class="disp" id="d">0</div><div class="grid" id="pad"></div></div>`,
`const d=document.getElementById('d');let cur='0';
const keys=['C','←','%','÷','7','8','9','×','4','5','6','−','1','2','3','+','0','.','','='];
const pad=document.getElementById('pad');
keys.forEach(k=>{const b=document.createElement('button');b.textContent=k;if('÷×−+%'.includes(k)||k==='=')b.className='op';if(k==='=')b.className='eq';
b.onclick=()=>press(k);pad.appendChild(b);});
function press(k){if(k==='C')cur='0';else if(k==='←')cur=cur.length>1?cur.slice(0,-1):'0';
else if(k==='='){try{cur=String(eval(cur.replace(/÷/g,'/').replace(/×/g,'*').replace(/−/g,'-').replace(/%/g,'/100')));}catch(e){cur='Error';}}
else{if(cur==='0'&&'0123456789.'.includes(k))cur=k;else cur+=k;}
d.textContent=cur;}
window.press=press;`);

Mega.lite.snake = (q) => Mega.lite._page('Snake Game', `*{margin:0;padding:0;box-sizing:border-box}
body{min-height:100vh;display:grid;place-items:center;background:radial-gradient(600px 400px at 50% -10%,rgba(53,224,255,.2),transparent 60%),#0b1022;color:#fff;font-family:'Segoe UI',sans-serif}
h1{margin-bottom:10px;background:linear-gradient(100deg,#8f7bff,#35e0ff);-webkit-background-clip:text;background-clip:text;color:transparent}
canvas{border-radius:16px;border:2px solid rgba(53,224,255,.4);box-shadow:0 0 40px rgba(53,224,255,.25);background:#080d1c}
.info{margin-top:12px;color:#8b93b8;font-weight:600}
.score{color:#35e0ff;font-size:22px;font-weight:800}`,
`<h1>🐍 Snake</h1><canvas id="c" width="400" height="400"></canvas>
<div class="info">Score: <span class="score" id="s">0</span> — Arrow keys / swipe</div>`,
`const c=document.getElementById('c'),x=c.getContext('2d');
let snake=[{x:10,y:10}],dir={x:1,y:0},food={x:15,y:15},score=0,dead=false;
const G=20,N=20;
function place(){food={x:Math.floor(Math.random()*N),y:Math.floor(Math.random()*N)};}
document.addEventListener('keydown',e=>{const m={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]}[e.key];
if(m&&!(m[0]===-dir.x&&m[1]===-dir.y)){dir={x:m[0],y:m[1]};e.preventDefault();}});
let tx,ty;c.addEventListener('touchstart',e=>{tx=e.touches[0].clientX;ty=e.touches[0].clientY;});
c.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-tx,dy=e.changedTouches[0].clientY-ty;
if(Math.abs(dx)>Math.abs(dy))dir={x:dx>0?1:-1,y:0};else dir={x:0,y:dy>0?1:-1};});
setInterval(()=>{if(dead)return;
const head={x:(snake[0].x+dir.x+N)%N,y:(snake[0].y+dir.y+N)%N};
if(snake.some(s=>s.x===head.x&&s.y===head.y)){dead=true;setTimeout(()=>{snake=[{x:10,y:10}];dir={x:1,y:0};score=0;document.getElementById('s').textContent=0;dead=false;},900);return;}
snake.unshift(head);
if(head.x===food.x&&head.y===food.y){score+=10;document.getElementById('s').textContent=score;place();}else snake.pop();
x.fillStyle='#080d1c';x.fillRect(0,0,400,400);
x.fillStyle='#ff4ecd';x.beginPath();x.arc(food.x*G+10,food.y*G+10,7,0,7);x.fill();
snake.forEach((s,i)=>{x.fillStyle=i===0?'#35e0ff':'#6d5dfc';x.beginPath();x.roundRect(s.x*G+2,s.y*G+2,16,16,5);x.fill();});
},110);place();`);

Mega.lite.quiz = (q) => Mega.lite._page('Quiz App', Mega.lite._baseCSS + `
.q{font-size:19px;font-weight:700;margin:14px 0}
.opt{display:block;width:100%;text-align:left;background:rgba(255,255,255,.07);color:#fff;margin-bottom:9px}
.opt:hover{background:rgba(53,224,255,.2)}
.opt.right{background:rgba(47,217,138,.3)}
.opt.wrong{background:rgba(255,84,112,.3)}
.bar{height:7px;background:rgba(255,255,255,.1);border-radius:9px;overflow:hidden;margin-bottom:14px}
.bar i{display:block;height:100%;background:linear-gradient(90deg,#6d5dfc,#35e0ff);transition:width .3s}`,
`<h1>🧠 Quiz Master</h1><p class="sub">Built by Mega Power AI</p>
<div class="app"><div class="bar"><i id="bar" style="width:0"></i></div><div class="q" id="q"></div><div id="opts"></div><p id="fb" style="margin-top:10px;font-weight:700;min-height:22px"></p></div>`,
`const QS=[{q:'Who created Mega Power AI?',o:['Umesh Chaudhary','Elon Musk','Bill Gates','Mark Z'],a:0},
{q:'Which language runs in the browser?',o:['Python','C++','JavaScript','Java'],a:2},
{q:'HTML is used for...',o:['Structure','Styling','Database','Hosting'],a:0},
{q:'CSS stands for...',o:['Computer Style Sheets','Cascading Style Sheets','Creative Style System','Color Style Sheets'],a:1},
{q:'1 KB = ?',o:['1000 bytes','1024 bytes','512 bytes','2048 bytes'],a:1}];
let i=0,score=0;
function render(){const q=QS[i];document.getElementById('bar').style.width=(i/QS.length*100)+'%';
document.getElementById('q').textContent=(i+1)+'. '+q.q;
const box=document.getElementById('opts');box.innerHTML='';document.getElementById('fb').textContent='';
q.o.forEach((o,j)=>{const b=document.createElement('button');b.className='opt';b.textContent=o;
b.onclick=()=>pick(j,b);box.appendChild(b);});}
function pick(j,btn){const q=QS[i];document.querySelectorAll('.opt').forEach((b,k)=>{if(k===q.a)b.classList.add('right');});
if(j===q.a){score++;document.getElementById('fb').textContent='✅ Correct!';document.getElementById('fb').style.color='#2fd98a';}
else{btn.classList.add('wrong');document.getElementById('fb').textContent='❌ Answer: '+q.o[q.a];document.getElementById('fb').style.color='#ff5470';}
setTimeout(()=>{i++;if(i<QS.length)render();else{document.getElementById('q').textContent='🏁 Score: '+score+'/'+QS.length;document.getElementById('opts').innerHTML='';document.getElementById('fb').textContent='Reload to play again!';document.getElementById('bar').style.width='100%';}},900);}
render();`);

Mega.lite.timer = (q) => Mega.lite._page('Pomodoro Timer', Mega.lite._baseCSS + `
.ring{position:relative;width:230px;height:230px;margin:14px auto}
svg{transform:rotate(-90deg)}
.time{position:absolute;inset:0;display:grid;place-items:center;font-size:42px;font-weight:800;color:#35e0ff}`,
`<h1>🍅 Pomodoro</h1><p class="sub">Focus • 25 min work / 5 min break</p>
<div class="app" style="text-align:center">
<div class="ring"><svg width="230" height="230"><circle cx="115" cy="115" r="104" stroke="rgba(255,255,255,.09)" stroke-width="12" fill="none"/><circle id="arc" cx="115" cy="115" r="104" stroke="url(#g)" stroke-width="12" fill="none" stroke-linecap="round" stroke-dasharray="653" stroke-dashoffset="0"/><defs><linearGradient id="g"><stop offset="0" stop-color="#6d5dfc"/><stop offset="1" stop-color="#35e0ff"/></linearGradient></defs></svg><div class="time" id="t">25:00</div></div>
<div class="row" style="justify-content:center"><button id="go">▶ Start</button><button class="grey" onclick="reset()">Reset</button></div>
<p id="mode" style="margin-top:12px;color:#8b93b8;font-weight:700">WORK</p></div>`,
`let total=25*60,left=total,run=false,timer=null,work=true;
const t=document.getElementById('t'),arc=document.getElementById('arc'),go=document.getElementById('go');
function fmt(){t.textContent=String(Math.floor(left/60)).padStart(2,'0')+':'+String(left%60).padStart(2,'0');
arc.style.strokeDashoffset=653*(1-left/total);}
function tick(){if(left>0){left--;fmt();}else{beep();switchMode();}}
function beep(){try{const a=new (window.AudioContext||window.webkitAudioContext)();const o=a.createOscillator();a.resume?.();o.connect(a.destination);o.start();o.stop(a.currentTime+.4);}catch(e){}}
function switchMode(){work=!work;total=work?25*60:5*60;left=total;document.getElementById('mode').textContent=work?'WORK':'BREAK';}
go.onclick=()=>{run=!run;go.textContent=run?'⏸ Pause':'▶ Start';if(run)timer=setInterval(tick,1000);else clearInterval(timer);};
function reset(){clearInterval(timer);run=false;go.textContent='▶ Start';total=work?25*60:5*60;left=total;fmt();}
fmt();`);

Mega.lite.notes = (q) => Mega.lite._page('Notes App', Mega.lite._baseCSS + `
.note{position:relative;padding:14px;border-radius:14px;background:linear-gradient(135deg,rgba(255,194,71,.15),rgba(255,78,205,.1));border:1px solid rgba(255,194,71,.3);margin-top:10px;white-space:pre-wrap;font-size:14px;line-height:1.5}
.note b{display:block;font-size:12px;color:#ffc247;margin-bottom:6px;letter-spacing:.06em}
textarea{width:100%;min-height:90px;background:rgba(255,255,255,.07);color:#fff;border:1px solid rgba(255,255,255,.14);border-radius:12px;padding:12px;font-size:14px;resize:vertical;outline:none}`,
`<h1>📝 Quick Notes</h1><p class="sub">Saved in your browser — never lost</p>
<div class="app"><textarea id="inp" placeholder="Write a note... (Ctrl+Enter to save)"></textarea>
<div style="text-align:right;margin-top:8px"><button onclick="save()">💾 Save note</button></div><div id="list"></div></div>`,
`const inp=document.getElementById('inp'),list=document.getElementById('list');
let notes=JSON.parse(localStorage.getItem('notes')||'[]');
inp.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.ctrlKey)save();});
function save(){const v=inp.value.trim();if(!v)return;notes.unshift({t:v,d:new Date().toLocaleString()});inp.value='';persist();}
function del(i){notes.splice(i,1);persist();}
function persist(){localStorage.setItem('notes',JSON.stringify(notes));render();}
function render(){list.innerHTML='';notes.forEach((n,i)=>{const d=document.createElement('div');d.className='note';
d.innerHTML='<b>'+n.d+' <span style="float:right;cursor:pointer;color:#ff5470" onclick="del('+i+')">✕</span></b>'+n.t.replace(/</g,'&lt;');list.appendChild(d);});}
render();`);

Mega.lite.clock = (q) => Mega.lite._page('Digital Clock', `body{min-height:100vh;display:grid;place-items:center;background:radial-gradient(800px 500px at 50% -20%,rgba(109,93,252,.35),transparent 60%),#0b1022;color:#fff;font-family:'Segoe UI',sans-serif;text-align:center}
.clock{font-size:clamp(54px,14vw,110px);font-weight:800;letter-spacing:.04em;background:linear-gradient(100deg,#8f7bff,#35e0ff);-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:0 0 60px rgba(53,224,255,.3)}
.date{color:#8b93b8;font-size:19px;margin-top:6px;font-weight:600}
.dots{display:flex;gap:8px;justify-content:center;margin-top:20px}
.dots i{width:8px;height:8px;border-radius:50%;background:#35e0ff;animation:b 1.5s infinite}
@keyframes b{50%{opacity:.3}}`,
`<div><div class="clock" id="c">00:00:00</div><div class="date" id="d"></div>
<div class="dots"><i></i><i style="animation-delay:.2s"></i><i style="animation-delay:.4s"></i></div></div>`,
`function tick(){const n=new Date();document.getElementById('c').textContent=n.toLocaleTimeString();
document.getElementById('d').textContent=n.toLocaleDateString([],{weekday:'long',year:'numeric',month:'long',day:'numeric'});}
tick();setInterval(tick,1000);`);

Mega.lite.portfolio = (q) => Mega.lite._page('Portfolio Website', `*{margin:0;padding:0;box-sizing:border-box;font-family:'Segoe UI',sans-serif}
body{background:#0b1022;color:#eef2ff}
header{min-height:92vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:20px;background:radial-gradient(700px 400px at 50% 0%,rgba(109,93,252,.35),transparent 65%)}
.avatar{width:130px;height:130px;border-radius:50%;background:linear-gradient(135deg,#6d5dfc,#35e0ff);display:grid;place-items:center;font-size:52px;font-weight:800;color:#fff;box-shadow:0 0 60px rgba(109,93,252,.6);margin-bottom:22px}
h1{font-size:clamp(30px,6vw,52px)}h1 span{background:linear-gradient(100deg,#8f7bff,#35e0ff);-webkit-background-clip:text;background-clip:text;color:transparent}
.tag{color:#8b93b8;margin:12px 0 26px;font-size:17px}
.btns a{display:inline-block;margin:5px;padding:12px 26px;border-radius:13px;background:linear-gradient(100deg,#6d5dfc,#35e0ff);color:#fff;font-weight:700;text-decoration:none}
section{max-width:960px;margin:0 auto;padding:70px 20px}
h2{font-size:30px;margin-bottom:24px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px}
.card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:18px;padding:22px;transition:.25s}
.card:hover{transform:translateY(-5px);border-color:rgba(53,224,255,.4)}
.card h3{margin-bottom:8px}.card p{color:#8b93b8;font-size:14px;line-height:1.6}
footer{text-align:center;padding:34px;color:#5f6a92;border-top:1px solid rgba(255,255,255,.07)}`,
`<header><div class="avatar">MP</div><h1>Hi, I'm <span>Your Name</span> 👋</h1>
<p class="tag">Developer • Designer • Creator</p>
<div class="btns"><a href="#work">My Work</a><a href="mailto:you@example.com">Contact</a></div></header>
<section id="work"><h2>⭐ Projects</h2><div class="grid">
<div class="card"><h3>Project One</h3><p>Amazing project description goes here.</p></div>
<div class="card"><h3>Project Two</h3><p>Another awesome thing I built.</p></div>
<div class="card"><h3>Project Three</h3><p>Crafted with love and code.</p></div></div></section>
<section><h2>🛠 Skills</h2><div class="grid">
<div class="card"><h3>Frontend</h3><p>HTML • CSS • JavaScript • React</p></div>
<div class="card"><h3>Backend</h3><p>Node.js • Python • APIs</p></div>
<div class="card"><h3>Design</h3><p>UI/UX • Figma • Motion</p></div></div></section>
<footer>© 2026 Your Name — site generated by Mega Power AI ⚡</footer>`,
`document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();document.querySelector(a.getAttribute('href')).scrollIntoView({behavior:'smooth'});}));
console.log('Portfolio ready — edit the HTML to make it yours!');`);

Mega.lite.landing = (q) => Mega.lite._page('Landing Page', `*{margin:0;padding:0;box-sizing:border-box;font-family:'Segoe UI',sans-serif}
body{background:#0b1022;color:#eef2ff;overflow-x:hidden}
nav{display:flex;justify-content:space-between;align-items:center;padding:20px 7%;position:sticky;top:0;backdrop-filter:blur(14px);background:rgba(11,16,34,.7);z-index:9}
.logo{font-weight:800;font-size:20px}.logo b{color:#35e0ff}
nav a{color:#8b93b8;text-decoration:none;margin-left:24px;font-weight:600}
nav a:hover{color:#fff}
.hero{min-height:88vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:20px;background:radial-gradient(700px 400px at 50% 0%,rgba(109,93,252,.4),transparent 60%)}
.hero h1{font-size:clamp(34px,7vw,64px);max-width:820px;line-height:1.15}
.hero h1 span{background:linear-gradient(100deg,#8f7bff,#35e0ff);-webkit-background-clip:text;background-clip:text;color:transparent}
.hero p{color:#8b93b8;font-size:19px;margin:18px 0 30px;max-width:560px}
.cta{padding:15px 34px;border-radius:14px;background:linear-gradient(100deg,#6d5dfc,#35e0ff);color:#fff;font-weight:800;font-size:16px;text-decoration:none;box-shadow:0 12px 40px rgba(109,93,252,.5)}
.feat{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:18px;max-width:1050px;margin:60px auto;padding:0 6%}
.f{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:26px;text-align:center}
.f div{font-size:38px}.f h3{margin:12px 0 8px}.f p{color:#8b93b8;font-size:14px}
footer{text-align:center;padding:40px;color:#5f6a92}`,
`<nav><div class="logo">Your<b>Brand</b></div><div><a href="#f">Features</a><a href="#">Pricing</a><a href="#" class="cta" style="margin-left:24px;padding:10px 20px;font-size:14px">Get Started</a></div></nav>
<div class="hero"><h1>Launch your idea <span>4X faster</span></h1><p>The all-in-one platform to build, ship and grow — no limits, no friction.</p><a class="cta" href="#f">Start free →</a></div>
<div class="feat" id="f">
<div class="f"><div>⚡</div><h3>Blazing Fast</h3><p>Optimized for speed at every level.</p></div>
<div class="f"><div>🔒</div><h3>Secure</h3><p>Enterprise-grade security built in.</p></div>
<div class="f"><div>🌍</div><h3>Global</h3><p>Available everywhere, instantly.</p></div></div>
<footer>© 2026 YourBrand — made with Mega Power AI ⚡</footer>`,
`document.querySelector('.cta').addEventListener('click',()=>alert('Welcome aboard! 🚀'));`);

Mega.lite.weather = (q) => Mega.lite._page('Weather App', Mega.lite._baseCSS + `
.temp{font-size:64px;font-weight:800;background:linear-gradient(100deg,#8f7bff,#35e0ff);-webkit-background-clip:text;background-clip:text;color:transparent}
.cond{font-size:17px;color:#8b93b8;font-weight:600}
.days{display:flex;gap:8px;margin-top:16px;flex-wrap:wrap}
.day{flex:1;min-width:86px;text-align:center;background:rgba(255,255,255,.06);border-radius:14px;padding:12px 8px;font-size:13px}
.day b{display:block;font-size:16px;margin-top:4px;color:#35e0ff}`,
`<h1>🌤 Weather</h1><p class="sub">Live data — open-meteo (free)</p>
<div class="app" style="text-align:center"><div class="row"><input id="city" placeholder="City e.g. Delhi, London, Tokyo"><button onclick="load()">Search</button></div>
<div id="out" style="margin-top:18px"><p style="color:#8b93b8">Type a city to get live weather ⛅</p></div></div>`,
`async function load(){const city=document.getElementById('city').value.trim();if(!city)return;
const out=document.getElementById('out');out.innerHTML='<p style="color:#8b93b8">Loading…</p>';
try{const g=await fetch('https://geocoding-api.open-meteo.com/v1/search?count=1&name='+encodeURIComponent(city)).then(r=>r.json());
if(!g.results)throw 0;const {latitude:la,longitude:lo,name}=g.results[0];
const w=await fetch('https://api.open-meteo.com/v1/forecast?latitude='+la+'&longitude='+lo+'&current=temperature_2m,weather_code&daily=temperature_2m_max,weather_code&forecast_days=5').then(r=>r.json());
const codes={0:'☀️ Clear',1:'🌤 Mostly clear',2:'⛅ Partly cloudy',3:'☁️ Overcast',45:'🌫 Fog',51:'🌦 Drizzle',61:'🌧 Rain',63:'🌧 Rain',65:'🌧 Heavy rain',71:'🌨 Snow',80:' showers',95:'⛈ Thunderstorm'};
out.innerHTML='<div class="temp">'+Math.round(w.current.temperature_2m)+'°C</div><div class="cond">'+name+' — '+(codes[w.current.weather_code]||'—')+'</div><div class="days">'+
w.daily.time.map((d,i)=>'<div class="day">'+new Date(d).toLocaleDateString([],{weekday:'short'})+(codes[w.daily.weather_code[i]]||'').split(' ')[0]+'<b>'+Math.round(w.daily.temperature_2m_max[i])+'°</b></div>').join('')+'</div>';}
catch(e){out.innerHTML='<p style="color:#ff5470">City not found — try again.</p>';}}
window.load=load;`);

Mega.lite.memory = (q) => Mega.lite._page('Memory Game', Mega.lite._baseCSS + `
.board{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:14px}
.card{aspect-ratio:1;border-radius:14px;background:linear-gradient(135deg,#6d5dfc,#35e0ff);font-size:34px;display:grid;place-items:center;cursor:pointer;transition:.25s;user-select:none}
.card.flip{background:rgba(255,255,255,.1);transform:rotateY(180deg)}
.card.done{background:rgba(47,217,138,.25);opacity:.6}`,
`<h1>🃏 Memory Match</h1><p class="sub">Find all the pairs!</p>
<div class="app"><div class="row" style="justify-content:space-between"><b>Moves: <span id="mv">0</span></b><button onclick="init()">Restart</button></div><div class="board" id="b"></div></div>`,
`const EM=['🚀','⚡','🌟','🔥','🎮','🌙','💎','🎧'];let first=null,lock=false,mv=0;
function init(){mv=0;document.getElementById('mv').textContent=0;first=null;lock=false;
const deck=[...EM,...EM].sort(()=>Math.random()-.5);
const b=document.getElementById('b');b.innerHTML='';
deck.forEach(e=>{const c=document.createElement('div');c.className='card';c.textContent='?';c.dataset.e=e;
c.onclick=()=>{if(lock||c.classList.contains('flip'))return;c.classList.add('flip');c.textContent=c.dataset.e;
if(!first){first=c;return;}
mv++;document.getElementById('mv').textContent=mv;lock=true;
if(first.dataset.e===c.dataset.e){first.classList.add('done');c.classList.add('done');first=null;lock=false;
if(document.querySelectorAll('.done').length===16)setTimeout(()=>alert('🏆 You won in '+mv+' moves!'),300);}
else setTimeout(()=>{first.classList.remove('flip');c.classList.remove('flip');first.textContent='?';c.textContent='?';first=null;lock=false;},700);};
b.appendChild(c);});}
init();`);

Mega.lite.rps = (q) => Mega.lite._page('Rock Paper Scissors', Mega.lite._baseCSS + `
.choices{display:flex;gap:12px;justify-content:center;margin:18px 0}
.choice{width:84px;height:84px;font-size:38px;border-radius:20px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);cursor:pointer;transition:.2s}
.choice:hover{transform:translateY(-4px) scale(1.05);background:rgba(53,224,255,.15)}
.score{display:flex;justify-content:center;gap:30px;font-size:17px;font-weight:700}
.score b{font-size:30px;color:#35e0ff}
#msg{font-size:22px;font-weight:800;min-height:30px;margin-top:10px}`,
`<h1>✊ ✋ ✌️</h1><p class="sub">You vs Computer</p>
<div class="app" style="text-align:center">
<div class="score"><div>You<br><b id="u">0</b></div><div>Comp<br><b id="c">0</b></div></div>
<div class="choices"><button class="choice" onclick="play('✊')">✊</button><button class="choice" onclick="play('✋')">✋</button><button class="choice" onclick="play('✌️')">✌️</button></div>
<div id="msg"></div></div>`,
`let u=0,c=0;
function play(p){const opts=['✊','✋','✌️'];const comp=opts[Math.floor(Math.random()*3)];
const msg=document.getElementById('msg');
if(p===comp){msg.textContent='🤝 Draw! '+p+' vs '+comp;}
else if((p==='✊'&&comp==='✌️')||(p==='✋'&&comp==='✊')||(p==='✌️'&&comp==='✋')){u++;msg.textContent='🎉 You win! '+p+' beats '+comp;}
else{c++;msg.textContent='💻 Computer wins! '+comp+' beats '+p;}
document.getElementById('u').textContent=u;document.getElementById('c').textContent=c;}
window.play=play;`);

Mega.lite.chatapp = (q) => Mega.lite._page('Chat UI', Mega.lite._baseCSS + `
.msgs{height:320px;overflow:auto;padding:10px;display:flex;flex-direction:column;gap:8px}
.m{max-width:78%;padding:10px 14px;border-radius:15px;font-size:14px;animation:in .2s}
.me{align-self:flex-end;background:linear-gradient(100deg,#6d5dfc,#35e0ff);border-bottom-right-radius:4px}
.bot{align-self:flex-start;background:rgba(255,255,255,.08);border-bottom-left-radius:4px}`,
`<h1>💬 Chat UI</h1><p class="sub">A messenger-style interface</p>
<div class="app"><div class="msgs" id="msgs">
<div class="m bot">Hi! 👋 I am a demo bot. Say anything!</div></div>
<div class="row" style="margin-top:12px"><input id="inp" placeholder="Type a message..."><button onclick="send()">➤</button></div></div>`,
`const msgs=document.getElementById('msgs'),inp=document.getElementById('inp');
const replies=['That\'s interesting! 🤔','Tell me more!','I am just a demo bot, but I listen well 👂','Haha! 😄','Mega Power AI could make me smarter ⚡','What else is on your mind?'];
function send(){const v=inp.value.trim();if(!v)return;add(v,'me');inp.value='';
setTimeout(()=>{add(replies[Math.floor(Math.random()*replies.length)],'bot');},600+Math.random()*600);}
function add(t,who){const d=document.createElement('div');d.className='m '+who;d.textContent=t;msgs.appendChild(d);msgs.scrollTop=msgs.scrollHeight;}
inp.addEventListener('keydown',e=>{if(e.key==='Enter')send();});
window.send=send;`);

Mega.lite.generic = (q) => {
  const name = (q.replace(/[^a-z0-9 ]/gi, '').trim().split(/\s+/).slice(0, 3).join(' ') || 'My App').replace(/\b\w/g, c => c.toUpperCase());
  return Mega.lite._page(name, Mega.lite._baseCSS + `
.hero{text-align:center;padding:30px 0}
.hero .ico{font-size:56px}
.hero p{color:#8b93b8;margin-top:8px}`,
`<h1>⚡ ${Mega.esc(name)}</h1><p class="sub">Generated by Mega Power AI (Lite engine)</p>
<div class="app"><div class="hero"><div class="ico">🚀</div><p>${Mega.esc(q.slice(0, 140))}</p></div>
<div class="row"><input id="inp" placeholder="Type something..."><button onclick="go()">Go</button></div>
<div id="out" style="margin-top:14px"></div></div>`,
`function go(){const v=document.getElementById('inp').value.trim();if(!v)return;
const out=document.getElementById('out');out.innerHTML='<li>'+v.replace(/</g,'&lt;')+'</li>';
console.log('App skeleton ready — extend me!');}
window.go=go;`);
};

/* ============================================================
   IMAGE ENGINE — ChatGPT-quality results
   • With OpenAI key → gpt-image-1 (same engine as ChatGPT)
   • Without key → free Flux engine with professional poster
     prompt engineering. NO watermarks, ever.
   ============================================================ */
Mega.ai.imageStyles = {
  '': '',
  poster: ', professional graphic design poster, bold headline typography, clean layout hierarchy, vivid colors, high contrast, print-quality composition, marketing flyer aesthetic, award-winning design',
  social: ', eye-catching social media post design, modern typography, balanced composition, vibrant gradient background, professional graphic design, high engagement aesthetic',
  realistic: ', ultra realistic photograph, 8k, detailed, professional lighting, shallow depth of field',
  cinematic: ', cinematic film still, dramatic lighting, movie color grading, anamorphic lens, highly detailed',
  anime: ', anime style, studio ghibli inspired, vibrant, detailed illustration',
  '3d': ', 3d render, octane render, soft studio lighting, pixar style, high detail',
  digital: ', digital art, concept art, trending on artstation, masterpiece',
  cyberpunk: ', cyberpunk style, neon lights, futuristic, rain reflections, blade runner mood',
  watercolor: ', watercolor painting, soft flowing colors, artistic paper texture',
  minimal: ', minimal flat vector design, clean shapes, lots of negative space',
  logo: ', flat vector logo design, simple, centered, iconic, professional branding, plain background',
  thumbnail: ', YouTube thumbnail style, bold expressive subject, bright colors, high contrast, clickbait energy, professional'
};

Mega.ai.image = (() => {
  const queue = []; let running = false; let lastAt = 0;
  const GAP = 2500;
  const run = async () => {
    if (running) return; running = true;
    while (queue.length) {
      const job = queue[0];
      const wait = Math.max(0, lastAt + GAP - Date.now());
      if (wait) await Mega.sleep(wait);
      lastAt = Date.now();
      let ok = false;
      for (let attempt = 0; attempt < 3 && !ok; attempt++) {
        if (job.signal && job.signal.aborted) break;
        ok = await job.load(attempt);
        if (!ok) await Mega.sleep(2000 + attempt * 2200);
      }
      queue.shift();
      if (!ok && !(job.signal && job.signal.aborted)) job.reject(new Error('image-failed'));
    }
    running = false;
  };
  return {
    /* engine choice: key-based (OpenAI gpt-image-1) or free Flux */
    engine() {
      const pref = Mega.settings.imageEngine || 'auto';
      if (pref === 'free') return 'free';
      if (pref === 'openai') return 'openai';
      return Mega.ai.hasKey('openai') ? 'openai' : 'free';
    },
    async get(prompt, opts = {}) {
      const engine = opts.engine || Mega.ai.image.engine();
      if (engine === 'openai' && Mega.ai.hasKey('openai')) {
        return Mega.ai.openaiImage(prompt, opts);
      }
      return new Promise((resolve, reject) => {
        const seed = opts.seed ?? Math.floor(Math.random() * 1e9);
        const style = opts.style !== undefined ? opts.style : (Mega.settings.imageStyle ?? 'realistic');
        const p = prompt + (Mega.ai.imageStyles[style] ?? '');
        const [w, h] = Mega.ai.imageSize(opts.size || Mega.settings.imageSize || '1:1');
        const load = (attempt) => new Promise((res) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          const s = seed + attempt * 7919;
          const u = 'https://image.pollinations.ai/prompt/' + encodeURIComponent(p) +
            `?width=${w}&height=${h}&seed=${s}&nologo=true&model=flux&enhance=true&referrer=megapowerai`;
          let done = false;
          const finish = (v) => { if (done) return; done = true; clearTimeout(t); if (v) resolve(img); res(v); };
          const t = setTimeout(() => finish(false), 90000);
          img.onload = () => finish(true);
          img.onerror = () => finish(false);
          img.src = u;
        });
        const job = { load, signal: opts.signal, resolve, reject };
        queue.push(job);
        run().catch(() => {});
      });
    },
    url(prompt, opts = {}) {
      const style = opts.style !== undefined ? opts.style : (Mega.settings.imageStyle ?? 'realistic');
      const [w, h] = Mega.ai.imageSize(opts.size || '1:1');
      return 'https://image.pollinations.ai/prompt/' + encodeURIComponent(prompt + (Mega.ai.imageStyles[style] ?? '')) +
        `?width=${w}&height=${h}&seed=${opts.seed ?? Math.floor(Math.random() * 1e9)}&nologo=true&model=flux&enhance=true&referrer=megapowerai`;
    }
  };
})();

Mega.ai.imageSize = (ratio) => {
  const map = { '1:1': [1024, 1024], '16:9': [1280, 720], '9:16': [720, 1280], '4:3': [1152, 864], '3:4': [864, 1152] };
  return map[ratio] || map['1:1'];
};

/* OpenAI image generation — the same engine family ChatGPT uses */
Mega.ai.openaiImage = async (prompt, opts = {}) => {
  const key = Mega.settings.keys.openai;
  const [w, h] = Mega.ai.imageSize(opts.size || Mega.settings.imageSize || '1:1');
  const size = w === h ? '1024x1024' : (w > h ? '1536x1024' : '1024x1536');
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt: prompt.slice(0, 3800),
      size,
      n: opts.n || 1
    })
  });
  if (!res.ok) { const e = new Error('OpenAI images: HTTP ' + res.status); e.status = res.status; try { e.detail = (await res.text()).slice(0, 200); } catch {} throw e; }
  const j = await res.json();
  const b64 = j.data?.[0]?.b64_json;
  if (!b64) throw new Error('OpenAI images: no image returned');
  const url = 'data:image/png;base64,' + b64;
  await new Promise((res2, rej2) => { const im = new Image(); im.onload = res2; im.onerror = rej2; im.src = url; });
  return { src: url, isDataURL: true };
};

/* Image EDIT — with OpenAI key (gpt-image-1 edits) or free (flux kontext) */
Mega.ai.editImage = async (imageUrl, prompt, opts = {}) => {
  if (Mega.ai.hasKey('openai') && (Mega.settings.imageEngine || 'auto') !== 'free') {
    try {
      const blob = await (await fetch(imageUrl)).blob();
      const fd = new FormData();
      fd.append('model', 'gpt-image-1');
      fd.append('prompt', prompt.slice(0, 3000));
      fd.append('image', blob, 'image.png');
      const res = await fetch('https://api.openai.com/v1/images/edits', {
        method: 'POST', headers: { 'Authorization': 'Bearer ' + Mega.settings.keys.openai }, body: fd
      });
      if (res.ok) {
        const j = await res.json();
        if (j.data?.[0]?.b64_json) return 'data:image/png;base64,' + j.data[0].b64_json;
      }
    } catch {}
  }
  // free: FLUX Kontext img2img via pollinations
  const u = 'https://image.pollinations.ai/prompt/' + encodeURIComponent(prompt + ', keep the same subject and composition, apply the requested edit') +
    `?model=kontext&image=${encodeURIComponent(imageUrl)}&nologo=true&enhance=true&referrer=megapowerai`;
  await new Promise((res, rej) => { const im = new Image(); im.onload = res; im.onerror = rej; im.src = u; });
  return u;
};

/* ---------------- provider test ---------------- */
Mega.ai.test = async (providerId) => {
  const p = Mega.ai.providers[providerId];
  const key = (Mega.settings.keys || {})[providerId];
  if (p.keyUrl && !key) return { ok: false, msg: 'No key saved yet' };
  try {
    const mdl = providerId === 'openai' ? 'gpt-4o-mini'
      : providerId === 'gemini' ? 'gemini-2.5-flash'
      : providerId === 'anthropic' ? 'claude-sonnet-4-5'
      : providerId === 'groq' ? 'llama-3.3-70b-versatile'
      : providerId === 'openrouter' ? 'meta-llama/llama-3.3-70b-instruct:free'
      : providerId === 'deepseek' ? 'deepseek-chat'
      : providerId === 'xai' ? 'grok-3-mini'
      : providerId === 'mistral' ? 'mistral-large-latest' : 'openai';
    const msgs = [{ role: 'user', content: 'Reply with exactly: OK' }];
    if (providerId === 'anthropic') await Mega.ai._anthropic(msgs, mdl, key, () => {}, undefined);
    else await Mega.ai._openaiCompat(p.base, msgs, mdl, key, () => {}, undefined, providerId);
    return { ok: true, msg: 'Connected — ' + p.name + ' is live 🚀' };
  } catch (e) {
    return { ok: false, msg: 'Failed: ' + (e.message || e) + (e.status ? ' (HTTP ' + e.status + ')' : '') };
  }
};

/* ---------------- parse AI code output into files ---------------- */
Mega.ai.parseFiles = (text) => {
  const files = [];
  let re = /\*{0,2}FILE:?\s*\*{0,2}`?([\w\u00c0-\u24ff./@ -]+?)`?\*{0,2}\s*\n+```[\w+#.-]*\n([\s\S]*?)```/g;
  let m;
  while ((m = re.exec(text))) files.push({ path: m[1].trim().replace(/\*+/g, ''), content: m[2].replace(/\n$/, '') });
  re = /={2,}\s*FILE:?\s*([\w\u00c0-\u24ff./@ -]+?)\s*={2,}\n([\s\S]*?)(?=={2,}\s*FILE:|$)/g;
  while ((m = re.exec(text))) { const p = m[1].trim(); if (!files.some(f => f.path === p)) files.push({ path: p, content: m[2].replace(/\n+$/, '') }); }
  if (!files.length) {
    const fre = /```([\w+#.-]*)\n([\s\S]*?)```/g;
    const langs = { html: 'index.html', javascript: 'script.js', js: 'script.js', css: 'style.css', python: 'main.py', json: 'data.json' };
    while ((m = fre.exec(text))) {
      const l = (m[1] || '').toLowerCase();
      files.push({ path: langs[l] || (l ? 'main.' + l : 'code.txt'), content: m[2].replace(/\n$/, '') });
    }
  }
  if (!files.length && text.trim()) files.push({ path: 'notes.md', content: text.trim() });
  return files;
};
