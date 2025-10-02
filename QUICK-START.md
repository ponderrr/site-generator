# ⚡ Quick Start - Site Generator

## 🎯 Choose Your Input Method

### 1️⃣ **Analyze a URL** (Live Website)

```bash
node analyze-url.js https://example.com
```

**Examples:**
```bash
node analyze-url.js https://github.com
node analyze-url.js https://example.com/blog/post
node analyze-url.js http://info.cern.ch
```

---

### 2️⃣ **Analyze a Local HTML File**

```bash
node analyze-html-simple.js your-file.html
```

**Examples:**
```bash
node analyze-html-simple.js sample.html
node analyze-html-simple.js /path/to/page.html
node analyze-html-simple.js C:\downloads\webpage.html
```

---

### 3️⃣ **Run the Test Suite** (See All Features)

```bash
pnpm test
```

Runs 214 automated tests showing all capabilities.

---

## 🚀 What You Get

Both methods give you:

- ✅ **Title** and **Description**
- ✅ **Word Count** and **Reading Time**  
- ✅ **Page Type** (blog, home, product, etc.)
- ✅ **Sections** (header, nav, footer, CTA, etc.)
- ✅ **Content Metrics** (headings, paragraphs, images, links)

---

## 📚 Files Created for You

| File | Purpose | Command |
|------|---------|---------|
| `analyze-url.js` | Analyze any URL | `node analyze-url.js <url>` |
| `analyze-html-simple.js` | Analyze HTML file | `node analyze-html-simple.js <file>` |
| `sample.html` | Example HTML file | `node analyze-html-simple.js sample.html` |
| `test-example.js` | See what system does | `node test-example.js` |

---

## 🎓 Complete Guides

- **URL-USAGE-GUIDE.md** - Everything about using URLs
- **HOW-TO-USE.md** - Complete usage documentation  
- **TESTING-GUIDE.md** - Testing documentation
- **README.md** - Project overview

---

## 💡 Most Common Tasks

### Analyze a website you found
```bash
node analyze-url.js https://the-website.com
```

### Analyze an HTML file you have
```bash
node analyze-html-simple.js your-page.html
```

### Try the demo
```bash
node test-example.js
```

### Test everything works
```bash
pnpm test
```

---

## 🆘 Quick Help

**Q: Can I use URLs?**  
✅ YES! `node analyze-url.js https://example.com`

**Q: Can I use local files?**  
✅ YES! `node analyze-html-simple.js file.html`

**Q: Do I need to build first?**  
❌ NO for basic usage. YES for advanced features (`pnpm build`)

**Q: Where do the files go?**  
📂 Anywhere! Just provide the path.

---

## ✨ Try It Now!

Pick one:

```bash
# Option A: Analyze a real website
node analyze-url.js https://example.com

# Option B: Analyze the sample file
node analyze-html-simple.js sample.html

# Option C: See the demo
node test-example.js
```

**That's it!** 🎉


