import {
  ParallelTask,
  ParallelResult,
  ResourceLimits,
} from "../types/index.js";

export interface ParallelProcessorOptions {
  maxConcurrency?: number;
  resourceLimits?: ResourceLimits;
  timeout?: number;
  retryAttempts?: number;
}

export class ParallelProcessor {
  private activeTasks: Set<Promise<any>> = new Set();
  private options: Required<ParallelProcessorOptions>;

  constructor(options: ParallelProcessorOptions = {}) {
    this.options = {
      maxConcurrency: 10,
      resourceLimits: {
        maxMemory: 1024 * 1024 * 1024, // 1GB
        maxCpu: 100,
        maxConcurrency: 1000,
        maxFileSize: 100 * 1024 * 1024, // 100MB
        maxRequests: 10000,
      },
      timeout: 30000,
      retryAttempts: 3,
      ...options,
    };
  }

  /**
   * Process tasks in parallel with concurrency control
   */
  async process<T, R>(
    tasks: ParallelTask<T, R>[],
    onProgress?: (completed: number, total: number) => void,
  ): Promise<R[]> {
    const results: R[] = [];
    const batches: ParallelTask<T, R>[][] = [];

    // Create batches based on concurrency limit
    for (let i = 0; i < tasks.length; i += this.options.maxConcurrency) {
      batches.push(tasks.slice(i, i + this.options.maxConcurrency));
    }

    let completed = 0;
    for (const batch of batches) {
      const batchPromises = batch.map((task) => this.executeTask(task));
      const batchResults = await Promise.all(batchPromises);

      results.push(
        ...batchResults.map((r) => r.data).filter((r) => r !== undefined),
      );

      completed += batch.length;
      if (onProgress) {
        onProgress(completed, tasks.length);
      }
    }

    return results;
  }

  /**
   * Execute a single task with retry logic
   */
  private async executeTask<T, R>(
    task: ParallelTask<T, R>,
  ): Promise<ParallelResult<R>> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.options.retryAttempts; attempt++) {
      try {
        const startTime = Date.now();
        const result = await Promise.race([
          task.execute(task.data),
          this.timeout(this.options.timeout),
        ]);

        const duration = Date.now() - startTime;
        return {
          success: true,
          data: result,
          duration,
          taskId: task.id,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < this.options.retryAttempts) {
          // Wait before retry with exponential backoff
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }

    return {
      success: false,
      error: lastError || undefined,
      duration: 0,
      taskId: task.id,
    };
  }

  /**
   * Process tasks with rate limiting
   */
  async processWithRateLimit<T, R>(
    tasks: ParallelTask<T, R>[],
    requestsPerSecond: number,
    onProgress?: (completed: number, total: number) => void,
  ): Promise<R[]> {
    const results: R[] = [];
    const interval = 1000 / requestsPerSecond;

    for (let i = 0; i < tasks.length; i++) {
      const result = await this.executeTask(tasks[i]);
      if (result.success && result.data !== undefined) {
        results.push(result.data);
      }

      if (onProgress) {
        onProgress(i + 1, tasks.length);
      }

      // Rate limiting delay (except for the last task)
      if (i < tasks.length - 1) {
        await this.delay(interval);
      }
    }

    return results;
  }

  /**
   * Get processor statistics
   */
  getStats(): {
    activeTasks: number;
    maxConcurrency: number;
    resourceLimits: ResourceLimits;
  } {
    return {
      activeTasks: this.activeTasks.size,
      maxConcurrency: this.options.maxConcurrency,
      resourceLimits: this.options.resourceLimits,
    };
  }

  /**
   * Check if processor is at capacity
   */
  isAtCapacity(): boolean {
    return this.activeTasks.size >= this.options.maxConcurrency;
  }

  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error(`Operation timed out after ${ms}ms`)),
        ms,
      );
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Default parallel processor instance
export const defaultProcessor = new ParallelProcessor();
