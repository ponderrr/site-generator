import { performance } from 'perf_hooks';
import { PerformanceMetrics, MetricsData, ResourceUsage } from '../types';

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, MetricsData[]> = new Map();
  private marks: Map<string, number> = new Map();
  private measurements: Map<string, number[]> = new Map();
  private startTime: number = performance.now();
  private enabled: boolean = true;

  private constructor() {
    this.startPeriodicCollection();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start measuring a performance operation
   */
  startMeasurement(name: string): void {
    if (!this.enabled) return;

    this.marks.set(name, performance.now());
    this.measurements.set(name, []);
  }

  /**
   * End measuring a performance operation
   */
  endMeasurement(name: string): PerformanceMetrics | null {
    if (!this.enabled || !this.marks.has(name)) return null;

    const startTime = this.marks.get(name)!;
    const endTime = performance.now();
    const duration = endTime - startTime;

    // Record the measurement
    const measurements = this.measurements.get(name) || [];
    measurements.push(duration);
    this.measurements.set(name, measurements);

    // Store detailed metrics
    const metrics: PerformanceMetrics = {
      startTime,
      endTime,
      duration,
      memoryUsage: process.memoryUsage(),
      operations: 1,
      throughput: 1000 / duration // operations per second
    };

    this.recordMetric(`${name}_duration`, duration);
    this.recordMetric(`${name}_memory_used`, metrics.memoryUsage.heapUsed);
    this.recordMetric(`${name}_throughput`, metrics.throughput);

    this.marks.delete(name);
    return metrics;
  }

  /**
   * Measure an async operation
   */
  async measureAsync<T>(
    name: string,
    operation: () => Promise<T>
  ): Promise<{ result: T; metrics: PerformanceMetrics }> {
    if (!this.enabled) {
      const result = await operation();
      return { result, metrics: {} as PerformanceMetrics };
    }

    this.startMeasurement(name);
    const startTime = performance.now();
    const startMemory = process.memoryUsage();

    try {
      const result = await operation();
      const endTime = performance.now();
      const endMemory = process.memoryUsage();

      const metrics: PerformanceMetrics = {
        startTime,
        endTime,
        duration: endTime - startTime,
        memoryUsage: endMemory,
        operations: 1,
        throughput: 1000 / (endTime - startTime)
      };

      this.recordMetric(`${name}_duration`, metrics.duration);
      this.recordMetric(`${name}_memory_used`, endMemory.heapUsed - startMemory.heapUsed);
      this.recordMetric(`${name}_throughput`, metrics.throughput);

      return { result, metrics };
    } catch (error) {
      const endTime = performance.now();
      const endMemory = process.memoryUsage();

      const metrics: PerformanceMetrics = {
        startTime,
        endTime,
        duration: endTime - startTime,
        memoryUsage: endMemory,
        operations: 0,
        throughput: 0
      };

      throw error;
    }
  }

  /**
   * Measure async performance (alias for measureAsync for backward compatibility)
   */
  async measureAsyncPerformance<T>(
    operation: () => Promise<T>
  ): Promise<{ result: T; duration: number; success: boolean; memoryUsage: NodeJS.MemoryUsage }> {
    const startTime = performance.now();
    const startMemory = process.memoryUsage();
    try {
      const result = await operation();
      const duration = performance.now() - startTime;
      const memoryUsage = process.memoryUsage();

      this.recordMetric('async_operation_duration', duration);
      this.recordMetric('async_operation_memory', memoryUsage.heapUsed - startMemory.heapUsed);
      return { result, duration, success: true, memoryUsage };
    } catch (error) {
      const duration = performance.now() - startTime;
      const memoryUsage = process.memoryUsage();
      this.recordMetric('async_operation_duration', duration);
      return { result: null as T, duration, success: false, memoryUsage };
    }
  }

  /**
   * Get metrics grouped by category
   */
  getMetricsByCategory(): Array<{ category: string; metrics: MetricsData[] }> {
    const categorized: Record<string, MetricsData[]> = {};

    for (const [metricName, metrics] of this.metrics) {
      // Extract category from metric name (e.g., "memory_heap_used" -> "memory")
      const category = metricName.split('_')[0];
      if (!categorized[category]) {
        categorized[category] = [];
      }
      categorized[category].push(...metrics);
    }

    // Convert to array format for compatibility
    return Object.entries(categorized).map(([category, metrics]) => ({
      category,
      metrics
    }));
  }

  /**
   * Record a custom metric
   */
  recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    if (!this.enabled) return;

    const metric: MetricsData = {
      name,
      value,
      timestamp: Date.now(),
      tags,
      metadata: {
        processId: process.pid,
        memoryUsage: process.memoryUsage().heapUsed,
        uptime: process.uptime()
      }
    };

    const metrics = this.metrics.get(name) || [];
    metrics.push(metric);

    // Keep only last 1000 metrics per name to prevent memory leaks
    if (metrics.length > 1000) {
      metrics.shift();
    }

    this.metrics.set(name, metrics);
  }

  /**
   * Get metrics for a specific name
   */
  getMetrics(name: string, limit?: number): MetricsData[] {
    const metrics = this.metrics.get(name) || [];
    return limit ? metrics.slice(-limit) : metrics;
  }

  /**
   * Get all metric names
   */
  getMetricNames(): string[] {
    return Array.from(this.metrics.keys());
  }

  /**
   * Get statistics for a metric
   */
  getMetricStats(name: string): {
    count: number;
    min: number;
    max: number;
    average: number;
    median: number;
    p95: number;
    p99: number;
    latest: number;
  } | null {
    const metrics = this.metrics.get(name);
    if (!metrics || metrics.length === 0) return null;

    const values = metrics.map(m => m.value).sort((a, b) => a - b);
    const count = values.length;
    const min = values[0];
    const max = values[count - 1];
    const average = values.reduce((sum, val) => sum + val, 0) / count;
    const median = count % 2 === 0
      ? (values[count / 2 - 1] + values[count / 2]) / 2
      : values[Math.floor(count / 2)];

    const p95Index = Math.floor(count * 0.95);
    const p99Index = Math.floor(count * 0.99);
    const p95 = values[Math.min(p95Index, count - 1)];
    const p99 = values[Math.min(p99Index, count - 1)];
    const latest = values[count - 1];

    return { count, min, max, average, median, p95, p99, latest };
  }

  /**
   * Get current resource usage
   */
  getResourceUsage(): ResourceUsage {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      memory: memUsage,
      cpu: (cpuUsage.user + cpuUsage.system) / 1000000, // Convert to seconds
      disk: this.getDiskUsage(),
      network: this.getNetworkUsage()
    };
  }

  /**
   * Get system performance summary
   */
  getPerformanceSummary(): {
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: number;
    activeMetrics: string[];
    totalMeasurements: number;
    totalOperations: number;
    averageThroughput: number;
  } {
    const resourceUsage = this.getResourceUsage();
    const activeMetrics = this.getMetricNames();
    const totalMeasurements = Array.from(this.metrics.values())
      .reduce((sum, metrics) => sum + metrics.length, 0);

    const throughputMetrics = this.getMetrics('throughput', 100);
    const averageThroughput = throughputMetrics.length > 0
      ? throughputMetrics.reduce((sum, m) => sum + m.value, 0) / throughputMetrics.length
      : 0;

    return {
      uptime: process.uptime(),
      memoryUsage: resourceUsage.memory,
      cpuUsage: resourceUsage.cpu,
      activeMetrics,
      totalMeasurements,
      totalOperations: totalMeasurements, // Alias for compatibility
      averageThroughput
    };
  }

  /**
   * Enable performance monitoring
   */
  enable(): void {
    this.enabled = true;
  }

  /**
   * Disable performance monitoring
   */
  disable(): void {
    this.enabled = false;
    this.marks.clear();
    this.measurements.clear();
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
    this.marks.clear();
    this.measurements.clear();
  }

  /**
   * Export metrics for external analysis
   */
  exportMetrics(): Record<string, MetricsData[]> {
    const exported: Record<string, MetricsData[]> = {};
    for (const [name, metrics] of this.metrics) {
      exported[name] = metrics;
    }
    return exported;
  }

  private startPeriodicCollection(): void {
    // Collect system metrics every 30 seconds
    setInterval(() => {
      if (this.enabled) {
        this.collectSystemMetrics();
      }
    }, 30000);
  }

  private collectSystemMetrics(): void {
    const resourceUsage = this.getResourceUsage();
    const timestamp = Date.now();

    // Memory metrics
    this.recordMetric('memory_rss', resourceUsage.memory.rss);
    this.recordMetric('memory_heap_used', resourceUsage.memory.heapUsed);
    this.recordMetric('memory_heap_total', resourceUsage.memory.heapTotal);
    this.recordMetric('memory_external', resourceUsage.memory.external);

    // CPU metrics
    this.recordMetric('cpu_usage', resourceUsage.cpu);

    // Disk metrics
    this.recordMetric('disk_used', resourceUsage.disk.used);
    this.recordMetric('disk_available', resourceUsage.disk.available);

    // Network metrics
    this.recordMetric('network_connections', resourceUsage.network.connections);
    this.recordMetric('network_bandwidth', resourceUsage.network.bandwidth);
  }

  private getDiskUsage(): { used: number; available: number } {
    // This is a simplified implementation
    // In a real implementation, you'd use a system information library
    return { used: 0, available: 0 };
  }

  private getNetworkUsage(): { connections: number; bandwidth: number } {
    // This is a simplified implementation
    // In a real implementation, you'd use a network monitoring library
    return { connections: 0, bandwidth: 0 };
  }
}

// Global performance monitor instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Utility functions for common performance operations
export function measurePerformance<T>(
  operation: () => T,
  name?: string
): { result: T; duration: number } {
  const startTime = performance.now();
  const result = operation();
  const duration = performance.now() - startTime;

  if (name) {
    performanceMonitor.recordMetric(`${name}_duration`, duration);
  }
  return { result, duration };
}

export async function measureAsyncPerformance<T>(
  operation: () => Promise<T>,
  name?: string
): Promise<{ result: T; duration: number; success: boolean }> {
  const startTime = performance.now();
  try {
    const result = await operation();
    const duration = performance.now() - startTime;

    if (name) {
      performanceMonitor.recordMetric(`${name}_duration`, duration);
    }
    return { result, duration, success: true };
  } catch (error) {
    const duration = performance.now() - startTime;
    if (name) {
      performanceMonitor.recordMetric(`${name}_duration`, duration);
    }
    return { result: null as T, duration, success: false };
  }
}

export function withPerformanceMonitoring<T extends any[], R>(
  name: string,
  fn: (...args: T) => R
): (...args: T) => R {
  return (...args: T): R => {
    performanceMonitor.startMeasurement(name);
    try {
      const result = fn(...args);
      performanceMonitor.endMeasurement(name);
      return result;
    } catch (error) {
      performanceMonitor.endMeasurement(name);
      throw error;
    }
  };
}
