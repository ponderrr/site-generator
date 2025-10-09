# Automatic Site Generator - One Command to Rule Them All
# This script automatically detects business info and generates a complete website

Write-Host "🚀 Starting Automatic Site Generator..." -ForegroundColor Green

# Step 1: Auto-detect business information
Write-Host "`n🔍 Step 1: Auto-detecting business information..." -ForegroundColor Yellow
Set-Location "AI generation"
node scripts/auto-detect-business.mjs

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Auto-detection failed. Please check your extracted content." -ForegroundColor Red
    exit 1
}

# Step 2: Package content with image extraction
Write-Host "`n📦 Step 2: Packaging content and extracting images..." -ForegroundColor Yellow
py packager/package_site.py

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Packaging failed." -ForegroundColor Red
    exit 1
}

# Step 3: Generate AI content
Write-Host "`n🤖 Step 3: Generating AI content..." -ForegroundColor Yellow
py drivers/generate_pages_ollama.py

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ AI generation failed." -ForegroundColor Red
    exit 1
}

# Step 4: Build website
Write-Host "`n🏗️ Step 4: Building website..." -ForegroundColor Yellow
Set-Location "../generator"
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed." -ForegroundColor Red
    exit 1
}

# Success!
Write-Host "`n🎉 SUCCESS! Website generated automatically!" -ForegroundColor Green
Write-Host "`n📁 Your website is ready in: generator/out/" -ForegroundColor Cyan
Write-Host "`n🌐 To preview locally:" -ForegroundColor Cyan
Write-Host "   cd generator/out" -ForegroundColor White
Write-Host "   python -m http.server 8000" -ForegroundColor White
Write-Host "   Then visit: http://localhost:8000" -ForegroundColor White

Write-Host "`n📋 What was automatically detected and configured:" -ForegroundColor Cyan
Write-Host "   ✅ Business name from website content" -ForegroundColor Green
Write-Host "   ✅ Contact information (phone, email)" -ForegroundColor Green
Write-Host "   ✅ Service areas/locations" -ForegroundColor Green
Write-Host "   ✅ Business type and appropriate tone" -ForegroundColor Green
Write-Host "   ✅ Call-to-action text" -ForegroundColor Green
Write-Host "   ✅ Images extracted and preserved" -ForegroundColor Green

Write-Host "`n🚀 Ready to deploy to any static hosting service!" -ForegroundColor Green

