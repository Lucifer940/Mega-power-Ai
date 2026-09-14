# ⚡ Mega Power AI

> **The world's fastest and most powerful AI platform — no limits, no issues.**
> Understands **any language**. Tell it your ideas — **it makes them real**.
>
> Created by **Umesh Chaudhary** 👑 · 🔒 *Secret project* · 100% free

One codebase that is a **website**, an **installable app** (Android · iOS · Windows · Linux · macOS) **and a CMD-box terminal** — with AI chat, one-prompt app generation, image/video/voice studios, background build jobs and real GitHub integration.

---

## 🚀 Run it (zero install)

**Option A — just open it**

```
open index.html          # any modern browser, works instantly (Lite engine)
```

**Option B — full power (recommended)**

```
python3 -m http.server 8420     # or: python -m http.server 8420
# → http://localhost:8420
```

**Option C — installers**

| Platform | Command |
|---|---|
| 🪟 Windows (CMD box mode) | double-click `install/install-windows.cmd` |
| 🐧 Linux | `bash install/install-linux.sh` |
| 🍎 macOS | `bash install/install-mac.sh` |
| No Python? | `node server.js` |

**Install as an app:** click the **📲 Install app** button in the sidebar (or the ⊕ icon in the address bar). Android: Chrome menu → *Install app*. iOS: Safari → Share → *Add to Home Screen*.

---

## ✨ Features

| | Feature | Where |
|---|---|---|
| 💬 | **Chat like ChatGPT** — streaming, markdown, code blocks, history, stop/regenerate | **AI Chat** |
| 🧠 | **25+ models, LMArena-style** — ChatGPT, Gemini, Claude, DeepSeek, Grok, Llama, Qwen, Grok, Mistral… | top-bar model picker |
| 🆓 | **Works free with no API key** — MegaAI Free (keyless cloud) + built-in offline **MegaAI Lite** engine that never fails | everywhere |
| 🧑‍💻 | **One prompt → complete project** — multi-file, live preview, edits, ZIP download | **Code Studio** |
| 🔍 | **Auto code check** — real syntax check (JS/HTML/CSS/JSON/Python) + smart review, per file & line | **Code Studio → Check** |
| 🔧 | **Auto-correction** — one tap fixes bugs across every file (also on any chat code block) | **Auto-fix** |
| ⚡ | **4X faster** — Turbo streaming mode, fast free engines | Settings |
| 🖼 | **Image generation** — free keyless engine, 9 styles, any aspect, grids, re-rolls | **Create Studio → Image** |
| 🎬 | **Video generation** — scenes → AI images → real encoded video (motion, titles, music) | **Create Studio → Video** |
| 🗣 | **Voice studio** — any text → speech, every language, presets | **Create Studio → Voice** |
| 📁 | **Projects with folders** — saved on device, rebuild anytime, one-click ZIP | **My Projects** |
| ⚙️ | **Background jobs** — builds run while you chat; stop / cancel any time; jobs **auto-resume** if you close the app | **My Projects** |
| 🐙 | **GitHub connect** — pick or create a repo, push projects as commits, import repos to edit | **GitHub Connect** |
| 🎯 | **Choose where to create** — in-app · your device (ZIP) · GitHub | project wizard |
| ⌨️ | **One-command builds** — `build a snake game` | **Mega CMD** |
| 🔐 | **Animated login/signup** — Google, Facebook, email or mobile with 100+ country codes & OTP | account |
| 🎨 | **Themes, accents, animations** + backup export/import | **Settings** |
| 📲 | **Installable everywhere** + Windows CMD-box mode | installers |

## 🤖 AI providers

Mega Power AI ships with **three layers of power** — you never hit a wall:

1. **MegaAI Free** *(default, no key)* — keyless cloud engine for chat, code and images.
2. **MegaAI Lite** *(built-in)* — offline fallback engine that generates real, working app projects (todo, games, portfolio, weather, …) even with no internet.
3. **Your own keys** *(optional)* — Settings → **API Keys** → add OpenAI, Gemini, Claude, Groq (free tier!), OpenRouter (free models), DeepSeek, xAI Grok or Mistral. Keys are stored **only on your device** and sent **directly** to the provider.

## 🐙 GitHub integration

1. GitHub → Settings → Developer settings → **Personal access tokens** → create a token with **repo** scope.
2. **GitHub Connect** tab → paste token (stored on-device only).
3. List/search your repos · create new repos · **push any project as commits** · **import any repo** into Code Studio.
4. In the project wizard choose **GitHub** and jobs even auto-create the repo for you.

## ⌨️ Mega CMD commands

```
help                          every command
build <anything> [--to zip|github|app]    one command → full project
image <prompt>                AI image, right in the terminal
ask <question>                quick AI answer
open <tab>                    chat|code|studio|projects|github|settings|about
models / use <model>          list & switch models
projects / download <name>    manage & ZIP projects
cancel                        stop the running job
clear · about · time · whoami · matrix
```

## 🗂 Project structure

```
index.html            the whole app (SPA)
manifest.json         PWA manifest (installable)
sw.js                 service worker — offline ready
css/style.css         design system (dark/light, animations)
js/core.js            state, storage, router, toasts, modals
js/ai.js              AI engine: 9 providers + free + Lite fallback
js/md.js              zero-dependency markdown + syntax highlighter
js/zip.js             zero-dependency ZIP writer (real archives)
js/auth.js            animated login/signup (Google/Facebook/phone, 190+ countries)
js/chat.js            ChatGPT-style chat
js/code.js            Code Studio + static code checker
js/studio.js          Image / Video / Voice studios
js/projects.js        projects + background jobs
js/github.js          GitHub REST integration
js/cmd.js             Mega CMD terminal
js/settings.js        settings
install/              installers (Windows CMD box, Linux, macOS)
server.js             tiny Node server (fallback)
```

## 🛠 Tech

100% **vanilla HTML/CSS/JS** — no build step, no frameworks, no npm install, no tracking. Data lives in your browser (localStorage + IndexedDB). AI calls go straight from your device to the provider. Images via the free keyless Flux engine; videos are encoded in-browser (MediaRecorder + Canvas).

## 📄 Notes

- The anonymous free engine is community-shared and politely throttles during peak times — the app auto-retries and falls back so you are never blocked; add a free Groq/OpenRouter key for guaranteed full speed.
- Google/Facebook buttons and SMS OTP run in **device mode** (local accounts) until you connect your own OAuth/SMS gateway — everything else is fully functional out of the box.

---

<div align="center">

**MEGA POWER AI** · v1.0 “No Limits”

Made with ⚡ by **Umesh Chaudhary** · 🔒 Secret project · © 2026

</div>
