#!/usr/bin/env bash
# ============================================================
#  MEGA POWER AI — macOS installer
#  Serves the app + opens it in app mode (Chrome/Edge).
#  Created by Umesh Chaudhary
# ============================================================
set -e
cd "$(dirname "$0")/.."
PORT=8420

echo "⚡ Mega Power AI — macOS installer"

SERVE="python3 -m http.server $PORT"
command -v python3 >/dev/null || { echo "python3 required"; exit 1; }
$SERVE & SRV=$!
sleep 1.5

URL="http://localhost:$PORT"
APP="/Applications/Mega Power AI.app"
mkdir -p "$APP/Contents/MacOS"
cat > "$APP/Contents/MacOS/run.sh" <<EOF
#!/bin/bash
open -na "Google Chrome" --args --app="$URL" 2>/dev/null || open "$URL"
EOF
chmod +x "$APP/Contents/MacOS/run.sh"
cat > "$APP/Contents/Info.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>CFBundleName</key><string>Mega Power AI</string>
  <key>CFBundleIdentifier</key><string>ai.megapower.app</string>
  <key>CFBundleExecutable</key><string>run.sh</string>
  <key>CFBundleIconFile</key><string>icon-512.png</string>
</dict></plist>
EOF
cp assets/icons/icon-512.png "$APP/Contents/Resources" 2>/dev/null || mkdir -p "$APP/Contents/Resources" && cp assets/icons/icon-512.png "$APP/Contents/Resources/"

echo "✅ Created: $APP"
echo "🌐 Opening $URL ..."
open "$URL" 2>/dev/null || true

echo "ℹ️  Server running on PID $SRV — Ctrl+C here to stop."
wait $SRV
