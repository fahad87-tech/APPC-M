@echo off
title VectorSelect by Mr. F - Static Server
cd /d "%~dp0"
echo ========================================================
echo   VectorSelect by Mr. F — AP Physics Platform
echo ========================================================
echo.

REM Start the local static web server on port 8888.
echo [*] Starting local static web server on port 8888...
start "" /b python -m http.server 8888
timeout /t 2 >nul

REM Open both portals.
echo [*] Opening Student & Teacher Portals...
start "" http://localhost:8888/index.html
start "" http://localhost:8888/teacher.html

echo.
echo [✓] Portals running at:
echo     Student Portal : http://localhost:8888/index.html
echo     Teacher Portal : http://localhost:8888/teacher.html
echo     Cloud backend  : Supabase
echo.
echo Press Ctrl+C or close this window to stop the server.
pause
