#!/usr/bin/env node

const { spawn } = require('child_process');
const os = require('os');
const v8 = require('v8');

class PerformanceMonitor {
  constructor() {
    this.interval = setInterval(() => this.collectMetrics(), 1000);
    this.startTime = Date.now();
    this.memoryThreshold = 0.85; // 85% as specified
  }

  collectMetrics() {
    const memUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const usedMemory = memUsage.heapUsed + memUsage.external;
    const memoryUsagePercent = usedMemory / totalMemory;

    const cpuUsage = process.cpuUsage();

    console.log(`📊 Performance Metrics:`);
    console.log(`   CPU: ${this.formatBytes(memUsage.heapUsed)} heap, ${this.formatBytes(memUsage.external)} external`);
    console.log(`   Memory: ${Math.round(memoryUsagePercent * 100)}% of system memory`);
    console.log(`   Runtime: ${Math.round((Date.now() - this.startTime) / 1000)}s`);
    console.log(`   User CPU: ${cpuUsage.user / 1000}ms, System CPU: ${cpuUsage.system / 1000}ms`);

    if (memoryUsagePercent > this.memoryThreshold) {
      console.warn(`⚠️  Memory usage at ${Math.round(memoryUsagePercent * 100)}% - approaching 85% threshold!`);
    }

    // Check for memory leaks
    const heapStats = v8.getHeapStatistics();
    if (heapStats.used_heap_size > heapStats.total_heap_size * 0.9) {
      console.warn(`⚠️  Heap usage very high: ${Math.round(heapStats.used_heap_size / heapStats.total_heap_size * 100)}%`);
    }
  }

  formatBytes(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    while (bytes >= 1024 && i < units.length - 1) {
      bytes /= 1024;
      i++;
    }
    return `${Math.round(bytes * 100) / 100} ${units[i]}`;
  }

  stop() {
    clearInterval(this.interval);
  }
}

// Start monitoring if this script is run directly
if (require.main === module) {
  const monitor = new PerformanceMonitor();

  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping performance monitor...');
    monitor.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Stopping performance monitor...');
    monitor.stop();
    process.exit(0);
  });

  console.log('🎯 Performance monitoring started...');
  console.log('   Press Ctrl+C to stop');
}
