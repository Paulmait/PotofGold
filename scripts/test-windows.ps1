# Pot of Gold - Windows PowerShell Testing Script
# Advanced testing with better error handling and reporting

$ErrorActionPreference = "Continue"

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "   POT OF GOLD - TESTING SUITE" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Set project directory
$projectDir = "C:\Users\maito\potofgold"
Set-Location $projectDir

# Function to check command availability
function Test-Command($commandName) {
    try {
        Get-Command $commandName -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

# Function to run command and capture output
function Run-Command($command, $description) {
    Write-Host "🔧 $description..." -ForegroundColor Green
    $result = Invoke-Expression $command 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Warning: $description had issues" -ForegroundColor Yellow
        Write-Host $result
    } else {
        Write-Host "✅ $description completed successfully" -ForegroundColor Green
    }
    Write-Host ""
    return $LASTEXITCODE
}

# Check prerequisites
Write-Host "📋 Checking Prerequisites" -ForegroundColor Cyan
Write-Host "------------------------" -ForegroundColor Gray

$prerequisites = @{
    "node" = "Node.js"
    "npm" = "npm"
    "git" = "Git"
}

$allPrerequisitesMet = $true
foreach ($cmd in $prerequisites.Keys) {
    if (Test-Command $cmd) {
        $version = & $cmd --version 2>$null
        Write-Host "✅ $($prerequisites[$cmd]): $version" -ForegroundColor Green
    } else {
        Write-Host "❌ $($prerequisites[$cmd]): Not installed" -ForegroundColor Red
        $allPrerequisitesMet = $false
    }
}

if (-not $allPrerequisitesMet) {
    Write-Host ""
    Write-Host "Please install missing prerequisites before continuing." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Check Android SDK (optional)
Write-Host "📱 Checking Android SDK" -ForegroundColor Cyan
$androidHome = $env:ANDROID_HOME
if ($androidHome) {
    Write-Host "✅ Android SDK: $androidHome" -ForegroundColor Green
    
    # Check for emulator
    $emulatorPath = "$androidHome\emulator\emulator.exe"
    if (Test-Path $emulatorPath) {
        Write-Host "✅ Android Emulator: Available" -ForegroundColor Green
        
        # List available AVDs
        $avds = & $emulatorPath -list-avds 2>$null
        if ($avds) {
            Write-Host "📱 Available emulators:" -ForegroundColor Cyan
            $avds | ForEach-Object { Write-Host "   - $_" }
        }
    }
} else {
    Write-Host "⚠️  Android SDK not configured (optional)" -ForegroundColor Yellow
}

Write-Host ""

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Run-Command "npm install" "Installing dependencies"
}

# Create test results directory
$testResultsDir = "$projectDir\test-results"
if (-not (Test-Path $testResultsDir)) {
    New-Item -ItemType Directory -Path $testResultsDir | Out-Null
}

# Run tests
Write-Host "🧪 Running Test Suite" -ForegroundColor Cyan
Write-Host "-------------------" -ForegroundColor Gray

$testResults = @{}
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"

# TypeScript check
$testResults["TypeScript"] = Run-Command "npm run typecheck" "TypeScript validation"

# Linting
$testResults["ESLint"] = Run-Command "npm run lint" "Code linting"

# Unit tests with coverage
Write-Host "🔧 Running unit tests with coverage..." -ForegroundColor Green
$testOutput = npm test -- --coverage --watchAll=false --json --outputFile="$testResultsDir\test-results-$timestamp.json" 2>&1
$testResults["Unit Tests"] = $LASTEXITCODE

# Security audit
Write-Host "🔐 Running security audit..." -ForegroundColor Green
$auditOutput = npm audit --json 2>&1 | Out-String
$auditData = $auditOutput | ConvertFrom-Json -ErrorAction SilentlyContinue
if ($auditData) {
    $vulnerabilities = $auditData.metadata.vulnerabilities
    if ($vulnerabilities.total -gt 0) {
        Write-Host "⚠️  Security vulnerabilities found:" -ForegroundColor Yellow
        Write-Host "   Critical: $($vulnerabilities.critical)" -ForegroundColor Red
        Write-Host "   High: $($vulnerabilities.high)" -ForegroundColor Red
        Write-Host "   Moderate: $($vulnerabilities.moderate)" -ForegroundColor Yellow
        Write-Host "   Low: $($vulnerabilities.low)" -ForegroundColor Gray
    } else {
        Write-Host "✅ No security vulnerabilities found" -ForegroundColor Green
    }
}

Write-Host ""

# Generate test report
Write-Host "📊 Test Results Summary" -ForegroundColor Cyan
Write-Host "---------------------" -ForegroundColor Gray

$failedTests = 0
foreach ($test in $testResults.Keys) {
    if ($testResults[$test] -eq 0) {
        Write-Host "✅ $test : PASSED" -ForegroundColor Green
    } else {
        Write-Host "❌ $test : FAILED" -ForegroundColor Red
        $failedTests++
    }
}

Write-Host ""

# Performance check
Write-Host "⚡ Performance Check" -ForegroundColor Cyan
Write-Host "------------------" -ForegroundColor Gray

# Check bundle size
Write-Host "📦 Checking bundle size..." -ForegroundColor Green
$bundleSize = (Get-ChildItem -Path $projectDir -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "   Total project size: $([math]::Round($bundleSize, 2)) MB" -ForegroundColor $(if ($bundleSize -lt 100) { "Green" } else { "Yellow" })

# Check for large files
$largeFiles = Get-ChildItem -Path $projectDir -Recurse -File | Where-Object { $_.Length -gt 1MB } | Sort-Object Length -Descending | Select-Object -First 5
if ($largeFiles) {
    Write-Host "   Large files detected:" -ForegroundColor Yellow
    $largeFiles | ForEach-Object {
        Write-Host "     - $($_.Name): $([math]::Round($_.Length / 1MB, 2)) MB"
    }
}

Write-Host ""

# Testing options
Write-Host "🚀 Launch Testing Environment" -ForegroundColor Cyan
Write-Host "---------------------------" -ForegroundColor Gray
Write-Host ""
Write-Host "1. Web Browser (Chrome/Edge)" -ForegroundColor White
Write-Host "2. Android Emulator" -ForegroundColor White
Write-Host "3. Expo Go (Mobile Device)" -ForegroundColor White
Write-Host "4. Generate Screenshots" -ForegroundColor White
Write-Host "5. Build APK (Debug)" -ForegroundColor White
Write-Host "6. Run LiveOps Tests" -ForegroundColor White
Write-Host "7. Exit" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Select option (1-7)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🌐 Starting web server..." -ForegroundColor Green
        Write-Host "Browser will open at http://localhost:19006" -ForegroundColor Cyan
        npm run web
    }
    "2" {
        if ($androidHome) {
            Write-Host ""
            Write-Host "📱 Starting Android emulator..." -ForegroundColor Green
            
            # Check if emulator is running
            $adbDevices = & adb devices 2>$null
            if ($adbDevices -match "emulator") {
                Write-Host "✅ Emulator already running" -ForegroundColor Green
            } else {
                Write-Host "Starting emulator..." -ForegroundColor Yellow
                $avd = Read-Host "Enter AVD name (or press Enter for default)"
                if ($avd) {
                    Start-Process -FilePath "$androidHome\emulator\emulator.exe" -ArgumentList "-avd", $avd -NoNewWindow
                }
            }
            
            Start-Sleep -Seconds 3
            npm run android
        } else {
            Write-Host "❌ Android SDK not configured" -ForegroundColor Red
        }
    }
    "3" {
        Write-Host ""
        Write-Host "📱 Starting Expo server..." -ForegroundColor Green
        Write-Host "Scan QR code with Expo Go app" -ForegroundColor Cyan
        npx expo start
    }
    "4" {
        Write-Host ""
        Write-Host "📸 Generating screenshots..." -ForegroundColor Green
        npm run generate:screenshots
    }
    "5" {
        Write-Host ""
        Write-Host "🔨 Building APK..." -ForegroundColor Green
        npm run build:android:dev
    }
    "6" {
        Write-Host ""
        Write-Host "🎮 Running LiveOps tests..." -ForegroundColor Green
        node scripts/test-liveops.js
    }
    "7" {
        Write-Host "Exiting..." -ForegroundColor Gray
        exit 0
    }
    default {
        Write-Host "Invalid option!" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Testing session completed!" -ForegroundColor Green
Read-Host "Press Enter to exit"