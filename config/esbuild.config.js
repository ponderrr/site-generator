const { cpus } = require('os');

module.exports = {
  // Performance optimizations
  target: 'es2022',
  platform: 'node',
  format: 'esm',

  // 16-thread parallel processing
  workers: 16,
  concurrency: 16,

  // Incremental builds for watch mode
  incremental: true,

  // Bundle analysis
  metafile: true,

  // Code splitting for optimal loading
  splitting: true,
  chunkNames: 'chunks/[name]-[hash]',

  // Dead code elimination
  treeShaking: true,

  // Output
  sourcemap: true,
  sourcesContent: true,

  // External dependencies
  external: [
    'node:*',
    '@node/*'
  ],

  // Worker threads for maximum CPU utilization
  workerThreads: true,
  maxWorkers: 16,

  // Memory management - using centralized config
  maxOldSpaceSize: 14336, // 14GB - matches centralized config
  gc: true,

  // Memory efficient compilation
  minifyWhitespace: false, // Keep for debugging
  minifyIdentifiers: false,
  minifySyntax: false,

  // Define environment
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  },

  // Additional performance flags
  keepNames: false,
  mangleProps: false,
  reserveProps: false
};
