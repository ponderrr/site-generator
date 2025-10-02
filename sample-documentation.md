# Site Generator Documentation

A comprehensive guide to using the Site Generator for content analysis and processing.

## Overview

The Site Generator is an enterprise-grade content analysis and processing system designed for intelligent website content extraction, analysis, and optimization.

## Features

### Core Capabilities

- **Content Extraction**: Extract and process HTML content from web pages
- **Intelligent Analysis**: Classify page types, assess content quality, and analyze structure
- **Performance Optimization**: High-speed parallel processing with advanced caching
- **Content Generation**: Transform and optimize content for various output formats

### Advanced Features

- **High-Performance Processing**: Multi-threaded architecture with parallel processing
- **Intelligent Content Analysis**: Page classification, quality scoring, and structure detection
- **Advanced Caching**: LRU cache with memory optimization and TTL support
- **Error Recovery**: Circuit breaker patterns and retry logic for reliability
- **Resource Monitoring**: Performance tracking and health checks

## Installation

### Prerequisites

- **Node.js** >= 20.0.0
- **pnpm** >= 8.0.0
- **Git LFS** >= 3.0.0

### Quick Setup

```bash
# Clone the repository
git clone <repository-url>
cd site-generator

# Install dependencies
pnpm install

# Build the project
pnpm build
```

## Usage Examples

### Basic Content Analysis

```javascript
import { ContentExtractor } from '@site-generator/extractor';

const extractor = new ContentExtractor();
const result = await extractor.extract('https://example.com', html);

console.log('Title:', result.title);
console.log('Word Count:', result.wordCount);
console.log('Markdown:', result.markdown);
```

### Page Classification

```javascript
import { PageTypeClassifier } from '@site-generator/analyzer';

const classifier = new PageTypeClassifier();
const analysis = await classifier.analyze(page);

console.log('Page Type:', analysis.pageType);
console.log('Confidence:', analysis.confidence);
```

## API Reference

### ContentExtractor

The main class for extracting content from HTML.

#### Methods

- `extract(url, html)` - Extract content from HTML
- `validateInput(data)` - Validate input parameters
- `getStats()` - Get extraction statistics

#### Example

```typescript
const extractor = new ContentExtractor({
  includeImages: true,
  includeLinks: true,
  maxContentLength: 10000
});

const result = await extractor.extract('https://example.com', html);
```

### AnalysisOrchestrator

Orchestrates the complete analysis pipeline.

#### Methods

- `analyzeContent(pages)` - Analyze multiple pages
- `getCacheStats()` - Get cache statistics
- `clearCache()` - Clear analysis cache

## Configuration

### Environment Variables

```bash
# Performance settings
NODE_ENV=production
MAX_WORKERS=8
CACHE_SIZE=1000

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

### Configuration Files

- `config/esbuild.config.js` - Build configuration
- `config/webpack.config.js` - Webpack settings
- `config/swc.config.js` - SWC compiler options

## Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run specific test suite
pnpm test analyzer
```

### Test Structure

```
test/
├── basic.test.ts          # Basic functionality tests
├── integration.test.ts    # End-to-end tests
└── setup.ts              # Test configuration
```

## Performance

### Benchmarks

The system is designed to handle:

- **High-volume content processing** with parallel workers
- **Intelligent content classification** and quality assessment
- **Memory-efficient operations** with advanced caching
- **Robust error handling** and recovery mechanisms

### Optimization Tips

1. **Use caching** for repeated analysis
2. **Batch process** multiple pages
3. **Monitor memory usage** during large operations
4. **Configure worker pools** based on your hardware

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Fork the repository
git clone your-fork-url
cd site-generator

# Install dependencies
pnpm install

# Run in development mode
pnpm dev
```

### Code Style

- Use TypeScript for all new code
- Follow ESLint configuration
- Write tests for new features
- Update documentation

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📖 [Documentation](https://docs.example.com)
- 🐛 [Issue Tracker](https://github.com/example/issues)
- 💬 [Discussions](https://github.com/example/discussions)
- 📧 [Email Support](mailto:support@example.com)

## Changelog

### Version 0.1.0

- Initial release
- Core extraction and analysis features
- Basic caching and performance monitoring
- Comprehensive test suite

---

*Last updated: March 2024*
