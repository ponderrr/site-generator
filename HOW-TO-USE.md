# 📖 How to Use the Site Generator

## 🎯 Quick Answer: Where to Give HTML

You have **4 ways** to provide HTML to the system:

### 1. **From a File** (Easiest)

```bash
# Use the simple analyzer
node analyze-html-simple.js sample.html

# Or any HTML file
node analyze-html-simple.js /path/to/your/page.html
```

### 2. **Programmatically in JavaScript**

```javascript
import { ContentExtractor } from '@site-generator/extractor';

const html = '<html><body><h1>Hello</h1></body></html>';
const extractor = new ContentExtractor();
const result = await extractor.extract('https://example.com', html);

console.log(result.markdown);
console.log(result.title);
console.log(result.wordCount);
```

### 3. **From a URL** (Fetch from web)

```javascript
import fetch from 'node-fetch';
import { ContentExtractor } from '@site-generator/extractor';

const url = 'https://example.com/blog/post';
const response = await fetch(url);
const html = await response.text();

const extractor = new ContentExtractor();
const result = await extractor.extract(url, html);
```

### 4. **In Tests** (Automated testing)

See `test/integration.test.ts` for examples.

---

## 📝 Complete Example: Analyze Your HTML File

### Step 1: Create Your HTML File

Save any HTML content to a file, for example `my-page.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Page</title>
</head>
<body>
    <h1>Welcome</h1>
    <p>This is my content.</p>
</body>
</html>
```

### Step 2: Analyze It

```bash
node analyze-html-simple.js my-page.html
```

**Output:**
```
🚀 Site Generator - HTML Analyzer
📄 Reading file: my-page.html
✅ File loaded!

📊 HTML File Analysis:
  Title: My Page
  Word Count: 6
  Reading Time: 1 minutes
  ...
```

---

## 💻 Programmatic Usage

### Full Example: Complete Analysis Pipeline

Create a file `my-analyzer.js`:

```javascript
import { readFileSync } from 'fs';

// For simple analysis, just parse the HTML directly
const html = readFileSync('sample.html', 'utf-8');

// Extract basic info
const titleMatch = html.match(/<title>(.*?)<\/title>/i);
const title = titleMatch ? titleMatch[1] : 'No title';

const textContent = html.replace(/<[^>]+>/g, ' ');
const wordCount = textContent.split(' ').filter(w => w.trim().length > 0).length;

console.log('Title:', title);
console.log('Word Count:', wordCount);
console.log('Reading Time:', Math.ceil(wordCount / 200), 'minutes');
```

Run it:
```bash
node my-analyzer.js
```

### Using the Built Packages

After building the project (`pnpm build`), you can use the compiled modules:

```javascript
// Import from the built packages
import { ContentExtractor } from './packages/extractor/dist/index.mjs';
import { AnalysisOrchestrator } from './packages/analyzer/dist/index.mjs';
import { readFileSync } from 'fs';

async function analyzeHTMLFile(filePath) {
  // 1. Read HTML from file
  const html = readFileSync(filePath, 'utf-8');
  
  // 2. Extract content
  const extractor = new ContentExtractor();
  const extracted = await extractor.extract(`file://${filePath}`, html);
  
  console.log('📄 Title:', extracted.title);
  console.log('📊 Word Count:', extracted.wordCount);
  console.log('⏱️  Reading Time:', extracted.readingTime, 'min');
  console.log('📝 Markdown length:', extracted.markdown.length);
  
  // 3. Analyze content
  const orchestrator = new AnalysisOrchestrator();
  const analysis = await orchestrator.analyzeContent([extracted]);
  
  console.log('\n🎯 Analysis:');
  console.log('Type:', analysis[0].classification?.pageType);
  console.log('Quality:', analysis[0].metrics?.qualityScore);
  
  // Cleanup
  await orchestrator.destroy();
}

// Use it
analyzeHTMLFile('sample.html');
```

---

## 🌐 Fetch HTML from a URL

Create `fetch-and-analyze.js`:

```javascript
import fetch from 'node-fetch';

async function analyzeWebsite(url) {
  console.log('📡 Fetching:', url);
  
  const response = await fetch(url);
  const html = await response.text();
  
  console.log('✅ Fetched!');
  
  // Now analyze the HTML
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1] : 'No title';
  
  console.log('Title:', title);
}

// Use it
analyzeWebsite('https://example.com');
```

---

## 📂 File Locations

Here's where everything is:

```
site-generator/
├── sample.html                    ← Sample HTML file (ready to use!)
├── analyze-html-simple.js         ← Simple analyzer script
├── my-page.html                   ← Your HTML files go here
│
├── packages/
│   ├── extractor/                 ← Converts HTML → Markdown
│   │   └── dist/index.mjs         ← Built extractor module
│   ├── analyzer/                  ← Analyzes content
│   │   └── dist/index.mjs         ← Built analyzer module
│   └── core/                      ← Utilities (cache, validation, etc.)
│
└── test/
    └── integration.test.ts        ← Examples of how to use the system
```

---

## 🎓 Learning Path

### Beginner: Just Analyze a File

```bash
# 1. Use the sample
node analyze-html-simple.js sample.html

# 2. Create your own HTML file
# 3. Analyze it
node analyze-html-simple.js your-file.html
```

### Intermediate: Use in Your Code

```javascript
// Read file
import { readFileSync } from 'fs';
const html = readFileSync('my-page.html', 'utf-8');

// Parse it
const title = html.match(/<title>(.*?)<\/title>/i)?.[1];
console.log(title);
```

### Advanced: Full System Integration

Look at the test files:
- `test/integration.test.ts` - Full pipeline examples
- `packages/*/src/*.test.ts` - Component-specific examples

---

## 🔧 Available Scripts

All these work with HTML:

```bash
# Analyze a file (simple)
node analyze-html-simple.js your-file.html

# Run all tests (uses HTML examples)
pnpm test

# Watch tests (auto-rerun on changes)
pnpm test:watch

# Build the project (needed for advanced usage)
pnpm build
```

---

## 💡 Common Use Cases

### 1. Convert HTML to Markdown

```javascript
import { readFileSync } from 'fs';
const html = readFileSync('article.html', 'utf-8');
// Extract markdown from HTML...
```

### 2. Classify Page Type

```javascript
// Is this a blog post? Landing page? Documentation?
const classifier = new PageTypeClassifier();
const result = await classifier.analyze(page);
console.log(result.pageType); // "blog", "home", "product", etc.
```

### 3. Extract Keywords

```javascript
const analyzer = new ContentMetricsAnalyzer();
const result = await analyzer.analyze(page);
console.log(result.keywords); // ["react", "javascript", "tutorial", ...]
```

### 4. Detect Sections

```javascript
const detector = new SectionDetector();
const result = await detector.analyze(page);
console.log(result.sections); // [{type: "hero"}, {type: "features"}, ...]
```

---

## 📚 Where to Learn More

1. **TESTING-GUIDE.md** - Complete testing documentation
2. **README.md** - Project overview
3. **test/integration.test.ts** - Real code examples
4. **packages/*/src/*.test.ts** - Component tests

---

## 🆘 Quick Help

**Q: Where do I put my HTML file?**  
A: Anywhere! Just pass the path: `node analyze-html-simple.js /path/to/file.html`

**Q: Can I analyze a URL instead of a file?**  
A: Yes! Fetch it first, then analyze the HTML (see "Fetch HTML from URL" above)

**Q: How do I use this in my own project?**  
A: See the "Programmatic Usage" section above

**Q: Do I need to build the project first?**  
A: No for simple analysis. Yes for full features. Run: `pnpm build`

---

## ✅ Quick Start Checklist

- [x] Sample HTML file created (`sample.html`)
- [x] Simple analyzer ready (`analyze-html-simple.js`)
- [ ] Run your first analysis: `node analyze-html-simple.js sample.html`
- [ ] Create your own HTML file
- [ ] Analyze your file
- [ ] Explore the test files for more examples


