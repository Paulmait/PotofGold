@echo off
echo =================================================
echo Pot of Gold - Starting with Node.js 18 LTS
echo =================================================
echo.

REM Switch to Node.js 18 LTS (no TypeScript stripping issues)
echo Switching to Node.js 18.20.5 LTS...
call nvm use 18.20.5

echo.
echo Current Node version:
call node --version

echo.
echo Starting Expo development server...
call npx expo start

pause