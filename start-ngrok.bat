@echo off
chcp 65001 >nul
cd /d %~dp0
set PORT=3000

if not exist "%~dp0ngrok.exe" (
  echo Ngrok is not installed in this folder.
  echo.
  echo 1. Download ngrok for Windows:
  echo    https://ngrok.com/download
  echo.
  echo 2. Unzip it.
  echo 3. Put ngrok.exe into this folder:
  echo    %~dp0
  echo.
  echo Then run start-ngrok.bat again.
  echo.
  pause
  exit /b 1
)

echo Starting Monopoly server on port %PORT%...
start "Monopoly Server" cmd /k "cd /d %~dp0 && npm start"

echo Waiting 2 seconds for server...
timeout /t 2 >nul

echo Starting ngrok tunnel...
echo Copy the HTTPS Forwarding link and send it to your friends.
echo.
"%~dp0ngrok.exe" http %PORT%
pause
