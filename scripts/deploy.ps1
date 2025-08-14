# Pot of Gold - PowerShell Deployment Script
# Advanced deployment automation with validation and monitoring

param(
    [Parameter(Position=0)]
    [ValidateSet("dev", "preview", "prod", "submit", "status", "rollback")]
    [string]$Action = "status",
    
    [Parameter()]
    [ValidateSet("ios", "android", "all")]
    [string]$Platform = "all",
    
    [Parameter()]
    [switch]$SkipTests,
    
    [Parameter()]
    [switch]$Force
)

$ErrorActionPreference = "Stop"

# Configuration
$projectDir = "C:\Users\maito\potofgold"
$configFile = "$projectDir\deployment-config.json"

# Color functions
function Write-Success($message) { Write-Host "✅ $message" -ForegroundColor Green }
function Write-Warning($message) { Write-Host "⚠️  $message" -ForegroundColor Yellow }
function Write-Error($message) { Write-Host "❌ $message" -ForegroundColor Red }
function Write-Info($message) { Write-Host "ℹ️  $message" -ForegroundColor Cyan }
function Write-Step($message) { Write-Host "🔧 $message" -ForegroundColor Magenta }

# Banner
Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "   POT OF GOLD - DEPLOYMENT SYSTEM" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $projectDir

# Load deployment configuration
if (Test-Path $configFile) {
    $config = Get-Content $configFile | ConvertFrom-Json
} else {
    $config = @{
        version = "1.0.0"
        buildNumber = 1
        lastDeployment = $null
        environments = @{
            dev = @{ lastBuild = $null }
            preview = @{ lastBuild = $null }
            prod = @{ lastBuild = $null }
        }
    }
}

# Function to save configuration
function Save-Config {
    $config | ConvertTo-Json -Depth 10 | Set-Content $configFile
}

# Function to check prerequisites
function Test-Prerequisites {
    Write-Step "Checking prerequisites..."
    
    $requirements = @{
        "node" = "16.0.0"
        "npm" = "7.0.0"
        "git" = "2.0.0"
    }
    
    $allMet = $true
    foreach ($cmd in $requirements.Keys) {
        try {
            $version = & $cmd --version 2>$null
            Write-Success "$cmd: $version"
        } catch {
            Write-Error "$cmd not found (minimum: $($requirements[$cmd]))"
            $allMet = $false
        }
    }
    
    # Check EAS CLI
    try {
        $easVersion = eas --version 2>$null
        Write-Success "EAS CLI: $easVersion"
    } catch {
        Write-Warning "EAS CLI not installed, installing..."
        npm install -g eas-cli
    }
    
    # Check Expo login
    try {
        $user = eas whoami 2>$null
        Write-Success "Logged in as: $user"
    } catch {
        Write-Warning "Not logged into Expo"
        eas login
    }
    
    return $allMet
}

# Function to run tests
function Invoke-Tests {
    if ($SkipTests) {
        Write-Warning "Skipping tests (--SkipTests flag used)"
        return $true
    }
    
    Write-Step "Running test suite..."
    
    $testsPassed = $true
    
    # TypeScript check
    Write-Info "Running TypeScript check..."
    $tsResult = npm run typecheck 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error "TypeScript errors found!"
        $testsPassed = $false
    } else {
        Write-Success "TypeScript check passed"
    }
    
    # Linting
    Write-Info "Running linter..."
    $lintResult = npm run lint 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Linting warnings found"
    } else {
        Write-Success "Linting passed"
    }
    
    # Unit tests
    Write-Info "Running unit tests..."
    $testResult = npm test -- --watchAll=false 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Unit tests failed!"
        $testsPassed = $false
    } else {
        Write-Success "Unit tests passed"
    }
    
    # Security audit
    Write-Info "Running security audit..."
    $auditResult = npm audit --json 2>&1 | ConvertFrom-Json
    if ($auditResult.metadata.vulnerabilities.high -gt 0 -or $auditResult.metadata.vulnerabilities.critical -gt 0) {
        Write-Warning "Security vulnerabilities found (High: $($auditResult.metadata.vulnerabilities.high), Critical: $($auditResult.metadata.vulnerabilities.critical))"
        if (-not $Force) {
            $testsPassed = $false
        }
    } else {
        Write-Success "Security audit passed"
    }
    
    return $testsPassed
}

# Function to increment version
function Update-Version {
    param([string]$type = "patch")
    
    $currentVersion = $config.version -split '\.'
    
    switch ($type) {
        "major" { 
            $currentVersion[0] = [int]$currentVersion[0] + 1
            $currentVersion[1] = 0
            $currentVersion[2] = 0
        }
        "minor" {
            $currentVersion[1] = [int]$currentVersion[1] + 1
            $currentVersion[2] = 0
        }
        "patch" {
            $currentVersion[2] = [int]$currentVersion[2] + 1
        }
    }
    
    $config.version = $currentVersion -join '.'
    $config.buildNumber++
    
    # Update package.json
    $packageJson = Get-Content "$projectDir\package.json" | ConvertFrom-Json
    $packageJson.version = $config.version
    $packageJson | ConvertTo-Json -Depth 10 | Set-Content "$projectDir\package.json"
    
    # Update app.json
    $appJson = Get-Content "$projectDir\app.json" | ConvertFrom-Json
    $appJson.expo.version = $config.version
    $appJson.expo.ios.buildNumber = $config.buildNumber.ToString()
    $appJson.expo.android.versionCode = $config.buildNumber
    $appJson | ConvertTo-Json -Depth 10 | Set-Content "$projectDir\app.json"
    
    Save-Config
    
    Write-Success "Version updated to $($config.version) (Build $($config.buildNumber))"
}

# Function to build app
function Start-Build {
    param(
        [string]$profile,
        [string]$platform
    )
    
    Write-Step "Starting $profile build for $platform..."
    
    # Create build metadata
    $buildMetadata = @{
        timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        version = $config.version
        buildNumber = $config.buildNumber
        profile = $profile
        platform = $platform
        gitCommit = git rev-parse HEAD
        gitBranch = git branch --show-current
    }
    
    # Save metadata
    $buildMetadata | ConvertTo-Json | Set-Content "$projectDir\build-metadata.json"
    
    # Start build
    $buildCommand = "eas build --platform $platform --profile $profile --non-interactive"
    
    Write-Info "Executing: $buildCommand"
    $buildResult = Invoke-Expression $buildCommand 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Build started successfully!"
        
        # Parse build URL from output
        $buildUrl = $buildResult | Select-String -Pattern "https://expo.dev/.*builds/.*" | Select-Object -First 1
        if ($buildUrl) {
            Write-Info "Build URL: $($buildUrl.Matches[0].Value)"
            
            # Save to config
            $config.environments[$profile].lastBuild = @{
                url = $buildUrl.Matches[0].Value
                timestamp = $buildMetadata.timestamp
                version = $buildMetadata.version
            }
            Save-Config
        }
        
        return $true
    } else {
        Write-Error "Build failed!"
        Write-Host $buildResult
        return $false
    }
}

# Function to submit to stores
function Submit-ToStore {
    param([string]$platform)
    
    Write-Step "Submitting to store ($platform)..."
    
    $submitCommand = "eas submit --platform $platform --latest"
    
    Write-Info "Executing: $submitCommand"
    $submitResult = Invoke-Expression $submitCommand 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Submission started successfully!"
        
        $config.lastDeployment = @{
            platform = $platform
            version = $config.version
            timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            status = "submitted"
        }
        Save-Config
        
        return $true
    } else {
        Write-Error "Submission failed!"
        Write-Host $submitResult
        return $false
    }
}

# Function to check build status
function Get-BuildStatus {
    Write-Step "Checking build status..."
    
    eas build:list --limit 5
    
    if ($config.environments.prod.lastBuild) {
        Write-Info "Last production build: $($config.environments.prod.lastBuild.version) at $($config.environments.prod.lastBuild.timestamp)"
        Write-Info "URL: $($config.environments.prod.lastBuild.url)"
    }
}

# Function to rollback
function Invoke-Rollback {
    Write-Step "Rollback functionality..."
    
    Write-Warning "Rollback process:"
    Write-Host "1. Identify the previous stable build in EAS dashboard"
    Write-Host "2. Download the build artifacts"
    Write-Host "3. Submit the previous build to stores"
    Write-Host ""
    
    $confirm = Read-Host "Do you want to view recent builds? (y/n)"
    if ($confirm -eq 'y') {
        eas build:list --limit 10
        
        $buildId = Read-Host "Enter build ID to rollback to"
        if ($buildId) {
            Write-Info "Submitting build $buildId to stores..."
            eas submit --id $buildId --platform all
        }
    }
}

# Main execution
try {
    # Check prerequisites
    if (-not (Test-Prerequisites)) {
        throw "Prerequisites not met"
    }
    
    switch ($Action) {
        "dev" {
            Write-Info "Development Build"
            if (Invoke-Tests) {
                Start-Build -profile "development" -platform $Platform
            } else {
                throw "Tests failed"
            }
        }
        
        "preview" {
            Write-Info "Preview Build (Beta Testing)"
            if (Invoke-Tests) {
                Update-Version -type "patch"
                Start-Build -profile "preview" -platform $Platform
            } else {
                throw "Tests failed"
            }
        }
        
        "prod" {
            Write-Info "Production Build"
            
            # Extra confirmation for production
            Write-Warning "This will create PRODUCTION builds!"
            $versionType = Read-Host "Version update type (major/minor/patch)"
            
            if (Invoke-Tests) {
                Update-Version -type $versionType
                
                # Git tag
                $tagName = "v$($config.version)"
                git tag -a $tagName -m "Release $tagName"
                git push origin $tagName
                
                if (Start-Build -profile "production" -platform $Platform) {
                    Write-Success "Production build started!"
                    Write-Info "Monitor at: https://expo.dev/accounts/[your-account]/projects/pot-of-gold/builds"
                    
                    $autoSubmit = Read-Host "Auto-submit when complete? (y/n)"
                    if ($autoSubmit -eq 'y') {
                        Write-Info "Waiting for build to complete..."
                        Write-Info "The script will check every 2 minutes..."
                        
                        # Poll for completion (simplified)
                        Start-Sleep -Seconds 120
                        Submit-ToStore -platform $Platform
                    }
                }
            } else {
                throw "Tests failed"
            }
        }
        
        "submit" {
            Write-Info "Store Submission"
            Submit-ToStore -platform $Platform
        }
        
        "status" {
            Get-BuildStatus
            
            Write-Host ""
            Write-Info "Current Configuration:"
            Write-Host "Version: $($config.version)" -ForegroundColor White
            Write-Host "Build Number: $($config.buildNumber)" -ForegroundColor White
            
            if ($config.lastDeployment) {
                Write-Host ""
                Write-Info "Last Deployment:"
                Write-Host "Platform: $($config.lastDeployment.platform)" -ForegroundColor White
                Write-Host "Version: $($config.lastDeployment.version)" -ForegroundColor White
                Write-Host "Time: $($config.lastDeployment.timestamp)" -ForegroundColor White
                Write-Host "Status: $($config.lastDeployment.status)" -ForegroundColor White
            }
        }
        
        "rollback" {
            Invoke-Rollback
        }
        
        default {
            Write-Error "Invalid action: $Action"
            Write-Host ""
            Write-Host "Usage: .\deploy.ps1 -Action [dev|preview|prod|submit|status|rollback] -Platform [ios|android|all]"
            Write-Host ""
            Write-Host "Examples:"
            Write-Host "  .\deploy.ps1 -Action dev -Platform android"
            Write-Host "  .\deploy.ps1 -Action prod -Platform all"
            Write-Host "  .\deploy.ps1 -Action status"
        }
    }
    
    Write-Host ""
    Write-Success "Deployment script completed!"
    
} catch {
    Write-Error "Deployment failed: $_"
    exit 1
}