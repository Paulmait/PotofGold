@echo off
:: Pot of Gold - Windows Testing Script
:: Comprehensive testing suite for Windows development

echo =====================================
echo    POT OF GOLD - WINDOWS TEST SUITE
echo =====================================
echo.

:: Check Node.js installation
echo [1/8] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
node --version
echo.

:: Check npm installation
echo [2/8] Checking npm installation...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed!
    pause
    exit /b 1
)
npm --version
echo.

:: Check Expo CLI
echo [3/8] Checking Expo CLI...
npx expo --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing Expo CLI...
    npm install -g expo-cli
)
npx expo --version
echo.

:: Navigate to project directory
cd /d C:\Users\maito\potofgold
echo Working directory: %cd%
echo.

:: Install dependencies if needed
echo [4/8] Checking dependencies...
if not exist node_modules (
    echo Installing dependencies...
    call npm install
) else (
    echo Dependencies already installed
)
echo.

:: Run TypeScript check
echo [5/8] Running TypeScript check...
call npm run typecheck
if %errorlevel% neq 0 (
    echo WARNING: TypeScript errors found!
    echo.
)

:: Run linter
echo [6/8] Running ESLint...
call npm run lint
if %errorlevel% neq 0 (
    echo WARNING: Linting errors found!
    echo.
)

:: Run unit tests
echo [7/8] Running unit tests...
call npm test -- --watchAll=false
if %errorlevel% neq 0 (
    echo WARNING: Some tests failed!
    echo.
)

:: Start development server
echo [8/8] Starting development server...
echo.
echo =====================================
echo    TESTING OPTIONS
echo =====================================
echo.
echo 1. Web Browser Testing (fastest)
echo 2. Android Emulator (requires Android Studio)
echo 3. iOS Simulator (requires Mac)
echo 4. Expo Go App (scan QR code)
echo 5. Run All Tests Only
echo 6. Exit
echo.

set /p choice="Select testing option (1-6): "

if "%choice%"=="1" (
    echo.
    echo Starting web testing...
    echo Opening in browser at http://localhost:19006
    call npx expo start --web
) else if "%choice%"=="2" (
    echo.
    echo Starting Android emulator testing...
    echo Make sure Android emulator is running!
    call npx expo start --android
) else if "%choice%"=="3" (
    echo.
    echo iOS testing requires macOS!
    pause
) else if "%choice%"=="4" (
    echo.
    echo Starting Expo development server...
    echo Scan the QR code with Expo Go app on your phone
    call npx expo start
) else if "%choice%"=="5" (
    echo.
    echo Running comprehensive tests...
    call npm run test:comprehensive
) else if "%choice%"=="6" (
    echo Exiting...
    exit /b 0
) else (
    echo Invalid option!
    pause
)