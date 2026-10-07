@echo off
chcp 65001 >nul
cd /d %~dp0
set PORT=3000

if not exist "%~dp0cloudflared.exe" (
  echo Cloudflared is not installed in this folder.
  echo.
  echo 1. Download cloudflared.exe for Windows AMD64:
  echo    https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe
  echo.
  echo 2. Rename downloaded file to:
  echo    cloudflared.exe
  echo.
  echo 3. Put cloudflared.exe into this folder:
  echo    %~dp0
  echo.
  echo Then run start-cloudflared.bat again.
  echo.
  pause
  exit /b 1
)

echo Starting Monopoly server on port %PORT%...
start "Monopoly Server" cmd /k "cd /d %~dp0 && npm start"

echo Waiting 2 seconds for server...
timeout /t 2 >nul

echo Starting Cloudflare Tunnel...
echo Copy the https://*.trycloudflare.com link and send it to your friends.
echo.
"%~dp0cloudflared.exe" tunnel --protocol http2 --url http://localhost:%PORT%
pause
