import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Verify worker files exist in dist (tsup should have built them)
const distWorkersDir = join(__dirname, 'dist', 'workers');

if (!existsSync(distWorkersDir)) {
  console.error('❌ Worker files not found in dist/workers/');
  console.error('   This might indicate a tsup configuration issue.');
  process.exit(1);
}

// Check for the expected worker file
const workerFile = join(distWorkersDir, 'analysis-worker.js');
if (existsSync(workerFile)) {
  console.log('✓ Worker files verified in dist/workers/');
} else {
  console.error('❌ analysis-worker.js not found in dist/workers/');
  console.error('   Expected:', workerFile);
  process.exit(1);
}

console.log('✓ Worker build verification complete!');







