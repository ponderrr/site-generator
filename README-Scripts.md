# Site Generator Scripts

Two PowerShell scripts to manage the complete site generation system.

## 🧹 clear-system.ps1

**Purpose:** Cleans the entire system by removing all generated content.

**What it clears:**
- Extractor: `data/`, `output/`, `.next/`, `out/`, `dist/`
- Analyzer: `data/`, `output/`, `.next/`, `out/`, `dist/`
- AI Generation: `build/`, `output/`, `.next/`, `out/`, `dist/`
- Generator: `content/pages/`, `route-map.json`, `.next/`, `out/`, `dist/`
- Root cache: `.next/`, `node_modules/.cache/`, `*.log`

**Usage:**
```powershell
.\clear-system.ps1
```

## 🚀 run-system.ps1

**Purpose:** Runs the complete site generation pipeline from start to finish.

**Pipeline order:**
1. Clear system (optional)
2. Install dependencies
3. **Extractor** → Extract content from source
4. **Analyzer** → Analyze and structure content
5. **AI Generation** → Generate new content using AI
6. **Generator** → Build the final website

**Usage:**
```powershell
# Run complete pipeline
.\run-system.ps1

# Run without clearing first
.\run-system.ps1 -SkipClear

# Run specific steps only
.\run-system.ps1 -SkipExtractor -SkipAnalyzer

# Run and open site in browser
.\run-system.ps1 -OpenSite
```

**Parameters:**
- `-SkipClear` - Don't clear system before running
- `-SkipExtractor` - Skip the extractor step
- `-SkipAnalyzer` - Skip the analyzer step
- `-SkipAI` - Skip the AI generation step
- `-SkipGenerator` - Skip the generator step
- `-OpenSite` - Open the generated site in browser

**Example outputs:**
- **Site files:** `generator/out/`
- **Extracted data:** `extractor/output/`
- **Analysis data:** `analyzer/output/`
- **AI content:** `AI generation/build/pack/`

## 📋 Quick Commands

```powershell
# Fresh start - clear and run everything
.\clear-system.ps1
.\run-system.ps1

# Just regenerate the site (skip extraction/analysis)
.\run-system.ps1 -SkipExtractor -SkipAnalyzer -SkipClear

# Just run AI generation and build
.\run-system.ps1 -SkipExtractor -SkipAnalyzer -SkipClear

# Run everything and open the site
.\run-system.ps1 -OpenSite
```

## 🛠️ Troubleshooting

**If scripts fail:**
1. Make sure you're in the root directory
2. Ensure PowerShell execution policy allows scripts:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```
3. Check that all dependencies are installed in each package
4. Verify Python is available for AI generation

**Common issues:**
- **Permission errors:** Run PowerShell as Administrator
- **Module not found:** Run `pnpm install` in root directory first
- **Python errors:** Ensure Python is installed and accessible

## 📊 Performance Notes

- **Full pipeline:** ~5-10 minutes (depending on content size)
- **Skip extraction/analysis:** ~2-3 minutes
- **Clear operation:** ~30 seconds

The scripts include progress indicators and error handling to help track the process.



