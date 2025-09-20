import { describe, it, expect } from 'vitest';

// Basic test to ensure test setup is working
describe('Test Suite Setup', () => {
  it('should run basic tests', () => {
    expect(2 + 2).toBe(4);
  });

  it('should have test utilities available', () => {
    expect(global.testUtils).toBeDefined();
    expect(global.testUtils.createMockPromise).toBeDefined();
    expect(global.testUtils.createMockTimeout).toBeDefined();
    expect(global.testUtils.createMockError).toBeDefined();
    expect(global.testUtils.createMockData).toBeDefined();
  });

  it('should have mocked performance API', () => {
    expect(global.performance.mark).toBeDefined();
    expect(global.performance.measure).toBeDefined();
    expect(global.performance.now).toBeDefined();
  });

  it('should create mock promises', async () => {
    const mockPromise = global.testUtils.createMockPromise('test-value');
    const result = await mockPromise;
    expect(result).toBe('test-value');
  });

  it('should create mock data', () => {
    const mockData = global.testUtils.createMockData(5);
    expect(mockData).toHaveLength(5);
    expect(mockData[0]).toHaveProperty('id');
    expect(mockData[0]).toHaveProperty('name');
    expect(mockData[0]).toHaveProperty('value');
  });

  it('should handle parallel execution', async () => {
    const promises = Array.from({ length: 10 }, (_, i) =>
      global.testUtils.createMockPromise(`result-${i}`)
    );

    const results = await Promise.all(promises);
    expect(results).toHaveLength(10);
    results.forEach((result, index) => {
      expect(result).toBe(`result-${index}`);
    });
  });
});
