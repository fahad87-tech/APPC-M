@echo off
title VectorSelect by Mr. F - Unified Server
cd /d "%~dp0"
echo ========================================================
echo   VectorSelect by Mr. F — AP Physics Platform
echo ========================================================
echo.

REM 1. Start PocketBase Backend if executable is present
if exist "pocketbase\pocketbase.exe" (
    echo [*] Starting PocketBase Backend on http://127.0.0.1:8090 ...
    start "PocketBase Backend" /min cmd /c "cd pocketbase && pocketbase.exe serve --http=127.0.0.1:8090 --dir=pb_data --hooksDir=pb_hooks"
) else (
    echo [i] PocketBase binary not detected in pocketbase\ (Running in air-gapped fallback mode).
    echo [i] Run pocketbase\run_pocketbase.bat to auto-download and enable live PocketBase cloud/local sync.
)

REM 2. Start Local Static Web Server on port 8888
echo [*] Starting local static web server on port 8888...
start "" /b python -m http.server 8888
timeout /t 2 >nul

REM 3. Open Portals
echo [*] Opening Student & Teacher Portals...
start "" http://localhost:8888/index.html
start "" http://localhost:8888/teacher.html

echo.
echo [✓] Portals running at:
echo     Student Portal : http://localhost:8888/index.html
echo     Teacher Portal : http://localhost:8888/teacher.html
echo     PocketBase API : http://127.0.0.1:8090/_/ (Admin UI)
echo.
echo Press Ctrl+C or close this window to stop the server.
pause
