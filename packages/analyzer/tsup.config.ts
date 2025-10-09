import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    // Main entry
    index: "src/index.ts",

    // Worker entry - this needs to be a separate bundle
    "workers/analysis-worker": "src/workers/analysis-worker.ts",
  },
  format: ["esm"],
  dts: false, // Skip DTS generation in tsup, use tsc instead
  clean: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  outExtension: () => ({ js: ".js" }),
  shims: false,
  target: "es2022",
  platform: "node",
  external: ["piscina", "lru-cache"], // Don't bundle piscina or lru-cache
});
