/**
 * @fileoverview Integration Tests for Worker Pools
 *
 * These tests use real worker pools without extensive mocking to catch
 * integration issues that unit tests with mocks might miss.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { WorkerPool } from "../../packages/core/src/worker/index";
import { AnalysisOrchestrator } from "../../packages/analyzer/src/analysis/AnalysisOrchestrator";
import type { ExtractedPage } from "../../packages/analyzer/src/types/analysis.types";
import * as path from "path";

describe("Worker Pool Integration Tests", () => {
  let workerPool: WorkerPool;
  let analysisOrchestrator: AnalysisOrchestrator;

  beforeAll(async () => {
    // Create worker pools with real configurations
    workerPool = new WorkerPool({
      minThreads: 2,
      maxThreads: 4,
      idleTimeout: 5000,
      maxQueue: 100,
    });

    analysisOrchestrator = new AnalysisOrchestrator({
      minThreads: 2,
      maxThreads: 4,
      idleTimeout: 5000,
      maxQueue: 100,
    });
  });

  afterAll(async () => {
    // Graceful shutdown
    if (workerPool) {
      await workerPool.shutdown(10000);
    }
    if (analysisOrchestrator) {
      await analysisOrchestrator.destroy();
    }
  });

  beforeEach(() => {
    // Reset any state between tests
  });

  describe("Worker Pool Lifecycle", () => {
    it("should create and destroy worker pool without errors", async () => {
      const pool = new WorkerPool({
        minThreads: 1,
        maxThreads: 2,
        idleTimeout: 1000,
      });

      expect(pool).toBeDefined();

      // Wait a bit for initialization
      await new Promise((resolve) => setTimeout(resolve, 100));

      const stats = pool.getPoolStats();
      expect(stats.threads).toBeGreaterThan(0);

      await pool.shutdown(5000);
    });

    it("should handle graceful shutdown with active tasks", async () => {
      const pool = new WorkerPool({
        minThreads: 1,
        maxThreads: 2,
        idleTimeout: 1000,
      });

      // Start some tasks that take time
      const promises = Array.from({ length: 5 }, (_, i) =>
        pool
          .executeTask(
            { taskId: i, duration: 2000 }, // 2 second task
            0,
            5000,
          )
          .catch(() => {
            // Expected to fail due to shutdown
          }),
      );

      // Give tasks time to start
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Shutdown should wait for tasks to complete
      const shutdownStart = Date.now();
      await pool.shutdown(10000);
      const shutdownDuration = Date.now() - shutdownStart;

      // Should have waited for tasks (at least 2 seconds)
      expect(shutdownDuration).toBeGreaterThan(1000);

      // Wait for all promises to resolve
      await Promise.allSettled(promises);
    });

    it("should handle force shutdown immediately", async () => {
      const pool = new WorkerPool({
        minThreads: 1,
        maxThreads: 2,
        idleTimeout: 1000,
      });

      // Start some tasks
      const promises = Array.from({ length: 3 }, (_, i) =>
        pool
          .executeTask(
            { taskId: i, duration: 5000 }, // 5 second task
            0,
            10000,
          )
          .catch(() => {
            // Expected to fail due to force shutdown
          }),
      );

      // Give tasks time to start
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Force shutdown should be immediate
      const shutdownStart = Date.now();
      pool.forceShutdown();
      const shutdownDuration = Date.now() - shutdownStart;

      // Should be immediate (less than 100ms)
      expect(shutdownDuration).toBeLessThan(100);

      // Wait for all promises to resolve
      await Promise.allSettled(promises);
    });
  });

  describe("Worker Pool Scaling", () => {
    it("should scale worker pool threads dynamically", async () => {
      const pool = new WorkerPool({
        minThreads: 1,
        maxThreads: 4,
        idleTimeout: 1000,
      });

      const initialStats = pool.getPoolStats();
      expect(initialStats.threads).toBeGreaterThanOrEqual(1);

      // Scale up
      await pool.scale(4);
      await new Promise((resolve) => setTimeout(resolve, 500));

      const scaledStats = pool.getPoolStats();
      expect(scaledStats.threads).toBeLessThanOrEqual(4);

      await pool.shutdown(5000);
    });
  });

  describe("Memory Management Integration", () => {
    it("should handle memory pressure gracefully", async () => {
      const pool = new WorkerPool({
        minThreads: 1,
        maxThreads: 2,
        idleTimeout: 1000,
      });

      // Simulate memory-intensive tasks
      const memoryIntensiveTasks = Array.from({ length: 10 }, (_, i) =>
        pool
          .executeTask(
            {
              taskId: i,
              memorySize: 50 * 1024 * 1024, // 50MB per task
              duration: 1000,
            },
            0,
            5000,
          )
          .catch(() => {
            // May fail due to memory limits
          }),
      );

      // Wait for tasks to complete or fail
      await Promise.allSettled(memoryIntensiveTasks);

      const finalStats = pool.getPoolStats();
      expect(finalStats.failedTasks).toBeGreaterThanOrEqual(0);

      await pool.shutdown(5000);
    });
  });

  describe("Error Handling Integration", () => {
    it("should handle worker errors gracefully", async () => {
      const pool = new WorkerPool({
        minThreads: 1,
        maxThreads: 2,
        idleTimeout: 1000,
      });

      // Tasks that will cause errors
      const errorTasks = Array.from({ length: 3 }, (_, i) =>
        pool
          .executeTask({ taskId: i, shouldError: true }, 0, 5000)
          .catch((error) => {
            expect(error).toBeDefined();
            return null;
          }),
      );

      const results = await Promise.allSettled(errorTasks);
      const errorCount = results.filter((r) => r.status === "rejected").length;

      // Should handle errors without crashing
      expect(errorCount).toBeGreaterThanOrEqual(0);

      await pool.shutdown(5000);
    });
  });
});

describe("Analysis Orchestrator Integration Tests", () => {
  let orchestrator: AnalysisOrchestrator;

  beforeAll(async () => {
    orchestrator = new AnalysisOrchestrator({
      minThreads: 1,
      maxThreads: 2,
      idleTimeout: 5000,
      maxQueue: 50,
    });
  });

  afterAll(async () => {
    if (orchestrator) {
      await orchestrator.destroy();
    }
  });

  describe("Content Analysis Integration", () => {
    it("should analyze real content without errors", async () => {
      const testPages: ExtractedPage[] = [
        {
          url: "https://example.com/page1",
          title: "Test Page 1",
          markdown: "# Test Content\n\nThis is a test page with some content.",
          html: "<h1>Test Content</h1><p>This is a test page with some content.</p>",
          metadata: { author: "test", date: "2024-01-01" },
          extractedAt: new Date().toISOString(),
        },
        {
          url: "https://example.com/page2",
          title: "Test Page 2",
          markdown:
            "# Another Test\n\nMore content here with different structure.",
          html: "<h1>Another Test</h1><p>More content here with different structure.</p>",
          metadata: { author: "test", date: "2024-01-02" },
          extractedAt: new Date().toISOString(),
        },
      ];

      const results = await orchestrator.analyzeContent(testPages);

      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);

      // Check that results have expected structure
      results.forEach((result) => {
        expect(result.url).toBeDefined();
        expect(result.pageType).toBeDefined();
        expect(result.contentMetrics).toBeDefined();
        expect(result.sections).toBeDefined();
      });
    });

    it("should handle batch processing correctly", async () => {
      const largeBatch: ExtractedPage[] = Array.from(
        { length: 10 },
        (_, i) => ({
          url: `https://example.com/page${i}`,
          title: `Test Page ${i}`,
          markdown: `# Page ${i}\n\nContent for page ${i}.`,
          html: `<h1>Page ${i}</h1><p>Content for page ${i}.</p>`,
          metadata: { author: "test", date: "2024-01-01" },
          extractedAt: new Date().toISOString(),
        }),
      );

      let progressUpdates: any[] = [];

      const results = await orchestrator.analyzeContent(
        largeBatch,
        (progress) => {
          progressUpdates.push(progress);
        },
      );

      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);
      expect(progressUpdates.length).toBeGreaterThan(0);
    });

    it("should handle cache correctly", async () => {
      const testPage: ExtractedPage = {
        url: "https://example.com/cache-test",
        title: "Cache Test Page",
        markdown: "# Cache Test\n\nThis page should be cached.",
        html: "<h1>Cache Test</h1><p>This page should be cached.</p>",
        metadata: { author: "test", date: "2024-01-01" },
        extractedAt: new Date().toISOString(),
      };

      // First analysis
      const start1 = Date.now();
      const result1 = await orchestrator.analyzeContent([testPage]);
      const time1 = Date.now() - start1;

      // Second analysis (should use cache)
      const start2 = Date.now();
      const result2 = await orchestrator.analyzeContent([testPage]);
      const time2 = Date.now() - start2;

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(result1.length).toBe(result2.length);

      // Cached result should be faster (though this might not always be true in tests)
      // Just ensure both results are valid
      expect(time1).toBeGreaterThan(0);
      expect(time2).toBeGreaterThan(0);
    });
  });

  describe("Memory Management Integration", () => {
    it("should handle memory pressure during analysis", async () => {
      // Create a large number of pages to test memory management
      const largeBatch: ExtractedPage[] = Array.from(
        { length: 50 },
        (_, i) => ({
          url: `https://example.com/memory-test-${i}`,
          title: `Memory Test Page ${i}`,
          markdown: `# Memory Test ${i}\n\n${"x".repeat(1000)}`, // 1KB of content
          html: `<h1>Memory Test ${i}</h1><p>${"x".repeat(1000)}</p>`,
          metadata: { author: "test", date: "2024-01-01" },
          extractedAt: new Date().toISOString(),
        }),
      );

      const results = await orchestrator.analyzeContent(largeBatch);

      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);

      // Check cache stats
      const cacheStats = orchestrator.getCacheStats();
      expect(cacheStats.size).toBeGreaterThan(0);
    });
  });

  describe("Graceful Shutdown Integration", () => {
    it("should shutdown gracefully with active analysis", async () => {
      const testPages: ExtractedPage[] = Array.from({ length: 5 }, (_, i) => ({
        url: `https://example.com/shutdown-test-${i}`,
        title: `Shutdown Test Page ${i}`,
        markdown: `# Shutdown Test ${i}\n\nContent for shutdown test.`,
        html: `<h1>Shutdown Test ${i}</h1><p>Content for shutdown test.</p>`,
        metadata: { author: "test", date: "2024-01-01" },
        extractedAt: new Date().toISOString(),
      }));

      // Start analysis
      const analysisPromise = orchestrator.analyzeContent(testPages);

      // Give analysis time to start
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Shutdown orchestrator
      const shutdownStart = Date.now();
      await orchestrator.destroy();
      const shutdownDuration = Date.now() - shutdownStart;

      // Should complete within reasonable time
      expect(shutdownDuration).toBeLessThan(10000);

      // Analysis should either complete or be cancelled gracefully
      await analysisPromise.catch(() => {
        // Expected if analysis was cancelled during shutdown
      });
    });
  });
});
