@echo off
echo ========================================
echo     POT OF GOLD - LOCAL TESTING
echo ========================================
echo.

REM Check if node_modules exists
if not exist node_modules (
    echo Installing dependencies...
    call npm install
    echo.
)

REM Clear Metro cache
echo Clearing cache...
if exist "%TEMP%\metro-cache" rd /s /q "%TEMP%\metro-cache"
if exist "%TEMP%\haste-map-*" del /q "%TEMP%\haste-map-*"

REM Start Expo
echo Starting Expo development server...
echo.
echo After server starts:
echo 1. Install "Expo Go" app on your phone
echo 2. Make sure phone and PC are on same WiFi
echo 3. Scan the QR code with Expo Go (Android) or Camera (iOS)
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

REM Start with clear cache
npx expo start --clear

pause