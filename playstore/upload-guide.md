# 🚀 How to publish Mega Power AI on Google Play — step by step

Everything below assumes you already have the built files. Get them from the
**GitHub Releases** page of this repo (`android-v1.0`) — the build is produced
automatically by GitHub Actions:

- `Mega-Power-AI-v1.0.apk` → direct install on any Android phone
- `app-release.aab` → **this is the file Google Play wants**
- `phone-*.png` → real screenshots for the listing

---

## Part 1 — One-time setup (≈ 30 minutes)

1. **Create a Google Play developer account**
   - Go to https://play.google.com/console
   - Pay the one-time **$25** registration fee (card required).
   - Complete identity verification (personal or business).

2. **(Optional but recommended) Enroll in Play App Signing**
   - Play Console → Setup → App signing. Keep the defaults (Google manages the app signing key).
   - Your upload key (the keystore in `android/mega-power-ai-release.jks`) stays yours — **back it up + the passwords** (`MegaPowerAI2026`). You need the SAME key for every future update.

## Part 2 — Create the app (≈ 5 minutes)

1. Play Console → **Create app**
   - App name: `Mega Power AI — No Limits`
   - Default language: **English (US)**
   - App or game: **App** · Free or paid: **Free**
2. Fill **App access**: All functionality is available to all users → *All functionality is open*.
3. Fill **Ads**: No ads.
4. **Target audience**: age 13+ (13–18 and 18+), no appeal to children.
5. **Content rating**: complete the IARC questionnaire with the answers in `data-safety.md` → Everyone.
6. **Data safety**: use the exact answers in `data-safety.md` → "No data collected".
7. **Privacy policy URL**: `https://lucifer940.github.io/Mega-power-Ai/privacy-policy.html`
   (Enable GitHub Pages on the `main` branch of this repo first — Settings → Pages → Deploy from branch → main → root. The file `privacy-policy.html` is in the repo root.)
8. **App category**: Productivity. Tags: ai, chatbot, code editor, image generator.

## Part 3 — Store listing (≈ 10 minutes)

1. **Main store listing** — copy every text from `store-listing.md` (title, short description, full description).
2. **Graphics**:
   - App icon 512×512 → use `assets/icons/icon-512.png`
   - Feature graphic 1024×500 → use `playstore/graphics/feature-graphic.png`
   - Phone screenshots → upload 4–8 of `playstore/screenshots/phone-*.png`
3. **Contact details**: add your email (required) + website (GitHub Pages URL).

## Part 4 — Upload the app (≈ 10 minutes)

1. Play Console → **Production** (left menu) → **Create release**.
2. If asked, let Google **generate/accept app signing** (keep Play App Signing ON).
3. **Upload** → choose `app-release.aab` (from the GitHub Release of this repo).
4. Release name: `1.0` · Release notes: copy from `release-notes.md`.
5. **Save → Review release → Start rollout to Production.**

## Part 5 — While Google reviews (usually 1–7 days)

- Fix anything Google flags — the most common items are already handled:
  - ✅ targetSdk 35 (current Play requirement)
  - ✅ Privacy policy included
  - ✅ Data safety answered
  - ✅ English-only listing
- Google may email questions about the app's purpose — reply that it is an
  AI assistant / developer-tools app that stores all data locally.

## After approval 🎉

Your app goes live worldwide. Share the Play Store link anywhere.

### To publish updates later
1. Edit the web app or Android files in this repo and push to `main`.
2. GitHub Actions rebuilds the APK + AAB automatically and attaches them to the Releases page.
3. Before building, bump `versionCode` (2, 3, …) and `versionName` in `android/app/build.gradle`.
4. Upload the new `.aab` to Production → Create new release.

---

## Direct APK install (no Play Store needed)

1. On any Android 7.0+ phone, open the GitHub Release page in Chrome.
2. Download `Mega-Power-AI-v1.0.apk`.
3. Tap the download → *Install unknown apps* → allow Chrome → **Install**.
4. Open **Mega Power AI** ⚡

## Build it yourself (optional)

```bash
bash android/sync-assets.sh        # bundle the web app into the APK
cd android
gradle assembleRelease             # → app/build/outputs/apk/release/app-release.apk
gradle bundleRelease               # → app/build/outputs/bundle/release/app-release.aab
```
Or open the `android/` folder in **Android Studio** and press ▶.
