#!/usr/bin/env node

const { spawn } = require('child_process');
const { cpus } = require('os');
const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';
const maxOldSpaceSize = 14336; // 14GB

console.log(`🚀 Starting ${isProduction ? 'production' : 'development'} build`);
console.log(`📊 Using ${cpus().length} CPU cores`);
console.log(`💾 Memory limit: ${maxOldSpaceSize}MB`);

// Build command with optimized Node.js flags
const nodeFlags = [
  `--max-old-space-size=${maxOldSpaceSize}`,
  '--enable-source-maps',
  '--experimental-specifier-resolution=node'
];

const buildCommand = isProduction ? 'turbo' : 'turbo';
const buildArgs = isProduction ? ['build'] : ['dev'];

const child = spawn('node', [...nodeFlags, buildCommand, ...buildArgs], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_OPTIONS: nodeFlags.join(' '),
    FORCE_COLOR: '1'
  }
});

child.on('close', (code) => {
  console.log(`\n✅ Build completed with exit code ${code}`);
  process.exit(code);
});

child.on('error', (error) => {
  console.error('❌ Build failed:', error);
  process.exit(1);
});
