@echo off
echo Starting Pot of Gold in Web Browser...
echo.
call nvm use 18.20.5
echo.
call npx expo start --web
pause