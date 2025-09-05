# Pot of Gold - Complete Project Fix Script
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "POT OF GOLD - PROJECT FIX SCRIPT" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Switch to Node 18
Write-Host "[1/8] Switching to Node.js 18 LTS..." -ForegroundColor Green
nvm use 18.20.5
node --version

# Step 2: Clean everything
Write-Host ""
Write-Host "[2/8] Cleaning project..." -ForegroundColor Green
Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "package-lock.json" -Force -ErrorAction SilentlyContinue
Remove-Item -Path ".expo" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:TEMP\metro-*" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:TEMP\haste-*" -Recurse -Force -ErrorAction SilentlyContinue

# Step 3: Clear all caches
Write-Host ""
Write-Host "[3/8] Clearing caches..." -ForegroundColor Green
npm cache clean --force
npx expo doctor --clear-cache 2>$null

# Step 4: Create .npmrc with proper settings
Write-Host ""
Write-Host "[4/8] Configuring npm..." -ForegroundColor Green
@"
legacy-peer-deps=true
auto-install-peers=false
strict-peer-deps=false
"@ | Out-File -FilePath ".npmrc" -Encoding UTF8

# Step 5: Install dependencies
Write-Host ""
Write-Host "[5/8] Installing dependencies (this may take a few minutes)..." -ForegroundColor Green
npm install

# Step 6: Fix any remaining issues
Write-Host ""
Write-Host "[6/8] Running post-install fixes..." -ForegroundColor Green
npx expo-doctor 2>$null

# Step 7: Prebuild if needed
Write-Host ""
Write-Host "[7/8] Preparing native directories..." -ForegroundColor Green
npx expo prebuild --clear 2>$null

# Step 8: Start the app
Write-Host ""
Write-Host "[8/8] Starting Expo..." -ForegroundColor Green
Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "STARTING YOUR APP..." -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

npx expo start --clear