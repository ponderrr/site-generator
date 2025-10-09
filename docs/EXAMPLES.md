# Usage Examples

## Basic Extraction

### Single Page

```bash
pnpm extract -- --url https://example.com
```

Output: `./extracted/example_com/example_com_<timestamp>.md`

### Custom Output

```bash
pnpm extract -- --url https://example.com --output ./my-data
```

### JSON Format

```bash
pnpm extract -- --url https://example.com --format json
```

## Advanced Extraction

### Skip Robots.txt

```bash
pnpm extract -- --url https://example.com --no-robots
```

### More Retries

```bash
pnpm extract -- --url https://slow-site.com --retry 5
```

### Verbose Mode

```bash
pnpm extract -- --url https://example.com --verbose
```

## Analysis Examples

### Full Analysis

```bash
pnpm analyze -- --input ./extracted --output ./analysis --all
```

### Metrics Only

```bash
pnpm analyze -- --input ./extracted --output ./analysis --metrics
```

### Multiple Analysis Types

```bash
pnpm analyze -- --input ./extracted --output ./analysis --metrics --sections
```

## Complete Workflows

### Blog Analysis

```bash
# Extract blog posts
pnpm extract -- --url https://blog.example.com/post-1 --output ./blog-data
pnpm extract -- --url https://blog.example.com/post-2 --output ./blog-data
pnpm extract -- --url https://blog.example.com/post-3 --output ./blog-data

# Analyze all posts
pnpm analyze -- --input ./blog-data --output ./blog-analysis --all

# View summary
cat blog-analysis/summary.json
```

### Competitive Analysis

```bash
# Extract competitor sites
pnpm extract -- --url https://competitor1.com --output ./competitors
pnpm extract -- --url https://competitor2.com --output ./competitors
pnpm extract -- --url https://competitor3.com --output ./competitors

# Analyze and compare
pnpm analyze -- --input ./competitors --output ./competitor-analysis --all

# Review metrics
cat competitor-analysis/summary.json
```

### Content Quality Assessment

```bash
# Extract your website
pnpm extract -- --url https://yoursite.com --output ./yoursite

# Run quality analysis
pnpm analyze -- --input ./yoursite --output ./quality-report --metrics

# View quality metrics
cat quality-report/summary.json
```

### SEO Analysis

```bash
# Extract pages
pnpm extract -- --url https://example.com/page1 --output ./seo-data
pnpm extract -- --url https://example.com/page2 --output ./seo-data

# Analyze with focus on metrics
pnpm analyze -- --input ./seo-data --output ./seo-analysis --metrics --verbose

# Review SEO scores
cat seo-analysis/summary.json
```

### Page Type Classification

```bash
# Extract various page types
pnpm extract -- --url https://example.com --output ./pages
pnpm extract -- --url https://example.com/about --output ./pages
pnpm extract -- --url https://example.com/contact --output ./pages
pnpm extract -- --url https://example.com/blog/post --output ./pages

# Classify pages
pnpm analyze -- --input ./pages --output ./classification --classification

# View classification results
ls classification/example_com/*_classification.json
```

## Automated Workflows

### Bash Script for Multiple URLs

```bash
#!/bin/bash

# urls.txt contains one URL per line
while IFS= read -r url; do
  echo "Processing: $url"
  pnpm extract -- --url "$url" --output ./bulk-extract
done < urls.txt

# Analyze all
pnpm analyze -- --input ./bulk-extract --output ./bulk-analysis --all
```

### Node.js Script for Batch Processing

```javascript
// batch-process.js
import { execSync } from "child_process";
import { existsSync, mkdirSync } from "fs";

const urls = [
  "https://example.com",
  "https://example.org",
  "https://example.net",
];

const outputDir = "./batch-data";
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

// Extract all URLs
for (const url of urls) {
  console.log(`Extracting: ${url}`);
  try {
    execSync(`pnpm extract -- --url ${url} --output ${outputDir}`, {
      stdio: "inherit",
    });
  } catch (error) {
    console.error(`Failed to extract ${url}:`, error.message);
  }
}

// Analyze all
console.log("Analyzing extracted content...");
execSync(
  `pnpm analyze -- --input ${outputDir} --output ./batch-analysis --all`,
  {
    stdio: "inherit",
  },
);
```

## Testing and Validation

### Integration Test

```bash
# Run the integration test suite
pnpm test:integration
```

### Performance Benchmark

```bash
# Run performance benchmarks
pnpm benchmark
```

### Manual Verification

```bash
# Extract test data
pnpm extract -- --url https://example.com --output ./verify

# Analyze
pnpm analyze -- --input ./verify --output ./verify-analysis --all --verbose

# Check results
ls -R ./verify-analysis/
cat ./verify-analysis/summary.json

# Cleanup
rm -rf ./verify ./verify-analysis
```

## Output Structure Examples

### After Extraction

```
extracted/
└── example_com/
    ├── example_com_2025-10-08T12-30-45.md
    └── example_com_2025-10-08T12-30-45_metadata.json
```

### After Analysis

```
analysis/
├── summary.json
└── example_com/
    ├── example_com_2025-10-08T12-30-45_analysis.json
    ├── example_com_2025-10-08T12-30-45_metrics.json
    ├── example_com_2025-10-08T12-30-45_classification.json
    └── example_com_2025-10-08T12-30-45_sections.json
```

## Troubleshooting Examples

### Handling Timeouts

```bash
# Increase retry attempts for slow sites
pnpm extract -- --url https://slow-site.com --retry 5 --verbose
```

### Debug Mode

```bash
# Use verbose flag for detailed logs
pnpm extract -- --url https://example.com --verbose
pnpm analyze -- --input ./extracted --output ./analysis --all --verbose
```

### Cleanup After Errors

```bash
# Clean all test and output data
pnpm clean

# Rebuild
pnpm build

# Try again
pnpm extract -- --url https://example.com --output ./fresh-start
```
