const { cpus } = require('os');

module.exports = {
  jsc: {
    parser: {
      syntax: 'typescript',
      tsx: true,
      decorators: true,
      dynamicImport: true
    },
    target: 'es2022',
    loose: false,

    // Performance optimizations
    experimental: {
      // Use all 16 logical processors
      cpus: 16,
      optimizeHygiene: true,
      plugins: [],
      parallel: true
    },

    // Memory management
    keepClassNames: false,
    externalHelpers: false,

    transform: {
      // Enable all optimizations
      optimizer: {
        globals: {
          vars: {
            'process.env.NODE_ENV': 'development'
          }
        },
        simplify: true,
        deadCodeElimination: true,
        threads: 8 // Use 8 threads for optimization
      },

      // React optimizations
      react: {
        runtime: 'automatic',
        development: process.env.NODE_ENV === 'development',
        refresh: process.env.NODE_ENV === 'development'
      }
    },

    // Module system
    module: {
      type: 'es6',
      strict: true,
      strictMode: true,
      lazy: false,
      noInterop: false
    }
  },

  // Source maps for debugging
  sourceMaps: true,
  inlineSourcesContent: true,

  // Memory efficient compilation
  minify: false, // Will be handled by esbuild in production

  // Experimental features for performance
  experimental: {
    ...module.exports.jsc.experimental,
    // Enable parallel parsing
    parallelParsing: true
  },

  // Additional compression settings
  compress: {
    threads: 8, // Use 8 threads for compression
    deadCodeElimination: true,
    unused: true,
    booleans: true,
    dropConsole: process.env.NODE_ENV === 'production',
    dropDebugger: process.env.NODE_ENV === 'production'
  }
};
