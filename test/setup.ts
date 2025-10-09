import { beforeAll, vi } from "vitest";

// Global test setup
beforeAll(() => {
  // Set up global test environment
  process.env.NODE_ENV = "test";

  // Mock performance monitoring
  global.performance = {
    ...global.performance,
    mark: vi.fn(),
    measure: vi.fn(),
    now: vi.fn(() => Date.now()),
  };

  // Mock console methods for cleaner test output
  const originalConsole = global.console;
  const mockConsole = {
    ...originalConsole,
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  };

  // Only override in test environment
  if (process.env.NODE_ENV === "test") {
    global.console = mockConsole;
  }

  // Clean up after all tests
  process.on("exit", () => {
    global.console = originalConsole;
  });

  // Suppress expected Piscina worker loading errors
  // These occur because we mock Piscina to fail and use direct analysis
  const originalListeners = process.listeners("uncaughtException");
  process.removeAllListeners("uncaughtException");

  process.on("uncaughtException", (error: Error) => {
    // Suppress expected worker module errors
    const errorMessage = error.message || "";
    const isWorkerError =
      errorMessage.includes("Cannot find module") &&
      (errorMessage.includes("workers/") || errorMessage.includes("worker.js"));

    if (!isWorkerError) {
      // Re-emit non-worker errors to original handlers
      originalListeners.forEach((listener) => listener(error));
    }
    // Silently ignore worker loading errors
  });
});

// Global test utilities
global.testUtils = {
  // Helper to create mock promises
  createMockPromise: (resolveValue?: any, rejectValue?: any) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (rejectValue) {
          reject(rejectValue);
        } else {
          resolve(resolveValue);
        }
      }, 0);
    });
  },

  // Helper to create mock timeouts
  createMockTimeout: (ms: number = 100) => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  },

  // Helper to create mock errors
  createMockError: (message: string = "Test error") => {
    return new Error(message);
  },

  // Helper to create mock data
  createMockData: (size: number = 100) => {
    return Array.from({ length: size }, (_, i) => ({
      id: i,
      name: `Test item ${i}`,
      value: Math.random(),
    }));
  },
};

// Mock filesystem operations for tests
vi.mock("fs", () => ({
  default: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
    readdirSync: vi.fn(),
  },
}));

// Mock path operations
vi.mock("path", () => ({
  default: {
    join: vi.fn((...args) => args.join("/")),
    resolve: vi.fn((...args) => args.join("/")),
    dirname: vi.fn((p) => p.split("/").slice(0, -1).join("/")),
    basename: vi.fn((p) => p.split("/").pop()),
    extname: vi.fn((p) => p.split(".").pop()),
  },
}));

// Mock os operations
vi.mock("os", () => ({
  default: {
    cpus: vi.fn(() =>
      Array.from({ length: 16 }, (_, i) => ({ model: `CPU ${i}` })),
    ),
    totalmem: vi.fn(() => 16 * 1024 * 1024 * 1024), // 16GB
    freemem: vi.fn(() => 8 * 1024 * 1024 * 1024), // 8GB
    platform: vi.fn(() => "test"),
    arch: vi.fn(() => "x64"),
  },
}));

// Mock crypto operations
vi.mock("crypto", () => ({
  default: {
    randomBytes: vi.fn(() => Buffer.from("mock-random-bytes")),
    createHash: vi.fn(() => ({
      update: vi.fn(),
      digest: vi.fn(() => "mock-hash"),
    })),
  },
}));

// Mock stream operations
vi.mock("stream", () => ({
  default: {
    Readable: vi.fn(),
    Writable: vi.fn(),
    Transform: vi.fn(),
    Duplex: vi.fn(),
  },
}));
