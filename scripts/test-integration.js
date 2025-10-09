#!/usr/bin/env node
import { execSync } from 'child_process';
import { existsSync, rmSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';

console.log('\n🧪 Running Integration Tests...\n');

const TEST_URL = 'https://example.com';
const EXTRACT_DIR = './test-integration-extract';
const ANALYSIS_DIR = './test-integration-analysis';

// Cleanup before starting
function cleanup() {
  if (existsSync(EXTRACT_DIR)) rmSync(EXTRACT_DIR, { recursive: true });
  if (existsSync(ANALYSIS_DIR)) rmSync(ANALYSIS_DIR, { recursive: true });
}

// Run command and capture output
function runCommand(cmd, description) {
  console.log(`\n📌 ${description}`);
  console.log(`   Command: ${cmd}\n`);
  try {
    execSync(cmd, { encoding: 'utf-8', stdio: 'inherit' });
    console.log('   ✅ Success\n');
    return true;
  } catch (error) {
    console.error('   ❌ Failed\n');
    return false;
  }
}

// Verify file exists and has content
function verifyFile(filepath, description) {
  console.log(`\n🔍 Verifying: ${description}`);
  console.log(`   Path: ${filepath}`);
  
  if (!existsSync(filepath)) {
    console.error('   ❌ File does not exist\n');
    return false;
  }
  
  const content = readFileSync(filepath, 'utf-8');
  const size = Buffer.byteLength(content, 'utf-8');
  
  if (size === 0) {
    console.error('   ❌ File is empty\n');
    return false;
  }
  
  console.log(`   ✅ File exists (${(size / 1024).toFixed(2)} KB)\n`);
  return true;
}

// Main test flow
async function runTests() {
  let passCount = 0;
  let failCount = 0;

  console.log('═'.repeat(60));
  console.log('  SITE GENERATOR - INTEGRATION TEST SUITE');
  console.log('═'.repeat(60));

  // Test 1: Build all packages
  if (runCommand('pnpm build', 'Test 1: Build all packages')) {
    passCount++;
  } else {
    failCount++;
    console.error('\n❌ Build failed - cannot continue tests\n');
    process.exit(1);
  }

  // Test 2: Extract content
  cleanup();
  if (runCommand(
    `node packages/cli/dist/index.js extract --url ${TEST_URL} --output ${EXTRACT_DIR} --verbose`,
    'Test 2: Extract content from URL'
  )) {
    passCount++;
  } else {
    failCount++;
  }

  // Test 3: Verify extracted files
  const extractedFiles = [
    join(EXTRACT_DIR, 'example_com'),
  ];
  
  if (existsSync(extractedFiles[0])) {
    console.log('\n🔍 Checking extracted files...');
    const files = readdirSync(extractedFiles[0]);
    const mdFiles = files.filter(f => f.endsWith('.md'));
    const jsonFiles = files.filter(f => f.includes('metadata') || (f.endsWith('.json') && !f.includes('metadata')));
    
    if (mdFiles.length > 0 || jsonFiles.filter(f => !f.includes('metadata')).length > 0) {
      console.log(`   ✅ Found ${mdFiles.length} markdown file(s) and ${jsonFiles.length} JSON file(s)\n`);
      passCount++;
    } else {
      console.error('   ❌ Expected files not found\n');
      failCount++;
    }
  } else {
    console.error('\n❌ Extracted directory not created\n');
    failCount++;
  }

  // Test 4: Analyze content
  if (runCommand(
    `node packages/cli/dist/index.js analyze --input ${EXTRACT_DIR} --output ${ANALYSIS_DIR} --all --verbose`,
    'Test 4: Analyze extracted content'
  )) {
    passCount++;
  } else {
    failCount++;
  }

  // Test 5: Verify analysis files
  if (existsSync(join(ANALYSIS_DIR, 'example_com'))) {
    console.log('\n🔍 Checking analysis files...');
    const files = readdirSync(join(ANALYSIS_DIR, 'example_com'));
    const analysisFiles = files.filter(f => f.endsWith('_analysis.json'));
    
    if (analysisFiles.length > 0) {
      console.log(`   ✅ Found ${analysisFiles.length} analysis file(s)\n`);
      passCount++;
    } else {
      console.error('   ❌ Analysis files not found\n');
      failCount++;
    }
  } else {
    console.error('\n❌ Analysis directory not created\n');
    failCount++;
  }

  // Test 6: Verify summary
  if (verifyFile(join(ANALYSIS_DIR, 'summary.json'), 'Summary report')) {
    try {
      const summary = JSON.parse(readFileSync(join(ANALYSIS_DIR, 'summary.json'), 'utf-8'));
      console.log('   Summary data:');
      console.log(`     - Total files: ${summary.totalFiles}`);
      console.log(`     - Average quality: ${summary.averageQuality?.toFixed(1)}`);
      console.log(`     - Total words: ${summary.totalWords}`);
      passCount++;
    } catch {
      console.error('   ❌ Could not parse summary JSON\n');
      failCount++;
    }
  } else {
    failCount++;
  }

  // Final results
  console.log('\n' + '═'.repeat(60));
  console.log('  TEST RESULTS');
  console.log('═'.repeat(60));
  console.log(`  ✅ Passed: ${passCount}`);
  console.log(`  ❌ Failed: ${failCount}`);
  console.log(`  📊 Total:  ${passCount + failCount}`);
  console.log('═'.repeat(60) + '\n');

  // Cleanup
  console.log('🧹 Cleaning up test files...\n');
  cleanup();

  if (failCount > 0) {
    console.error('❌ Integration tests failed\n');
    process.exit(1);
  } else {
    console.log('✅ All integration tests passed!\n');
    process.exit(0);
  }
}

// Run tests
runTests().catch(error => {
  console.error('\n❌ Test runner error:', error);
  cleanup();
  process.exit(1);
});
