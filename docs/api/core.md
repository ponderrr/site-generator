# Core Package API Reference

## Overview

The `@site-generator/core` package provides the foundational infrastructure for the Site Generator, including caching, worker management, performance monitoring, and validation utilities.

## Classes

### EnhancedLRUCache

Advanced LRU cache with TTL support and comprehensive metrics.

```typescript
import { EnhancedLRUCache } from "@site-generator/core";

const cache = new EnhancedLRUCache<string, any>({
  max: 1000,
  ttl: 300000, // 5 minutes
  updateAgeOnGet: true,
  allowStale: false,
  maxAge: 600000, // 10 minutes maximum age
});
```

#### Constructor Options

```typescript
interface CacheOptions<T> {
  max?: number; // Maximum number of items
  ttl?: number; // Time to live in milliseconds
  updateAgeOnGet?: boolean; // Update age on get operations
  allowStale?: boolean; // Allow stale items to be returned
  maxAge?: number; // Maximum age in milliseconds
  dispose?: (key: string, value: T) => void; // Cleanup function
}
```

#### Methods

##### `set(key: string, value: T, ttl?: number): boolean`

Store a value in the cache with optional TTL override.

```typescript
cache.set("user:123", { name: "John", email: "john@example.com" });
cache.set("temp:data", data, 60000); // 1 minute TTL
```

##### `get(key: string): T | undefined`

Retrieve a value from the cache.

```typescript
const user = cache.get("user:123");
if (user) {
  console.log(user.name);
}
```

##### `has(key: string): boolean`

Check if a key exists in the cache.

```typescript
if (cache.has("user:123")) {
  // Key exists
}
```

##### `delete(key: string): boolean`

Remove a key from the cache.

```typescript
cache.delete("user:123");
```

##### `clear(): void`

Clear all items from the cache.

```typescript
cache.clear();
```

##### `getMetrics(): CacheMetrics`

Get comprehensive cache performance metrics.

```typescript
const metrics = cache.getMetrics();
console.log(`Hit rate: ${metrics.hitRate}%`);
console.log(`Total operations: ${metrics.totalOperations}`);
```

#### Cache Metrics

```typescript
interface CacheMetrics {
  size: number; // Current cache size
  max: number; // Maximum cache size
  hitCount: number; // Number of cache hits
  missCount: number; // Number of cache misses
  hitRate: number; // Hit rate percentage
  missRate: number; // Miss rate percentage
  totalOperations: number; // Total get/set operations
  evictionCount: number; // Number of evictions
  averageAge: number; // Average item age
  oldestItem: number; // Age of oldest item
}
```

### WorkerPool

Piscina-based worker thread pool with health monitoring.

```typescript
import { WorkerPool } from "@site-generator/core";

const pool = new WorkerPool({
  filename: "./worker.js",
  minThreads: 2,
  maxThreads: 8,
  idleTimeout: 30000,
  maxQueue: 100,
});
```

#### Constructor Options

```typescript
interface WorkerPoolOptions {
  filename: string; // Worker script path
  minThreads?: number; // Minimum thread count
  maxThreads?: number; // Maximum thread count
  idleTimeout?: number; // Idle timeout in milliseconds
  maxQueue?: number; // Maximum queue size
  name?: string; // Pool name for debugging
}
```

#### Methods

##### `run<T>(task: any, transferList?: Transferable[]): Promise<T>`

Execute a task in the worker pool.

```typescript
const result = await pool.run({
  type: "processContent",
  data: { url: "https://example.com", content: "..." },
});
```

##### `runTask<T>(task: any, transferList?: Transferable[]): Promise<T>`

Alias for `run()` method.

##### `destroy(): Promise<void>`

Destroy the worker pool and all threads.

```typescript
await pool.destroy();
```

##### `getStats(): WorkerStats`

Get worker pool statistics.

```typescript
const stats = pool.getStats();
console.log(`Active workers: ${stats.activeWorkers}`);
console.log(`Queue size: ${stats.queueSize}`);
```

#### Worker Statistics

```typescript
interface WorkerStats {
  totalTasks: number; // Total tasks processed
  completedTasks: number; // Successfully completed tasks
  failedTasks: number; // Failed tasks
  activeWorkers: number; // Currently active workers
  idleWorkers: number; // Idle workers
  queueSize: number; // Current queue size
  averageTaskTime: number; // Average task execution time
  uptime: number; // Pool uptime in milliseconds
}
```

### PerformanceMonitor

Real-time performance monitoring and metrics collection.

```typescript
import { PerformanceMonitor } from "@site-generator/core";

const monitor = new PerformanceMonitor({
  enableTracking: true,
  metricsInterval: 5000,
  maxHistory: 100,
});
```

#### Constructor Options

```typescript
interface PerformanceMonitorOptions {
  enableTracking?: boolean; // Enable automatic tracking
  metricsInterval?: number; // Metrics collection interval
  maxHistory?: number; // Maximum history entries
  enableMemoryTracking?: boolean; // Enable memory tracking
  enableCPUTracking?: boolean; // Enable CPU tracking
}
```

#### Methods

##### `startOperation(name: string): PerformanceOperation`

Start timing an operation.

```typescript
const operation = monitor.startOperation("extractContent");
// ... do work ...
operation.end();
```

##### `measure<T>(name: string, fn: () => T): T`

Measure the execution time of a function.

```typescript
const result = monitor.measure("processData", () => {
  return processLargeDataset(data);
});
```

##### `measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T>`

Measure the execution time of an async function.

```typescript
const result = await monitor.measureAsync("fetchData", async () => {
  return await fetchFromAPI(url);
});
```

##### `getMetrics(): PerformanceMetrics`

Get comprehensive performance metrics.

```typescript
const metrics = monitor.getMetrics();
console.log(`Memory usage: ${metrics.memory.used}MB`);
console.log(`CPU usage: ${metrics.cpu.usage}%`);
```

##### `getOperationMetrics(name: string): OperationMetrics`

Get metrics for a specific operation.

```typescript
const opMetrics = monitor.getOperationMetrics("extractContent");
console.log(`Average time: ${opMetrics.averageTime}ms`);
console.log(`Total calls: ${opMetrics.totalCalls}`);
```

#### Performance Metrics

```typescript
interface PerformanceMetrics {
  memory: {
    used: number; // Used memory in MB
    total: number; // Total memory in MB
    percentage: number; // Memory usage percentage
  };
  cpu: {
    usage: number; // CPU usage percentage
    cores: number; // Number of CPU cores
  };
  operations: Record<string, OperationMetrics>;
  uptime: number; // Monitor uptime in milliseconds
  timestamp: number; // Last update timestamp
}

interface OperationMetrics {
  totalCalls: number; // Total number of calls
  totalTime: number; // Total execution time
  averageTime: number; // Average execution time
  minTime: number; // Minimum execution time
  maxTime: number; // Maximum execution time
  p50: number; // 50th percentile
  p95: number; // 95th percentile
  p99: number; // 99th percentile
}
```

### Logger

Structured logging with EventEmitter integration.

```typescript
import { Logger } from "@site-generator/core";

const logger = new Logger({
  level: "info",
  format: "json",
  enableColors: true,
});
```

#### Constructor Options

```typescript
interface LoggerOptions {
  level?: LogLevel; // Log level
  format?: "json" | "text"; // Log format
  enableColors?: boolean; // Enable colored output
  timestamp?: boolean; // Include timestamps
  context?: Record<string, any>; // Default context
}
```

#### Methods

##### `debug(message: string, context?: object): void`

Log debug message.

```typescript
logger.debug("Processing started", { userId: 123, task: "extract" });
```

##### `info(message: string, context?: object): void`

Log info message.

```typescript
logger.info("Task completed successfully", { duration: 1500 });
```

##### `warn(message: string, context?: object): void`

Log warning message.

```typescript
logger.warn("High memory usage detected", { usage: "85%" });
```

##### `error(message: string, error?: Error, context?: object): void`

Log error message.

```typescript
logger.error("Task failed", error, { taskId: "task-123" });
```

##### `fatal(message: string, error?: Error, context?: object): void`

Log fatal error message.

```typescript
logger.fatal("System error", error, { component: "worker" });
```

## Validation Utilities

### validateInput

Runtime input validation using Zod schemas.

```typescript
import { validateInput } from "@site-generator/core";
import { z } from "zod";

const schema = z.object({
  url: z.string().url(),
  options: z.object({
    timeout: z.number().positive(),
    retries: z.number().min(0).max(5),
  }),
});

const result = validateInput(input, schema);
if (!result.success) {
  console.error("Validation failed:", result.errors);
}
```

### ValidationResult

```typescript
interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
}

interface ValidationError {
  path: string; // Error path
  message: string; // Error message
  code: string; // Error code
  value?: any; // Invalid value
}
```

## Error Handling

### ValidationError

Custom error class for validation failures.

```typescript
import { ValidationError } from "@site-generator/core";

throw new ValidationError("Invalid input", {
  field: "url",
  value: "invalid-url",
  expected: "valid URL",
});
```

### Circuit Breaker

Automatic failure detection and recovery.

```typescript
import { CircuitBreaker } from "@site-generator/core";

const breaker = new CircuitBreaker({
  failureThreshold: 5,
  recoveryTimeout: 30000,
  monitoringPeriod: 60000,
});

const result = await breaker.execute(async () => {
  return await riskyOperation();
});
```

## Types

### Common Types

```typescript
type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

interface BaseConfig {
  cache: CacheConfig;
  workers: WorkerConfig;
  performance: PerformanceConfig;
  logging: LoggingConfig;
}

interface CacheConfig {
  maxSize: number;
  ttl: number;
  enableMetrics: boolean;
}

interface WorkerConfig {
  minThreads: number;
  maxThreads: number;
  idleTimeout: number;
}

interface PerformanceConfig {
  enableTracking: boolean;
  metricsInterval: number;
}

interface LoggingConfig {
  level: LogLevel;
  format: "json" | "text";
  enableColors: boolean;
}
```

## Usage Examples

### Complete Setup

```typescript
import {
  EnhancedLRUCache,
  WorkerPool,
  PerformanceMonitor,
  Logger,
  validateInput,
} from "@site-generator/core";

// Initialize core components
const cache = new EnhancedLRUCache({ max: 1000, ttl: 300000 });
const pool = new WorkerPool({ filename: "./worker.js", maxThreads: 8 });
const monitor = new PerformanceMonitor({ enableTracking: true });
const logger = new Logger({ level: "info" });

// Use in application
async function processContent(url: string) {
  // Check cache first
  const cached = cache.get(url);
  if (cached) {
    logger.debug("Cache hit", { url });
    return cached;
  }

  // Process with monitoring
  const operation = monitor.startOperation("processContent");
  try {
    const result = await pool.run({ type: "extract", url });
    cache.set(url, result);
    operation.end();
    logger.info("Content processed", { url, duration: operation.duration });
    return result;
  } catch (error) {
    operation.end();
    logger.error("Processing failed", error, { url });
    throw error;
  }
}
```

This comprehensive API reference covers all the major functionality provided by the core package. Each component is designed to work together to provide a robust foundation for high-performance content processing.
