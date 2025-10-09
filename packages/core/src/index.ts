// Core utilities and shared types for the site generator
export * from "./types/index.js";
export * from "./cache/index.js";
export * from "./worker/index.js";
export * from "./performance/index.js";
export * from "./validation/index.js";
export * from "./parallel/index.js";
export * from "./error-handling/index.js";
export * from "./metrics/index.js";
export * from "./logger/index.js";
export * from "./health/index.js";
export * from "./rate-limiting/index.js";

// Re-export specific items to resolve conflicts
export {
  WorkerPool,
  defaultWorkerPool,
  analysisWorkerPool,
  extractionWorkerPool,
  generationWorkerPool,
} from "./worker/index.js";
export type { WorkerPoolOptions, WorkerStats } from "./worker/index.js";
export { EnhancedLRUCache } from "./cache/index.js";
export type { CacheOptions, CacheEntry, CacheStats } from "./cache/index.js";
export {
  PerformanceMonitor,
  measurePerformance,
  measureAsyncPerformance,
} from "./performance/index.js";
export {
  Validator,
  RequiredRule,
  TypeRule,
  StringRule,
  NumberRule,
  ArrayRule,
  ObjectRule,
  CustomRule,
  URLValidator,
  EmailValidator,
  ConfigValidator,
} from "./validation/index.js";
export {
  ZodValidator,
  CommonSchemas,
  zodURLValidator,
  zodEmailValidator,
  zodConfigValidator,
  ValidationMigrationHelper,
} from "./validation/index.js";
export { ParallelProcessor } from "./parallel/index.js";
export type { ParallelProcessorOptions } from "./parallel/index.js";
export { ErrorHandler, defaultErrorHandler } from "./error-handling/index.js";
export type { ErrorPatterns } from "./error-handling/index.js";
export {
  MetricsCollector,
  defaultMetricsCollector,
  MetricsUtils,
} from "./metrics/index.js";
export { Logger, logger } from "./logger/index.js";
export {
  HealthCheckManager,
  healthCheckManager,
  createHealthCheckMiddleware,
  HealthCheckServer,
  startHealthCheckServer,
} from "./health/index.js";
export type {
  HealthStatus,
  HealthCheck,
  HealthCheckOptions,
} from "./health/index.js";
export {
  RateLimiter,
  TokenBucket,
  SlidingWindow,
  apiRateLimiter,
  networkRateLimiter,
  analysisRateLimiter,
  RateLimitError,
} from "./rate-limiting/index.js";
export type {
  RateLimitOptions,
  RateLimitStats,
  RateLimitResult,
} from "./rate-limiting/index.js";
