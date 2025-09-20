#!/usr/bin/env node

const { spawn } = require('child_process');
const { cpus } = require('os');
const path = require('path');
const fs = require('fs');

class PerformanceSuite {
  constructor() {
    this.startTime = Date.now();
    this.cpuCount = cpus().length;
    this.maxMemory = 14336 * 1024 * 1024; // 14GB
    this.memoryThreshold = 0.85; // 85%
  }

  // Clinic.js profiling
  async profileWithClinic(tool = 'heapprofiler') {
    const clinicConfig = require('../config/clinic.config.json');

    console.log(`🔬 Starting ${tool} profiling...`);

    const args = [
      tool,
      '--config', path.join(__dirname, '../config/clinic.config.json'),
      '--',
      'node',
      '--max-old-space-size=14336',
      '--optimize-for-size',
      'scripts/build.js'
    ];

    return new Promise((resolve, reject) => {
      const child = spawn('clinic', args, {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });

      child.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ ${tool} profiling completed`);
          console.log(`📊 Report saved to: .cache/profiles/`);
          resolve();
        } else {
          reject(new Error(`${tool} failed with exit code ${code}`));
        }
      });

      child.on('error', reject);
    });
  }

  // Memory monitoring
  startMemoryMonitoring() {
    const monitor = setInterval(() => {
      const memUsage = process.memoryUsage();
      const totalMemory = require('os').totalmem();
      const usedMemory = memUsage.heapUsed + memUsage.external;
      const memoryUsagePercent = usedMemory / totalMemory;

      console.log(`💾 Memory: ${this.formatBytes(memUsage.heapUsed)} heap, ${this.formatBytes(memUsage.external)} external`);
      console.log(`📈 Usage: ${Math.round(memoryUsagePercent * 100)}% of system memory`);

      if (memoryUsagePercent > this.memoryThreshold) {
        console.warn(`⚠️  Memory usage at ${Math.round(memoryUsagePercent * 100)}% - threshold exceeded!`);
      }

      // Check for potential memory leaks
      if (memUsage.heapUsed > this.maxMemory * 0.8) {
        console.error(`🚨 Critical: Heap usage approaching limit!`);
      }
    }, 2000);

    return monitor;
  }

  // CPU monitoring
  startCpuMonitoring() {
    let lastCpuUsage = process.cpuUsage();

    const monitor = setInterval(() => {
      const cpuUsage = process.cpuUsage(lastCpuUsage);
      const totalTime = cpuUsage.user + cpuUsage.system;
      const cpuPercent = (totalTime / 1000000) / this.cpuCount; // Convert to percentage

      console.log(`⚡ CPU Usage: ${cpuPercent.toFixed(2)}% across ${this.cpuCount} cores`);

      lastCpuUsage = process.cpuUsage();
    }, 5000);

    return monitor;
  }

  // Performance benchmarking
  async runBenchmark() {
    console.log(`🚀 Running performance benchmarks...`);

    const benchmarks = {
      'TypeScript Compilation': async () => {
        const start = Date.now();
        await this.runCommand('pnpm', ['type-check']);
        return Date.now() - start;
      },

      'Build Process': async () => {
        const start = Date.now();
        await this.runCommand('node', ['scripts/build.js']);
        return Date.now() - start;
      },

      'Linting': async () => {
        const start = Date.now();
        await this.runCommand('pnpm', ['lint']);
        return Date.now() - start;
      }
    };

    const results = {};

    for (const [name, benchmark] of Object.entries(benchmarks)) {
      try {
        console.log(`⏱️  Running ${name}...`);
        results[name] = await benchmark();
        console.log(`✅ ${name}: ${results[name]}ms`);
      } catch (error) {
        console.error(`❌ ${name} failed:`, error.message);
        results[name] = 'FAILED';
      }
    }

    console.log(`\n📊 Benchmark Results:`);
    Object.entries(results).forEach(([name, time]) => {
      console.log(`   ${name}: ${time}ms`);
    });

    return results;
  }

  // Utility methods
  async runCommand(command, args) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed with exit code ${code}`));
        }
      });

      child.on('error', reject);
    });
  }

  formatBytes(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    while (bytes >= 1024 && i < units.length - 1) {
      bytes /= 1024;
      i++;
    }
    return `${Math.round(bytes * 100) / 100} ${units[i]}`;
  }

  // Main profiling suite
  async run() {
    console.log(`🎯 Starting comprehensive performance analysis...`);
    console.log(`🔧 System: ${this.cpuCount} CPU cores, ${this.formatBytes(require('os').totalmem())} RAM`);

    const monitors = [
      this.startMemoryMonitoring(),
      this.startCpuMonitoring()
    ];

    try {
      // Run benchmarks
      await this.runBenchmark();

      // Run profiling tools
      await this.profileWithClinic('heapprofiler');
      await this.profileWithClinic('doctor');

      console.log(`\n🎉 Performance analysis completed in ${Math.round((Date.now() - this.startTime) / 1000)}s`);

    } catch (error) {
      console.error(`❌ Performance analysis failed:`, error);
    } finally {
      monitors.forEach(monitor => clearInterval(monitor));
    }
  }
}

// Run if called directly
if (require.main === module) {
  const suite = new PerformanceSuite();
  suite.run().catch(console.error);
}

module.exports = PerformanceSuite;
