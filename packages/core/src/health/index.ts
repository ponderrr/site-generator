/**
 * @fileoverview Health Check System
 *
 * Provides health check endpoints and monitoring for production environments.
 * Enables load balancer health checks and operational visibility.
 */

import { EventEmitter } from "events";
import { WorkerPool } from "../worker/index.js";
import { MemoryMonitor, runtimeMemoryConfig } from "../config/memory.config.js";

export interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    memory: HealthCheck;
    workers: HealthCheck;
    system: HealthCheck;
  };
  metrics: {
    memoryUsage: NodeJS.MemoryUsage;
    workerStats: any;
    systemLoad: any;
  };
}

export interface HealthCheck {
  status: "pass" | "fail" | "warn";
  message?: string;
  details?: any;
  duration?: number;
}

export interface HealthCheckOptions {
  timeout?: number;
  includeDetails?: boolean;
  includeMetrics?: boolean;
}

/**
 * Health Check Manager
 */
export class HealthCheckManager extends EventEmitter {
  private workerPools: Map<string, WorkerPool> = new Map();
  private memoryMonitor: MemoryMonitor;
  private startTime: number = Date.now();
  private version: string = "1.0.0";
  private healthMonitorInterval?: NodeJS.Timeout;

  constructor() {
    super();
    this.memoryMonitor = new MemoryMonitor();
    this.startMonitoring();
  }

  /**
   * Register a worker pool for health monitoring
   */
  registerWorkerPool(name: string, workerPool: WorkerPool): void {
    this.workerPools.set(name, workerPool);
    this.emit("worker-pool-registered", { name, workerPool });
  }

  /**
   * Unregister a worker pool
   */
  unregisterWorkerPool(name: string): void {
    this.workerPools.delete(name);
    this.emit("worker-pool-unregistered", { name });
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck(
    options: HealthCheckOptions = {},
  ): Promise<HealthStatus> {
    const {
      timeout = 5000,
      includeDetails = true,
      includeMetrics = true,
    } = options;

    const startTime = Date.now();

    try {
      // Perform checks in parallel with timeout
      const [memoryCheck, workersCheck, systemCheck] = await Promise.allSettled(
        [
          this.checkMemory(timeout),
          this.checkWorkers(timeout),
          this.checkSystem(timeout),
        ],
      );

      const checks = {
        memory:
          memoryCheck.status === "fulfilled"
            ? memoryCheck.value
            : {
                status: "fail" as const,
                message: memoryCheck.reason?.message || "Memory check failed",
                duration: Date.now() - startTime,
              },
        workers:
          workersCheck.status === "fulfilled"
            ? workersCheck.value
            : {
                status: "fail" as const,
                message: workersCheck.reason?.message || "Workers check failed",
                duration: Date.now() - startTime,
              },
        system:
          systemCheck.status === "fulfilled"
            ? systemCheck.value
            : {
                status: "fail" as const,
                message: systemCheck.reason?.message || "System check failed",
                duration: Date.now() - startTime,
              },
      };

      // Determine overall status
      const overallStatus = this.determineOverallStatus(checks);

      const healthStatus: HealthStatus = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: Date.now() - this.startTime,
        version: this.version,
        checks,
        metrics: includeMetrics
          ? {
              memoryUsage: process.memoryUsage(),
              workerStats: this.getWorkerStats(),
              systemLoad: this.getSystemLoad(),
            }
          : {
              memoryUsage: process.memoryUsage(),
              workerStats: {},
              systemLoad: {},
            },
      };

      this.emit("health-check", healthStatus);
      return healthStatus;
    } catch (error) {
      const healthStatus: HealthStatus = {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        uptime: Date.now() - this.startTime,
        version: this.version,
        checks: {
          memory: {
            status: "fail",
            message: "Health check failed",
            duration: Date.now() - startTime,
          },
          workers: {
            status: "fail",
            message: "Health check failed",
            duration: Date.now() - startTime,
          },
          system: {
            status: "fail",
            message: "Health check failed",
            duration: Date.now() - startTime,
          },
        },
        metrics: {
          memoryUsage: process.memoryUsage(),
          workerStats: {},
          systemLoad: {},
        },
      };

      this.emit("health-check-failed", { error, healthStatus });
      return healthStatus;
    }
  }

  /**
   * Check memory health
   */
  private async checkMemory(timeout: number): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      const memoryUsage = process.memoryUsage();
      const memoryPressure = this.memoryMonitor.getMemoryPressure();
      const systemInfo = runtimeMemoryConfig.getSystemInfo();

      const heapUsagePercent =
        (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

      let status: HealthCheck["status"] = "pass";
      let message = "Memory usage is normal";

      if (memoryPressure === "critical") {
        status = "fail";
        message = "Critical memory pressure detected";
      } else if (memoryPressure === "high") {
        status = "warn";
        message = "High memory pressure detected";
      } else if (heapUsagePercent > 90) {
        status = "warn";
        message = "Heap usage is very high";
      }

      return {
        status,
        message,
        details: {
          memoryPressure,
          heapUsagePercent: Math.round(heapUsagePercent * 100) / 100,
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          systemMemory: systemInfo.totalMemory,
          availableMemory: systemInfo.availableMemory,
        },
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        status: "fail",
        message: `Memory check failed: ${error}`,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Check worker pools health
   */
  private async checkWorkers(timeout: number): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      if (this.workerPools.size === 0) {
        return {
          status: "pass",
          message: "No worker pools registered",
          duration: Date.now() - startTime,
        };
      }

      let overallStatus: HealthCheck["status"] = "pass";
      const workerDetails: any = {};

      for (const [name, workerPool] of Array.from(this.workerPools.entries())) {
        try {
          const healthStatus = workerPool.getHealthStatus();
          workerDetails[name] = {
            healthy: healthStatus.healthy,
            threads: healthStatus.threads,
            queueSize: healthStatus.queueSize,
            memoryPressure: healthStatus.memoryPressure,
            issues: healthStatus.issues,
          };

          if (!healthStatus.healthy) {
            overallStatus = "fail";
          } else if (
            healthStatus.issues.length > 0 &&
            overallStatus !== "fail"
          ) {
            overallStatus = "warn";
          }
        } catch (error) {
          workerDetails[name] = {
            error: error instanceof Error ? error.message : String(error),
          };
          overallStatus = "fail";
        }
      }

      const message =
        overallStatus === "pass"
          ? "All worker pools are healthy"
          : overallStatus === "warn"
            ? "Some worker pools have warnings"
            : "Worker pools are unhealthy";

      return {
        status: overallStatus,
        message,
        details: workerDetails,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        status: "fail",
        message: `Workers check failed: ${error}`,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Check system health
   */
  private async checkSystem(timeout: number): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      const systemInfo = runtimeMemoryConfig.getSystemInfo();

      // Check if system has sufficient resources
      const memoryUsage = process.memoryUsage();
      const systemMemoryUsage =
        (memoryUsage.heapUsed / systemInfo.totalMemory) * 100;

      let status: HealthCheck["status"] = "pass";
      let message = "System resources are adequate";

      if (systemMemoryUsage > 95) {
        status = "fail";
        message = "System memory usage is critical";
      } else if (systemMemoryUsage > 85) {
        status = "warn";
        message = "System memory usage is high";
      }

      return {
        status,
        message,
        details: {
          cpuCount: systemInfo.cpuCount,
          totalMemory: systemInfo.totalMemory,
          availableMemory: systemInfo.availableMemory,
          systemMemoryUsage: Math.round(systemMemoryUsage * 100) / 100,
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
        },
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        status: "fail",
        message: `System check failed: ${error}`,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Determine overall health status
   */
  private determineOverallStatus(
    checks: HealthStatus["checks"],
  ): HealthStatus["status"] {
    const checkStatuses = Object.values(checks).map((check) => check.status);

    if (checkStatuses.includes("fail")) {
      return "unhealthy";
    } else if (checkStatuses.includes("warn")) {
      return "degraded";
    } else {
      return "healthy";
    }
  }

  /**
   * Get worker pool statistics
   */
  private getWorkerStats(): any {
    const stats: any = {};

    for (const [name, workerPool] of Array.from(this.workerPools.entries())) {
      try {
        stats[name] = workerPool.getPoolStats();
      } catch (error) {
        stats[name] = {
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }

    return stats;
  }

  /**
   * Get system load information
   */
  private getSystemLoad(): any {
    try {
      const cpus = require("os").cpus();
      const loadavg = require("os").loadavg();

      return {
        loadAverage: loadavg,
        cpuCount: cpus.length,
        uptime: require("os").uptime(),
        freeMemory: require("os").freemem(),
        totalMemory: require("os").totalmem(),
      };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }

  /**
   * Start continuous monitoring
   */
  private startMonitoring(): void {
    // Monitor health every 30 seconds
    this.healthMonitorInterval = setInterval(async () => {
      try {
        const healthStatus = await this.performHealthCheck({
          includeDetails: false,
          includeMetrics: false,
        });

        if (healthStatus.status !== "healthy") {
          this.emit("health-degraded", healthStatus);
        }
      } catch (error) {
        this.emit("health-monitoring-error", error);
      }
    }, 30000);
  }

  /**
   * Get quick health status for load balancers
   */
  async getQuickHealthStatus(): Promise<{ status: string; timestamp: string }> {
    try {
      const memoryUsage = process.memoryUsage();
      const memoryPressure = this.memoryMonitor.getMemoryPressure();

      // Quick check - just memory pressure
      const status = memoryPressure === "critical" ? "unhealthy" : "healthy";

      return {
        status,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.memoryMonitor.stopMonitoring();
    if (this.healthMonitorInterval) {
      clearInterval(this.healthMonitorInterval);
      this.healthMonitorInterval = undefined;
    }
    this.removeAllListeners();
  }
}

/**
 * Global health check manager instance
 */
export const healthCheckManager = new HealthCheckManager();

/**
 * Express.js middleware for health check endpoints
 */
export function createHealthCheckMiddleware() {
  return {
    // Basic health check for load balancers
    basic: async (req: any, res: any) => {
      try {
        const status = await healthCheckManager.getQuickHealthStatus();
        res.status(status.status === "healthy" ? 200 : 503).json(status);
      } catch (error) {
        res.status(503).json({
          status: "unhealthy",
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },

    // Detailed health check for monitoring
    detailed: async (req: any, res: any) => {
      try {
        const includeDetails = req.query.details === "true";
        const includeMetrics = req.query.metrics === "true";

        const healthStatus = await healthCheckManager.performHealthCheck({
          includeDetails,
          includeMetrics,
        });

        const statusCode =
          healthStatus.status === "healthy"
            ? 200
            : healthStatus.status === "degraded"
              ? 200
              : 503;

        res.status(statusCode).json(healthStatus);
      } catch (error) {
        res.status(503).json({
          status: "unhealthy",
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },

    // Readiness check for Kubernetes
    readiness: async (req: any, res: any) => {
      try {
        const healthStatus = await healthCheckManager.performHealthCheck({
          includeDetails: false,
          includeMetrics: false,
        });

        const isReady =
          healthStatus.status === "healthy" ||
          healthStatus.status === "degraded";
        res.status(isReady ? 200 : 503).json({
          ready: isReady,
          timestamp: new Date().toISOString(),
          status: healthStatus.status,
        });
      } catch (error) {
        res.status(503).json({
          ready: false,
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },

    // Liveness check for Kubernetes
    liveness: async (req: any, res: any) => {
      try {
        const memoryUsage = process.memoryUsage();
        const memoryPressure =
          healthCheckManager["memoryMonitor"].getMemoryPressure();

        // Liveness check is more lenient - just check if process is responsive
        const isAlive = memoryPressure !== "critical";

        res.status(isAlive ? 200 : 503).json({
          alive: isAlive,
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          memoryPressure,
        });
      } catch (error) {
        res.status(503).json({
          alive: false,
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  };
}

// Export the HealthCheckServer and startHealthCheckServer from the server module
export { HealthCheckServer, startHealthCheckServer } from "./server.js";
