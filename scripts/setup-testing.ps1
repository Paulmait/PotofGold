# PowerShell script for Windows setup and testing

Write-Host "🚀 Pot of Gold - Setup for External Testing" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan

# Check Node.js installation
Write-Host "`n📦 Checking Node.js installation..." -ForegroundColor Green
$nodeVersion = node --version
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Node.js $nodeVersion installed" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js not found. Please install Node.js 18+" -ForegroundColor Red
    exit 1
}

# Install EAS CLI globally
Write-Host "`n📦 Installing EAS CLI..." -ForegroundColor Green
npm install -g eas-cli

# Install dependencies
Write-Host "`n📦 Installing project dependencies..." -ForegroundColor Green
npm install

# Create .env file from example
Write-Host "`n🔧 Setting up environment variables..." -ForegroundColor Green
if (!(Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Created .env file - Please add your API keys!" -ForegroundColor Yellow
} else {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
}

# Login to Expo
Write-Host "`n🔐 Logging into Expo..." -ForegroundColor Green
eas login

# Configure EAS
Write-Host "`n⚙️ Configuring EAS Build..." -ForegroundColor Green
eas build:configure

# Select build profile
Write-Host "`n📱 Select build profile:" -ForegroundColor Cyan
Write-Host "1) Development (for testing with dev client)" -ForegroundColor White
Write-Host "2) Preview (for internal testing)" -ForegroundColor White
Write-Host "3) Production (for app stores)" -ForegroundColor White
$choice = Read-Host "Enter choice (1-3)"

$profile = switch ($choice) {
    "1" { "development" }
    "2" { "preview" }
    "3" { "production" }
    default { "preview" }
}

# Select platform
Write-Host "`n📱 Select platform:" -ForegroundColor Cyan
Write-Host "1) iOS" -ForegroundColor White
Write-Host "2) Android" -ForegroundColor White
Write-Host "3) Both" -ForegroundColor White
$platformChoice = Read-Host "Enter choice (1-3)"

$platform = switch ($platformChoice) {
    "1" { "ios" }
    "2" { "android" }
    "3" { "all" }
    default { "all" }
}

# Build the app
Write-Host "`n🏗️ Building app for $platform with $profile profile..." -ForegroundColor Green
Write-Host "This may take 15-30 minutes..." -ForegroundColor Yellow

if ($platform -eq "all") {
    eas build --platform all --profile $profile
} else {
    eas build --platform $platform --profile $profile
}

# Display next steps
Write-Host "`n✅ Build initiated successfully!" -ForegroundColor Green
Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Wait for build to complete (check status at https://expo.dev)" -ForegroundColor White
Write-Host "2. Download the build artifact" -ForegroundColor White
Write-Host "3. For iOS: Upload .ipa to TestFlight" -ForegroundColor White
Write-Host "4. For Android: Share .apk with testers or upload to Play Console" -ForegroundColor White
Write-Host "5. Configure Firebase and RevenueCat with real credentials" -ForegroundColor White

Write-Host "`n🎮 Happy Testing!" -ForegroundColor Yellow