/**
 * @fileoverview Integration Test Setup
 * 
 * Setup file for integration tests that use real worker pools
 * without extensive mocking.
 */

import { beforeAll, afterAll } from 'vitest';

// Increase timeout for integration tests
beforeAll(() => {
  // Set longer timeout for integration tests
  vi.setConfig({ testTimeout: 30000 });
  
  // Enable garbage collection if available
  if (global.gc) {
    console.log('✅ Garbage collection enabled for integration tests');
  } else {
    console.log('⚠️ Garbage collection not available - run with --expose-gc flag');
  }
});

afterAll(() => {
  // Cleanup any global resources
  console.log('🧹 Integration test cleanup completed');
});

// Global test utilities for integration tests
global.integrationTestUtils = {
  // Helper to create realistic test data
  createTestPage: (overrides: any = {}) => ({
    url: `https://example.com/test-${Date.now()}`,
    title: 'Test Page',
    markdown: '# Test Content\n\nThis is test content.',
    html: '<h1>Test Content</h1><p>This is test content.</p>',
    metadata: { author: 'test', date: new Date().toISOString() },
    extractedAt: new Date().toISOString(),
    ...overrides,
  }),

  // Helper to wait for worker pool to stabilize
  waitForWorkerPoolStability: async (pool: any, timeout = 5000) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const stats = pool.getPoolStats();
      if (stats.threads > 0 && stats.activeTasks === 0) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return false;
  },

  // Helper to create memory pressure
  createMemoryPressure: (sizeInMB: number) => {
    const buffer = Buffer.alloc(sizeInMB * 1024 * 1024);
    return buffer;
  },
};

type IntegrationTestUtils = typeof global.integrationTestUtils;

declare global {
  // eslint-disable-next-line no-var
  var integrationTestUtils: IntegrationTestUtils;
}

export {};
