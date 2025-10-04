/**
 * @fileoverview Rate Limiting System
 * 
 * Provides rate limiting for external API calls and network requests
 * to prevent API rate limit violations and control resource usage.
 */

import { EventEmitter } from 'events';

export interface RateLimitOptions {
  requestsPerSecond?: number;
  requestsPerMinute?: number;
  requestsPerHour?: number;
  maxConcurrent?: number;
  burstLimit?: number;
  windowMs?: number;
  keyGenerator?: (context: any) => string;
}

export interface RateLimitStats {
  totalRequests: number;
  allowedRequests: number;
  blockedRequests: number;
  currentConcurrency: number;
  averageResponseTime: number;
  lastResetTime: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  reason?: string;
}

/**
 * Token bucket rate limiter
 */
export class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  private readonly capacity: number;
  private readonly refillRate: number; // tokens per second
  private readonly windowMs: number;

  constructor(capacity: number, refillRate: number, windowMs: number = 1000) {
    this.capacity = capacity;
    this.refillRate = refillRate;
    this.windowMs = windowMs;
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  /**
   * Try to consume tokens
   */
  tryConsume(tokens: number = 1): boolean {
    this.refill();
    
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    
    return false;
  }

  /**
   * Get remaining tokens
   */
  getRemaining(): number {
    this.refill();
    return this.tokens;
  }

  /**
   * Get time until next token is available
   */
  getTimeUntilRefill(): number {
    this.refill();
    
    if (this.tokens >= 1) {
      return 0;
    }
    
    return Math.ceil((1 - this.tokens) / this.refillRate * 1000);
  }

  /**
   * Refill tokens based on time elapsed
   */
  private refill(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    const tokensToAdd = timePassed * this.refillRate;
    
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
}

/**
 * Sliding window rate limiter
 */
export class SlidingWindow {
  private requests: number[] = [];
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Try to make a request
   */
  tryRequest(): boolean {
    const now = Date.now();
    
    // Remove old requests outside the window
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return true;
    }
    
    return false;
  }

  /**
   * Get remaining requests in current window
   */
  getRemaining(): number {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    return Math.max(0, this.maxRequests - this.requests.length);
  }

  /**
   * Get time until window resets
   */
  getTimeUntilReset(): number {
    if (this.requests.length === 0) {
      return 0;
    }
    
    const oldestRequest = Math.min(...this.requests);
    return Math.max(0, this.windowMs - (Date.now() - oldestRequest));
  }
}

/**
 * Rate Limiter with multiple strategies
 */
export class RateLimiter extends EventEmitter {
  private buckets: Map<string, TokenBucket> = new Map();
  private windows: Map<string, SlidingWindow> = new Map();
  private concurrencyLimits: Map<string, number> = new Map();
  private currentConcurrency: Map<string, number> = new Map();
  private stats: Map<string, RateLimitStats> = new Map();
  private burstLimits: Map<string, number> = new Map();

  constructor(private defaultOptions: RateLimitOptions = {}) {
    super();
    
    // Set defaults
    this.defaultOptions = {
      requestsPerSecond: 10,
      requestsPerMinute: 600,
      requestsPerHour: 36000,
      maxConcurrent: 5,
      burstLimit: 20,
      windowMs: 1000,
      keyGenerator: () => 'default',
      ...defaultOptions
    };
  }

  /**
   * Execute a function with rate limiting
   */
  async execute<T>(
    fn: () => Promise<T>,
    context?: any,
    options?: Partial<RateLimitOptions>
  ): Promise<T> {
    const key = this.getKey(context, options);
    const opts = { ...this.defaultOptions, ...options };
    
    // Check if request is allowed
    const result = this.checkLimit(key, opts);
    
    if (!result.allowed) {
      this.emit('rate-limited', { key, result, context });
      throw new RateLimitError(result.reason || 'Rate limit exceeded', result.retryAfter);
    }

    // Wait for concurrency slot if needed
    await this.waitForConcurrencySlot(key, opts);

    const startTime = Date.now();
    let success = false;

    try {
      // Update concurrency
      this.incrementConcurrency(key);
      
      // Execute the function
      const result = await fn();
      success = true;
      
      // Update stats
      this.updateStats(key, Date.now() - startTime, true);
      
      this.emit('request-completed', { key, duration: Date.now() - startTime, success: true });
      
      return result;

    } catch (error) {
      this.updateStats(key, Date.now() - startTime, false);
      this.emit('request-failed', { key, duration: Date.now() - startTime, error });
      throw error;
      
    } finally {
      // Decrement concurrency
      this.decrementConcurrency(key);
    }
  }

  /**
   * Check if a request is allowed
   */
  checkLimit(key: string, options: RateLimitOptions): RateLimitResult {
    const now = Date.now();
    
    // Check burst limit
    if (options.burstLimit) {
      const burstWindow = this.getOrCreateBurstWindow(key, options.burstLimit);
      if (!burstWindow.tryRequest()) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: now + burstWindow.getTimeUntilReset(),
          retryAfter: burstWindow.getTimeUntilReset(),
          reason: 'Burst limit exceeded'
        };
      }
    }

    // Check per-second limit
    if (options.requestsPerSecond) {
      const bucket = this.getOrCreateBucket(key, 'second', options.requestsPerSecond, 1);
      if (!bucket.tryConsume()) {
        return {
          allowed: false,
          remaining: bucket.getRemaining(),
          resetTime: now + bucket.getTimeUntilRefill(),
          retryAfter: bucket.getTimeUntilRefill(),
          reason: 'Per-second limit exceeded'
        };
      }
    }

    // Check per-minute limit
    if (options.requestsPerMinute) {
      const bucket = this.getOrCreateBucket(key, 'minute', options.requestsPerMinute, 60);
      if (!bucket.tryConsume()) {
        return {
          allowed: false,
          remaining: bucket.getRemaining(),
          resetTime: now + bucket.getTimeUntilRefill(),
          retryAfter: bucket.getTimeUntilRefill(),
          reason: 'Per-minute limit exceeded'
        };
      }
    }

    // Check per-hour limit
    if (options.requestsPerHour) {
      const bucket = this.getOrCreateBucket(key, 'hour', options.requestsPerHour, 3600);
      if (!bucket.tryConsume()) {
        return {
          allowed: false,
          remaining: bucket.getRemaining(),
          resetTime: now + bucket.getTimeUntilRefill(),
          retryAfter: bucket.getTimeUntilRefill(),
          reason: 'Per-hour limit exceeded'
        };
      }
    }

    // Check concurrency limit
    const currentConcurrency = this.currentConcurrency.get(key) || 0;
    if (options.maxConcurrent && currentConcurrency >= options.maxConcurrent) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: now,
        reason: 'Concurrency limit exceeded'
      };
    }

    return {
      allowed: true,
      remaining: this.getRemainingRequests(key, options),
      resetTime: now
    };
  }

  /**
   * Wait for a concurrency slot to become available
   */
  private async waitForConcurrencySlot(key: string, options: RateLimitOptions): Promise<void> {
    if (!options.maxConcurrent) {
      return;
    }

    const maxWait = 30000; // 30 seconds max wait
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      const current = this.currentConcurrency.get(key) || 0;
      
      if (current < options.maxConcurrent) {
        return;
      }

      // Wait a bit before checking again
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    throw new Error('Concurrency slot timeout');
  }

  /**
   * Get or create a token bucket
   */
  private getOrCreateBucket(key: string, period: string, capacity: number, windowSeconds: number): TokenBucket {
    const bucketKey = `${key}:${period}`;
    
    if (!this.buckets.has(bucketKey)) {
      const refillRate = capacity / windowSeconds;
      this.buckets.set(bucketKey, new TokenBucket(capacity, refillRate, windowSeconds * 1000));
    }
    
    return this.buckets.get(bucketKey)!;
  }

  /**
   * Get or create a burst window
   */
  private getOrCreateBurstWindow(key: string, maxRequests: number): SlidingWindow {
    const burstKey = `${key}:burst`;
    
    if (!this.windows.has(burstKey)) {
      this.windows.set(burstKey, new SlidingWindow(maxRequests, 1000)); // 1 second burst window
    }
    
    return this.windows.get(burstKey)!;
  }

  /**
   * Get key for rate limiting
   */
  private getKey(context: any, options?: Partial<RateLimitOptions>): string {
    const keyGenerator = options?.keyGenerator || this.defaultOptions.keyGenerator;
    return keyGenerator!(context);
  }

  /**
   * Increment concurrency counter
   */
  private incrementConcurrency(key: string): void {
    const current = this.currentConcurrency.get(key) || 0;
    this.currentConcurrency.set(key, current + 1);
  }

  /**
   * Decrement concurrency counter
   */
  private decrementConcurrency(key: string): void {
    const current = this.currentConcurrency.get(key) || 0;
    this.currentConcurrency.set(key, Math.max(0, current - 1));
  }

  /**
   * Update statistics
   */
  private updateStats(key: string, duration: number, success: boolean): void {
    const stats = this.stats.get(key) || {
      totalRequests: 0,
      allowedRequests: 0,
      blockedRequests: 0,
      currentConcurrency: 0,
      averageResponseTime: 0,
      lastResetTime: Date.now()
    };

    stats.totalRequests++;
    
    if (success) {
      stats.allowedRequests++;
    } else {
      stats.blockedRequests++;
    }

    stats.currentConcurrency = this.currentConcurrency.get(key) || 0;
    
    // Update average response time
    stats.averageResponseTime = (stats.averageResponseTime * (stats.totalRequests - 1) + duration) / stats.totalRequests;

    this.stats.set(key, stats);
  }

  /**
   * Get remaining requests for a key
   */
  private getRemainingRequests(key: string, options: RateLimitOptions): number {
    // Return the minimum remaining across all limits
    const remainings: number[] = [];

    if (options.requestsPerSecond) {
      const bucket = this.getOrCreateBucket(key, 'second', options.requestsPerSecond, 1);
      remainings.push(bucket.getRemaining());
    }

    if (options.requestsPerMinute) {
      const bucket = this.getOrCreateBucket(key, 'minute', options.requestsPerMinute, 60);
      remainings.push(bucket.getRemaining());
    }

    if (options.requestsPerHour) {
      const bucket = this.getOrCreateBucket(key, 'hour', options.requestsPerHour, 3600);
      remainings.push(bucket.getRemaining());
    }

    return remainings.length > 0 ? Math.min(...remainings) : 0;
  }

  /**
   * Get statistics for a key
   */
  getStats(key: string): RateLimitStats | undefined {
    return this.stats.get(key);
  }

  /**
   * Get all statistics
   */
  getAllStats(): Map<string, RateLimitStats> {
    return new Map(this.stats);
  }

  /**
   * Reset statistics for a key
   */
  resetStats(key: string): void {
    this.stats.delete(key);
  }

  /**
   * Reset all statistics
   */
  resetAllStats(): void {
    this.stats.clear();
  }

  /**
   * Cleanup old buckets and windows
   */
  cleanup(): void {
    // This could be implemented to remove old, unused buckets
    // For now, we keep them for simplicity
  }
}

/**
 * Rate limit error
 */
export class RateLimitError extends Error {
  constructor(
    message: string,
    public retryAfter?: number
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

/**
 * Default rate limiter instances for common use cases
 */
export const apiRateLimiter = new RateLimiter({
  requestsPerSecond: 5,
  requestsPerMinute: 300,
  maxConcurrent: 3,
  burstLimit: 10
});

export const networkRateLimiter = new RateLimiter({
  requestsPerSecond: 10,
  requestsPerMinute: 600,
  maxConcurrent: 5,
  burstLimit: 20
});

export const analysisRateLimiter = new RateLimiter({
  requestsPerSecond: 2,
  requestsPerMinute: 120,
  maxConcurrent: 2,
  burstLimit: 5
});
