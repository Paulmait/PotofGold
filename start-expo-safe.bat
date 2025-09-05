@echo off
echo =================================================
echo Pot of Gold - Starting Expo Development Server
echo =================================================
echo.

REM Switch to Node.js 20.15.0
echo [1/4] Switching to Node.js 20.15.0...
call nvm use 20.15.0

REM Clear npm cache
echo.
echo [2/4] Clearing npm cache...
call npm cache clean --force 2>nul

REM Set environment to disable TypeScript stripping
echo.
echo [3/4] Configuring environment...
set NODE_OPTIONS=
set NODE_NO_WARNINGS=1

REM Start Expo with explicit node binary
echo.
echo [4/4] Starting Expo server...
echo.
call npx expo start --clear

echo.
echo =================================================
echo If the server doesn't start, try:
echo   1. Close all terminal windows
echo   2. Open a new terminal
echo   3. Run: nvm use 20.15.0
echo   4. Run: npx expo start --clear
echo =================================================