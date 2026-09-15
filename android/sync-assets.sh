#!/usr/bin/env bash
# ============================================================
#  Mega Power AI — sync the web app into the Android APK
#  Copies the whole web app into android/app/src/main/assets/www
#  (run automatically by CI before every build; run it manually
#   once if you build locally with Android Studio)
#  Created by Umesh Chaudhary
# ============================================================
set -e
cd "$(dirname "$0")/.."
mkdir -p android/app/src/main/assets/www
rsync -a --delete \
  --exclude '.git' \
  --exclude '.github' \
  --exclude 'android' \
  --exclude 'playstore' \
  --exclude 'install' \
  --exclude 'test' \
  --exclude 'README.md' \
  --exclude 'server.js' \
  ./ android/app/src/main/assets/www/
echo "✅ Web app synced into android/app/src/main/assets/www/ ($(find android/app/src/main/assets/www -type f | wc -l) files)"
