@echo off
title VectorSelect PocketBase Engine
echo ======================================================================
echo Starting VectorSelect PocketBase Backend Engine...
echo ======================================================================
echo.

if not exist pocketbase.exe (
    echo [!] pocketbase.exe not found in this folder.
    echo [*] Downloading latest official PocketBase for Windows (v0.22.4)...
    powershell -Command "Invoke-WebRequest -Uri 'https://github.com/pocketbase/pocketbase/releases/download/v0.22.4/pocketbase_0.22.4_windows_amd64.zip' -OutFile 'pocketbase.zip'"
    powershell -Command "Expand-Archive -Path 'pocketbase.zip' -DestinationPath '.' -Force"
    del pocketbase.zip
    echo [✓] PocketBase binary installed successfully!
    echo.
)

echo [*] Starting PocketBase on http://127.0.0.1:8090 ...
echo [*] Admin Dashboard: http://127.0.0.1:8090/_/
echo.
pocketbase.exe serve --http=127.0.0.1:8090 --dir=pb_data --hooksDir=pb_hooks
pause
