module.exports = {
  // Chrome DevTools Protocol configuration
  chrome: {
    port: 9222,
    host: 'localhost',

    // Debugging options
    debug: {
      breakOnFirstStatement: false,
      breakOnUncaughtException: true,
      breakOnUnhandledRejection: true
    },

    // Performance monitoring
    performance: {
      enable: true,
      metrics: {
        // JavaScript execution time
        scriptDuration: true,

        // Layout and rendering
        layoutDuration: true,
        recalcStyleDuration: true,
        updateLayerTreeDuration: true,

        // Memory usage
        usedJSHeapSize: true,
        totalJSHeapSize: true,
        jsHeapSizeLimit: true,

        // Network activity
        networkRequests: true,
        networkBytes: true
      },

      // CPU profiling
      cpu: {
        enable: true,
        sampleInterval: 1000, // 1ms
        maxSamples: 100000
      }
    },

    // Network monitoring
    network: {
      enable: true,
      maxResourceBufferSize: 100 * 1024 * 1024, // 100MB
      maxTotalBufferSize: 500 * 1024 * 1024 // 500MB
    },

    // Console logging
    console: {
      enable: true,
      maxConsoleMessages: 1000,
      categories: ['log', 'warn', 'error', 'info', 'debug']
    }
  },

  // Inspector options
  inspector: {
    port: 9229,
    host: 'localhost',
    protocol: 'inspector',

    // WebSocket options
    maxConnections: 10,
    connectionTimeout: 30000
  },

  // V8 profiling
  v8: {
    // Enable V8 profiler
    enableProfiler: true,

    // Sampling heap profiler
    enableSamplingHeapProfiler: true,

    // Startup profiler
    enableStartupProfiler: true,

    // CPU profiler
    enableCPUProfiler: true
  },

  // Remote debugging
  remoteDebugging: {
    enable: process.env.NODE_ENV === 'development',
    port: 9222,
    address: '0.0.0.0'
  }
};
