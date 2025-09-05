@echo off
echo Switching to Node.js 20...
call nvm use 20.15.0
echo.
echo Current Node version:
call node --version
echo.
echo Initializing EAS project...
call eas init
echo.
echo Done!