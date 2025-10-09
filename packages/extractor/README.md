# @site-generator/extractor

Content extraction engine for the Site Generator.

## Overview

The extractor package handles the extraction of content from various sources including:

- **HTML Parsing**: Advanced HTML parsing with Cheerio
- **Markdown Conversion**: HTML to Markdown conversion using Turndown
- **Media Extraction**: Image and asset extraction with optimization
- **URL Processing**: URL normalization and validation
- **Content Filtering**: Intelligent content filtering and cleaning

## Installation

```bash
pnpm add @site-generator/extractor
```

## Usage

### Basic Extraction

```typescript
import { ContentExtractor } from "@site-generator/extractor";

const extractor = new ContentExtractor({
  includeImages: true,
  includeLinks: true,
  maxDepth: 3,
  timeout: 30000,
});

const result = await extractor.extract("https://example.com");
```

### HTML Parsing

```typescript
import { HTMLParser } from "@site-generator/extractor";

const parser = new HTMLParser({
  removeScripts: true,
  removeStyles: false,
  preserveFormatting: true,
});

const parsed = parser.parse(htmlContent);
```

### Markdown Conversion

```typescript
import { MarkdownConverter } from "@site-generator/extractor";

const converter = new MarkdownConverter({
  headingStyle: "atx",
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
});

const markdown = converter.convert(htmlContent);
```

### Media Extraction

```typescript
import { MediaExtractor } from "@site-generator/extractor";

const mediaExtractor = new MediaExtractor({
  downloadImages: true,
  optimizeImages: true,
  maxImageSize: 1024 * 1024, // 1MB
  supportedFormats: ["jpg", "png", "webp"],
});

const media = await mediaExtractor.extract(url, htmlContent);
```

## API Reference

### Classes

- `ContentExtractor` - Main extraction orchestrator
- `HTMLParser` - HTML parsing and cleaning
- `MarkdownConverter` - HTML to Markdown conversion
- `MediaExtractor` - Media file extraction and optimization
- `URLNormalizer` - URL processing and validation
- `ContentFilter` - Content filtering and cleaning

### Types

- `ExtractionOptions` - Configuration for content extraction
- `ExtractionResult` - Result of extraction operation
- `ParsedContent` - Parsed HTML content structure
- `MediaFile` - Extracted media file information

## Configuration

```typescript
interface ExtractionConfig {
  html: {
    removeScripts: boolean;
    removeStyles: boolean;
    preserveFormatting: boolean;
    cleanWhitespace: boolean;
  };
  markdown: {
    headingStyle: "atx" | "setext";
    bulletListMarker: "-" | "*" | "+";
    codeBlockStyle: "fenced" | "indented";
  };
  media: {
    downloadImages: boolean;
    optimizeImages: boolean;
    maxImageSize: number;
    supportedFormats: string[];
  };
  urls: {
    normalize: boolean;
    validate: boolean;
    followRedirects: boolean;
  };
}
```

## Features

### Intelligent Content Filtering

The extractor includes sophisticated content filtering:

- **Ad Blocking**: Removes common ad patterns
- **Navigation Cleanup**: Filters out navigation elements
- **Content Scoring**: Scores content relevance
- **Duplicate Detection**: Identifies and removes duplicate content

### Performance Optimizations

- **Parallel Processing**: Concurrent extraction of multiple pages
- **Caching**: Intelligent caching of extracted content
- **Streaming**: Stream-based processing for large documents
- **Memory Management**: Efficient memory usage for large extractions

### Error Handling

- **Retry Logic**: Automatic retry with exponential backoff
- **Timeout Management**: Configurable timeouts for operations
- **Fallback Strategies**: Graceful degradation when features fail
- **Detailed Error Reporting**: Comprehensive error information

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

- `cheerio` - HTML parsing and manipulation
- `turndown` - HTML to Markdown conversion
- `sharp` - Image processing and optimization
- `node-fetch` - HTTP client for content fetching
- `robots-parser` - Robots.txt parsing
- `p-throttle` - Request throttling

## License

MIT
