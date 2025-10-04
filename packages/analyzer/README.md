# @site-generator/analyzer

Content analysis engine for the Site Generator.

## Overview

The analyzer package provides sophisticated content analysis capabilities:

- **Content Metrics**: Word count, reading time, complexity analysis
- **Page Classification**: Automatic page type detection
- **Section Detection**: Content structure analysis
- **Cross-page Analysis**: Relationship detection between pages
- **Quality Scoring**: Content quality assessment
- **Embedding Generation**: Vector embeddings for content similarity

## Installation

```bash
pnpm add @site-generator/analyzer
```

## Usage

### Content Analysis

```typescript
import { AnalysisOrchestrator } from '@site-generator/analyzer';

const orchestrator = new AnalysisOrchestrator({
  parallel: 4,
  cache: true,
  enableMetrics: true,
  enableClassification: true,
  enableSections: true
});

const results = await orchestrator.analyze(pages);
```

### Metrics Analysis

```typescript
import { ContentMetricsAnalyzer } from '@site-generator/analyzer';

const metricsAnalyzer = new ContentMetricsAnalyzer();

const metrics = await metricsAnalyzer.analyze(content, {
  calculateReadingTime: true,
  analyzeComplexity: true,
  detectLanguage: true
});
```

### Page Classification

```typescript
import { PageTypeClassifier } from '@site-generator/analyzer';

const classifier = new PageTypeClassifier();

const pageType = await classifier.classify({
  title: 'How to Build a Website',
  content: 'Step 1: Choose a domain...',
  url: 'https://example.com/guide',
  metadata: { author: 'John Doe' }
});
```

### Section Detection

```typescript
import { SectionDetector } from '@site-generator/analyzer';

const detector = new SectionDetector({
  minSectionLength: 100,
  detectHeadings: true,
  detectLists: true,
  detectCodeBlocks: true
});

const sections = await detector.detect(content);
```

## API Reference

### Classes

- `AnalysisOrchestrator` - Main analysis coordination
- `ContentMetricsAnalyzer` - Content metrics calculation
- `PageTypeClassifier` - Page type classification
- `SectionDetector` - Content section detection

### Types

- `AnalysisOptions` - Configuration for analysis operations
- `AnalysisResult` - Result of analysis operation
- `ContentMetrics` - Calculated content metrics
- `PageType` - Detected page type information
- `ContentSection` - Detected content section

## Page Types

The classifier can detect various page types:

- `article` - Blog posts, news articles
- `documentation` - Technical documentation
- `landing` - Marketing landing pages
- `product` - Product pages
- `about` - About pages
- `contact` - Contact pages
- `gallery` - Image galleries
- `form` - Form pages

## Content Metrics

Available metrics include:

- **Word Count**: Total word count
- **Reading Time**: Estimated reading time in minutes
- **Complexity Score**: Text complexity (0-1)
- **Readability**: Flesch-Kincaid readability score
- **Language**: Detected content language
- **Sentiment**: Content sentiment analysis

## Section Types

Detected sections include:

- `heading` - Headings (H1-H6)
- `paragraph` - Text paragraphs
- `list` - Ordered and unordered lists
- `code` - Code blocks
- `quote` - Blockquotes
- `image` - Image elements
- `table` - Data tables

## Configuration

```typescript
interface AnalysisConfig {
  metrics: {
    calculateReadingTime: boolean;
    analyzeComplexity: boolean;
    detectLanguage: boolean;
    analyzeSentiment: boolean;
  };
  classification: {
    confidenceThreshold: number;
    enableML: boolean;
    customRules: ClassificationRule[];
  };
  sections: {
    minSectionLength: number;
    detectHeadings: boolean;
    detectLists: boolean;
    detectCodeBlocks: boolean;
    detectTables: boolean;
  };
  crossPage: {
    enableSimilarity: boolean;
    enableRelationships: boolean;
    similarityThreshold: number;
  };
}
```

## Performance Features

### Parallel Processing

- **Worker Threads**: Utilizes Piscina for parallel analysis
- **Batch Processing**: Processes multiple pages in batches
- **Load Balancing**: Distributes work across available threads

### Caching

- **Result Caching**: Caches analysis results for performance
- **TTL Support**: Time-based cache expiration
- **Memory Efficient**: LRU cache with configurable limits

### Monitoring

- **Progress Tracking**: Real-time analysis progress
- **Performance Metrics**: Analysis performance monitoring
- **Error Reporting**: Comprehensive error tracking

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
- `natural` - Natural language processing
- `compromise` - Text analysis and processing
- `franc` - Language detection
- `sentiment` - Sentiment analysis

## License

MIT
