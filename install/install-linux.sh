#!/usr/bin/env bash
# ============================================================
#  MEGA POWER AI — Linux installer
#  Creates a desktop launcher + serves the app locally.
#  Created by Umesh Chaudhary
# ============================================================
set -e
cd "$(dirname "$0")/.."
PORT=8420

echo "⚡ Mega Power AI — Linux installer"
echo "   No Limits · Any Language · Free"

# serve in background
SERVE="python3 -m http.server $PORT"
command -v python3 >/dev/null || { echo "python3 required"; exit 1; }
$SERVE & SRV=$!
sleep 1.5

URL="http://localhost:$PORT"
APPFILE="$HOME/.local/share/applications/mega-power-ai.desktop"
mkdir -p "$HOME/.local/share/applications"
cat > "$APPFILE" <<EOF
[Desktop Entry]
Type=Application
Name=Mega Power AI
Comment=World's fastest AI platform — no limits (by Umesh Chaudhary)
Exec=xdg-open $URL
Icon=$(pwd)/assets/icons/icon-512.png
Terminal=false
Categories=Development;Utility;
EOF
update-desktop-database "$HOME/.local/share/applications" 2>/dev/null || true

echo "✅ Installed: $APPFILE"
echo "🌐 Opening $URL ..."
( xdg-open "$URL" >/dev/null 2>&1 ) || echo "Open $URL in your browser, then use the install (⊕) icon for app mode."

echo "ℹ️  Server running on PID $SRV — Ctrl+C here to stop."
echo "   CMD box mode: $URL/#/cmd"
wait $SRV
