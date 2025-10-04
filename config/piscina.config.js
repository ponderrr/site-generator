const { cpus } = require('os');
const Piscina = require('piscina');
const { DEFAULT_WORKER_CONFIG, DEFAULT_MAIN_CONFIG } = require('./memory.config.ts');

module.exports = {
  // Worker thread pool configuration
  piscina: {
    // Use all logical processors
    maxThreads: cpus().length,

    // Memory management - using centralized config
    maxQueue: 1000,
    minThreads: Math.min(4, cpus().length), // Minimum 4 threads
    maxThreads: cpus().length,

    // Worker lifecycle
    idleTimeout: 5000, // 5 seconds
    maxMemoryUsage: DEFAULT_WORKER_CONFIG.maxMemoryUsage, // From centralized config

    // Error handling
    retryOnError: true,
    maxRetries: 3,

    // Performance monitoring
    onTaskComplete: (task) => {
      console.log(`✅ Task completed in ${task.duration}ms`);
    },

    onTaskError: (error) => {
      console.error(`❌ Task failed:`, error);
    }
  },

  // Worker pool factory
  createWorkerPool: (filename) => {
    return new Piscina({
      filename,
      maxThreads: cpus().length,
      maxQueue: 1000,
      idleTimeout: 5000,
      workerData: {
        maxMemory: DEFAULT_WORKER_CONFIG.maxMemoryUsage,
        cpuCount: cpus().length
      }
    });
  },

  // Task distribution strategies
  strategies: {
    // Round-robin for CPU intensive tasks
    cpuIntensive: 'ROUND_ROBIN',

    // Least-loaded for memory intensive tasks
    memoryIntensive: 'LEAST_LOADED',

    // Priority-based for time-critical tasks
    priority: 'PRIORITY_QUEUE'
  }
};
