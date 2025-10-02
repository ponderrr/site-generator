# 🌐 Using URLs with Site Generator

## ✅ Yes, You Can Use URLs!

The system can analyze **any website URL** directly!

---

## 🚀 Quick Start with URLs

### Analyze Any Website

```bash
node analyze-url.js https://example.com
```

### Real Examples

```bash
# Analyze a blog post
node analyze-url.js https://example.com/blog/my-post

# Analyze a documentation page
node analyze-url.js https://github.com/nodejs/node

# Analyze a product page
node analyze-url.js https://example.com/products/item

# Analyze the first website ever made!
node analyze-url.js http://info.cern.ch
```

---

## 📊 What You Get from URL Analysis

When you run `node analyze-url.js <url>`, you get:

✅ **Page Information:**
- Title
- Description (meta tag)
- URL classification

✅ **Content Metrics:**
- Word count
- Reading time estimate
- Number of headings (H1, H2)
- Number of paragraphs
- Number of images
- Number of links

✅ **Page Classification:**
- Automatically detects: blog post, product page, home page, landing page, etc.

✅ **Section Detection:**
- Header
- Navigation
- Main content/Article
- Forms
- Call-to-Action buttons
- Footer

✅ **Content Preview:**
- Main heading
- First paragraph

---

## 💻 Full Comparison: Files vs URLs

### Option 1: Analyze Local HTML File

```bash
node analyze-html-simple.js sample.html
```

**Best for:**
- ✅ HTML files you already have
- ✅ Offline analysis
- ✅ Testing during development

### Option 2: Analyze Live URL

```bash
node analyze-url.js https://example.com
```

**Best for:**
- ✅ Analyzing live websites
- ✅ Competitor analysis
- ✅ Content audits
- ✅ SEO research

---

## 🎯 Use Cases for URL Analysis

### 1. **Competitor Analysis**

```bash
# Analyze competitor's blog
node analyze-url.js https://competitor.com/blog/popular-post

# See their content structure
# Word count, sections, keywords, etc.
```

### 2. **Content Research**

```bash
# Analyze top-performing content
node analyze-url.js https://medium.com/@author/trending-article

# Extract structure, reading time, sections
```

### 3. **SEO Audit**

```bash
# Check any page's content metrics
node analyze-url.js https://yoursite.com/page

# Get title, description, word count, etc.
```

### 4. **Content Scraping**

```bash
# Extract content from any page
node analyze-url.js https://docs.example.com/guide

# Convert HTML to Markdown automatically
```

---

## 🔧 Advanced: Programmatic URL Usage

### Fetch and Analyze in Your Code

Create `my-url-analyzer.js`:

```javascript
import https from 'https';

function fetchURL(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      let html = '';
      response.on('data', chunk => html += chunk);
      response.on('end', () => resolve(html));
      response.on('error', reject);
    }).on('error', reject);
  });
}

async function analyzeWebsite(url) {
  console.log('Fetching:', url);
  
  const html = await fetchURL(url);
  
  // Extract title
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1] : 'No title';
  
  // Count words
  const text = html.replace(/<[^>]+>/g, ' ');
  const wordCount = text.split(' ').filter(w => w.trim()).length;
  
  console.log('Title:', title);
  console.log('Word Count:', wordCount);
}

// Use it
analyzeWebsite('https://example.com');
```

### Batch Process Multiple URLs

```javascript
const urls = [
  'https://example.com/page1',
  'https://example.com/page2',
  'https://example.com/page3'
];

for (const url of urls) {
  // Analyze each URL
  console.log(`Analyzing: ${url}`);
  // ... analysis code
}
```

---

## 🌐 URL Requirements

### ✅ Supported URLs

```bash
# HTTPS (secure)
node analyze-url.js https://example.com

# HTTP (plain)
node analyze-url.js http://example.com

# With path
node analyze-url.js https://example.com/blog/post

# With subdomains
node analyze-url.js https://blog.example.com

# With ports
node analyze-url.js http://localhost:3000
```

### ❌ Not Supported (yet)

- URLs requiring authentication
- JavaScript-rendered content (SPA)
- URLs behind firewalls
- Dynamic content loaded after page load

---

## 🔍 What Gets Analyzed from URLs

### 1. **HTML Content**
- The system fetches the raw HTML
- Analyzes the static content
- Does NOT execute JavaScript

### 2. **Metadata**
```html
<title>Page Title</title>
<meta name="description" content="...">
<meta name="keywords" content="...">
```

### 3. **Structure**
```html
<header>...</header>
<nav>...</nav>
<article>...</article>
<footer>...</footer>
```

### 4. **Content Elements**
- Headings (H1-H6)
- Paragraphs
- Images
- Links
- Lists

---

## 📝 Example Output

When you run:
```bash
node analyze-url.js https://example.com
```

You get:
```
🚀 Site Generator - URL Analyzer
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📡 Fetching HTML from: https://example.com
⏳ Please wait...

✅ Fetched successfully!
📏 HTML Size: 1.23 KB

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Analyzing Content...

📝 Page Information:
  URL: https://example.com
  Title: Example Domain
  Description: No description found

📈 Content Metrics:
  Word Count: 30
  Reading Time: 1 minutes
  H1 Headings: 1
  H2 Headings: 0
  Paragraphs: 2
  Images: 0
  Links: 1

🎯 Page Classification:
  Type: home-page

🎨 Detected Sections:

📄 Main Heading:
  Example Domain

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Analysis Complete!
```

---

## 🎓 Learning Examples

### Example 1: Simple URL Analysis

```bash
node analyze-url.js https://example.com
```

### Example 2: Blog Post Analysis

```bash
# Find a blog URL and analyze it
node analyze-url.js https://medium.com/@author/post
```

### Example 3: Compare Two Pages

```bash
# Analyze home page
node analyze-url.js https://example.com

# Analyze about page
node analyze-url.js https://example.com/about

# Compare the results
```

---

## 🛠️ Troubleshooting

### Problem: "Failed to fetch"

**Solutions:**
1. Check internet connection
2. Verify URL is accessible in browser
3. Some sites block automated requests
4. Try http:// instead of https:// (or vice versa)

### Problem: "ENOTFOUND" Error

**Solutions:**
1. Check URL spelling
2. Make sure URL includes http:// or https://
3. Test URL in browser first

### Problem: "Certificate Error"

**Solutions:**
1. Site might have SSL issues
2. Try http:// version
3. Check if site is accessible in browser

---

## 🚀 Quick Reference

```bash
# Basic usage
node analyze-url.js <url>

# Examples
node analyze-url.js https://example.com
node analyze-url.js http://info.cern.ch
node analyze-url.js https://github.com

# For local files, use:
node analyze-html-simple.js file.html
```

---

## 💡 Pro Tips

1. **Always include `http://` or `https://`**
   ```bash
   ✅ node analyze-url.js https://example.com
   ❌ node analyze-url.js example.com
   ```

2. **Test in browser first**
   - Make sure the URL loads in your browser
   - If it works there, it should work in the analyzer

3. **Use full URLs**
   ```bash
   ✅ https://example.com/blog/post
   ❌ example.com/blog
   ```

4. **For JavaScript-heavy sites**
   - The analyzer only sees static HTML
   - Content loaded by JavaScript won't be analyzed
   - Use the browser's "View Source" to see what gets analyzed

---

## ✅ Summary

**Yes, you CAN use URLs!**

```bash
# Just run:
node analyze-url.js https://any-website.com

# It will:
✓ Fetch the HTML
✓ Analyze content
✓ Extract metadata
✓ Classify page type
✓ Detect sections
✓ Calculate metrics
```

**That's it!** 🎉


