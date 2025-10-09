/**
 * @fileoverview Testing utilities and helpers for the site generator
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

/**
 * Test utilities for mocking and testing site generator components
 */
export class TestUtils {
  /**
   * Creates a mock HTML page for testing
   */
  static createMockHTMLPage(
    options: {
      title?: string;
      content?: string;
      url?: string;
      metadata?: Record<string, any>;
    } = {},
  ): any {
    return {
      url: options.url || "https://example.com/test-page",
      title: options.title || "Test Page",
      content:
        options.content || "<h1>Test Content</h1><p>This is test content.</p>",
      metadata: {
        description: "Test page description",
        keywords: ["test", "page"],
        author: "Test Author",
        ...options.metadata,
      },
      extractedAt: new Date().toISOString(),
      size: 1024,
    };
  }

  /**
   * Creates mock analysis results for testing
   */
  static createMockAnalysisResult(
    options: {
      pageType?: string;
      metrics?: Record<string, number>;
      sections?: any[];
    } = {},
  ): any {
    return {
      pageType: options.pageType || "article",
      metrics: {
        wordCount: 150,
        readingTime: 1,
        complexity: 0.5,
        ...options.metrics,
      },
      sections: options.sections || [
        { type: "heading", level: 1, content: "Main Heading" },
        { type: "paragraph", content: "Test paragraph content" },
      ],
      analyzedAt: new Date().toISOString(),
    };
  }

  /**
   * Creates a mock cache entry for testing
   */
  static createMockCacheEntry<T>(
    key: string,
    value: T,
    ttl: number = 300000,
  ): any {
    return {
      key,
      value,
      timestamp: Date.now(),
      ttl,
      accessCount: 0,
    };
  }

  /**
   * Waits for a specified amount of time (useful for async testing)
   */
  static async wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Creates a mock worker pool for testing
   */
  static createMockWorkerPool(): any {
    return {
      run: vi.fn().mockResolvedValue({ success: true }),
      destroy: vi.fn().mockResolvedValue(undefined),
      getStats: vi.fn().mockReturnValue({
        totalTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        activeWorkers: 0,
      }),
    };
  }
}

/**
 * Mock factories for common site generator types
 */
export class MockFactories {
  /**
   * Creates a mock URL for testing
   */
  static createMockURL(base: string = "https://example.com"): URL {
    return new URL(base);
  }

  /**
   * Creates mock extraction options
   */
  static createMockExtractionOptions(): any {
    return {
      includeImages: true,
      includeLinks: true,
      maxDepth: 3,
      timeout: 30000,
      userAgent: "SiteGenerator/1.0",
    };
  }

  /**
   * Creates mock generation options
   */
  static createMockGenerationOptions(): any {
    return {
      outputFormat: "html",
      includeMetadata: true,
      optimizeImages: true,
      generateSitemap: true,
      theme: "default",
    };
  }
}

/**
 * Test fixtures for common scenarios
 */
export class TestFixtures {
  /**
   * Simple HTML page fixture
   */
  static readonly SIMPLE_HTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Simple Test Page</title>
      <meta name="description" content="A simple test page">
    </head>
    <body>
      <h1>Welcome</h1>
      <p>This is a simple test page.</p>
      <img src="/test-image.jpg" alt="Test Image">
      <a href="/other-page">Link to other page</a>
    </body>
    </html>
  `;

  /**
   * Complex HTML page fixture with multiple sections
   */
  static readonly COMPLEX_HTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Complex Test Page</title>
      <meta name="description" content="A complex test page with multiple sections">
      <meta name="keywords" content="test, complex, multiple, sections">
    </head>
    <body>
      <header>
        <nav>
          <a href="/">Home</a>
          <a href="/about">About</a>
          <a href="/contact">Contact</a>
        </nav>
      </header>
      <main>
        <article>
          <h1>Main Article Title</h1>
          <p>This is the main article content with lots of text.</p>
          <section>
            <h2>Subsection</h2>
            <p>This is a subsection with more content.</p>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
              <li>Item 3</li>
            </ul>
          </section>
        </article>
        <aside>
          <h3>Related Links</h3>
          <ul>
            <li><a href="/related1">Related Article 1</a></li>
            <li><a href="/related2">Related Article 2</a></li>
          </ul>
        </aside>
      </main>
      <footer>
        <p>&copy; 2024 Test Site</p>
      </footer>
    </body>
    </html>
  `;

  /**
   * Markdown content fixture
   */
  static readonly MARKDOWN_CONTENT = `
# Test Markdown Document

This is a test markdown document with various elements.

## Features

- **Bold text**
- *Italic text*
- \`Code snippets\`

### Code Block

\`\`\`javascript
function test() {
  console.log('Hello, World!');
}
\`\`\`

## Links and Images

[External Link](https://example.com)

![Test Image](/test-image.jpg)

## Lists

1. First item
2. Second item
3. Third item
  `;
}

/**
 * Assertion helpers for common test patterns
 */
export class AssertionHelpers {
  /**
   * Asserts that a value is a valid URL
   */
  static assertValidURL(value: any, message?: string): asserts value is URL {
    expect(value).toBeInstanceOf(URL);
    expect(value.href).toBeTruthy();
  }

  /**
   * Asserts that a cache entry is valid
   */
  static assertValidCacheEntry(entry: any, message?: string): void {
    expect(entry).toHaveProperty("key");
    expect(entry).toHaveProperty("value");
    expect(entry).toHaveProperty("timestamp");
    expect(typeof entry.timestamp).toBe("number");
  }

  /**
   * Asserts that analysis results are valid
   */
  static assertValidAnalysisResult(result: any, message?: string): void {
    expect(result).toHaveProperty("pageType");
    expect(result).toHaveProperty("metrics");
    expect(result).toHaveProperty("sections");
    expect(Array.isArray(result.sections)).toBe(true);
  }

  /**
   * Asserts that extraction results are valid
   */
  static assertValidExtractionResult(result: any, message?: string): void {
    expect(result).toHaveProperty("url");
    expect(result).toHaveProperty("title");
    expect(result).toHaveProperty("content");
    expect(result).toHaveProperty("extractedAt");
  }
}

/**
 * Performance testing utilities
 */
export class PerformanceTestUtils {
  /**
   * Measures execution time of a function
   */
  static async measureExecutionTime<T>(
    fn: () => Promise<T> | T,
    label?: string,
  ): Promise<{ result: T; duration: number }> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;

    if (label) {
      console.log(`${label}: ${duration.toFixed(2)}ms`);
    }

    return { result, duration };
  }

  /**
   * Creates a performance test that ensures execution time is within limits
   */
  static createPerformanceTest(
    maxDuration: number,
    fn: () => Promise<any> | any,
    label?: string,
  ) {
    return async () => {
      const { duration } = await this.measureExecutionTime(fn, label);
      expect(duration).toBeLessThan(maxDuration);
    };
  }
}

// Export all utilities as default
export default {
  TestUtils,
  MockFactories,
  TestFixtures,
  AssertionHelpers,
  PerformanceTestUtils,
};
