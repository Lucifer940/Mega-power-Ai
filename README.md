# ⚡ Mega Power AI

> **The world's fastest and most powerful AI platform — no limits, no issues.**
> One chat box that does everything. Understands **any language**. Tell it your ideas — **it makes them real**.
>
> Created by **Umesh Chaudhary** 👑 · 🔒 *Secret project* · 100% free

One codebase that is a **website**, an **Android app (APK + Play Store AAB)** and an **installable app** (Android · iOS · Windows · Linux · macOS) — a ChatGPT-style all-in-one chat with real web search, one-prompt app building, ChatGPT-quality images, watermark-free video generation and real GitHub integration.

---

## 📱 Android app — APK + Play Store

**Get the built files** → GitHub **Releases** → `android-v1.1`: signed **APK** (install directly), **AAB** (upload to Google Play) and **real Play Store screenshots**. Built automatically by [GitHub Actions](.github/workflows/android.yml) with the official Android toolchain.

| | |
|---|---|
| **Install directly (any Android 7+)** | download `Mega-Power-AI-v1.1.apk` from Releases → open it → allow "Install unknown apps" → Install ⚡ |
| **Publish on Google Play** | follow **`playstore/upload-guide.md`** — step-by-step, ~1 hour. Listing copy: `playstore/store-listing.md` · Data safety answers: `playstore/data-safety.md` · Privacy policy: `privacy-policy.html` |
| **Rebuild after changes** | push to the repo — CI rebuilds APK + AAB + screenshots automatically. Bump `versionCode` in `android/app/build.gradle` for each Play upload |
| **Build locally** | `bash android/sync-assets.sh && cd android && gradle assembleRelease bundleRelease` (or open `android/` in Android Studio) |

The Android app bundles the **entire web app inside the APK** (works offline, no server needed) and serves it on a proper `https://` origin via WebViewAssetLoader — so chats, projects, service worker and AI calls behave exactly like the website. Signing keystore: `android/mega-power-ai-release.jks` (passwords in `android/app/build.gradle` — replace with your own keystore for production if you prefer).

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
| 🪟 Windows | double-click `install/install-windows.cmd` |
| 🐧 Linux | `bash install/install-linux.sh` |
| 🍎 macOS | `bash install/install-mac.sh` |
| No Python? | `node server.js` |

**Install as an app:** click the **📲 Install app** button in the sidebar (or the ⊕ icon in the address bar). Android: Chrome menu → *Install app*. iOS: Safari → Share → *Add to Home Screen*.

---

## ✨ One box. Everything.

Type anything in the chat box — the smart router sends it to the right engine:

| You type | You get |
|---|---|
| *“What is quantum computing?”* | streaming ChatGPT-style answer + follow-up suggestion chips |
| *“Search latest AI news”* | real web search with live **source links** |
| *“Build a todo app”* | a complete multi-file project — Run / Check / Fix / ZIP / GitHub, auto-saved to **Projects** |
| *“Make a poster of a lion, cinematic”* | ChatGPT-quality images (10+ style presets: poster, flyer, thumbnail, social…) |
| *“Video: rocket launch at sunrise”* | real encoded video — 15/30/60s, up to 1080p, optional music, **zero watermarks** |
| *“Animate this image”* | image-to-video with zoom / pan / rotate motion |
| *“/help”* | commands: `/new` `/model` `/image` `/video` `/build` `/search` `/settings` |

### Features

| | Feature |
|---|---|
| 💬 | **Chat like ChatGPT** — streaming, markdown, code blocks, conversations, stop/regenerate, edit & resend |
| 🧠 | **Smart routing** — one box detects chat / search / build / image / video / command automatically |
| 💡 | **The brain** — follow-up suggestion chips after every answer (summarize, translate, make a video, …) |
| 🌐 | **Real web search** — live sources with links; Smart / Always / Off modes in Settings |
| 🗣 | **Any language** — write in Hindi, Arabic, Spanish… answers come back in your language (UI stays English) |
| 🧑‍💻 | **One prompt → complete project** — multi-file, live preview, editor, ZIP download |
| 🔍 | **Auto code check** — real syntax check (JS/HTML/CSS/JSON/Python) + one-tap auto-fix across every file |
| 🖼 | **ChatGPT-quality images** — free keyless Flux engine w/ enhanced prompts, or your OpenAI key for gpt-image-1; posters, flyers, thumbnails, 10+ styles, grids, re-rolls, inline edit |
| 🎬 | **Video generation** — scenes → AI images → real encoded video (motion, music, 480p–1080p) — no watermarks, no limits |
| 🧠 | **25+ models, LMArena-style** — ChatGPT, Gemini, Claude, DeepSeek, Grok, Llama, Qwen, Mistral… top-bar picker with search |
| 🆓 | **Works free with no API key** — MegaAI Free (keyless cloud) + built-in offline **MegaAI Lite** engine that never fails |
| ⚙️ | **Settings hub with search** — every feature has a toggle: model, system prompt, turbo, suggestions, web-search mode, image engine/style/size/count, video duration/resolution/fps/music, theme, accents, animations, data export |
| 🔑 | **Your own keys** — add OpenAI / Gemini / Claude / Groq / OpenRouter / DeepSeek / xAI / Mistral; keys stored on-device, permanent, edit or delete anytime; the model you pick uses its provider's key |
| 📁 | **Projects** — auto-saved, rebuild, one-click ZIP |
| 🐙 | **GitHub connect** — push any project as commits to a new or existing repo |
| 🔐 | **Animated login/signup** — Google, Facebook, email or mobile with 100+ country codes & OTP |
| 🎨 | **Dark / light themes, 5 accents, animations** + backup export/import |

## 🤖 AI providers

Mega Power AI ships with **three layers of power** — you never hit a wall:

1. **MegaAI Free** *(default, no key)* — keyless cloud engine for chat, code, search and images.
2. **MegaAI Lite** *(built-in)* — offline fallback engine that generates real, working app projects (todo, games, portfolio, weather, …) even with no internet.
3. **Your own keys** *(optional)* — Settings → **API Keys** → add a key, test it with one tap, edit or delete anytime. Keys are stored **only on your device** and sent **directly** to the provider. The model picker only enables a keyed provider's models when its key exists.

## 🐙 GitHub integration

1. GitHub → Settings → Developer settings → **Personal access tokens** → create a token with **repo** scope.
2. Projects → open a project → **GitHub** → paste token (stored on-device only).
3. Pick or create a repo and **push the project as commits**, or import any repo to edit.

## ⌨️ Chat commands

```
/help                    every command + what the box can do
/new                     start a fresh conversation
/model <name>            switch models (or use the top-bar picker)
/image <prompt>          generate images
/video <prompt>          generate a video
/build <anything>        build a complete project
/search <query>          force a web search
/settings                open settings
```

## 🗂 Project structure

```
index.html            the whole app (sidebar + chat + drawers)
manifest.json         PWA manifest (installable)
sw.js                 service worker — offline ready
css/style.css         design system (dark/light, accents, animations)
js/core.js            state, storage, helpers, theme, toasts, modals
js/ai.js              AI engine: 9 providers + free + Lite + intent router + suggestions + web search
js/md.js              zero-dependency markdown + syntax highlighter
js/zip.js             zero-dependency ZIP writer (real archives)
js/auth.js            animated login/signup (Google/Facebook/phone, 190+ countries)
js/chat.js            the all-in-one chat engine (routing, streaming, build, images, video)
js/code.js            static code checker + live preview + auto-fix
js/media.js           video engine (Canvas + MediaRecorder) + speech
js/projects.js        projects drawer (auto-save, ZIP, GitHub push)
js/github.js          GitHub REST integration
js/settings.js        searchable settings hub + About
android/              native Android app (WebView shell, gradle, signing)
playstore/            Google Play kit: listing, data safety, graphics, guide
install/              installers (Windows, Linux, macOS)
server.js             tiny Node server (fallback)
```

## 🛠 Tech

100% **vanilla HTML/CSS/JS** — no build step, no frameworks, no npm install, no tracking. Data lives in your browser (localStorage + IndexedDB; conversations and videos persist across visits). AI calls go straight from your device to the provider. Images via the free keyless Flux engine; videos are encoded in-browser (MediaRecorder + Canvas).

## 📄 Notes

- The anonymous free engine is community-shared and politely throttles during peak times — the app auto-retries and falls back so you are never blocked; add a free Groq/OpenRouter key for guaranteed full speed.
- Everything generated (images, videos, projects) is **yours** — no watermarks, ever.
