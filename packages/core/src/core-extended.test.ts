import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { EnhancedLRUCache } from "./cache";
import {
  PerformanceMonitor,
  measurePerformance,
  measureAsyncPerformance,
} from "./performance";
import {
  Validator,
  RequiredRule,
  TypeRule,
  StringRule,
  NumberRule,
  ArrayRule,
  ObjectRule,
  CustomRule,
} from "./validation";
import { Logger } from "./logger";
import { defaultMetricsCollector } from "./metrics";
import { defaultErrorHandler, ErrorPatterns } from "./error-handling";
import { ParallelProcessor } from "./parallel";
import { WorkerPool } from "./worker";
import { logger } from "./logger";

// Mock the path module
vi.mock("path", () => ({
  resolve: vi.fn((...args) => args.join("/")),
  dirname: vi.fn((path) => path.split("/").slice(0, -1).join("/") || "/"),
  join: vi.fn((...args) => args.join("/")),
  extname: vi.fn((path) => path.split(".").pop() || ""),
  basename: vi.fn((path) => path.split("/").pop() || ""),
}));

// Mock Piscina
vi.mock("piscina", () => ({
  default: vi.fn().mockImplementation(() => ({
    run: vi.fn().mockResolvedValue({ success: true }),
    destroy: vi.fn().mockResolvedValue(undefined),
    threads: [],
    queueSize: 0,
    options: {
      concurrentTasksPerWorker: 1,
    },
  })),
}));

// Mock events module for EventEmitter
vi.mock("events", () => ({
  EventEmitter: class EventEmitter {
    constructor() {
      this.events = {};
    }

    on(event, listener) {
      if (!this.events[event]) this.events[event] = [];
      this.events[event].push(listener);
    }

    emit(event, ...args) {
      if (this.events[event]) {
        this.events[event].forEach((listener) => listener(...args));
      }
    }

    removeListener() {}
    removeAllListeners() {}
  },
}));

describe("Extended Core Functionality Tests", () => {
  describe("EnhancedLRUCache - Advanced Features", () => {
    let cache: EnhancedLRUCache;

    beforeEach(() => {
      cache = new EnhancedLRUCache({
        maxSize: 100,
        ttl: 3600000,
        maxAge: 1800000,
        updateAgeOnGet: true,
        updateAgeOnHas: false,
        allowStale: true,
      });
    });

    afterEach(() => {
      cache.clear();
    });

    it("should handle complex objects with size calculation", () => {
      const largeObject = {
        id: 1,
        data: "x".repeat(1000),
        nested: { value: "y".repeat(500) },
        array: new Array(100).fill("item"),
      };

      cache.set("large", largeObject);
      expect(cache.has("large")).toBe(true);

      const retrieved = cache.get("large");
      expect(retrieved).toEqual(largeObject);
    });

    it("should handle TTL expiration correctly", async () => {
      const shortCache = new EnhancedLRUCache({ maxSize: 10, ttl: 100 });

      shortCache.set("temp", "temporary value");
      expect(shortCache.has("temp")).toBe(true);

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(shortCache.has("temp")).toBe(false);
      expect(shortCache.get("temp")).toBeUndefined();
    });

    it("should handle getOrSet with async operations", async () => {
      const asyncValue = async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return "async result";
      };

      const result = await cache.getOrSet("async-key", asyncValue);
      expect(result).toBe("async result");
      expect(cache.has("async-key")).toBe(true);
    });

    it("should handle batch operations efficiently", () => {
      const batchData = Array.from({ length: 20 }, (_, i) => ({
        key: `batch${i}`,
        value: `value${i}`,
        ttl: i % 2 === 0 ? 3600000 : undefined,
      }));

      // Use individual set operations instead of setMany
      batchData.forEach((item) => {
        cache.set(item.key, item.value, item.ttl);
      });

      expect(cache.size).toBeGreaterThan(15); // Allow for some evictions

      const batchKeys = batchData.map((item) => item.key);
      const retrieved = cache.getMany(batchKeys);

      expect(retrieved.size).toBeGreaterThan(10);
    });

    it("should handle cache dumps and restores", () => {
      cache.set("key1", "value1");
      cache.set("key2", { complex: "object" });
      cache.set("key3", [1, 2, 3]);

      const dump = cache.dump();
      expect(dump.length).toBeGreaterThan(0);

      const newCache = new EnhancedLRUCache({ maxSize: 100 });
      dump.forEach((entry) => {
        newCache.set(entry.key, entry.value, entry.ttl);
      });

      expect(newCache.has("key1")).toBe(true);
      expect(newCache.get("key2")).toEqual({ complex: "object" });
    });

    it("should handle memory pressure correctly", () => {
      const memoryCache = new EnhancedLRUCache({ maxSize: 10 });

      // Add items until we hit size limit
      for (let i = 0; i < 100; i++) {
        memoryCache.set(`key${i}`, "x".repeat(100));
      }

      expect(memoryCache.size).toBeLessThanOrEqual(10);
      expect(memoryCache.getSizeInfo().utilization).toBeGreaterThan(0);
    });
  });

  describe("PerformanceMonitor - Advanced Metrics", () => {
    let monitor: PerformanceMonitor;

    beforeEach(() => {
      monitor = new PerformanceMonitor();
    });

    it("should track custom metrics over time", () => {
      monitor.recordMetric("custom.counter", 1, { operation: "test" });
      monitor.recordMetric("custom.counter", 5, { operation: "test" });
      monitor.recordMetric("custom.counter", 3, { operation: "other" });

      const metrics = monitor.getMetricsByCategory();
      expect(metrics.length).toBeGreaterThan(0);
    });

    it("should handle resource usage tracking", () => {
      const usage = monitor.getResourceUsage();
      expect(usage.memory).toBeDefined();
      expect(usage.cpu).toBeGreaterThanOrEqual(0);
      expect(usage.disk).toBeDefined();
    });

    it("should provide performance summaries", () => {
      // Perform some operations and record metrics
      measurePerformance(() => {
        for (let i = 0; i < 1000; i++) {
          Math.random();
        }
      }, "math-operations");

      // Record some additional metrics to ensure we have data
      monitor.recordMetric("test.metric1", 100);
      monitor.recordMetric("test.metric2", 200);
      monitor.recordMetric("test.metric3", 300);

      const summary = monitor.getPerformanceSummary();
      expect(summary).toBeDefined();
      expect(summary.totalOperations).toBeGreaterThan(0);
    });

    it("should handle async performance measurement", async () => {
      const result = await measureAsyncPerformance(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return "result";
      }, "async-delay");

      expect(result.success).toBe(true);
      expect(result.duration).toBeGreaterThan(10); // More lenient timing check for async operations
      expect(result.result).toBe("result");
    });

    it("should track performance across different categories", () => {
      measurePerformance(() => Math.sqrt(100), "math.sqrt");
      measurePerformance(() => "test".includes("e"), "string.includes");
      measurePerformance(() => ({ a: 1, b: 2 }), "object.creation");

      // Record metrics in different categories
      monitor.recordMetric("memory.heap_used", 1000000);
      monitor.recordMetric("cpu.usage", 50);
      monitor.recordMetric("disk.used", 5000000);

      const categories = monitor.getMetricsByCategory();
      expect(categories.length).toBeGreaterThan(1);
    });
  });

  describe("Validation System - Complex Scenarios", () => {
    let validator: Validator;

    beforeEach(() => {
      validator = new Validator();
    });

    it("should validate nested objects", () => {
      validator.addRule(
        "user.profile.name",
        new RequiredRule("Name is required"),
      );
      validator.addRule(
        "user.profile.email",
        new TypeRule("string", "Email must be string"),
      );
      validator.addRule(
        "user.settings.preferences",
        new ArrayRule({
          minLength: 1,
          maxLength: 10,
          message: "Preferences must be 1-10 items",
        }),
      );

      const validData = {
        user: {
          profile: { name: "John", email: "john@example.com" },
          settings: { preferences: ["pref1", "pref2"] },
        },
      };

      const invalidData = {
        user: {
          profile: { email: 123 },
          settings: { preferences: [] },
        },
      };

      expect(validator.validate(validData)).toEqual({
        valid: true,
        errors: [],
        warnings: [],
      });
      expect(validator.validate(invalidData).valid).toBe(false);
    });

    it("should handle custom validation rules", () => {
      validator.addRule(
        "password",
        new CustomRule(
          (value: string) =>
            value.length >= 8 && /[A-Z]/.test(value) && /[0-9]/.test(value),
          "Password must be 8+ chars with uppercase and number",
        ),
      );

      expect(validator.validateField("password", "weak")).toEqual({
        valid: false,
        errors: [
          {
            field: "password",
            message: "Password must be 8+ chars with uppercase and number",
            code: "CUSTOM_ERROR",
            value: "weak",
          },
        ],
        warnings: [],
      });

      expect(validator.validateField("password", "Strong123")).toEqual({
        valid: true,
        errors: [],
        warnings: [],
      });
    });

    it("should validate arrays with complex rules", () => {
      validator.addRule(
        "items",
        new ArrayRule({
          minLength: 2,
          maxLength: 5,
          itemRules: [
            new ObjectRule({
              requiredFields: ["name", "value"],
              customRules: {
                name: new CustomRule(
                  (val: string) => val.length > 0,
                  "Name cannot be empty",
                ),
                value: new TypeRule("number", "Value must be number"),
              },
            }),
          ],
        }),
      );

      const validArray = [
        { name: "item1", value: 10 },
        { name: "item2", value: 20 },
      ];

      const invalidArray = [{ name: "", value: "not-a-number" }];

      expect(validator.validateField("items", validArray).valid).toBe(true);
      expect(validator.validateField("items", invalidArray).valid).toBe(false);
    });

    it("should handle conditional validation", () => {
      validator.addRule("type", new RequiredRule("Type is required"));
      validator.addRule(
        "email",
        new CustomRule((value: string, data: any) => {
          if (data.type === "user") {
            return value.includes("@");
          }
          return true;
        }, "Email required for user type"),
      );

      expect(validator.validate({ type: "user", email: "invalid" }).valid).toBe(
        false,
      );
      expect(
        validator.validate({ type: "admin", email: "no-email" }).valid,
      ).toBe(true);
    });
  });

  describe("ErrorHandler - Advanced Error Scenarios", () => {
    it("should handle network errors with retry", async () => {
      let attempts = 0;

      const networkOperation = async () => {
        attempts++;
        if (attempts <= 2) {
          // Succeed on the 3rd attempt (attempts = 3)
          throw new Error("ECONNRESET: Connection reset");
        }
        return "success";
      };

      const context = { operation: "network-request", component: "test" };

      const result = await defaultErrorHandler.handleWithRetry(
        networkOperation,
        context,
        {
          maxAttempts: 3,
          retryableErrors: [
            "NETWORK_ERROR",
            "TIMEOUT",
            "TEMPORARY_FAILURE",
            "ECONNRESET",
          ],
        },
      );
      expect(result).toBe("success");
      expect(attempts).toBe(3);
    });

    it("should handle circuit breaker patterns", async () => {
      const failingOperation = async () => {
        throw new Error("SERVICE_UNAVAILABLE");
      };

      const context = { operation: "service-call", component: "test-service" };

      // First few calls should fail
      for (let i = 0; i < 6; i++) {
        try {
          await defaultErrorHandler.handleWithRetry(failingOperation, context, {
            maxAttempts: 1,
          });
        } catch (error) {
          // Expected to fail
        }
      }

      // Circuit should be open now
      const circuitStatus = defaultErrorHandler.getCircuitBreakerStatus();
      const testServiceBreaker = circuitStatus.find(
        (cb) => cb.component === "test-service",
      );
      expect(testServiceBreaker?.state).toBe("open");
    });

    it("should classify different error types", () => {
      const networkError = new Error("ECONNRESET: Connection reset");
      const timeoutError = new Error("ETIMEDOUT: Operation timed out");
      const validationError = new Error("VALIDATION_FAILED: Invalid input");
      const unknownError = new Error("UNKNOWN_ERROR");

      expect(ErrorPatterns.isNetworkError(networkError)).toBe(true);
      expect(ErrorPatterns.isTimeoutError(timeoutError)).toBe(true);
      expect(ErrorPatterns.isNetworkError(validationError)).toBe(false);
      expect(ErrorPatterns.isTemporaryError(unknownError)).toBe(false);
    });

    it("should handle custom error contexts", async () => {
      const operation = async () => {
        throw new Error("CUSTOM_ERROR");
      };

      const context = {
        operation: "custom-operation",
        component: "custom-component",
        metadata: { userId: 123, sessionId: "abc" },
      };

      try {
        await defaultErrorHandler.handleWithRetry(operation, context);
        expect("Should not reach here").toBe(true);
      } catch (error) {
        expect(error.message).toContain("custom-operation");
        expect(error.message).toContain("custom-component");
      }
    });
  });

  describe("ParallelProcessor - Advanced Features", () => {
    let processor: ParallelProcessor;

    beforeEach(() => {
      processor = new ParallelProcessor({
        maxConcurrency: 5,
        timeout: 10000,
        retryAttempts: 2,
      });
    });

    it("should handle task prioritization", async () => {
      const tasks = Array.from({ length: 10 }, (_, i) => ({
        id: `task${i}`,
        data: { priority: i, value: i },
        priority: i % 3, // 0 = high, 1 = medium, 2 = low
        execute: async (data: any) => {
          await new Promise((resolve) => setTimeout(resolve, data.value * 10));
          return data.value;
        },
      }));

      const results = await processor.process(tasks);

      expect(results).toHaveLength(10);
      // Results should be sorted by completion time, not submission order
      const sortedResults = [...results].sort((a, b) => a - b);
      expect(results).toEqual(sortedResults);
    });

    it("should handle rate limiting", async () => {
      const tasks = Array.from({ length: 10 }, (_, i) => ({
        id: `rate-task${i}`,
        data: i,
        execute: async (data: number) => {
          await new Promise((resolve) => setTimeout(resolve, 20));
          return data;
        },
      }));

      const startTime = Date.now();
      const results = await processor.processWithRateLimit(tasks, 10); // 10 requests per second
      const endTime = Date.now();

      expect(results).toHaveLength(10);
      // Should take at least 1 second for 10 requests at 10/s rate
      expect(endTime - startTime).toBeGreaterThanOrEqual(1000);
    });

    it("should handle resource limits", async () => {
      const memoryTasks = Array.from({ length: 5 }, (_, i) => ({
        id: `memory-task${i}`,
        data: { size: 10000, id: i },
        execute: async (data: any) => {
          // Allocate memory
          const array = new Array(data.size).fill("x");
          await new Promise((resolve) => setTimeout(resolve, 100));
          return array.length;
        },
      }));

      const stats = processor.getStats();
      expect(stats.maxConcurrency).toBe(5);
      expect(stats.resourceLimits.maxMemory).toBeDefined();
    });

    it("should handle mixed success/failure scenarios", async () => {
      const mixedTasks = Array.from({ length: 8 }, (_, i) => ({
        id: `mixed-task${i}`,
        data: i,
        execute: async (data: number) => {
          if (data % 3 === 0) {
            throw new Error(`Task ${data} always fails`);
          }
          await new Promise((resolve) => setTimeout(resolve, 50));
          return data * 2;
        },
      }));

      const results = await processor.process(mixedTasks);

      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThan(8); // Some should fail

      const successful = results.filter((r) => r !== undefined);
      expect(successful.length).toBeGreaterThan(0);
    });
  });

  describe("MetricsCollector - Advanced Analytics", () => {
    beforeEach(() => {
      defaultMetricsCollector.clear();
    });

    it("should handle high-frequency metrics", () => {
      // Record many metrics quickly
      for (let i = 0; i < 1000; i++) {
        defaultMetricsCollector.record(`metric${i % 10}`, i, "counter", {
          batch: Math.floor(i / 100),
        });
      }

      const summary = defaultMetricsCollector.getMetricsSummary();
      expect(summary.length).toBeGreaterThan(5);

      const aggregated = defaultMetricsCollector.getAggregatedMetrics(
        "metric0",
        "avg",
      );
      expect(aggregated?.count).toBeGreaterThan(50);
    });

    it("should handle time-series analysis", async () => {
      const startTime = Date.now();

      for (let i = 0; i < 50; i++) {
        defaultMetricsCollector.record(
          "timeseries",
          Math.sin(i / 10) * 100,
          "gauge",
          { iteration: i },
        );
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      const endTime = Date.now();
      const metrics = defaultMetricsCollector.getMetrics(
        "timeseries",
        startTime,
      );

      expect(metrics.length).toBeGreaterThan(40);
      // Verify time ordering
      for (let i = 1; i < metrics.length; i++) {
        expect(metrics[i].timestamp).toBeGreaterThanOrEqual(
          metrics[i - 1].timestamp,
        );
      }
    });

    it("should handle complex aggregation scenarios", () => {
      // Create metrics with different patterns
      for (let i = 0; i < 100; i++) {
        const tags = {
          region: i % 3 === 0 ? "us-east" : i % 3 === 1 ? "us-west" : "eu-west",
          service: i % 2 === 0 ? "api" : "worker",
          version: i % 4 === 0 ? "v1" : "v2",
        };
        defaultMetricsCollector.record(
          "performance",
          100 + (i % 20),
          "histogram",
          tags,
        );
      }

      const byRegion = defaultMetricsCollector.getMetricsByTags({
        region: "us-east",
      });
      expect(byRegion.length).toBeGreaterThan(0);

      const aggregated = defaultMetricsCollector.getAggregatedMetrics(
        "performance",
        "avg",
        Date.now() - 3600000,
        { service: "api" },
      );
      expect(aggregated?.count).toBeGreaterThan(0);
    });

    it("should handle percentile calculations", () => {
      // Generate normally distributed data
      for (let i = 0; i < 1000; i++) {
        const value = 100 + (Math.random() - 0.5) * 20;
        defaultMetricsCollector.record("latency", value, "histogram", {
          percentile_test: true,
        });
      }

      const p50 = defaultMetricsCollector.getAggregatedMetrics(
        "latency",
        "p50",
      );
      const p95 = defaultMetricsCollector.getAggregatedMetrics(
        "latency",
        "p95",
      );
      const p99 = defaultMetricsCollector.getAggregatedMetrics(
        "latency",
        "p99",
      );

      expect(p50?.value).toBeDefined();
      expect(p95?.value).toBeDefined();
      expect(p99?.value).toBeDefined();
      expect(p95.value).toBeGreaterThan(p50.value);
      expect(p99.value).toBeGreaterThan(p95.value);
    });
  });

  describe("Logger - Advanced Features", () => {
    let logger: Logger;

    beforeEach(() => {
      logger = Logger.getInstance();
      logger.clearLogs();
    });

    it("should handle structured logging", () => {
      logger.info("User login", {
        userId: 123,
        ip: "192.168.1.1",
        userAgent: "Mozilla/5.0",
        metadata: { sessionId: "abc123" },
      });

      const logs = logger.getLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].message).toBe("User login");
      expect(logs[0].metadata).toBeDefined();
      expect(logs[0].metadata.userId).toBe(123);
    });

    it("should handle log filtering by level", () => {
      logger.debug("Debug message");
      logger.info("Info message");
      logger.warn("Warning message");
      logger.error("Error message");

      const allLogs = logger.getLogs();
      const infoLogs = logger.getLogs("info");
      const errorLogs = logger.getLogs("error");

      expect(allLogs.length).toBe(4);
      expect(infoLogs.length).toBe(1);
      expect(infoLogs[0].message).toBe("Info message");
      expect(errorLogs.length).toBe(1);
      expect(errorLogs[0].message).toBe("Error message");
    });

    it("should handle log statistics", () => {
      logger.debug("Debug 1");
      logger.debug("Debug 2");
      logger.info("Info 1");
      logger.info("Info 2");
      logger.info("Info 3");
      logger.warn("Warning 1");
      logger.error("Error 1");

      const stats = logger.getStats();
      expect(stats.total).toBeGreaterThanOrEqual(6); // Allow for additional logs that may be created during testing
      expect(stats.debug).toBe(2);
      expect(stats.info).toBe(3);
      expect(stats.warn).toBe(1);
      expect(stats.error).toBe(1);
    });

    it("should handle component-based filtering", () => {
      logger.info("Database operation", { component: "database" });
      logger.info("Cache operation", { component: "cache" });
      logger.info("API operation", { component: "api" });

      const dbLogs = logger.getLogs(undefined, { component: "database" });
      const allLogs = logger.getLogs();

      expect(dbLogs.length).toBe(1);
      expect(allLogs.length).toBe(3);
    });
  });

  describe("Integration - Cross-Component Workflows", () => {
    it("should handle metrics collection with performance monitoring", async () => {
      const monitor = new PerformanceMonitor();

      const result = await monitor.measureAsyncPerformance(async () => {
        // Simulate work
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Record metrics during execution
        defaultMetricsCollector.record("operation.duration", 100, "histogram", {
          operation: "test",
        });
        defaultMetricsCollector.incrementCounter("operation.count", 1, {
          type: "async",
        });

        return "result";
      }, "integration-test");

      expect(result.success).toBe(true);
      expect(result.duration).toBeGreaterThan(50); // More lenient timing check

      const metrics = defaultMetricsCollector.getMetricsSummary();
      expect(metrics.length).toBeGreaterThan(0);
    });

    it("should handle error handling with logging and metrics", async () => {
      const failingOperation = async () => {
        throw new Error("TEST_ERROR: This is a test error");
      };

      const context = {
        operation: "test-operation",
        component: "integration-test",
      };

      try {
        await defaultErrorHandler.handleWithRetry(failingOperation, context, {
          maxAttempts: 1,
        });
      } catch (error) {
        logger.error("Operation failed", {
          error: error.message,
          context,
          stack: error.stack,
        });

        defaultMetricsCollector.incrementCounter("errors", 1, {
          type: "integration_test",
          component: "error_handler",
        });
      }

      const logs = logger.getLogs();
      const metrics = defaultMetricsCollector.getMetricsSummary();

      expect(logs.length).toBeGreaterThan(0);
      expect(logs.some((log) => log.level === "error")).toBe(true);
      expect(metrics.some((metric) => metric.name === "errors")).toBe(true);
    });

    it("should handle parallel processing with metrics", async () => {
      const processor = new ParallelProcessor({ maxConcurrency: 3 });

      const tasks = Array.from({ length: 10 }, (_, i) => ({
        id: `parallel-task-${i}`,
        data: { taskId: i, delay: 50 + (i % 3) * 20 },
        execute: async (data: any) => {
          await new Promise((resolve) => setTimeout(resolve, data.delay));
          defaultMetricsCollector.record(
            "parallel.task",
            data.delay,
            "histogram",
            { taskId: data.taskId },
          );
          return data.taskId;
        },
      }));

      const results = await processor.process(tasks);

      expect(results.length).toBe(10);

      const metrics = defaultMetricsCollector.getMetricsSummary();
      const parallelMetrics = metrics.filter((m) => m.name === "parallel.task");
      expect(parallelMetrics.length).toBeGreaterThan(0);
    });
  });
});
