#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Create both dist/workers and workers directories if they don't exist
const distWorkersDir = path.join(__dirname, 'dist', 'workers');
const rootWorkersDir = path.join(__dirname, 'workers');

if (!fs.existsSync(distWorkersDir)) {
  fs.mkdirSync(distWorkersDir, { recursive: true });
}

if (!fs.existsSync(rootWorkersDir)) {
  fs.mkdirSync(rootWorkersDir, { recursive: true });
}

// Copy all worker files
const srcWorkersDir = path.join(__dirname, 'src', 'workers');
const files = fs.readdirSync(srcWorkersDir);

files.forEach(file => {
  if (file.endsWith('.js')) {
    const src = path.join(srcWorkersDir, file);
    
    // Copy to dist/workers/
    const distDest = path.join(distWorkersDir, file);
    fs.copyFileSync(src, distDest);
    console.log(`✅ Copied ${file} to dist/workers/`);
    
    // Copy to workers/ (root level)
    const rootDest = path.join(rootWorkersDir, file);
    fs.copyFileSync(src, rootDest);
    console.log(`✅ Copied ${file} to workers/`);
  }
});

console.log('✨ Worker files copied successfully!');








