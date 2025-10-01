const fs = require('fs');
const path = require('path');

// Copy worker files to dist
const workersDir = path.join(__dirname, 'src', 'workers');
const distWorkersDir = path.join(__dirname, 'dist', 'workers');

// Create dist/workers directory if it doesn't exist
if (!fs.existsSync(distWorkersDir)) {
  fs.mkdirSync(distWorkersDir, { recursive: true });
}

// Copy all worker files
const workerFiles = fs.readdirSync(workersDir);
workerFiles.forEach(file => {
  const srcPath = path.join(workersDir, file);
  const destPath = path.join(distWorkersDir, file.replace('.ts', '.js'));
  
  // Read the TypeScript file and write as JavaScript (simple copy for now)
  const content = fs.readFileSync(srcPath, 'utf8');
  fs.writeFileSync(destPath, content);
  console.log(`Copied ${file} to dist/workers/`);
});

console.log('Worker files copied successfully!');







