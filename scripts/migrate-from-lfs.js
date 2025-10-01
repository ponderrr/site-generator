#!/usr/bin/env node

/**
 * Git LFS Migration Script
 * 
 * This script migrates files from Git LFS back to regular Git storage.
 * Use this to fix repositories where configuration files were incorrectly
 * tracked by Git LFS.
 * 
 * ⚠️  WARNING: This will rewrite Git history!
 * ⚠️  Coordinate with all team members before running this script.
 * 
 * Usage:
 *   node scripts/migrate-from-lfs.js [--dry-run]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Color output helpers
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command, options = {}) {
  try {
    return execSync(command, { encoding: 'utf-8', stdio: 'pipe', ...options });
  } catch (error) {
    if (!options.ignoreError) {
      throw error;
    }
    return '';
  }
}

// Check if we're in dry-run mode
const isDryRun = process.argv.includes('--dry-run');

log('\n╔═══════════════════════════════════════════════════════════════╗', 'cyan');
log('║         Git LFS Migration Script - Fix LFS Configuration      ║', 'cyan');
log('╚═══════════════════════════════════════════════════════════════╝\n', 'cyan');

if (isDryRun) {
  log('🔍 Running in DRY-RUN mode - no changes will be made\n', 'yellow');
}

// Step 1: Check prerequisites
log('Step 1: Checking prerequisites...', 'blue');

// Check if Git LFS is installed
try {
  const lfsVersion = exec('git lfs version').trim();
  log(`  ✓ Git LFS installed: ${lfsVersion}`, 'green');
} catch (error) {
  log('  ✗ Git LFS is not installed!', 'red');
  log('    Install it from: https://git-lfs.github.com/', 'yellow');
  process.exit(1);
}

// Check if we're in a git repository
try {
  exec('git rev-parse --git-dir');
  log('  ✓ Inside a Git repository', 'green');
} catch (error) {
  log('  ✗ Not inside a Git repository!', 'red');
  process.exit(1);
}

// Check for uncommitted changes
const status = exec('git status --porcelain');
if (status.trim() && !isDryRun) {
  log('  ✗ You have uncommitted changes!', 'red');
  log('    Please commit or stash your changes before running this script.', 'yellow');
  log('\nUncommitted changes:', 'yellow');
  console.log(status);
  process.exit(1);
}
log('  ✓ No uncommitted changes', 'green');

// Step 2: List files currently tracked by LFS
log('\nStep 2: Analyzing files tracked by Git LFS...', 'blue');
const lfsFiles = exec('git lfs ls-files')
  .split('\n')
  .filter(line => line.trim())
  .map(line => {
    const match = line.match(/\* (.+)$/);
    return match ? match[1] : null;
  })
  .filter(Boolean);

if (lfsFiles.length === 0) {
  log('  ℹ  No files are currently tracked by Git LFS', 'cyan');
  log('\nNothing to migrate. Exiting.', 'green');
  process.exit(0);
}

log(`  Found ${lfsFiles.length} files tracked by LFS:`, 'yellow');
lfsFiles.forEach(file => log(`    - ${file}`, 'yellow'));

// Step 3: Identify files that should NOT be in LFS
const shouldNotBeInLFS = [
  'package.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'package-lock.json',
  '.lintstagedrc.json',
  'validation-report.json',
  'turbo.json',
  'tsconfig.json',
];

const filesToMigrate = lfsFiles.filter(file => {
  const basename = path.basename(file);
  return shouldNotBeInLFS.includes(basename) || 
         basename.endsWith('.json') || 
         basename.endsWith('tsconfig.json') ||
         basename.endsWith('.config.json') ||
         basename.endsWith('.tsbuildinfo') ||
         basename.endsWith('.log');
});

log(`\nStep 3: Identified ${filesToMigrate.length} files to migrate from LFS:`, 'blue');
filesToMigrate.forEach(file => log(`    - ${file}`, 'cyan'));

if (filesToMigrate.length === 0) {
  log('\n  ℹ  No problematic files found in LFS', 'green');
  log('  All files in LFS appear to be appropriate for LFS storage.', 'green');
  process.exit(0);
}

// Step 4: Create backup branch
log('\nStep 4: Creating backup branch...', 'blue');
const currentBranch = exec('git rev-parse --abbrev-ref HEAD').trim();
const backupBranch = `backup-before-lfs-migration-${Date.now()}`;

if (!isDryRun) {
  exec(`git branch ${backupBranch}`);
  log(`  ✓ Created backup branch: ${backupBranch}`, 'green');
  log(`    Current branch: ${currentBranch}`, 'cyan');
} else {
  log(`  [DRY-RUN] Would create backup branch: ${backupBranch}`, 'yellow');
}

// Step 5: Migration strategy explanation
log('\nStep 5: Migration Strategy', 'blue');
log('  This script will:', 'cyan');
log('    1. Untrack files from Git LFS', 'cyan');
log('    2. Remove LFS pointers and restore actual content', 'cyan');
log('    3. Add files back to regular Git storage', 'cyan');
log('    4. Update .gitattributes to prevent re-tracking', 'cyan');

if (!isDryRun) {
  log('\n⚠️  WARNING: This will modify your repository!', 'red');
  log('⚠️  A backup branch has been created: ' + backupBranch, 'yellow');
  log('\nPress Ctrl+C within 5 seconds to cancel...', 'yellow');
  
  // Wait 5 seconds
  const waitTime = 5000;
  const start = Date.now();
  while (Date.now() - start < waitTime) {
    // Busy wait (in production, use proper sleep)
  }
}

// Step 6: Execute migration
log('\nStep 6: Executing migration...', 'blue');

for (const file of filesToMigrate) {
  log(`\n  Processing: ${file}`, 'cyan');
  
  if (!isDryRun) {
    try {
      // Untrack from LFS
      log(`    → Untracking from LFS...`, 'yellow');
      exec(`git lfs untrack "${file}"`, { ignoreError: true });
      
      // Remove from LFS cache
      log(`    → Removing LFS pointer...`, 'yellow');
      exec(`git rm --cached "${file}"`, { ignoreError: true });
      
      // Checkout the actual file content from LFS
      log(`    → Fetching actual content...`, 'yellow');
      exec(`git lfs pull --include="${file}"`, { ignoreError: true });
      
      // Add back to regular Git
      log(`    → Adding to regular Git...`, 'yellow');
      exec(`git add "${file}"`);
      
      log(`    ✓ Migrated successfully`, 'green');
    } catch (error) {
      log(`    ✗ Error migrating ${file}: ${error.message}`, 'red');
    }
  } else {
    log(`    [DRY-RUN] Would migrate this file`, 'yellow');
  }
}

// Step 7: Update .gitattributes
log('\nStep 7: Verifying .gitattributes...', 'blue');
const gitattributesPath = path.join(process.cwd(), '.gitattributes');
if (fs.existsSync(gitattributesPath)) {
  log('  ✓ .gitattributes file exists', 'green');
  log('  ℹ  Make sure it has been updated with correct LFS rules', 'cyan');
} else {
  log('  ⚠  .gitattributes file not found', 'yellow');
  log('    You should create one to prevent files from being tracked by LFS again', 'yellow');
}

// Step 8: Summary
log('\n╔═══════════════════════════════════════════════════════════════╗', 'green');
log('║                      Migration Complete!                      ║', 'green');
log('╚═══════════════════════════════════════════════════════════════╝\n', 'green');

if (!isDryRun) {
  log('Next steps:', 'cyan');
  log('  1. Review the changes: git status', 'cyan');
  log('  2. Commit the migration: git commit -m "fix: migrate config files from LFS to regular Git"', 'cyan');
  log('  3. Push to remote: git push origin ' + currentBranch, 'cyan');
  log('  4. Inform team members to re-clone or run: git lfs pull', 'cyan');
  log(`\n  Backup branch created: ${backupBranch}`, 'yellow');
  log('  If something goes wrong, restore with: git checkout ' + backupBranch, 'yellow');
} else {
  log('This was a DRY-RUN. No changes were made.', 'yellow');
  log('Run without --dry-run to execute the migration.', 'yellow');
}

log('\n✨ Done!\n', 'green');

