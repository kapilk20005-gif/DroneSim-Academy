@echo off
setlocal
cd /d "%~dp0"
echo ==================================================
echo   DroneSim Academy - Problem Statement 26247
echo ==================================================
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js was not found.
  echo Install Node.js LTS from https://nodejs.org/ and reopen this file.
  pause
  exit /b 1
)
where npm >nul 2>nul
if errorlevel 1 (
  echo ERROR: npm was not found. Reinstall Node.js LTS and try again.
  pause
  exit /b 1
)
if not exist package.json (
  echo ERROR: package.json is missing. Extract the complete ZIP first.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Installing project dependencies for the first run...
  call npm install
  if errorlevel 1 (
    echo.
    echo Dependency installation failed. Check your internet connection and retry.
    pause
    exit /b 1
  )
)
echo.
echo Starting the development server. Keep this window open.
call npm run dev
pause
