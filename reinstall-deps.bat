@echo off
echo ========================================
echo Fixing Pot of Gold Dependencies
echo ========================================
echo.

echo [1/6] Switching to Node.js 18...
call nvm use 18.20.5

echo.
echo [2/6] Removing node_modules...
rd /s /q node_modules 2>nul

echo.
echo [3/6] Removing package-lock.json...
del package-lock.json 2>nul

echo.
echo [4/6] Clearing npm cache...
call npm cache clean --force

echo.
echo [5/6] Installing dependencies fresh...
call npm install

echo.
echo [6/6] Starting Expo...
call npx expo start

pause