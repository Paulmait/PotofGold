@echo off
echo ========================================
echo   POT OF GOLD - TUNNEL MODE (Any Network)
echo ========================================
echo.
echo This mode works even if phone and PC are on different networks!
echo.

REM Check if node_modules exists
if not exist node_modules (
    echo Installing dependencies...
    call npm install
    echo.
)

REM Clear cache
echo Clearing cache...
npx expo start --clear --tunnel

pause