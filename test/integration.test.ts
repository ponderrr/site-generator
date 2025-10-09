import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { ContentExtractor } from "@site-generator/extractor";
import { AnalysisOrchestrator } from "@site-generator/analyzer";
import { ExtractedPage } from "@site-generator/analyzer";

describe("End-to-End Integration Tests", () => {
  let extractor: ContentExtractor;
  let orchestrator: AnalysisOrchestrator;

  beforeAll(async () => {
    // Initialize components
    extractor = new ContentExtractor({
      extractImages: true,
      extractLinks: true,
      extractMetadata: true,
      maxContentLength: 50000,
      timeout: 10000,
    });

    orchestrator = new AnalysisOrchestrator(
      {
        minThreads: 2,
        maxThreads: 4,
        idleTimeout: 10000,
        maxQueue: 100,
        resourceLimits: {
          maxOldGenerationSizeMb: 256,
          maxYoungGenerationSizeMb: 64,
        },
      },
      {
        batchSize: 5,
        cacheTTL: 1000 * 60 * 60,
        confidenceThreshold: 0.5,
        enableCrossAnalysis: true,
        enableEmbeddings: true,
        maxWorkers: 4,
      },
    );
  });

  afterAll(async () => {
    await orchestrator.destroy();
  });

  beforeEach(() => {
    // Clear cache between tests
    orchestrator.clearCache();
  });

  describe("Full Content Processing Pipeline", () => {
    it("should extract and analyze content from HTML data URL", async () => {
      // Create a test HTML page
      const testHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Test Blog Post - Machine Learning Fundamentals</title>
          <meta name="description" content="Learn the basics of machine learning with practical examples">
          <meta name="author" content="Tech Writer">
        </head>
        <body>
          <article>
            <h1>Machine Learning Fundamentals</h1>
            <p>Machine learning is a subset of artificial intelligence that focuses on algorithms and statistical models.</p>
            
            <h2>Key Concepts</h2>
            <ul>
              <li>Supervised Learning</li>
              <li>Unsupervised Learning</li>
              <li>Reinforcement Learning</li>
            </ul>

            <h2>Applications</h2>
            <p>Machine learning is used in various industries including healthcare, finance, and technology.</p>
            
            <h2>Conclusion</h2>
            <p>Understanding machine learning fundamentals is essential for modern software development.</p>
          </article>
        </body>
        </html>
      `;

      const dataUrl = `data:text/html,${encodeURIComponent(testHtml)}`;

      // Step 1: Extract content
      const extractionResult = await extractor.extract(dataUrl);

      expect(extractionResult.success).toBe(true);
      expect(extractionResult.content).toBeDefined();

      const extractedContent = extractionResult.content!;
      expect(extractedContent.title).toBe(
        "Test Blog Post - Machine Learning Fundamentals",
      );
      expect(extractedContent.markdown).toContain(
        "# Machine Learning Fundamentals",
      );
      expect(extractedContent.markdown).toContain("## Key Concepts");
      expect(extractedContent.markdown).toContain("Supervised Learning");
      expect(extractedContent.wordCount).toBeGreaterThan(50);

      // Step 2: Analyze content
      const page: ExtractedPage = {
        url: dataUrl,
        title: extractedContent.title,
        markdown: extractedContent.markdown,
        frontmatter: {},
      };

      const analysisResults = await orchestrator.analyzeContent([page]);

      expect(analysisResults).toHaveLength(1);

      const analysis = analysisResults[0];
      expect(analysis.url).toBe(dataUrl);
      expect(analysis.pageType).toBeDefined();
      expect(analysis.confidence).toBeGreaterThan(0);
      expect(analysis.contentMetrics).toBeDefined();
      expect(analysis.sections).toBeDefined();
      expect(analysis.analysisTime).toBeGreaterThan(0);
      expect(analysis.qualityScore).toBeGreaterThan(0);
      expect(analysis.recommendations).toBeDefined();
    });

    it("should handle multiple pages with cross-analysis", async () => {
      const pages: ExtractedPage[] = [
        {
          url:
            "data:text/html," +
            encodeURIComponent(`
            <html><head><title>React Tutorial</title></head><body>
              <h1>React Tutorial</h1>
              <p>Learn React components and hooks. React is a popular JavaScript library.</p>
              <h2>Components</h2>
              <p>Components are the building blocks of React applications.</p>
            </body></html>
          `),
          title: "React Tutorial",
          markdown:
            "# React Tutorial\n\nLearn React components and hooks. React is a popular JavaScript library.\n\n## Components\n\nComponents are the building blocks of React applications.",
          frontmatter: { topic: "react", type: "tutorial" },
        },
        {
          url:
            "data:text/html," +
            encodeURIComponent(`
            <html><head><title>Vue.js Guide</title></head><body>
              <h1>Vue.js Guide</h1>
              <p>Complete guide to Vue.js framework. Vue is another popular JavaScript framework.</p>
              <h2>Components</h2>
              <p>Vue components work similarly to React components.</p>
            </body></html>
          `),
          title: "Vue.js Guide",
          markdown:
            "# Vue.js Guide\n\nComplete guide to Vue.js framework. Vue is another popular JavaScript framework.\n\n## Components\n\nVue components work similarly to React components.",
          frontmatter: { topic: "vue", type: "guide" },
        },
        {
          url:
            "data:text/html," +
            encodeURIComponent(`
            <html><head><title>JavaScript Basics</title></head><body>
              <h1>JavaScript Basics</h1>
              <p>Learn JavaScript fundamentals. JavaScript is the foundation of web development.</p>
              <h2>Variables</h2>
              <p>Variables store data in JavaScript programs.</p>
            </body></html>
          `),
          title: "JavaScript Basics",
          markdown:
            "# JavaScript Basics\n\nLearn JavaScript fundamentals. JavaScript is the foundation of web development.\n\n## Variables\n\nVariables store data in JavaScript programs.",
          frontmatter: { topic: "javascript", type: "basics" },
        },
      ];

      const results = await orchestrator.analyzeContent(pages);

      expect(results).toHaveLength(3);

      // Check that all pages were analyzed
      results.forEach((result) => {
        expect(result.pageType).toBeDefined();
        expect(result.confidence).toBeGreaterThan(0);
        expect(result.contentMetrics).toBeDefined();
        expect(result.qualityScore).toBeGreaterThan(0);
      });

      // Check cross-analysis was performed
      const hasCrossRefs = results.some(
        (result) => result.crossReferences && result.crossReferences.length > 0,
      );
      expect(hasCrossRefs).toBe(true);
    });

    it("should handle content with various structures and formats", async () => {
      const complexHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Complex Article - Data Science</title>
          <meta name="description" content="Comprehensive guide to data science">
        </head>
        <body>
          <article>
            <h1>Data Science: A Comprehensive Guide</h1>
            <p>Data science combines statistics, programming, and domain expertise.</p>
            
            <h2>Table of Contents</h2>
            <ol>
              <li>Introduction to Data Science</li>
              <li>Statistics and Mathematics</li>
              <li>Programming Languages</li>
              <li>Machine Learning</li>
              <li>Data Visualization</li>
            </ol>

            <h2>Statistics and Mathematics</h2>
            <p>Understanding statistical concepts is crucial for data science.</p>
            
            <table>
              <tr>
                <th>Concept</th>
                <th>Importance</th>
              </tr>
              <tr>
                <td>Probability</td>
                <td>High</td>
              </tr>
              <tr>
                <td>Linear Algebra</td>
                <td>High</td>
              </tr>
            </table>

            <h2>Code Example</h2>
            <pre><code class="python">
import pandas as pd
import numpy as np

# Load data
data = pd.read_csv('dataset.csv')
print(data.head())
            </code></pre>

            <blockquote>
              "Data science is about extracting insights from data."
            </blockquote>

            <h2>Conclusion</h2>
            <p>Data science is a rapidly evolving field with many opportunities.</p>
          </article>
        </body>
        </html>
      `;

      const dataUrl = `data:text/html,${encodeURIComponent(complexHtml)}`;

      const extractionResult = await extractor.extract(dataUrl);
      expect(extractionResult.success).toBe(true);

      const page: ExtractedPage = {
        url: dataUrl,
        title: extractionResult.content!.title,
        markdown: extractionResult.content!.markdown,
        frontmatter: {},
      };

      const analysisResults = await orchestrator.analyzeContent([page]);
      expect(analysisResults).toHaveLength(1);

      const analysis = analysisResults[0];
      expect(analysis.contentMetrics).toBeDefined();
      expect(analysis.contentMetrics!.structure).toBeDefined();
      expect(analysis.contentMetrics!.keywords).toBeDefined();
      expect(analysis.sections.length).toBeGreaterThan(0);

      // Verify content was properly extracted and analyzed
      expect(analysis.contentMetrics!.density.wordCount).toBeGreaterThan(50);
      expect(
        analysis.contentMetrics!.readability.fleschReading,
      ).toBeGreaterThan(0);
    });

    it("should handle error cases gracefully", async () => {
      // Test with invalid URL
      const invalidUrl = "invalid-url";

      const extractionResult = await extractor.extract(invalidUrl);
      expect(extractionResult.success).toBe(false);
      expect(extractionResult.error).toBeDefined();

      // Test with empty content
      const emptyPage: ExtractedPage = {
        url: "test://empty",
        title: "",
        markdown: "",
        frontmatter: {},
      };

      const analysisResults = await orchestrator.analyzeContent([emptyPage]);
      expect(analysisResults).toHaveLength(1);

      const analysis = analysisResults[0];
      expect(analysis.pageType).toBeDefined();
      expect(analysis.confidence).toBeGreaterThanOrEqual(0);
      expect(analysis.contentMetrics).toBeDefined();
    });

    it("should maintain performance under load", async () => {
      const pages: ExtractedPage[] = Array.from({ length: 10 }, (_, i) => ({
        url: `test://page-${i}`,
        title: `Test Page ${i}`,
        markdown: `# Page ${i}\n\nThis is test content for page ${i}. It contains some text for analysis purposes. The content includes various elements to test the analysis pipeline.`,
        frontmatter: { index: i, test: true },
      }));

      const startTime = Date.now();
      const results = await orchestrator.analyzeContent(pages);
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(10);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds

      // Verify all pages were processed
      results.forEach((result, index) => {
        expect(result.url).toBe(`test://page-${index}`);
        expect(result.pageType).toBeDefined();
        expect(result.analysisTime).toBeGreaterThan(0);
      });
    });
  });

  describe("Performance and Memory Management", () => {
    it("should not leak memory during batch processing", async () => {
      const initialMemory = process.memoryUsage();

      // Process multiple batches
      for (let batch = 0; batch < 5; batch++) {
        const pages: ExtractedPage[] = Array.from({ length: 10 }, (_, i) => ({
          url: `test://batch-${batch}-page-${i}`,
          title: `Batch ${batch} Page ${i}`,
          markdown: `# Batch ${batch} Page ${i}\n\nContent for testing memory management.`,
          frontmatter: { batch, index: i },
        }));

        const results = await orchestrator.analyzeContent(pages);
        expect(results).toHaveLength(10);

        // Clear cache between batches
        orchestrator.clearCache();
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });
});
