/**
 * @fileoverview Centralized Memory Configuration
 *
 * This file provides a single source of truth for memory limits across all packages,
 * preventing configuration drift and potential memory issues.
 */

import { cpus, totalmem } from "os";

/**
 * Memory configuration constants
 */
export const MEMORY_LIMITS = {
  // Worker thread limits
  worker: {
    maxOldGenerationSizeMb: 1024, // 1GB per worker
    maxYoungGenerationSizeMb: 256, // 256MB young generation
    maxMemoryUsage: 1024 * 1024 * 1024, // 1GB in bytes
  },

  // Main process limits
  main: {
    maxOldSpaceSize: 14336, // 14GB main process
    maxOldGenerationSizeMb: 14336, // 14GB in MB
    maxMemoryUsage: 14336 * 1024 * 1024, // 14GB in bytes
  },

  // Cache limits
  cache: {
    maxItems: 5000, // Maximum cache items
    maxSize: 100 * 1024 * 1024, // 100MB cache size
    ttl: 1000 * 60 * 60, // 1 hour TTL
  },

  // System limits
  system: {
    maxMemoryPercent: 0.85, // Use max 85% of system memory
    warningThreshold: 0.75, // Warn at 75% usage
    criticalThreshold: 0.9, // Critical at 90% usage
  },
} as const;

/**
 * Runtime memory configuration based on system resources
 */
export class RuntimeMemoryConfig {
  private readonly systemMemory: number;
  private readonly cpuCount: number;

  constructor() {
    this.systemMemory = totalmem();
    this.cpuCount = cpus().length;
  }

  /**
   * Get worker memory limits based on system resources
   */
  getWorkerLimits() {
    const availableMemory =
      this.systemMemory * MEMORY_LIMITS.system.maxMemoryPercent;
    const memoryPerWorker = Math.floor(availableMemory / (this.cpuCount * 2)); // Conservative allocation

    return {
      maxOldGenerationSizeMb: Math.min(
        MEMORY_LIMITS.worker.maxOldGenerationSizeMb,
        memoryPerWorker / (1024 * 1024),
      ),
      maxYoungGenerationSizeMb: MEMORY_LIMITS.worker.maxYoungGenerationSizeMb,
      maxMemoryUsage: Math.min(
        MEMORY_LIMITS.worker.maxMemoryUsage,
        memoryPerWorker,
      ),
    };
  }

  /**
   * Get main process memory limits
   */
  getMainProcessLimits() {
    const availableMemory =
      this.systemMemory * MEMORY_LIMITS.system.maxMemoryPercent;

    return {
      maxOldSpaceSize: Math.min(
        MEMORY_LIMITS.main.maxOldSpaceSize,
        Math.floor(availableMemory / (1024 * 1024)),
      ),
      maxOldGenerationSizeMb: Math.min(
        MEMORY_LIMITS.main.maxOldGenerationSizeMb,
        Math.floor(availableMemory / (1024 * 1024)),
      ),
      maxMemoryUsage: Math.min(
        MEMORY_LIMITS.main.maxMemoryUsage,
        availableMemory,
      ),
    };
  }

  /**
   * Get cache configuration based on available memory
   */
  getCacheConfig() {
    const availableMemory =
      this.systemMemory * MEMORY_LIMITS.system.maxMemoryPercent;
    const cacheMemory = Math.min(
      MEMORY_LIMITS.cache.maxSize,
      availableMemory * 0.1,
    ); // Use 10% for cache

    return {
      maxItems: MEMORY_LIMITS.cache.maxItems,
      maxSize: cacheMemory,
      ttl: MEMORY_LIMITS.cache.ttl,
    };
  }

  /**
   * Validate memory configuration against system limits
   */
  validateConfiguration(config: {
    workerMemory?: number;
    mainMemory?: number;
    cacheMemory?: number;
  }): {
    valid: boolean;
    warnings: string[];
    errors: string[];
  } {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check worker memory
    if (config.workerMemory) {
      const maxWorkerMemory = (this.systemMemory * 0.4) / this.cpuCount; // Max 40% total / CPU count
      if (config.workerMemory > maxWorkerMemory) {
        errors.push(
          `Worker memory (${config.workerMemory}) exceeds safe limit (${maxWorkerMemory})`,
        );
      } else if (config.workerMemory > maxWorkerMemory * 0.8) {
        warnings.push(
          `Worker memory (${config.workerMemory}) is high, consider reducing`,
        );
      }
    }

    // Check main process memory
    if (config.mainMemory) {
      const maxMainMemory = this.systemMemory * 0.6; // Max 60% for main process
      if (config.mainMemory > maxMainMemory) {
        errors.push(
          `Main process memory (${config.mainMemory}) exceeds safe limit (${maxMainMemory})`,
        );
      } else if (config.mainMemory > maxMainMemory * 0.8) {
        warnings.push(
          `Main process memory (${config.mainMemory}) is high, consider reducing`,
        );
      }
    }

    // Check cache memory
    if (config.cacheMemory) {
      const maxCacheMemory = this.systemMemory * 0.15; // Max 15% for cache
      if (config.cacheMemory > maxCacheMemory) {
        errors.push(
          `Cache memory (${config.cacheMemory}) exceeds safe limit (${maxCacheMemory})`,
        );
      }
    }

    return {
      valid: errors.length === 0,
      warnings,
      errors,
    };
  }

  /**
   * Get system information for debugging
   */
  getSystemInfo() {
    return {
      totalMemory: this.systemMemory,
      cpuCount: this.cpuCount,
      availableMemory:
        this.systemMemory * MEMORY_LIMITS.system.maxMemoryPercent,
      memoryWarningThreshold:
        this.systemMemory * MEMORY_LIMITS.system.warningThreshold,
      memoryCriticalThreshold:
        this.systemMemory * MEMORY_LIMITS.system.criticalThreshold,
    };
  }
}

/**
 * Default runtime memory configuration instance
 */
export const runtimeMemoryConfig = new RuntimeMemoryConfig();

/**
 * Memory monitoring utilities
 */
export class MemoryMonitor {
  private readonly thresholds = MEMORY_LIMITS.system;
  private monitorInterval?: NodeJS.Timeout;

  /**
   * Start monitoring memory usage
   */
  startMonitoring(
    onWarning?: (usage: NodeJS.MemoryUsage) => void,
    onCritical?: (usage: NodeJS.MemoryUsage) => void,
  ) {
    this.monitorInterval = setInterval(() => {
      const usage = process.memoryUsage();
      const memoryPressure = usage.heapUsed / usage.heapTotal;

      if (memoryPressure > this.thresholds.criticalThreshold && onCritical) {
        onCritical(usage);
      } else if (
        memoryPressure > this.thresholds.warningThreshold &&
        onWarning
      ) {
        onWarning(usage);
      }
    }, 5000); // Check every 5 seconds
  }

  /**
   * Stop monitoring memory usage
   */
  stopMonitoring() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = undefined;
    }
  }

  /**
   * Get current memory pressure level
   */
  getMemoryPressure(): "low" | "medium" | "high" | "critical" {
    const usage = process.memoryUsage();
    const memoryPressure = usage.heapUsed / usage.heapTotal;

    if (memoryPressure > this.thresholds.criticalThreshold) return "critical";
    if (memoryPressure > this.thresholds.warningThreshold) return "high";
    if (memoryPressure > 0.5) return "medium";
    return "low";
  }
}

/**
 * Export commonly used configurations
 */
export const DEFAULT_WORKER_CONFIG = runtimeMemoryConfig.getWorkerLimits();
export const DEFAULT_MAIN_CONFIG = runtimeMemoryConfig.getMainProcessLimits();
export const DEFAULT_CACHE_CONFIG = runtimeMemoryConfig.getCacheConfig();
