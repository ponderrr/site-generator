# Clear System Script - Removes all generated content
# Run this to start fresh with a clean system

Write-Host "🧹 Clearing entire site-generator system..." -ForegroundColor Yellow

# Stop any running processes
Write-Host "⏹️ Stopping any running Node processes..." -ForegroundColor Blue
try {
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Node processes stopped" -ForegroundColor Green
} catch {
    Write-Host "ℹ️ No Node processes found" -ForegroundColor Gray
}

# Clear Extractor
Write-Host "🗑️ Clearing Extractor..." -ForegroundColor Blue
$extractorPaths = @(
    "extractor/data",
    "extractor/output",
    "extractor/.next",
    "extractor/out",
    "extractor/dist"
)
foreach ($path in $extractorPaths) {
    if (Test-Path $path) {
        Remove-Item -Recurse -Force $path
        Write-Host "  ✅ Cleared $path" -ForegroundColor Green
    }
}

# Clear Analyzer
Write-Host "🗑️ Clearing Analyzer..." -ForegroundColor Blue
$analyzerPaths = @(
    "analyzer/data",
    "analyzer/output",
    "analyzer/.next",
    "analyzer/out",
    "analyzer/dist"
)
foreach ($path in $analyzerPaths) {
    if (Test-Path $path) {
        Remove-Item -Recurse -Force $path
        Write-Host "  ✅ Cleared $path" -ForegroundColor Green
    }
}

# Clear AI Generation
Write-Host "🗑️ Clearing AI Generation..." -ForegroundColor Blue
$aiPaths = @(
    "AI generation/build",
    "AI generation/output",
    "AI generation/.next",
    "AI generation/out",
    "AI generation/dist"
)
foreach ($path in $aiPaths) {
    if (Test-Path $path) {
        Remove-Item -Recurse -Force $path
        Write-Host "  ✅ Cleared $path" -ForegroundColor Green
    }
}

# Clear Generator
Write-Host "🗑️ Clearing Generator..." -ForegroundColor Blue
$generatorPaths = @(
    "generator/content/pages",
    "generator/data/route-map.json",
    "generator/.next",
    "generator/out",
    "generator/dist"
)
foreach ($path in $generatorPaths) {
    if (Test-Path $path) {
        Remove-Item -Recurse -Force $path
        Write-Host "  ✅ Cleared $path" -ForegroundColor Green
    }
}

# Clear root level cache
Write-Host "🗑️ Clearing root cache..." -ForegroundColor Blue
$rootPaths = @(
    ".next",
    "node_modules/.cache",
    "*.log"
)
foreach ($path in $rootPaths) {
    if ($path -like "*.log") {
        Get-ChildItem -Path . -Name "*.log" -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
    } elseif (Test-Path $path) {
        Remove-Item -Recurse -Force $path
        Write-Host "  ✅ Cleared $path" -ForegroundColor Green
    }
}

Write-Host "🎉 System cleared successfully!" -ForegroundColor Green
Write-Host "💡 Run 'run-system.ps1' to start the complete pipeline" -ForegroundColor Cyan



