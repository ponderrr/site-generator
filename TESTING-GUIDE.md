# 🧪 Site Generator - Testing Guide

## Overview

This guide shows you all the ways to test the Site Generator system.

## 🚀 Quick Start

### 1. Run All Tests (Simplest)

```bash
pnpm test
```

This runs **214 automated tests** covering:
- ✅ Content extraction from HTML
- ✅ Page type classification
- ✅ Content quality analysis
- ✅ Section detection
- ✅ Caching and performance
- ✅ Error handling and validation

**Expected Output:**
```
✓ Test Files  10 passed (10)
✓ Tests  214 passed (214)
```

### 2. Run Tests in Watch Mode

```bash
pnpm test:watch
```

- Auto-reruns tests when you change code
- Great for development
- Has a nice UI interface

### 3. Run Example Demo

```bash
node test-example.js
```

Shows what the system does with a sample blog post HTML.

---

## 📝 Testing Different Components

### Test Content Extraction

**What it does:** Extracts and converts HTML to Markdown

**Test file:** `packages/extractor/src/extractor.test.ts`

**Run specific test:**
```bash
pnpm test extractor
```

**Example test:**
```typescript
// Test that HTML converts to Markdown correctly
it('should convert HTML to Markdown', async () => {
  const html = '<h1>Hello</h1><p>World</p>';
  const result = await extractor.extract('https://example.com', html);
  
  expect(result.markdown).toContain('# Hello');
  expect(result.markdown).toContain('World');
});
```

### Test Page Classification

**What it does:** Automatically detects if a page is a blog post, home page, product page, etc.

**Test file:** `packages/analyzer/src/analysis/PageTypeClassifier.test.ts`

**Run specific test:**
```bash
pnpm test PageTypeClassifier
```

**Example:**
```typescript
it('should classify blog post correctly', async () => {
  const page = {
    url: 'https://example.com/blog/my-post',
    title: 'My Blog Post',
    markdown: '# Article Title\n\nBy John Doe...'
  };
  
  const result = await classifier.analyze(page);
  
  expect(result.pageType).toBe('blog');
  expect(result.confidence).toBeGreaterThan(0.8);
});
```

### Test Content Quality Analysis

**What it does:** Scores content quality, readability, keyword extraction

**Test file:** `packages/analyzer/src/analysis/ContentMetricsAnalyzer.test.ts`

**Example:**
```typescript
it('should analyze content metrics', async () => {
  const result = await analyzer.analyze(page);
  
  expect(result.wordCount).toBeGreaterThan(0);
  expect(result.readingTime).toBeGreaterThan(0);
  expect(result.qualityScore).toBeGreaterThan(0);
  expect(result.keywords).toBeArray();
});
```

### Test Section Detection

**What it does:** Finds navigation, hero, features, pricing, CTA sections

**Test file:** `packages/analyzer/src/analysis/SectionDetector.test.ts`

**Example:**
```typescript
it('should detect hero section', async () => {
  const markdown = '# Welcome to Our Site\n\nGet started today!';
  const result = await detector.analyze({ markdown });
  
  const heroSection = result.sections.find(s => s.type === 'hero');
  expect(heroSection).toBeDefined();
  expect(heroSection.confidence).toBeGreaterThan(0.7);
});
```

---

## 🔍 Integration Tests

**File:** `test/integration.test.ts`

These test the **entire pipeline** working together:

```bash
pnpm test integration
```

**What they test:**
1. Extract HTML → Convert to Markdown
2. Classify page type
3. Analyze content quality
4. Detect sections
5. Cache results
6. Handle errors

---

## 💡 Manual Testing - Try It Yourself

### Create Your Own Test

Create a file `my-test.js`:

```javascript
import { ContentExtractor } from './packages/extractor/src/extractor.js';
import { AnalysisOrchestrator } from './packages/analyzer/src/analysis/index.js';

async function testWebPage() {
  // 1. Extract content from HTML
  const extractor = new ContentExtractor();
  const html = `
    <html>
      <head><title>My Test Page</title></head>
      <body>
        <h1>Welcome</h1>
        <p>This is a test page with some content.</p>
      </body>
    </html>
  `;
  
  const extracted = await extractor.extract('https://test.com', html);
  console.log('📄 Extracted Content:', extracted);
  
  // 2. Analyze the content
  const orchestrator = new AnalysisOrchestrator();
  const analysis = await orchestrator.analyzeContent([extracted]);
  console.log('📊 Analysis Results:', analysis);
}

testWebPage();
```

Run it:
```bash
node my-test.js
```

---

## 🎯 Testing Specific Features

### Test Input Validation (Security Feature)

```bash
pnpm test validation
```

Tests that the system:
- ✅ Rejects invalid URLs
- ✅ Validates input data types
- ✅ Prevents malicious inputs
- ✅ Enforces data schemas

### Test Error Handling

```bash
pnpm test error
```

Tests that the system:
- ✅ Handles network errors
- ✅ Retries failed operations
- ✅ Uses circuit breakers
- ✅ Logs errors properly

### Test Caching

```bash
pnpm test cache
```

Tests that the system:
- ✅ Caches analysis results
- ✅ Respects TTL (time-to-live)
- ✅ Manages memory efficiently
- ✅ Provides cache statistics

### Test Performance

```bash
pnpm test performance
```

Tests that the system:
- ✅ Processes content quickly
- ✅ Uses parallel workers
- ✅ Monitors resource usage
- ✅ Handles large content

---

## 📊 Understanding Test Output

When you run `pnpm test`, you'll see:

```
✓ packages/extractor/src/extractor.test.ts
  ✓ ContentExtractor
    ✓ should extract content successfully
    ✓ should handle extraction errors
    ✓ should extract metadata
    ✓ should count words and calculate reading time
```

**What this means:**
- Each `✓` is a passing test
- Tests are organized by component
- Each test validates a specific feature

---

## 🐛 Debugging Failed Tests

If a test fails:

```
✗ should classify blog post correctly
  Expected: "blog"
  Received: "unknown"
```

**How to debug:**

1. **Run only that test:**
   ```bash
   pnpm test -t "should classify blog post"
   ```

2. **Add console logs:**
   ```javascript
   console.log('Classification result:', result);
   ```

3. **Check the test file:**
   Look at the test expectations and actual data

---

## 📈 Coverage Reports

See which code is tested:

```bash
pnpm test:coverage
```

**Output:**
```
Coverage Report:
  Statements: 85%
  Branches: 80%
  Functions: 82%
  Lines: 85%
```

---

## 🔥 Performance Testing

Test how fast the system processes content:

```bash
pnpm perf
```

This runs benchmarks and shows:
- Processing speed (pages/second)
- Memory usage
- Cache hit rates
- Worker performance

---

## 💻 Real-World Testing Example

Want to test on a real website? Here's how:

```javascript
import fetch from 'node-fetch';
import { ContentExtractor } from './packages/extractor/src/extractor.js';

async function testRealWebsite() {
  const url = 'https://example.com/blog/some-post';
  
  // Fetch the HTML
  const response = await fetch(url);
  const html = await response.text();
  
  // Extract and analyze
  const extractor = new ContentExtractor();
  const result = await extractor.extract(url, html);
  
  console.log('Title:', result.title);
  console.log('Word Count:', result.wordCount);
  console.log('Reading Time:', result.readingTime);
  console.log('Markdown Preview:', result.markdown.substring(0, 200));
}

testRealWebsite();
```

---

## ✅ Test Checklist

Before committing code, ensure:

- [ ] All tests pass: `pnpm test`
- [ ] No linter errors: `pnpm lint`
- [ ] Code is formatted: `pnpm format`
- [ ] Coverage is maintained: `pnpm test:coverage`

---

## 🎓 Summary

**For Quick Testing:**
```bash
pnpm test                 # Run all tests
node test-example.js      # See example output
```

**For Development:**
```bash
pnpm test:watch          # Auto-rerun tests
pnpm test:coverage       # Check coverage
```

**For Specific Components:**
```bash
pnpm test extractor      # Test extraction
pnpm test analyzer       # Test analysis
pnpm test cache          # Test caching
```

---

## 🆘 Need Help?

- Check existing test files in `packages/*/src/*.test.ts`
- Look at `test/integration.test.ts` for examples
- Run `node test-example.js` to see what the system does


