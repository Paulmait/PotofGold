@echo off
title Pot of Gold - Device Testing
color 0A
cls

echo ===============================================
echo        POT OF GOLD - DEVICE TESTING
echo ===============================================
echo.
echo Checking environment...
echo.

REM Check Node version
node -v >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js installed

REM Check if Expo CLI is installed
npx expo --version >nul 2>&1
if errorlevel 1 (
    echo Installing Expo CLI...
    npm install -g expo-cli
)
echo [OK] Expo CLI ready

REM Install dependencies if needed
if not exist node_modules (
    echo.
    echo Installing project dependencies...
    echo This may take a few minutes on first run...
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)
echo [OK] Dependencies installed

REM Clear cache
echo.
echo Clearing cache for fresh start...
if exist "%TEMP%\metro-cache" rd /s /q "%TEMP%\metro-cache"
if exist "%TEMP%\haste-map-*" del /q "%TEMP%\haste-map-*"
echo [OK] Cache cleared

echo.
echo ===============================================
echo           DEVICE CONNECTION OPTIONS
echo ===============================================
echo.
echo Choose your testing method:
echo.
echo 1. WIFI (Same Network) - Fastest
echo 2. TUNNEL (Any Network) - Works anywhere
echo 3. USB (Android Only) - Most stable
echo 4. Exit
echo.
set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" goto wifi
if "%choice%"=="2" goto tunnel
if "%choice%"=="3" goto usb
if "%choice%"=="4" goto end
goto end

:wifi
echo.
echo ===============================================
echo         STARTING WIFI CONNECTION MODE
echo ===============================================
echo.
echo IMPORTANT: Make sure:
echo 1. Your phone and PC are on the SAME WiFi network
echo 2. Expo Go app is installed on your phone
echo 3. Windows Firewall allows Node.js connections
echo.
echo Starting server...
echo.
npx expo start --clear
goto end

:tunnel
echo.
echo ===============================================
echo         STARTING TUNNEL MODE
echo ===============================================
echo.
echo This works on ANY network (even cellular)!
echo.
echo IMPORTANT:
echo 1. Expo Go app must be installed on your phone
echo 2. This may be slower than WiFi mode
echo.
echo Starting tunnel server...
echo.
npx expo start --clear --tunnel
goto end

:usb
echo.
echo ===============================================
echo         USB CONNECTION (ANDROID ONLY)
echo ===============================================
echo.
echo Before continuing, make sure:
echo 1. USB Debugging is enabled on your Android device
echo 2. Your device is connected via USB cable
echo 3. ADB drivers are installed
echo.
echo Checking for connected devices...
adb devices >nul 2>&1
if errorlevel 1 (
    echo ERROR: ADB is not installed or no device found
    echo.
    echo Please:
    echo 1. Enable Developer Options on your phone
    echo 2. Enable USB Debugging
    echo 3. Connect your phone via USB
    echo 4. Install ADB: https://developer.android.com/studio/releases/platform-tools
    pause
    goto end
)
echo [OK] Device detected
echo.
echo Starting with USB connection...
npx expo start --localhost --android
goto end

:end
echo.
echo ===============================================
echo         Testing session ended
echo ===============================================
pause