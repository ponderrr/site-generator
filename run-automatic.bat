@echo off
echo 🚀 Starting Automatic Site Generator...

echo.
echo 🔍 Step 1: Auto-detecting business information...
cd "AI generation"
node scripts/auto-detect-business.mjs
if %errorlevel% neq 0 (
    echo ❌ Auto-detection failed. Please check your extracted content.
    pause
    exit /b 1
)

echo.
echo 📦 Step 2: Packaging content and extracting images...
py packager/package_site.py
if %errorlevel% neq 0 (
    echo ❌ Packaging failed.
    pause
    exit /b 1
)

echo.
echo 🤖 Step 3: Generating AI content...
py drivers/generate_pages_ollama.py
if %errorlevel% neq 0 (
    echo ❌ AI generation failed.
    pause
    exit /b 1
)

echo.
echo 🏗️ Step 4: Building website...
cd "../generator"
npm run build
if %errorlevel% neq 0 (
    echo ❌ Build failed.
    pause
    exit /b 1
)

echo.
echo 🎉 SUCCESS! Website generated automatically!
echo.
echo 📁 Your website is ready in: generator/out/
echo.
echo 🌐 To preview locally:
echo    cd generator/out
echo    python -m http.server 8000
echo    Then visit: http://localhost:8000
echo.
echo 📋 What was automatically detected and configured:
echo    ✅ Business name from website content
echo    ✅ Contact information (phone, email)
echo    ✅ Service areas/locations
echo    ✅ Business type and appropriate tone
echo    ✅ Call-to-action text
echo    ✅ Images extracted and preserved
echo.
echo 🚀 Ready to deploy to any static hosting service!
pause

