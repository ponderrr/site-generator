# @site-generator/testing

Testing utilities and helpers for the Site Generator.

## Overview

The testing package provides comprehensive testing utilities for the Site Generator monorepo:

- **Test Utilities**: Mock factories and test helpers
- **Fixtures**: Common test data and scenarios
- **Assertions**: Custom assertion helpers
- **Performance Testing**: Performance measurement utilities
- **Mocking**: Advanced mocking capabilities
- **Integration Helpers**: End-to-end testing support

## Installation

```bash
pnpm add @site-generator/testing
```

## Usage

### Basic Test Setup

```typescript
import { describe, it, expect } from 'vitest';
import { TestUtils, MockFactories, TestFixtures } from '@site-generator/testing';

describe('Content Extraction', () => {
  it('should extract content from HTML', () => {
    const html = TestFixtures.SIMPLE_HTML;
    const mockPage = TestUtils.createMockHTMLPage({
      content: html,
      title: 'Test Page'
    });
    
    expect(mockPage.title).toBe('Test Page');
    expect(mockPage.content).toContain('Welcome');
  });
});
```

### Mock Factories

```typescript
import { MockFactories } from '@site-generator/testing';

// Create mock URL
const url = MockFactories.createMockURL('https://example.com');

// Create mock extraction options
const options = MockFactories.createMockExtractionOptions();

// Create mock generation options
const genOptions = MockFactories.createMockGenerationOptions();
```

### Test Utilities

```typescript
import { TestUtils } from '@site-generator/testing';

// Create mock HTML page
const page = TestUtils.createMockHTMLPage({
  title: 'My Test Page',
  content: '<h1>Test Content</h1>',
  url: 'https://example.com/test',
  metadata: {
    author: 'Test Author',
    description: 'Test page description'
  }
});

// Create mock analysis result
const analysis = TestUtils.createMockAnalysisResult({
  pageType: 'article',
  metrics: {
    wordCount: 250,
    readingTime: 2,
    complexity: 0.7
  }
});

// Create mock cache entry
const cacheEntry = TestUtils.createMockCacheEntry('test-key', { data: 'value' });
```

### Performance Testing

```typescript
import { PerformanceTestUtils } from '@site-generator/testing';

describe('Performance Tests', () => {
  it('should extract content within time limit', async () => {
    const performanceTest = PerformanceTestUtils.createPerformanceTest(
      1000, // Max duration: 1 second
      async () => {
        // Your async operation here
        await extractor.extract('https://example.com');
      },
      'Content Extraction'
    );
    
    await performanceTest();
  });
  
  it('should measure execution time', async () => {
    const { result, duration } = await PerformanceTestUtils.measureExecutionTime(
      async () => {
        return await someAsyncOperation();
      },
      'Operation Name'
    );
    
    expect(duration).toBeLessThan(500);
    expect(result).toBeDefined();
  });
});
```

### Assertion Helpers

```typescript
import { AssertionHelpers } from '@site-generator/testing';

describe('Validation Tests', () => {
  it('should validate URL', () => {
    const url = new URL('https://example.com');
    AssertionHelpers.assertValidURL(url);
  });
  
  it('should validate cache entry', () => {
    const entry = TestUtils.createMockCacheEntry('key', 'value');
    AssertionHelpers.assertValidCacheEntry(entry);
  });
  
  it('should validate analysis result', () => {
    const result = TestUtils.createMockAnalysisResult();
    AssertionHelpers.assertValidAnalysisResult(result);
  });
});
```

## API Reference

### Classes

- `TestUtils` - General testing utilities
- `MockFactories` - Mock object factories
- `TestFixtures` - Static test data
- `AssertionHelpers` - Custom assertion helpers
- `PerformanceTestUtils` - Performance testing utilities

### Test Fixtures

#### HTML Fixtures

- `TestFixtures.SIMPLE_HTML` - Basic HTML page
- `TestFixtures.COMPLEX_HTML` - Complex HTML with multiple sections
- `TestFixtures.MARKDOWN_CONTENT` - Markdown content example

#### Mock Data

- `TestUtils.createMockHTMLPage()` - Mock HTML page data
- `TestUtils.createMockAnalysisResult()` - Mock analysis results
- `TestUtils.createMockCacheEntry()` - Mock cache entries
- `TestUtils.createMockWorkerPool()` - Mock worker pool

### Utilities

#### TestUtils Methods

- `createMockHTMLPage(options?)` - Create mock HTML page
- `createMockAnalysisResult(options?)` - Create mock analysis result
- `createMockCacheEntry(key, value, ttl?)` - Create mock cache entry
- `wait(ms)` - Wait for specified time
- `createMockWorkerPool()` - Create mock worker pool

#### MockFactories Methods

- `createMockURL(base?)` - Create mock URL
- `createMockExtractionOptions()` - Create mock extraction options
- `createMockGenerationOptions()` - Create mock generation options

#### AssertionHelpers Methods

- `assertValidURL(value, message?)` - Assert valid URL
- `assertValidCacheEntry(entry, message?)` - Assert valid cache entry
- `assertValidAnalysisResult(result, message?)` - Assert valid analysis result
- `assertValidExtractionResult(result, message?)` - Assert valid extraction result

#### PerformanceTestUtils Methods

- `measureExecutionTime(fn, label?)` - Measure function execution time
- `createPerformanceTest(maxDuration, fn, label?)` - Create performance test

## Testing Patterns

### Unit Testing

```typescript
import { TestUtils } from '@site-generator/testing';

describe('Unit Tests', () => {
  it('should process single page', () => {
    const page = TestUtils.createMockHTMLPage();
    const result = processor.process(page);
    
    expect(result).toBeDefined();
    expect(result.processed).toBe(true);
  });
});
```

### Integration Testing

```typescript
import { TestFixtures, TestUtils } from '@site-generator/testing';

describe('Integration Tests', () => {
  it('should process complete pipeline', async () => {
    const pages = [
      TestUtils.createMockHTMLPage({ content: TestFixtures.SIMPLE_HTML }),
      TestUtils.createMockHTMLPage({ content: TestFixtures.COMPLEX_HTML })
    ];
    
    const results = await orchestrator.process(pages);
    
    expect(results).toHaveLength(2);
    expect(results[0].success).toBe(true);
  });
});
```

### Performance Testing

```typescript
import { PerformanceTestUtils } from '@site-generator/testing';

describe('Performance Tests', () => {
  it('should handle large datasets', async () => {
    const largeDataset = Array.from({ length: 1000 }, (_, i) => 
      TestUtils.createMockHTMLPage({ url: `https://example.com/page-${i}` })
    );
    
    const test = PerformanceTestUtils.createPerformanceTest(
      5000, // 5 second limit
      () => processor.processBatch(largeDataset)
    );
    
    await test();
  });
});
```

## Development

### Building

```bash
pnpm build
```

### Testing

```bash
pnpm test
```

### Development Mode

```bash
pnpm dev
```

## Dependencies

- `@site-generator/core` - Core utilities and types
- `vitest` - Testing framework
- `@vitest/ui` - Vitest UI
- `happy-dom` - DOM implementation for testing
- `jsdom` - JavaScript DOM implementation

## License

MIT
