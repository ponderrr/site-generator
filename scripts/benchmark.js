#!/usr/bin/env node
import { execSync } from 'child_process';
import { existsSync, rmSync } from 'fs';

console.log('\n⚡ Performance Benchmarks\n');

const URLS = [
  'https://example.com',
  'https://example.org',
  'https://example.net'
];

function benchmark(label, fn) {
  console.log(`\n📊 ${label}`);
  const start = Date.now();
  fn();
  const duration = Date.now() - start;
  console.log(`   Duration: ${(duration / 1000).toFixed(2)}s`);
  return duration;
}

// Cleanup
if (existsSync('./bench-extract')) rmSync('./bench-extract', { recursive: true });
if (existsSync('./bench-analysis')) rmSync('./bench-analysis', { recursive: true });

// Benchmark extraction
console.log('\n' + '═'.repeat(50));
console.log('  EXTRACTION BENCHMARKS');
console.log('═'.repeat(50));

const extractTimes = [];
for (const url of URLS) {
  const time = benchmark(`Extract: ${url}`, () => {
    execSync(`node packages/cli/dist/index.js extract --url ${url} --output ./bench-extract`, {
      stdio: 'ignore'
    });
  });
  extractTimes.push(time);
}

const avgExtract = extractTimes.reduce((a, b) => a + b, 0) / extractTimes.length;
console.log(`\n⏱️  Average extraction time: ${(avgExtract / 1000).toFixed(2)}s`);

// Benchmark analysis
console.log('\n' + '═'.repeat(50));
console.log('  ANALYSIS BENCHMARKS');
console.log('═'.repeat(50));

const analyzeTime = benchmark('Analyze all extracted content', () => {
  execSync('node packages/cli/dist/index.js analyze --input ./bench-extract --output ./bench-analysis --all', {
    stdio: 'ignore'
  });
});

console.log('\n' + '═'.repeat(50));
console.log('  SUMMARY');
console.log('═'.repeat(50));
console.log(`  URLs processed: ${URLS.length}`);
console.log(`  Avg extraction: ${(avgExtract / 1000).toFixed(2)}s per URL`);
console.log(`  Total analysis: ${(analyzeTime / 1000).toFixed(2)}s`);
console.log(`  Total pipeline: ${((avgExtract * URLS.length + analyzeTime) / 1000).toFixed(2)}s`);
console.log('═'.repeat(50) + '\n');

// Cleanup
rmSync('./bench-extract', { recursive: true });
rmSync('./bench-analysis', { recursive: true });
