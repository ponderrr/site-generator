import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Enable parallel test execution
    threads: true,
    maxThreads: 16,
    minThreads: 4,

    // Test environment
    environment: 'node',
    globals: true,

    // Performance optimizations
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        useAtomics: true,
        isolate: false // For better performance
      }
    },

    // Test discovery and execution
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*'
    ],

    // Integration test configuration
    testNamePattern: process.env.INTEGRATION_TESTS_ONLY 
      ? /integration/i 
      : undefined,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'coverage/**',
        'dist/**',
        '**/*.d.ts',
        '**/vitest.config.*',
        '**/jest.config.*',
        '**/test/**',
        '**/tests/**',
        'config/**',
        'scripts/**'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    },

    // Test timeouts
    testTimeout: 10000,
    hookTimeout: 10000,

    // Reporter configuration
    reporter: process.env.CI ? ['verbose', 'github-actions'] : ['verbose'],

    // Watch mode configuration
    watch: {
      include: ['src/**/*.{js,ts,jsx,tsx}'],
      exclude: ['**/node_modules/**', '**/dist/**']
    },

    // Performance optimizations
    silent: false,
    logHeapUsage: true,
    clearScreen: true,

    // Fail fast in CI
    bail: process.env.CI ? 1 : 0,

    // Retry configuration
    retry: process.env.CI ? 2 : 0,

    // Setup files
    setupFiles: ['./test/setup.ts'],

    // Suppress expected worker module errors from Piscina
    onConsoleLog(log: string) {
      // Suppress Piscina worker loading errors as we're using mocked workers
      if (log.includes('Cannot find module') && log.includes('workers/')) {
        return false;
      }
      if (log.includes('ERR_MODULE_NOT_FOUND')) {
        return false;
      }
      return true;
    },
  },

  // Environment variables
  define: {
    'import.meta.vitest': undefined
  },

  // Optimize dependencies
  optimizeDeps: {
    include: [
      'vitest',
      '@vitest/ui',
      'jsdom'
    ]
  }
});
