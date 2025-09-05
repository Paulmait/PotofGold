@echo off
echo Fixing Expo setup...
echo.

echo [1/5] Switching to Node.js 18...
call nvm use 18.20.5

echo.
echo [2/5] Clearing Expo cache...
call npx expo start --clear-cache --no-dev --minify 2>nul
timeout /t 2 >nul
taskkill /F /IM node.exe 2>nul

echo.
echo [3/5] Clearing Metro cache...
rd /s /q "%TEMP%\metro-*" 2>nul
rd /s /q ".expo" 2>nul

echo.
echo [4/5] Reinstalling Expo modules...
call npm install expo@latest

echo.
echo [5/5] Starting Expo...
call npx expo start --clear

pause