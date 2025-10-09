import {
  MetricData,
  MetricType,
  MetricTags,
  AggregationType,
} from "../types/index.js";

export interface MetricsCollectorOptions {
  maxRetention?: number;
  maxMetrics?: number;
  aggregationInterval?: number;
  enablePersistence?: boolean;
  persistencePath?: string;
}

export class MetricsCollector {
  private metrics: Map<string, MetricData[]> = new Map();
  private options: Required<MetricsCollectorOptions>;

  constructor(options: MetricsCollectorOptions = {}) {
    this.options = {
      maxRetention: 7 * 24 * 60 * 60 * 1000, // 7 days
      maxMetrics: 10000,
      aggregationInterval: 60 * 1000, // 1 minute
      enablePersistence: false,
      persistencePath: "./metrics.json",
      ...options,
    };
  }

  /**
   * Record a metric value
   */
  record(
    name: string,
    value: number,
    type: MetricType = "gauge",
    tags: MetricTags = {},
    timestamp?: number,
  ): void {
    const metric: MetricData = {
      name,
      value,
      type,
      tags,
      timestamp: timestamp || Date.now(),
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metricList = this.metrics.get(name)!;
    metricList.push(metric);

    // Enforce max metrics limit
    if (metricList.length > this.options.maxMetrics) {
      metricList.shift();
    }

    // Clean up old metrics
    this.cleanupOldMetrics();
  }

  /**
   * Get metrics by name
   */
  getMetrics(name: string, since?: number): MetricData[] {
    const metricList = this.metrics.get(name) || [];
    if (!since) return [...metricList];

    return metricList.filter((metric) => metric.timestamp >= since);
  }

  /**
   * Get aggregated metrics
   */
  getAggregatedMetrics(
    name: string,
    aggregation: AggregationType = "avg",
    since?: number,
    tags?: MetricTags,
  ): { value: number; count: number; min: number; max: number } | null {
    let metrics = this.getMetrics(name, since);

    if (tags) {
      metrics = metrics.filter((metric) =>
        Object.entries(tags).every(
          ([key, value]) => metric.tags[key] === value,
        ),
      );
    }

    if (metrics.length === 0) return null;

    const values = metrics.map((m) => m.value);
    const result = {
      count: metrics.length,
      min: Math.min(...values),
      max: Math.max(...values),
      value: 0,
    };

    switch (aggregation) {
      case "sum":
        result.value = values.reduce((a, b) => a + b, 0);
        break;
      case "avg":
        result.value = values.reduce((a, b) => a + b, 0) / values.length;
        break;
      case "min":
        result.value = result.min;
        break;
      case "max":
        result.value = result.max;
        break;
      case "count":
        result.value = result.count;
        break;
      case "p50":
        result.value = this.percentile(values, 0.5);
        break;
      case "p95":
        result.value = this.percentile(values, 0.95);
        break;
      case "p99":
        result.value = this.percentile(values, 0.99);
        break;
    }

    return result;
  }

  /**
   * Get metrics summary
   */
  getMetricsSummary(since?: number): Array<{
    name: string;
    count: number;
    latest: number;
    min: number;
    max: number;
    avg: number;
    type: MetricType;
    tags: MetricTags;
  }> {
    const summary: Array<{
      name: string;
      count: number;
      latest: number;
      min: number;
      max: number;
      avg: number;
      type: MetricType;
      tags: MetricTags;
    }> = [];

    for (const [name, metrics] of this.metrics.entries()) {
      const filteredMetrics = since
        ? metrics.filter((m) => m.timestamp >= since)
        : metrics;

      if (filteredMetrics.length === 0) continue;

      const values = filteredMetrics.map((m) => m.value);
      const latest = filteredMetrics[filteredMetrics.length - 1];

      summary.push({
        name,
        count: filteredMetrics.length,
        latest: latest.value,
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        type: latest.type,
        tags: latest.tags,
      });
    }

    return summary.sort((a, b) => b.latest - a.latest);
  }

  /**
   * Get metrics by tags
   */
  getMetricsByTags(tags: MetricTags): Array<{
    name: string;
    metrics: MetricData[];
  }> {
    const results: Array<{
      name: string;
      metrics: MetricData[];
    }> = [];

    for (const [name, metrics] of this.metrics.entries()) {
      const matchingMetrics = metrics.filter((metric) =>
        Object.entries(tags).every(
          ([key, value]) => metric.tags[key] === value,
        ),
      );

      if (matchingMetrics.length > 0) {
        results.push({ name, metrics: matchingMetrics });
      }
    }

    return results;
  }

  /**
   * Increment a counter metric
   */
  incrementCounter(
    name: string,
    value: number = 1,
    tags: MetricTags = {},
  ): void {
    this.record(name, value, "counter", tags);
  }

  /**
   * Record processing time
   */
  recordDuration(name: string, duration: number, tags: MetricTags = {}): void {
    this.record(name, duration, "histogram", { ...tags, unit: "ms" });
  }

  /**
   * Record memory usage
   */
  recordMemoryUsage(
    heapUsed: number,
    heapTotal: number,
    external: number,
  ): void {
    this.record("memory.heap_used", heapUsed, "gauge", { unit: "bytes" });
    this.record("memory.heap_total", heapTotal, "gauge", { unit: "bytes" });
    this.record("memory.external", external, "gauge", { unit: "bytes" });
    this.record("memory.usage_percent", (heapUsed / heapTotal) * 100, "gauge", {
      unit: "percent",
    });
  }

  /**
   * Record CPU usage
   */
  recordCpuUsage(percentage: number, user: number, system: number): void {
    this.record("cpu.usage_percent", percentage, "gauge", { unit: "percent" });
    this.record("cpu.user_percent", user, "gauge", { unit: "percent" });
    this.record("cpu.system_percent", system, "gauge", { unit: "percent" });
  }

  /**
   * Export metrics to JSON
   */
  exportToJSON(): string {
    const exportData: Record<string, MetricData[]> = {};
    for (const [name, metrics] of this.metrics.entries()) {
      exportData[name] = metrics.slice(-1000); // Export last 1000 metrics
    }
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import metrics from JSON
   */
  importFromJSON(jsonData: string): void {
    try {
      const importData = JSON.parse(jsonData) as Record<string, MetricData[]>;

      for (const [name, metrics] of Object.entries(importData)) {
        if (!this.metrics.has(name)) {
          this.metrics.set(name, []);
        }
        this.metrics.get(name)!.push(...metrics);
      }

      this.cleanupOldMetrics();
    } catch (error) {
      throw new Error(`Failed to import metrics: ${error}`);
    }
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
  }

  /**
   * Clear metrics for specific name
   */
  clearMetrics(name: string): void {
    this.metrics.delete(name);
  }

  /**
   * Get collector statistics
   */
  getStats(): {
    totalMetrics: number;
    metricNames: string[];
    memoryUsage: number;
    maxRetention: number;
  } {
    const totalMetrics = Array.from(this.metrics.values()).reduce(
      (sum, metrics) => sum + metrics.length,
      0,
    );
    const memoryUsage = JSON.stringify([...this.metrics.entries()]).length;

    return {
      totalMetrics,
      metricNames: Array.from(this.metrics.keys()),
      memoryUsage,
      maxRetention: this.options.maxRetention,
    };
  }

  private cleanupOldMetrics(): void {
    const cutoffTime = Date.now() - this.options.maxRetention;

    for (const [name, metrics] of this.metrics.entries()) {
      const filteredMetrics = metrics.filter(
        (metric) => metric.timestamp >= cutoffTime,
      );
      this.metrics.set(name, filteredMetrics);
    }
  }

  private percentile(values: number[], p: number): number {
    if (values.length === 0) return 0;
    if (values.length === 1) return values[0];

    const sorted = [...values].sort((a, b) => a - b);
    const index = (sorted.length - 1) * p;
    const lower = Math.floor(index);
    const upper = Math.ceil(index);

    if (lower === upper) {
      return sorted[lower];
    }

    const weight = index - lower;
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }
}

// Default metrics collector instance
export const defaultMetricsCollector = new MetricsCollector();

// Utility functions for common metrics
export const MetricsUtils = {
  recordOperationDuration: (
    operation: string,
    duration: number,
    tags: MetricTags = {},
  ) => {
    defaultMetricsCollector.recordDuration(
      `operation.${operation}`,
      duration,
      tags,
    );
  },

  recordError: (component: string, error: string, tags: MetricTags = {}) => {
    defaultMetricsCollector.incrementCounter("errors", 1, {
      component,
      error,
      ...tags,
    });
  },

  recordRequest: (
    endpoint: string,
    method: string,
    duration: number,
    statusCode: number,
  ) => {
    defaultMetricsCollector.recordDuration(
      `http.${method}.${endpoint}`,
      duration,
      {
        status_code: statusCode.toString(),
        method,
        endpoint,
      },
    );
  },

  recordCacheHit: (cacheName: string, hit: boolean) => {
    defaultMetricsCollector.incrementCounter("cache", 1, {
      cache: cacheName,
      type: hit ? "hit" : "miss",
    });
  },
};
