# 🚀 Quick Start - Using the Site Generator for ANY Business

## TL;DR - 3 Steps to Generate a Website

```bash
# 1. Edit your business info
notepad "AI generation/config/site.config.yaml"

# 2. Run the packager (if you have new extracted content)
cd "AI generation"
py packager/package_site.py

# 3. Build the site
cd generator
npm run build

# Your site is now in: generator/out/
```

---

## 📋 **Complete Workflow**

### For a New Business Website:

#### Step 1: Configure Business Details
Edit `AI generation/config/site.config.yaml`:

```yaml
brand:
  name: "Your Business Name Here"
  primary_cta: "Get Started"  # Or "Book Now", "Contact Us", etc.

constants:
  company_name: "Your Business Name Here"
  phone: "(555) 123-4567"
  email: "contact@yourbusiness.com"
  service_areas:
    - City1
    - City2
    - City3
```

#### Step 2: Extract Content (if crawling a website)
```bash
# From project root
cd packages/crawler
npm run crawl -- https://competitor-site.com

# Output goes to: extracted/
```

#### Step 3: Analyze Content
```bash
cd packages/analyzer
npm run analyze

# Output goes to: analysis/
```

#### Step 4: Package Content
```bash
cd "AI generation"
py packager/package_site.py

# ✅ Extracts images from markdown
# ✅ Creates structured content files
# Output: build/pack/
```

#### Step 5: Generate AI Content (Optional)
```bash
# Still in AI generation directory
py drivers/generate_pages_ollama.py

# ✅ AI rewrites content using your brand voice
# Output: build/generated/
```

#### Step 6: Build Website
```bash
cd generator
npm run build

# This automatically:
# ✅ Generates tokens from your config
# ✅ Copies AI-generated content
# ✅ Creates navigation structure
# ✅ Injects metadata
# ✅ Builds static site

# Output: generator/out/
```

#### Step 7: Test Locally
```bash
# Still in generator directory
npm run start

# Or use a simple HTTP server:
cd out
python -m http.server 8000

# Visit: http://localhost:8000
```

#### Step 8: Deploy
```bash
# Deploy the 'generator/out/' folder to:
# - Netlify
# - Vercel
# - GitHub Pages
# - AWS S3
# - Any static hosting
```

---

## 🔄 **Making Changes**

### Change Business Info:
```bash
# 1. Edit config
notepad "AI generation/config/site.config.yaml"

# 2. Rebuild
cd generator
npm run build
```

### Update Content:
```bash
# 1. Edit MDX files in:
#    generator/content/pages/

# 2. Rebuild
npm run build
```

### Change Design/Layout:
```bash
# Edit templates in:
# generator/themes/default/templates/

# Edit components in:
# generator/themes/default/components/

# Rebuild
npm run build
```

---

## 🎨 **Customization**

### Change Colors:
Edit `AI generation/config/site.config.yaml` (future enhancement) or directly edit `generator/themes/default/tokens.ts` after running `generate:tokens`.

### Add New Pages:
```bash
# 1. Create new .mdx file in:
#    generator/content/pages/new-page.mdx

# 2. Add front matter:
---
title: "New Page"
slug: /new-page
page_type: other
description: "Description here"
---

# Content here

# 3. Rebuild
npm run build
```

### Custom Templates:
Create new template in `generator/themes/default/templates/`:

```tsx
// custom.tsx
export default function CustomTemplate({ meta, tokens, children }) {
  return (
    <>
      <h1>{meta.title}</h1>
      <div>{children}</div>
    </>
  );
}
```

Then use `page_type: custom` in your MDX front matter.

---

## 📊 **File Structure Reference**

```
site-generator/
├── AI generation/
│   ├── config/
│   │   └── site.config.yaml          ← Edit business info here
│   ├── packager/
│   │   └── package_site.py           ← Extracts images & packages content
│   ├── drivers/
│   │   └── generate_pages_ollama.py  ← AI content generation
│   └── build/
│       ├── pack/                     ← Packaged content
│       └── generated/                ← AI-generated content
│
├── generator/
│   ├── config/
│   │   └── site.config.ts            ← Static site config
│   ├── content/
│   │   └── pages/                    ← Your page content (.mdx)
│   ├── themes/
│   │   └── default/
│   │       ├── tokens.ts             ← Auto-generated from config
│   │       ├── templates/            ← Page templates
│   │       └── components/           ← Reusable components
│   ├── scripts/
│   │   ├── generate-tokens.mjs       ← Creates tokens from config
│   │   ├── copy-generated.mjs        ← Copies AI content
│   │   └── prebuild.mjs              ← Runs all build scripts
│   └── out/                          ← Built static site (deploy this!)
│
├── extracted/                        ← Crawled website content
├── analysis/                         ← Content analysis results
└── packages/                         ← Core modules
    ├── crawler/                      ← Website crawler
    ├── analyzer/                     ← Content analyzer
    └── extractor/                    ← Content extractor
```

---

## 🔍 **Verification Checklist**

After building, verify:

✅ **Images show up:**
```bash
# Check HTML has image tags
grep '<img' generator/out/index.html
```

✅ **Your business name appears:**
```bash
# Check HTML has your business name
grep 'Your Business Name' generator/out/index.html
```

✅ **Contact info is correct:**
```bash
# Check footer has your phone/email
grep 'contact@yourbusiness.com' generator/out/index.html
```

✅ **All pages generated:**
```bash
# List generated HTML files
ls generator/out/*.html
```

---

## 🐛 **Common Issues**

### "Images not showing"
**Cause:** Packager didn't extract images or wrong path  
**Fix:**
```bash
cd "AI generation"
py packager/package_site.py
cd generator
npm run build
```

### "Wrong business name showing"
**Cause:** Config not updated or tokens not regenerated  
**Fix:**
```bash
# Edit config first
notepad "AI generation/config/site.config.yaml"

cd generator
npm run generate:tokens
npm run build
```

### "Pages missing"
**Cause:** Route map not updated  
**Fix:**
```bash
cd generator
npm run generate:routes
npm run build
```

### "Build fails"
**Cause:** Corrupted cache  
**Fix:**
```bash
cd generator
rm -rf .next out node_modules
npm install
npm run build
```

---

## 💡 **Pro Tips**

1. **Always edit config first** - It flows through the entire system
2. **Run packager after crawling** - To extract images properly
3. **Test locally before deploying** - Use `npm run dev` for live preview
4. **Keep AI generation optional** - You can manually edit MDX files
5. **Use version control** - Commit changes to track what works

---

## 📚 **Resources**

- **Full documentation:** See `SYSTEM-FIXED-SUMMARY.md`
- **Config reference:** `AI generation/config/site.config.yaml`
- **Component examples:** `generator/themes/default/components/`
- **Template examples:** `generator/themes/default/templates/`

---

## 🎯 **Success Criteria**

You'll know it's working when:
1. ✅ Running `npm run build` succeeds without errors
2. ✅ `generator/out/` contains HTML files
3. ✅ Your business name appears throughout the site
4. ✅ Images from extracted content show up
5. ✅ Contact info is correct in footer
6. ✅ Site looks good in browser at `http://localhost:3000`

---

**Need help?** Check `SYSTEM-FIXED-SUMMARY.md` for detailed information about what was fixed and how the system works.


