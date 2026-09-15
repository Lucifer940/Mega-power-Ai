@echo off
title Mega Power AI - CMD Box Install
color 0B
cls
echo.
echo  ============================================================
echo      M E G A   P O W E R   A I   -   I N S T A L L E R
echo      No Limits ^| Any Language ^| 4X Faster ^| Free
echo      Created by Umesh Chaudhary
echo  ============================================================
echo.
echo  This installs Mega Power AI as a desktop app on Windows
echo  (works the same on: Android / iOS / Linux / macOS / Web).
echo.

cd /d "%~dp0.."

REM ---- find a way to serve the app ----
set "SERVER="
where python >nul 2>nul && set "SERVER=python -m http.server 8420"
if not defined SERVER where py >nul 2>nul && set "SERVER=py -m http.server 8420"
if not defined SERVER where node >nul 2>nul && set "SERVER=node server.js"

if not defined SERVER (
  echo  [!] No Python or Node.js found.
  echo      Install Python from https://python.org  (tick "Add to PATH")
  echo      then run this file again.
  echo.
  pause
  exit /b 1
)

echo  [*] Starting local server on http://localhost:8420 ...
start "" cmd /c "%SERVER%"

timeout /t 2 >nul

echo  [*] Opening Mega Power AI in app window (CMD Box mode)...
set "BROWSER="
where msedge >nul 2>nul && set "BROWSER=msedge"
if not defined BROWSER where chrome >nul 2>nul && set "BROWSER=chrome"

if defined BROWSER (
  start "" %BROWSER% --app=http://localhost:8420
) else (
  start "" http://localhost:8420
)

echo.
echo  [OK] Mega Power AI is running!
echo       - Window app mode  : opened above
echo       - CMD Box mode     : http://localhost:8420/#/cmd
echo       - Install forever  : click the install icon in the address bar
echo                             (creates Start-menu + desktop shortcuts)
echo.
echo  Tip: the server must keep running while you use the app.
echo  Press any key in THIS window to stop it.
pause >nul
echo  Stopping... (close the black server window if it stays open)
taskkill /f /im python.exe >nul 2>nul
exit /b 0
