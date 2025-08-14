@echo off
:: Pot of Gold - Deployment Script
:: Automated deployment to App Store and Play Store

echo =====================================
echo    POT OF GOLD - DEPLOYMENT SUITE
echo =====================================
echo.

:: Check if EAS CLI is installed
echo Checking EAS CLI...
eas --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing EAS CLI...
    call npm install -g eas-cli
)
echo.

:: Navigate to project directory
cd /d C:\Users\maito\potofgold

:: Login to EAS
echo Logging into Expo account...
call eas whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo Please login to your Expo account:
    call eas login
)
echo.

:: Show deployment options
echo =====================================
echo    DEPLOYMENT OPTIONS
echo =====================================
echo.
echo 1. Development Build (Testing)
echo 2. Preview Build (Beta Testing)
echo 3. Production Build (App Stores)
echo 4. Submit to App Store (iOS)
echo 5. Submit to Play Store (Android)
echo 6. Full Production Deploy (Build + Submit)
echo 7. Check Build Status
echo 8. Download Build Artifacts
echo 9. Exit
echo.

set /p choice="Select deployment option (1-9): "

if "%choice%"=="1" (
    echo.
    echo ===== DEVELOPMENT BUILD =====
    echo.
    echo Select platform:
    echo 1. iOS
    echo 2. Android
    echo 3. Both
    echo.
    set /p platform="Select platform (1-3): "
    
    if "!platform!"=="1" (
        echo Building iOS development build...
        call eas build --platform ios --profile development
    ) else if "!platform!"=="2" (
        echo Building Android development build...
        call eas build --platform android --profile development
    ) else if "!platform!"=="3" (
        echo Building for all platforms...
        call eas build --platform all --profile development
    )
    
) else if "%choice%"=="2" (
    echo.
    echo ===== PREVIEW BUILD =====
    echo.
    echo Select platform:
    echo 1. iOS (TestFlight)
    echo 2. Android (Internal Testing)
    echo 3. Both
    echo.
    set /p platform="Select platform (1-3): "
    
    if "!platform!"=="1" (
        echo Building iOS preview build...
        call eas build --platform ios --profile preview
    ) else if "!platform!"=="2" (
        echo Building Android preview build...
        call eas build --platform android --profile preview
    ) else if "!platform!"=="3" (
        echo Building for all platforms...
        call eas build --platform all --profile preview
    )
    
) else if "%choice%"=="3" (
    echo.
    echo ===== PRODUCTION BUILD =====
    echo.
    echo WARNING: This will create production builds for app stores!
    set /p confirm="Are you sure? (y/n): "
    
    if /i "!confirm!"=="y" (
        echo.
        echo Running pre-deployment checks...
        
        :: Run tests
        call npm run typecheck
        if %errorlevel% neq 0 (
            echo ERROR: TypeScript errors found!
            echo Please fix errors before deploying.
            pause
            exit /b 1
        )
        
        call npm test -- --watchAll=false
        if %errorlevel% neq 0 (
            echo WARNING: Some tests are failing!
            set /p continue="Continue anyway? (y/n): "
            if /i "!continue!" neq "y" exit /b 1
        )
        
        echo.
        echo Select platform:
        echo 1. iOS (App Store)
        echo 2. Android (Play Store)
        echo 3. Both
        echo.
        set /p platform="Select platform (1-3): "
        
        if "!platform!"=="1" (
            echo Building iOS production build...
            call eas build --platform ios --profile production
        ) else if "!platform!"=="2" (
            echo Building Android production build...
            call eas build --platform android --profile production
        ) else if "!platform!"=="3" (
            echo Building for all platforms...
            call eas build --platform all --profile production
        )
    )
    
) else if "%choice%"=="4" (
    echo.
    echo ===== SUBMIT TO APP STORE =====
    echo.
    echo Submitting latest iOS build to App Store Connect...
    call eas submit --platform ios --latest
    
) else if "%choice%"=="5" (
    echo.
    echo ===== SUBMIT TO PLAY STORE =====
    echo.
    echo Submitting latest Android build to Google Play Console...
    call eas submit --platform android --latest
    
) else if "%choice%"=="6" (
    echo.
    echo ===== FULL PRODUCTION DEPLOYMENT =====
    echo.
    echo This will:
    echo 1. Run all tests
    echo 2. Build production versions
    echo 3. Submit to both stores
    echo.
    echo WARNING: This is the final deployment step!
    set /p confirm="Are you absolutely sure? (yes/no): "
    
    if /i "!confirm!"=="yes" (
        echo.
        echo Step 1: Running comprehensive tests...
        call npm run test:comprehensive
        if %errorlevel% neq 0 (
            echo ERROR: Tests failed!
            pause
            exit /b 1
        )
        
        echo.
        echo Step 2: Building production apps...
        call eas build --platform all --profile production
        
        echo.
        echo Waiting for builds to complete...
        echo You can check status at: https://expo.dev/accounts/[your-account]/projects/pot-of-gold/builds
        echo.
        pause
        
        echo.
        echo Step 3: Submitting to stores...
        call eas submit --platform all --latest
        
        echo.
        echo ===== DEPLOYMENT COMPLETE =====
        echo.
        echo Next steps:
        echo 1. Monitor build status in Expo dashboard
        echo 2. Complete store listings in App Store Connect and Play Console
        echo 3. Submit for review
        echo 4. Monitor crash reports and analytics
    )
    
) else if "%choice%"=="7" (
    echo.
    echo ===== BUILD STATUS =====
    echo.
    call eas build:list --limit 5
    
) else if "%choice%"=="8" (
    echo.
    echo ===== DOWNLOAD BUILD =====
    echo.
    echo Recent builds:
    call eas build:list --limit 3
    echo.
    set /p buildId="Enter build ID to download: "
    call eas build:download --id !buildId!
    
) else if "%choice%"=="9" (
    echo Exiting deployment script...
    exit /b 0
    
) else (
    echo Invalid option!
)

echo.
pause