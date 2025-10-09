# Full System Run Script - Executes the complete site generation pipeline
# This script runs: Extractor → Analyzer → AI Generation → Generator

param(
    [switch]$SkipClear = $false,
    [switch]$SkipExtractor = $false,
    [switch]$SkipAnalyzer = $false,
    [switch]$SkipAI = $false,
    [switch]$SkipGenerator = $false,
    [switch]$OpenSite = $false
)

$ErrorActionPreference = "Continue"

function Write-Step {
    param($Message, $Color = "Cyan")
    Write-Host "`n🚀 $Message" -ForegroundColor $Color
    Write-Host "=" * 50 -ForegroundColor $Color
}

function Write-Success {
    param($Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Error {
    param($Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Info {
    param($Message)
    Write-Host "ℹ️ $Message" -ForegroundColor Blue
}

# Start timing
$startTime = Get-Date
Write-Host "🎯 Starting complete site generation pipeline..." -ForegroundColor Yellow
Write-Host "Start time: $($startTime.ToString('yyyy-MM-dd HH:mm:ss'))" -ForegroundColor Gray

# Step 1: Clear system (optional)
if (-not $SkipClear) {
    Write-Step "Step 1: Clearing system for fresh start"
    try {
        & ".\clear-system.ps1"
        Write-Success "System cleared successfully"
    } catch {
        Write-Error "Failed to clear system: $_"
        exit 1
    }
} else {
    Write-Info "Skipping system clear (--SkipClear flag used)"
}

# Step 2: Install dependencies
Write-Step "Step 2: Installing dependencies"
try {
    Write-Info "Installing root dependencies..."
    pnpm install
    Write-Success "Root dependencies installed"
} catch {
    Write-Error "Failed to install dependencies: $_"
    exit 1
}

# Step 3: Extractor
if (-not $SkipExtractor) {
    Write-Step "Step 3: Running Extractor"
    try {
        Set-Location "extractor"
        Write-Info "Installing extractor dependencies..."
        pnpm install
        
        Write-Info "Running extractor..."
        pnpm run extract
        
        Set-Location ".."
        Write-Success "Extractor completed successfully"
    } catch {
        Set-Location ".."
        Write-Error "Extractor failed: $_"
        exit 1
    }
} else {
    Write-Info "Skipping Extractor (--SkipExtractor flag used)"
}

# Step 4: Analyzer
if (-not $SkipAnalyzer) {
    Write-Step "Step 4: Running Analyzer"
    try {
        Set-Location "analyzer"
        Write-Info "Installing analyzer dependencies..."
        pnpm install
        
        Write-Info "Running analyzer..."
        pnpm run analyze
        
        Set-Location ".."
        Write-Success "Analyzer completed successfully"
    } catch {
        Set-Location ".."
        Write-Error "Analyzer failed: $_"
        exit 1
    }
} else {
    Write-Info "Skipping Analyzer (--SkipAnalyzer flag used)"
}

# Step 5: AI Generation
if (-not $SkipAI) {
    Write-Step "Step 5: Running AI Generation"
    try {
        Set-Location "AI generation"
        Write-Info "Running AI content generation..."
        python main.py
        
        Set-Location ".."
        Write-Success "AI Generation completed successfully"
    } catch {
        Set-Location ".."
        Write-Error "AI Generation failed: $_"
        exit 1
    }
} else {
    Write-Info "Skipping AI Generation (--SkipAI flag used)"
}

# Step 6: Generator
if (-not $SkipGenerator) {
    Write-Step "Step 6: Building Generator"
    try {
        Set-Location "generator"
        Write-Info "Installing generator dependencies..."
        pnpm install
        
        Write-Info "Running prebuild and building site..."
        pnpm run build
        
        Set-Location ".."
        Write-Success "Generator completed successfully"
    } catch {
        Set-Location ".."
        Write-Error "Generator failed: $_"
        exit 1
    }
} else {
    Write-Info "Skipping Generator (--SkipGenerator flag used)"
}

# Final step: Open site (optional)
if ($OpenSite) {
    Write-Step "Step 7: Opening generated site"
    try {
        $sitePath = Resolve-Path "generator\out\index.html"
        Write-Info "Opening site at: $sitePath"
        Start-Process $sitePath
        Write-Success "Site opened in browser"
    } catch {
        Write-Error "Failed to open site: $_"
        Write-Info "You can manually open: generator\out\index.html"
    }
}

# Completion summary
$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host "`n🎉 PIPELINE COMPLETED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "=" * 50 -ForegroundColor Green
Write-Host "⏱️  Total Duration: $($duration.ToString('hh\:mm\:ss'))" -ForegroundColor Yellow
Write-Host "🏁 End time: $($endTime.ToString('yyyy-MM-dd HH:mm:ss'))" -ForegroundColor Gray

Write-Host "`n📁 Generated files location:" -ForegroundColor Cyan
Write-Host "   Site: generator\out\" -ForegroundColor White
Write-Host "   Extracted data: extractor\output\" -ForegroundColor White
Write-Host "   Analysis: analyzer\output\" -ForegroundColor White
Write-Host "   AI content: AI generation\build\pack\" -ForegroundColor White

Write-Host "`n💡 Next steps:" -ForegroundColor Cyan
Write-Host "   • View site: generator\out\index.html" -ForegroundColor White
Write-Host "   • Serve site: cd generator\out && npx serve" -ForegroundColor White
Write-Host "   • Clear system: .\clear-system.ps1" -ForegroundColor White

Write-Host "`n🚀 Happy site generating!" -ForegroundColor Magenta



