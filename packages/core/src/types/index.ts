// Core types and interfaces shared across the site generator

export interface SiteConfig {
  source: string;
  output: string;
  baseUrl: string;
  title: string;
  description: string;
  theme?: string;
  plugins?: string[];
  build?: {
    minify?: boolean;
    sourcemap?: boolean;
    target?: string;
  };
}

export interface WorkerMessage {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
}

export interface WorkerResponse {
  id: string;
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
  memoryUsage?: NodeJS.MemoryUsage;
}

export interface CacheEntry<T = any> {
  key: string;
  value: T;
  timestamp: number;
  ttl: number;
  size: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  size: number;
  maxSize: number;
  hitRate: number;
}

export interface PerformanceMetrics {
  startTime: number;
  endTime: number;
  duration: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage?: number;
  operations: number;
  throughput: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  value?: any;
  code: string;
}

export interface ParallelTask<T = any, R = any> {
  id: string;
  data: T;
  priority?: number;
  retries?: number;
  timeout?: number;
  execute: (data: T) => Promise<R>;
}

export interface ParallelResult<T = any> {
  success: boolean;
  data?: T;
  error?: Error;
  duration: number;
  taskId: string;
}

export interface ErrorContext {
  operation: string;
  component: string;
  url?: string;
  metadata?: Record<string, any>;
}

export interface ProcessingError extends Error {
  code: string;
  context: ErrorContext;
  timestamp: number;
  retryable: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: number;
  component?: string;
  operation?: string;
  metadata?: Record<string, any>;
  error?: Error;
}

export interface MetricsData {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
  metadata?: Record<string, any>;
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> =
  Pick<T, Exclude<keyof T, Keys>> &
  { [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>> }[Keys];

export type PromiseType<T> = T extends PromiseLike<infer U> ? U : T;

export type Awaited<T> = T extends PromiseLike<infer U> ? U : T;

// Event types for pub/sub pattern
export interface EventHandler<T = any> {
  (event: T): void | Promise<void>;
}

export interface EventBus {
  on<T = any>(event: string, handler: EventHandler<T>): void;
  off<T = any>(event: string, handler: EventHandler<T>): void;
  emit<T = any>(event: string, data: T): void;
  once<T = any>(event: string, handler: EventHandler<T>): void;
}

// Configuration types
export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryableErrors?: string[];
}

export interface ThrottleConfig {
  limit: number;
  interval: number;
  strategy: 'fixed' | 'burst';
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringWindow: number;
  successThreshold: number;
}

// Resource management types
export interface ResourceUsage {
  memory: NodeJS.MemoryUsage;
  cpu: number;
  disk: {
    used: number;
    available: number;
  };
  network: {
    connections: number;
    bandwidth: number;
  };
}

export interface ResourceLimits {
  maxMemory: number;
  maxCpu: number;
  maxConcurrency: number;
  maxFileSize: number;
  maxRequests: number;
}

// Analysis types
export interface ExtractedPage {
  url: string;
  title: string;
  markdown: string;
  html?: string;
  frontmatter: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface PageAnalysis {
  url: string;
  pageType: string;
  confidence: number;
  contentMetrics: Record<string, any>;
  sections: Array<{
    type: string;
    content: string;
    confidence: number;
    metadata?: Record<string, any>;
  }>;
  analysisTime: number;
  metadata: Record<string, any>;
  embeddings?: number[];
  timestamp: number;
}

export interface AnalysisResult {
  success: boolean;
  data?: PageAnalysis;
  error?: string;
  duration: number;
}

export interface AnalysisOptions {
  batchSize: number;
  cacheTTL: number;
  confidenceThreshold: number;
  enableCrossAnalysis: boolean;
  enableEmbeddings: boolean;
  maxWorkers: number;
}

export interface AnalysisProgress {
  completed: number;
  total: number;
  currentUrl?: string;
  estimatedTimeRemaining?: number;
}

export interface WorkerPoolOptions {
  minThreads: number;
  maxThreads: number;
  idleTimeout: number;
  maxQueue: number;
  resourceLimits: ResourceLimits;
}

export interface WorkerStats {
  threadId: number;
  status: 'idle' | 'busy' | 'terminating';
  tasksCompleted: number;
  tasksFailed: number;
  averageTaskTime: number;
  currentTask?: string;
  memoryUsage: NodeJS.MemoryUsage;
  uptime: number;
}

export interface AnalysisWorkerTask {
  id: string;
  page: ExtractedPage;
  context?: {
    relatedPages: ExtractedPage[];
    previousAnalysis?: PageAnalysis;
  };
}

export interface AnalysisWorkerResult {
  success: boolean;
  result?: PageAnalysis;
  error?: string;
  taskId: string;
  duration: number;
}

export interface AnalysisConfig {
  enableParallelProcessing: boolean;
  maxConcurrency: number;
  enableCaching: boolean;
  cacheSize: number;
  enableMetrics: boolean;
  metricsInterval: number;
}

export type MetricType = 'counter' | 'gauge' | 'histogram';
export type AggregationType = 'sum' | 'avg' | 'min' | 'max' | 'count' | 'p50' | 'p95' | 'p99';
export type MetricTags = Record<string, string>;

export interface MetricData {
  name: string;
  value: number;
  type: MetricType;
  tags: MetricTags;
  timestamp: number;
  metadata?: Record<string, any>;
}
