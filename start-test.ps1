# Comprehensive Test Script for Pot of Gold
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "POT OF GOLD - COMPREHENSIVE TEST" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Switch to Node 18
Write-Host "[1/3] Setting up environment..." -ForegroundColor Green
nvm use 18.20.5
Write-Host ""

# Clear any existing processes
Write-Host "[2/3] Clearing previous sessions..." -ForegroundColor Green
taskkill /F /IM node.exe 2>$null
Remove-Item -Path ".expo" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host ""

# Start the app
Write-Host "[3/3] Starting Pot of Gold..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "The app will open in your default browser." -ForegroundColor Yellow
Write-Host "Press 'w' when prompted to open web version." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start Expo with web option
npx expo start --web --clear