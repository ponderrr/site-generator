# @site-generator/core

Core utilities and shared types for the Site Generator monorepo.

## Overview

This package provides the foundational infrastructure for the Site Generator, including:

- **Caching System**: Advanced LRU cache with TTL support and metrics
- **Worker Pool**: Piscina-based worker thread management with health monitoring
- **Performance Monitoring**: Real-time resource tracking and metrics collection
- **Validation**: Comprehensive input validation using Zod schemas
- **Error Handling**: Circuit breaker patterns and retry logic
- **Logger**: Structured logging with EventEmitter integration
- **Parallel Processing**: Queue management and task distribution

## Installation

```bash
pnpm add @site-generator/core
```

## Usage

### Caching

```typescript
import { EnhancedLRUCache } from '@site-generator/core';

const cache = new EnhancedLRUCache({
  max: 1000,
  ttl: 300000, // 5 minutes
  updateAgeOnGet: true
});

// Store data
cache.set('key', { data: 'value' });

// Retrieve data
const data = cache.get('key');
```

### Worker Pool

```typescript
import { WorkerPool } from '@site-generator/core';

const pool = new WorkerPool({
  filename: './worker.js',
  minThreads: 2,
  maxThreads: 8
});

// Execute task
const result = await pool.run({ task: 'process', data: input });
```

### Performance Monitoring

```typescript
import { PerformanceMonitor } from '@site-generator/core';

const monitor = new PerformanceMonitor();

// Track operation
const operation = monitor.startOperation('extract-content');
// ... do work ...
operation.end();

// Get metrics
const metrics = monitor.getMetrics();
```

### Validation

```typescript
import { validateInput } from '@site-generator/core';

const schema = z.object({
  url: z.string().url(),
  options: z.object({
    timeout: z.number().positive(),
    retries: z.number().min(0).max(5)
  })
});

const result = validateInput(input, schema);
```

## API Reference

### Classes

- `EnhancedLRUCache<T>` - Advanced LRU cache with metrics
- `WorkerPool` - Piscina-based worker thread pool
- `PerformanceMonitor` - Real-time performance tracking
- `ValidationError` - Custom validation error class
- `Logger` - Structured logging utility

### Types

- `CacheMetrics` - Cache performance metrics
- `WorkerStats` - Worker pool statistics
- `PerformanceMetrics` - Performance monitoring data
- `ValidationResult<T>` - Validation operation result

## Configuration

The core package supports various configuration options:

```typescript
interface CoreConfig {
  cache: {
    maxSize: number;
    ttl: number;
    enableMetrics: boolean;
  };
  workers: {
    minThreads: number;
    maxThreads: number;
    idleTimeout: number;
  };
  performance: {
    enableTracking: boolean;
    metricsInterval: number;
  };
}
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

## Architecture

The core package is designed with the following principles:

1. **Performance First**: Optimized for high-throughput processing
2. **Resilient**: Built-in error handling and recovery mechanisms
3. **Observable**: Comprehensive metrics and logging
4. **Modular**: Clean separation of concerns
5. **Type Safe**: Full TypeScript support with strict typing

## Dependencies

- `lru-cache` - Core caching functionality
- `piscina` - Worker thread pool management
- `zod` - Runtime type validation
- `msgpackr` - Efficient serialization
- `p-limit` - Concurrency control
- `xxhashjs` - Fast hashing for cache keys

## License

MIT
