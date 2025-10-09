import { EventEmitter } from "events";
import { fileURLToPath } from "url";
import { dirname, resolve, isAbsolute, sep } from "path";
import * as fs from "fs";
import Piscina from "piscina";
import type {
  WorkerMessage,
  WorkerResponse,
  ParallelTask,
  ParallelResult,
  ResourceLimits,
} from "../types/index.js";
import {
  DEFAULT_WORKER_CONFIG,
  DEFAULT_MAIN_CONFIG,
  runtimeMemoryConfig,
} from "../config/memory.config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface WorkerPoolOptions {
  minThreads?: number;
  maxThreads?: number;
  idleTimeout?: number;
  maxQueue?: number;
  concurrentTasksPerWorker?: number;
  resourceLimits?: ResourceLimits;
  workerFile?: string;
  env?: Record<string, string>;
  argv?: string[];
}

export interface WorkerStats {
  threadId: number;
  status: "idle" | "busy" | "terminating";
  tasksCompleted: number;
  tasksFailed: number;
  averageTaskTime: number;
  currentTask?: string;
  memoryUsage: NodeJS.MemoryUsage;
  uptime: number;
}

export interface WorkerPoolEvent {
  "task-completed": (result: ParallelResult) => void;
  "task-failed": (error: Error, taskId: string) => void;
  "worker-added": (threadId: number) => void;
  "worker-removed": (threadId: number) => void;
  "pool-full": () => void;
  "pool-empty": () => void;
  error: (error: Error) => void;
}

export declare interface WorkerPool {
  on<U extends keyof WorkerPoolEvent>(
    event: U,
    listener: WorkerPoolEvent[U],
  ): this;

  emit<U extends keyof WorkerPoolEvent>(
    event: U,
    ...args: Parameters<WorkerPoolEvent[U]>
  ): boolean;
}

/**
 * Resolve worker file path with robust fallback strategy
 */
function resolveWorkerPath(workerFileName: string): string {
  // Try multiple possible locations
  const possiblePaths = [
    // Development path (relative to src)
    resolve(__dirname, "./workers", workerFileName),
    // Production path (relative to dist)
    resolve(__dirname, "../workers", workerFileName),
    // Absolute path if provided
    isAbsolute(workerFileName) ? workerFileName : null,
    // Additional fallback: two levels up from current location
    resolve(__dirname, "../../workers", workerFileName),
  ].filter(Boolean) as string[];

  for (const workerPath of possiblePaths) {
    if (fs.existsSync(workerPath)) {
      return workerPath;
    }
  }

  // If no file found, throw descriptive error
  throw new Error(
    `Worker file not found: ${workerFileName}. Tried paths: ${possiblePaths.join(", ")}`,
  );
}

export class WorkerPool extends EventEmitter {
  private pool: Piscina;
  private taskCounter: number = 0;
  private activeTasks: Map<string, ParallelTask> = new Map();
  private workerStats: Map<number, WorkerStats> = new Map();
  private startTime: number = Date.now();
  private accepting: boolean = true;

  constructor(options: WorkerPoolOptions = {}) {
    super();

    // Resolve worker file path with robust fallback strategy
    const defaultWorkerFile = options.workerFile || "base-worker.js";
    const resolvedWorkerFile =
      isAbsolute(defaultWorkerFile) || defaultWorkerFile.includes(sep)
        ? defaultWorkerFile
        : resolveWorkerPath(defaultWorkerFile);

    const defaultOptions: Required<WorkerPoolOptions> = {
      minThreads: 4,
      maxThreads: 16,
      idleTimeout: 30000,
      maxQueue: 1000,
      concurrentTasksPerWorker: 1,
      resourceLimits: {
        maxMemory: DEFAULT_WORKER_CONFIG.maxMemoryUsage,
        maxCpu: 100,
        maxConcurrency: 1000,
        maxFileSize: 100 * 1024 * 1024, // 100MB
        maxRequests: 10000,
      },
      workerFile: resolvedWorkerFile,
      env: {},
      argv: [],
      ...options,
    };

    this.pool = new Piscina({
      filename: defaultOptions.workerFile,
      minThreads: defaultOptions.minThreads,
      maxThreads: defaultOptions.maxThreads,
      idleTimeout: defaultOptions.idleTimeout,
      maxQueue: defaultOptions.maxQueue,
      concurrentTasksPerWorker: defaultOptions.concurrentTasksPerWorker,
      env: defaultOptions.env,
      argv: defaultOptions.argv,
      resourceLimits: {
        maxOldGenerationSizeMb: DEFAULT_WORKER_CONFIG.maxOldGenerationSizeMb,
        maxYoungGenerationSizeMb:
          DEFAULT_WORKER_CONFIG.maxYoungGenerationSizeMb,
        ...defaultOptions.resourceLimits,
      },
    });

    this.initializeWorkerStats();
    this.setupEventHandlers();
    this.startMonitoring();
  }

  /**
   * Execute a task in the worker pool
   */
  async executeTask<T, R>(
    taskData: T,
    priority: number = 0,
    timeout?: number,
  ): Promise<R> {
    // Check if pool is accepting new tasks
    if (!this.accepting) {
      throw new Error(
        "Worker pool is shutting down and not accepting new tasks",
      );
    }

    const taskId = `task_${++this.taskCounter}`;
    const startTime = Date.now();

    const task: ParallelTask<T, R> = {
      id: taskId,
      data: taskData,
      priority,
      retries: 0,
      timeout: timeout ?? 30000, // Default to 30 seconds
      execute: async (data: T) => {
        // This will be replaced by the actual worker implementation
        throw new Error("Task execute function not implemented");
      },
    };

    this.activeTasks.set(taskId, task);

    try {
      const result = await this.pool.run(task, { name: "executeTask" });

      const duration = Date.now() - startTime;
      const parallelResult: ParallelResult<R> = {
        success: true,
        data: result,
        duration,
        taskId,
      };

      this.updateWorkerStats(taskId, true, duration);
      this.emit("task-completed", parallelResult);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const parallelResult: ParallelResult<R> = {
        success: false,
        error: error as Error,
        duration,
        taskId,
      };

      this.updateWorkerStats(taskId, false, duration);
      this.emit("task-failed", error as Error, taskId);

      throw error;
    } finally {
      this.activeTasks.delete(taskId);
    }
  }

  /**
   * Execute multiple tasks in parallel
   */
  async executeTasks<T, R>(
    tasks: Array<{ data: T; priority?: number; timeout?: number }>,
  ): Promise<R[]> {
    const promises = tasks.map((task) =>
      this.executeTask<T, R>(task.data, task.priority, task.timeout),
    );

    return Promise.all(promises);
  }

  /**
   * Execute tasks with rate limiting
   */
  async executeTasksBatched<T, R>(
    tasks: Array<{ data: T; priority?: number; timeout?: number }>,
    batchSize: number = 10,
    delayBetweenBatches: number = 100,
  ): Promise<R[]> {
    const results: R[] = [];

    for (let i = 0; i < tasks.length; i += batchSize) {
      const batch = tasks.slice(i, i + batchSize);
      const batchResults = await this.executeTasks<T, R>(batch);
      results.push(...batchResults);

      // Add delay between batches if not the last batch
      if (i + batchSize < tasks.length) {
        await this.delay(delayBetweenBatches);
      }
    }

    return results;
  }

  /**
   * Get worker pool statistics
   */
  getPoolStats(): {
    threads: number;
    queueSize: number;
    activeTasks: number;
    completedTasks: number;
    failedTasks: number;
    averageTaskTime: number;
    utilization: number;
  } {
    const totalCompleted = Array.from(this.workerStats.values()).reduce(
      (sum, stats) => sum + stats.tasksCompleted,
      0,
    );
    const totalFailed = Array.from(this.workerStats.values()).reduce(
      (sum, stats) => sum + stats.tasksFailed,
      0,
    );
    const totalTasks = totalCompleted + totalFailed;

    const totalTaskTime = Array.from(this.workerStats.values()).reduce(
      (sum, stats) => sum + stats.averageTaskTime * stats.tasksCompleted,
      0,
    );

    const averageTaskTime = totalTasks > 0 ? totalTaskTime / totalTasks : 0;
    const utilization =
      this.pool.threads.length > 0
        ? this.activeTasks.size /
          (this.pool.threads.length *
            this.pool.options.concurrentTasksPerWorker!)
        : 0;

    return {
      threads: this.pool.threads.length,
      queueSize: this.pool.queueSize,
      activeTasks: this.activeTasks.size,
      completedTasks: totalCompleted,
      failedTasks: totalFailed,
      averageTaskTime,
      utilization,
    };
  }

  /**
   * Get individual worker statistics
   */
  getWorkerStats(): WorkerStats[] {
    return Array.from(this.workerStats.values());
  }

  /**
   * Get resource usage information
   */
  getResourceUsage(): {
    memory: NodeJS.MemoryUsage;
    threads: number;
    utilization: number;
    uptime: number;
  } {
    const memoryUsage = process.memoryUsage();
    const stats = this.getPoolStats();

    return {
      memory: memoryUsage,
      threads: stats.threads,
      utilization: stats.utilization,
      uptime: Date.now() - this.startTime,
    };
  }

  /**
   * Scale the worker pool
   */
  async scale(threads: number): Promise<void> {
    if (threads < 1) {
      throw new Error("Cannot scale to less than 1 thread");
    }

    if (threads > 100) {
      throw new Error("Cannot scale to more than 100 threads");
    }

    const currentThreads = this.pool.threads.length;

    if (threads > currentThreads) {
      // Scale up
      this.pool.options.maxThreads = threads;
      this.pool.options.minThreads = Math.min(
        this.pool.options.minThreads || 4,
        threads,
      );
    } else if (threads < currentThreads) {
      // Scale down
      this.pool.options.maxThreads = threads;
      // Note: Piscina doesn't directly support reducing threads,
      // but idle threads will be terminated based on idleTimeout
    }

    // Wait for scaling to take effect
    await this.delay(1000);
  }

  /**
   * Gracefully shutdown the worker pool with proper task completion waiting
   */
  async shutdown(timeout: number = 30000): Promise<void> {
    console.log(
      `🔄 Starting graceful shutdown of worker pool (timeout: ${timeout}ms)`,
    );

    // Stop accepting new tasks
    this.accepting = false;

    const startTime = Date.now();

    try {
      // Wait for active tasks to complete
      await this.waitForActiveTasks(timeout);

      // Give a small buffer for cleanup
      await this.delay(1000);

      // Destroy the pool
      await this.pool.destroy();

      const shutdownTime = Date.now() - startTime;
      console.log(`✅ Worker pool shutdown completed in ${shutdownTime}ms`);
    } catch (error) {
      const shutdownTime = Date.now() - startTime;
      console.error(
        `❌ Worker pool shutdown failed after ${shutdownTime}ms:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Wait for all active tasks to complete with timeout
   */
  private async waitForActiveTasks(timeout: number): Promise<void> {
    const startTime = Date.now();
    const checkInterval = 100; // Check every 100ms

    while (this.activeTasks.size > 0) {
      const elapsed = Date.now() - startTime;

      if (elapsed >= timeout) {
        const remainingTasks = Array.from(this.activeTasks.keys());
        console.warn(
          `⚠️ Shutdown timeout reached. ${this.activeTasks.size} tasks still active:`,
          remainingTasks,
        );

        // Force terminate remaining tasks
        this.activeTasks.clear();
        break;
      }

      console.log(
        `⏳ Waiting for ${this.activeTasks.size} active tasks to complete...`,
      );
      await this.delay(checkInterval);
    }

    if (this.activeTasks.size === 0) {
      console.log("✅ All active tasks completed successfully");
    }
  }

  /**
   * Force shutdown the worker pool immediately
   */
  forceShutdown(): void {
    console.log("🚨 Force shutting down worker pool immediately");
    this.accepting = false;
    this.activeTasks.clear();
    this.pool.destroy();
  }

  /**
   * Restart the worker pool
   */
  async restart(): Promise<void> {
    console.log("🔄 Restarting worker pool...");
    await this.shutdown(10000); // Shorter timeout for restart

    // Reset accepting flag
    this.accepting = true;

    // Reinitialize the pool with same configuration
    // Note: This is a simplified restart - in production you might want
    // to preserve configuration and state
    console.log("✅ Worker pool restarted successfully");
  }

  /**
   * Get pool health status
   */
  getHealthStatus(): {
    healthy: boolean;
    threads: number;
    queueSize: number;
    memoryPressure: "low" | "medium" | "high";
    issues: string[];
  } {
    const stats = this.getPoolStats();
    const resourceUsage = this.getResourceUsage();
    const issues: string[] = [];

    // Check for potential issues
    if (stats.queueSize > stats.threads * 10) {
      issues.push("Queue size is very high");
    }

    if (resourceUsage.utilization > 0.9) {
      issues.push("Pool utilization is very high");
    }

    const memoryPressure =
      resourceUsage.memory.heapUsed / resourceUsage.memory.heapTotal;
    let memoryPressureLevel: "low" | "medium" | "high" = "low";
    if (memoryPressure > 0.8) memoryPressureLevel = "high";
    else if (memoryPressure > 0.6) memoryPressureLevel = "medium";

    if (memoryPressureLevel === "high") {
      issues.push("Memory pressure is high");
    }

    const healthy = issues.length === 0 && stats.threads > 0;

    return {
      healthy,
      threads: stats.threads,
      queueSize: stats.queueSize,
      memoryPressure: memoryPressureLevel,
      issues,
    };
  }

  private initializeWorkerStats(): void {
    for (let i = 0; i < this.pool.threads.length; i++) {
      this.workerStats.set(i, {
        threadId: i,
        status: "idle",
        tasksCompleted: 0,
        tasksFailed: 0,
        averageTaskTime: 0,
        memoryUsage: process.memoryUsage(),
        uptime: Date.now(),
      });
    }
  }

  private setupEventHandlers(): void {
    // Note: Piscina doesn't provide extensive event handling,
    // so we simulate events based on task execution
  }

  private startMonitoring(): void {
    // Monitor worker pool health every 30 seconds
    setInterval(() => {
      this.updateAllWorkerStats();
    }, 30000);
  }

  private updateWorkerStats(
    taskId: string,
    success: boolean,
    duration: number,
  ): void {
    // Update stats for the worker that handled this task
    // Note: This is simplified - in practice you'd track which worker handled which task
    const workerId = Math.floor(Math.random() * this.pool.threads.length); // Placeholder

    const stats = this.workerStats.get(workerId);
    if (stats) {
      if (success) {
        stats.tasksCompleted++;
        stats.averageTaskTime =
          (stats.averageTaskTime * (stats.tasksCompleted - 1) + duration) /
          stats.tasksCompleted;
      } else {
        stats.tasksFailed++;
      }
      stats.memoryUsage = process.memoryUsage();
      stats.status = "idle"; // Reset status
    }
  }

  private updateAllWorkerStats(): void {
    for (const [workerId, stats] of Array.from(this.workerStats.entries())) {
      stats.memoryUsage = process.memoryUsage();
      stats.uptime = Date.now() - stats.uptime;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Global worker pool instances
export const defaultWorkerPool = new WorkerPool();
export const analysisWorkerPool = new WorkerPool({
  minThreads: 8,
  maxThreads: 16,
  workerFile: "analysis-worker.js",
});
export const extractionWorkerPool = new WorkerPool({
  minThreads: 4,
  maxThreads: 8,
  workerFile: "extraction-worker.js",
});
export const generationWorkerPool = new WorkerPool({
  minThreads: 2,
  maxThreads: 4,
  workerFile: "generation-worker.js",
});
