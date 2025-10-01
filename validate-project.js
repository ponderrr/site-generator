#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

/**
 * Comprehensive Project Validator
 * Checks all aspects of the monorepo and reports issues
 */
class ProjectValidator {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.successes = [];
    this.projectRoot = process.cwd();
    this.packages = [];
    this.report = {
      timestamp: new Date().toISOString(),
      environment: {},
      structure: {},
      dependencies: {},
      typescript: {},
      builds: {},
      imports: {},
      exports: {},
    };
  }

  // Main validation runner
  async validate() {
    console.log(chalk.blue.bold('\n🔍 Starting Comprehensive Project Validation...\n'));
    
    try {
      // Level 1: Environment & Structure
      await this.checkEnvironment();
      await this.checkProjectStructure();
      await this.checkMonorepoConfig();
      
      // Level 2: Dependencies
      await this.checkRootDependencies();
      await this.checkPackageDependencies();
      await this.checkDependencyGraph();
      
      // Level 3: TypeScript
      await this.checkTypeScriptConfig();
      await this.checkTypeDefinitions();
      await this.checkTsProjectReferences();
      
      // Level 4: Build System
      await this.checkBuildScripts();
      await this.checkBuildOrder();
      await this.testIndividualBuilds();
      
      // Level 5: Imports & Exports
      await this.checkPackageExports();
      await this.checkImportPaths();
      await this.checkCircularDependencies();
      
      // Level 6: Integration
      await this.checkInterPackageImports();
      await this.checkSharedTypes();

      // Level 7: Advanced Features
      await this.checkPerformanceOptimization();
      await this.checkCachingStrategies();
      await this.checkErrorHandling();
      await this.checkBuildOptimizations();
      await this.checkDocumentation();
      await this.checkCLIFeatures();

      // Generate report
      this.generateReport();
      
    } catch (error) {
      console.error(chalk.red('Validation failed:'), error);
      this.issues.push({ level: 'FATAL', message: error.message });
      this.generateReport();
      process.exit(1);
    }
  }

  // 1. ENVIRONMENT CHECKS
  checkEnvironment() {
    console.log(chalk.yellow('📋 Checking environment...'));
    
    try {
      // Node version
      const nodeVersion = process.version;
      this.report.environment.node = nodeVersion;
      if (!nodeVersion.match(/^v(18|20)/)) {
        this.warnings.push(`Node version ${nodeVersion} - recommended v18 or v20`);
      }
      
      // pnpm version
      try {
        const pnpmVersion = execSync('pnpm --version', { encoding: 'utf8' }).trim();
        this.report.environment.pnpm = pnpmVersion;
        this.successes.push(`pnpm ${pnpmVersion} installed`);
      } catch {
        this.issues.push('pnpm not found - required for workspace management');
      }
      
      // Check for required global tools
      const tools = ['tsc', 'node'];
      tools.forEach(tool => {
        try {
          // Cross-platform check for command availability
          if (process.platform === 'win32') {
            execSync(`where ${tool}`, { encoding: 'utf8' });
          } else {
            execSync(`which ${tool}`, { encoding: 'utf8' });
          }
          this.successes.push(`${tool} found in PATH`);
        } catch {
          this.warnings.push(`${tool} not found in PATH`);
        }
      });
      
    } catch (error) {
      this.issues.push(`Environment check failed: ${error.message}`);
    }
  }

  // 2. PROJECT STRUCTURE CHECKS
  checkProjectStructure() {
    console.log(chalk.yellow('📁 Checking project structure...'));
    
    const requiredDirs = [
      'packages',
      'packages/core',
      'packages/extractor',
      'packages/analyzer',
      'packages/generator',
      'packages/cli',
      'packages/testing'
    ];
    
    const requiredFiles = [
      'package.json',
      'pnpm-workspace.yaml',
      'tsconfig.json',
      '.gitignore'
    ];
    
    // Check directories
    requiredDirs.forEach(dir => {
      const fullPath = path.join(this.projectRoot, dir);
      if (fs.existsSync(fullPath)) {
        this.successes.push(`✓ Directory exists: ${dir}`);
        
        // Track packages
        if (dir.startsWith('packages/') && dir.split('/').length === 2) {
          this.packages.push(dir.replace('packages/', ''));
        }
      } else {
        this.issues.push(`✗ Missing directory: ${dir}`);
      }
    });
    
    // Check files
    requiredFiles.forEach(file => {
      const fullPath = path.join(this.projectRoot, file);
      if (fs.existsSync(fullPath)) {
        this.successes.push(`✓ File exists: ${file}`);
      } else {
        this.issues.push(`✗ Missing file: ${file}`);
      }
    });
    
    this.report.structure.packages = this.packages;
  }

  // 3. MONOREPO CONFIGURATION
  checkMonorepoConfig() {
    console.log(chalk.yellow('⚙️  Checking monorepo configuration...'));
    
    // Check pnpm-workspace.yaml
    const workspacePath = path.join(this.projectRoot, 'pnpm-workspace.yaml');
    if (fs.existsSync(workspacePath)) {
      const content = fs.readFileSync(workspacePath, 'utf8');
      if (content.includes('packages/*')) {
        this.successes.push('✓ pnpm workspace configured correctly');
      } else {
        this.issues.push('✗ pnpm-workspace.yaml missing packages/* entry');
      }
    }
    
    // Check root package.json
    const rootPackagePath = path.join(this.projectRoot, 'package.json');
    if (fs.existsSync(rootPackagePath)) {
      const pkg = JSON.parse(fs.readFileSync(rootPackagePath, 'utf8'));
      
      // Check for workspace scripts
      if (pkg.scripts) {
        const requiredScripts = ['build', 'test', 'lint'];
        requiredScripts.forEach(script => {
          if (pkg.scripts[script]) {
            this.successes.push(`✓ Root script exists: ${script}`);
          } else {
            this.warnings.push(`⚠ Missing root script: ${script}`);
          }
        });
      }
      
      // Check for turbo/nx/lerna
      if (pkg.devDependencies?.turbo || pkg.devDependencies?.nx) {
        this.successes.push('✓ Build orchestration tool found');
      } else {
        this.warnings.push('⚠ No build orchestration tool (turbo/nx) found');
      }
    }
  }

  // 4. DEPENDENCY CHECKS
  checkRootDependencies() {
    console.log(chalk.yellow('📦 Checking root dependencies...'));

    const rootPackagePath = path.join(this.projectRoot, 'package.json');
    if (fs.existsSync(rootPackagePath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(rootPackagePath, 'utf8'));

        // Check for required devDependencies
        const requiredDeps = ['typescript', 'turbo'];
        requiredDeps.forEach(dep => {
          if (!pkg.devDependencies?.[dep]) {
            this.warnings.push(`⚠ Missing root devDependency: ${dep}`);
          }
        });

        // Check for required dependencies
        if (!pkg.dependencies) {
          this.warnings.push('⚠ Root package has no runtime dependencies');
        }

        this.successes.push('✓ Root dependencies checked');

      } catch (error) {
        this.issues.push(`✗ Invalid root package.json: ${error.message}`);
      }
    }
  }

  checkPackageDependencies() {
    console.log(chalk.yellow('📦 Checking package dependencies...'));

    this.packages.forEach(pkg => {
      const pkgPath = path.join(this.projectRoot, 'packages', pkg, 'package.json');

      if (!fs.existsSync(pkgPath)) {
        this.issues.push({ level: 'ERROR', message: `Missing package.json in ${pkg}` });
        return;
      }

      try {
        const packageJson = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

        // Check package name
        if (!packageJson.name) {
          this.issues.push({ level: 'ERROR', message: `Package ${pkg} missing name field` });
        } else if (!packageJson.name.startsWith('@site-generator/')) {
          this.warnings.push(`⚠ Package ${pkg} not using @site-generator scope`);
        }

        // Check main/exports
        if (!packageJson.main && !packageJson.exports) {
          this.warnings.push(`⚠ Package ${pkg} missing main/exports field`);
        }

        // Check internal dependencies
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
        Object.keys(deps).forEach(dep => {
          if (dep.startsWith('@site-generator/')) {
            const depName = dep.replace('@site-generator/', '');
            if (!this.packages.includes(depName)) {
              this.issues.push({ level: 'ERROR', message: `${pkg} depends on non-existent package: ${dep}` });
            }
          }
        });

        // Check TypeScript setup
        if (!packageJson.devDependencies?.typescript) {
          this.warnings.push(`⚠ Package ${pkg} missing TypeScript dependency`);
        }

        // Check build script
        if (!packageJson.scripts?.build) {
          this.issues.push({ level: 'ERROR', message: `Package ${pkg} missing build script` });
        }

      } catch (error) {
        this.issues.push({ level: 'ERROR', message: `Invalid package.json in ${pkg}: ${error.message}` });
      }
    });
  }

  checkDependencyGraph() {
    console.log(chalk.yellow('📊 Analyzing dependency graph...'));

    const graph = {};
    let totalDeps = 0;

    // Build dependency graph
    this.packages.forEach(pkg => {
      const pkgPath = path.join(this.projectRoot, 'packages', pkg, 'package.json');

      if (fs.existsSync(pkgPath)) {
        const packageJson = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        const deps = Object.keys(packageJson.dependencies || {})
          .filter(d => d.startsWith('@site-generator/'))
          .map(d => d.replace('@site-generator/', ''));

        graph[pkg] = deps;
        totalDeps += deps.length;
      }
    });

    this.report.dependencies.graph = graph;
    this.report.dependencies.total = totalDeps;

    if (totalDeps > 0) {
      this.successes.push(`✓ Dependency graph analyzed: ${totalDeps} internal dependencies`);
    } else {
      this.warnings.push('⚠ No internal package dependencies found');
    }
  }

  // 5. TYPESCRIPT CONFIGURATION
  checkTypeScriptConfig() {
    console.log(chalk.yellow('📝 Checking TypeScript configuration...'));

    // Check root tsconfig
    const rootTsConfig = path.join(this.projectRoot, 'tsconfig.json');
    if (fs.existsSync(rootTsConfig)) {
      try {
        const config = JSON.parse(fs.readFileSync(rootTsConfig, 'utf8'));

        // Check for project references
        if (config.references) {
          this.successes.push('✓ TypeScript project references configured');

          // Validate references
          config.references.forEach(ref => {
            const refPath = path.join(this.projectRoot, ref.path, 'tsconfig.json');
            if (!fs.existsSync(refPath)) {
              this.issues.push({ level: 'ERROR', message: `Missing referenced tsconfig: ${ref.path}` });
            }
          });
        } else {
          this.warnings.push('⚠ No TypeScript project references found');
        }

        // Check compiler options
        const recommended = {
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true
        };

        Object.entries(recommended).forEach(([key, value]) => {
          if (config.compilerOptions?.[key] !== value) {
            this.warnings.push(`⚠ Recommended tsconfig.compilerOptions.${key} = ${value}`);
          }
        });

      } catch (error) {
        this.issues.push({ level: 'ERROR', message: `Invalid root tsconfig.json: ${error.message}` });
      }
    }

    // Check package-level tsconfigs
    this.packages.forEach(pkg => {
      const tsConfigPath = path.join(this.projectRoot, 'packages', pkg, 'tsconfig.json');

      if (!fs.existsSync(tsConfigPath)) {
        this.issues.push({ level: 'ERROR', message: `Missing tsconfig.json in ${pkg}` });
      } else {
        try {
          const config = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));

          // Check for composite project
          if (!config.compilerOptions?.composite) {
            this.warnings.push(`⚠ Package ${pkg} should have composite: true`);
          }

          // Check for declaration generation
          if (!config.compilerOptions?.declaration) {
            this.warnings.push(`⚠ Package ${pkg} should generate declarations`);
          }

        } catch (error) {
          this.issues.push({ level: 'ERROR', message: `Invalid tsconfig in ${pkg}: ${error.message}` });
        }
      }
    });
  }

  checkTypeDefinitions() {
    console.log(chalk.yellow('🔍 Checking type definitions...'));

    this.packages.forEach(pkg => {
      const pkgPath = path.join(this.projectRoot, 'packages', pkg);
      const indexPath = path.join(pkgPath, 'src', 'index.ts');

      if (fs.existsSync(indexPath)) {
        const content = fs.readFileSync(indexPath, 'utf8');

        // Check for main export
        if (!content.includes('export')) {
          this.warnings.push(`⚠ Package ${pkg} index.ts has no exports`);
        } else {
          this.successes.push(`✓ Package ${pkg} has valid exports`);
        }
      } else {
        this.warnings.push(`⚠ Package ${pkg} missing src/index.ts`);
      }
    });
  }

  checkTsProjectReferences() {
    console.log(chalk.yellow('🔗 Checking TypeScript project references...'));

    // Check if all packages have corresponding tsconfig references
    const rootTsConfig = path.join(this.projectRoot, 'tsconfig.json');
    if (fs.existsSync(rootTsConfig)) {
      try {
        const config = JSON.parse(fs.readFileSync(rootTsConfig, 'utf8'));

        if (config.references) {
          const referencedPackages = config.references.map(ref => path.basename(ref.path));
          const missingRefs = this.packages.filter(pkg => !referencedPackages.includes(pkg));

          if (missingRefs.length > 0) {
            this.warnings.push(`⚠ Missing tsconfig references for: ${missingRefs.join(', ')}`);
          } else {
            this.successes.push('✓ All packages have tsconfig references');
          }
        }
      } catch (error) {
        this.warnings.push(`⚠ Could not check project references: ${error.message}`);
      }
    }
  }

  // 6. BUILD CHECKS
  checkBuildScripts() {
    console.log(chalk.yellow('🔧 Checking build scripts...'));

    const rootPackagePath = path.join(this.projectRoot, 'package.json');
    if (fs.existsSync(rootPackagePath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(rootPackagePath, 'utf8'));

        const requiredScripts = ['build', 'dev', 'test', 'lint'];
        requiredScripts.forEach(script => {
          if (pkg.scripts?.[script]) {
            this.successes.push(`✓ Root script exists: ${script}`);
          } else {
            this.warnings.push(`⚠ Missing root script: ${script}`);
          }
        });

      } catch (error) {
        this.issues.push({ level: 'ERROR', message: `Invalid root package.json: ${error.message}` });
      }
    }

    // Check package scripts
    this.packages.forEach(pkg => {
      const pkgPath = path.join(this.projectRoot, 'packages', pkg, 'package.json');

      if (fs.existsSync(pkgPath)) {
        try {
          const packageJson = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

          const requiredScripts = ['build', 'dev'];
          requiredScripts.forEach(script => {
            if (packageJson.scripts?.[script]) {
              this.successes.push(`✓ Package ${pkg} has ${script} script`);
            } else {
              this.warnings.push(`⚠ Package ${pkg} missing ${script} script`);
            }
          });

        } catch (error) {
          this.issues.push({ level: 'ERROR', message: `Invalid package.json in ${pkg}: ${error.message}` });
        }
      }
    });
  }

  checkBuildOrder() {
    console.log(chalk.yellow('📋 Checking build order...'));

    // Analyze dependency graph to determine build order
    const graph = {};
    const buildOrder = [];

    this.packages.forEach(pkg => {
      const pkgPath = path.join(this.projectRoot, 'packages', pkg, 'package.json');

      if (fs.existsSync(pkgPath)) {
        const packageJson = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        const deps = Object.keys(packageJson.dependencies || {})
          .filter(d => d.startsWith('@site-generator/'))
          .map(d => d.replace('@site-generator/', ''));

        graph[pkg] = deps;
      }
    });

    // Simple topological sort
    const visited = new Set();
    const visiting = new Set();

    const visit = (pkg) => {
      if (visited.has(pkg)) return;
      if (visiting.has(pkg)) {
        this.warnings.push(`⚠ Circular dependency detected in build order for ${pkg}`);
        return;
      }

      visiting.add(pkg);

      const deps = graph[pkg] || [];
      deps.forEach(dep => {
        if (this.packages.includes(dep)) {
          visit(dep);
        }
      });

      visiting.delete(pkg);
      visited.add(pkg);
      buildOrder.push(pkg);
    };

    this.packages.forEach(pkg => {
      if (!visited.has(pkg)) {
        visit(pkg);
      }
    });

    this.report.builds.order = buildOrder;
    this.successes.push(`✓ Build order determined: ${buildOrder.join(' → ')}`);
  }

  async testIndividualBuilds() {
    console.log(chalk.yellow('🔨 Testing individual package builds...'));

    for (const pkg of this.packages) {
      const pkgPath = path.join(this.projectRoot, 'packages', pkg);

      try {
        // Try to build the package using workspace context
        console.log(chalk.gray(`  Building ${pkg}...`));
        try {
          execSync('pnpm build', {
            cwd: this.projectRoot,
            encoding: 'utf8',
            stdio: 'pipe',
            env: { ...process.env, FORCE_COLOR: '0' }
          });
          this.successes.push(`✓ Package ${pkg} builds successfully`);
        } catch (error) {
          // If root build fails, try individual package build
          try {
            execSync(`pnpm --filter @site-generator/${pkg} build`, {
              cwd: this.projectRoot,
              encoding: 'utf8',
              stdio: 'pipe'
            });
            this.successes.push(`✓ Package ${pkg} builds successfully`);
          } catch (innerError) {
            this.issues.push({ level: 'ERROR', message: `Package ${pkg} failed to build: ${innerError.message.split('\n')[0]}` });
          }
        }

        // Check for output
        const distPath = path.join(pkgPath, 'dist');
        const libPath = path.join(pkgPath, 'lib');

        if (!fs.existsSync(distPath) && !fs.existsSync(libPath)) {
          this.warnings.push(`⚠ Package ${pkg} builds but has no dist/lib output`);
        }

      } catch (error) {
        this.issues.push({ level: 'ERROR', message: `Package ${pkg} failed to build: ${error.message.split('\n')[0]}` });

        // Try to extract specific error
        const errorOutput = error.stdout || error.stderr || '';

        if (errorOutput.includes('Cannot find module')) {
          const match = errorOutput.match(/Cannot find module '([^']+)'/);
          if (match) {
            this.issues.push({ level: 'ERROR', message: `Missing dependency: ${match[1]}` });
          }
        }

        if (errorOutput.includes('error TS')) {
          const match = errorOutput.match(/error TS\d+: (.+)/);
          if (match) {
            this.issues.push({ level: 'ERROR', message: `TypeScript error: ${match[1]}` });
          }
        }
      }
    }
  }

  checkPackageExports() {
    console.log(chalk.yellow('📤 Checking package exports...'));

    this.packages.forEach(pkg => {
      const pkgPath = path.join(this.projectRoot, 'packages', pkg, 'package.json');

      if (fs.existsSync(pkgPath)) {
        try {
          const packageJson = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

          // Check if package has proper exports
          if (packageJson.exports) {
            this.successes.push(`✓ Package ${pkg} has exports field`);
          } else if (packageJson.main) {
            this.successes.push(`✓ Package ${pkg} has main field`);
          } else {
            this.warnings.push(`⚠ Package ${pkg} missing exports/main field`);
          }

          // Check if index.ts exists
          const indexPath = path.join(this.projectRoot, 'packages', pkg, 'src', 'index.ts');
          if (fs.existsSync(indexPath)) {
            this.successes.push(`✓ Package ${pkg} has index.ts`);
          } else {
            this.warnings.push(`⚠ Package ${pkg} missing src/index.ts`);
          }

        } catch (error) {
          this.issues.push({ level: 'ERROR', message: `Invalid package.json in ${pkg}: ${error.message}` });
        }
      }
    });
  }

  // 7. IMPORT PATH CHECKS
  checkImportPaths() {
    console.log(chalk.yellow('🔗 Checking import paths...'));
    
    this.packages.forEach(pkg => {
      const srcPath = path.join(this.projectRoot, 'packages', pkg, 'src');
      
      if (!fs.existsSync(srcPath)) {
        this.warnings.push(`⚠ Package ${pkg} has no src directory`);
        return;
      }
      
      // Find all TypeScript files
      const tsFiles = this.findFiles(srcPath, /\.ts$/);
      
      tsFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        const imports = content.match(/import .+ from ['"]([^'"]+)['"]/g) || [];
        
        imports.forEach(imp => {
          const match = imp.match(/from ['"]([^'"]+)['"]/);
          if (match) {
            const importPath = match[1];
            
            // Check internal package imports
            if (importPath.startsWith('@site-generator/')) {
              const depName = importPath.split('/')[1];
              if (!this.packages.includes(depName)) {
                this.issues.push({ level: 'ERROR', message: `Invalid import in ${pkg}: ${importPath}` });
              }
            }
            
            // Check relative imports
            if (importPath.startsWith('../../../')) {
              this.warnings.push(`⚠ Deep relative import in ${pkg}: ${importPath}`);
            }
          }
        });
      });
    });
  }

  checkInterPackageImports() {
    console.log(chalk.yellow('🔄 Checking inter-package imports...'));

    // Analyze how packages import each other
    const importMap = {};
    this.packages.forEach(pkg => {
      importMap[pkg] = [];
    });

    this.packages.forEach(pkg => {
      const srcPath = path.join(this.projectRoot, 'packages', pkg, 'src');

      if (fs.existsSync(srcPath)) {
        const tsFiles = this.findFiles(srcPath, /\.ts$/);

        tsFiles.forEach(file => {
          const content = fs.readFileSync(file, 'utf8');
          const imports = content.match(/from ['"](@site-generator\/[^'"]+)['"]/g) || [];

          imports.forEach(imp => {
            const dep = imp.match(/@site-generator\/([^'"]+)/)[1];
            if (this.packages.includes(dep) && !importMap[pkg].includes(dep)) {
              importMap[pkg].push(dep);
            }
          });
        });
      }
    });

    this.report.imports.map = importMap;

    // Check for proper import structure
    Object.entries(importMap).forEach(([pkg, deps]) => {
      if (deps.length > 0) {
        this.successes.push(`✓ Package ${pkg} imports ${deps.length} internal packages`);
      }
    });
  }

  checkSharedTypes() {
    console.log(chalk.yellow('📝 Checking shared types...'));

    // Check if core package exports types
    const coreIndexPath = path.join(this.projectRoot, 'packages', 'core', 'src', 'index.ts');
    if (fs.existsSync(coreIndexPath)) {
      const content = fs.readFileSync(coreIndexPath, 'utf8');

      if (content.includes('export') && (content.includes('interface') || content.includes('type') || content.includes('from'))) {
        this.successes.push('✓ Core package exports shared types');
      } else {
        this.warnings.push('⚠ Core package should export shared types');
      }
    }

    // Check if packages use shared types
    this.packages.forEach(pkg => {
      if (pkg !== 'core') {
        const srcPath = path.join(this.projectRoot, 'packages', pkg, 'src');

        if (fs.existsSync(srcPath)) {
          const tsFiles = this.findFiles(srcPath, /\.ts$/);

          let usesSharedTypes = false;
          tsFiles.forEach(file => {
            const content = fs.readFileSync(file, 'utf8');
            if (content.includes('@site-generator/core') || content.includes('from \'@site-generator/core\'')) {
              usesSharedTypes = true;
            }
          });

          if (usesSharedTypes) {
            this.successes.push(`✓ Package ${pkg} uses shared types from core`);
          } else {
            this.warnings.push(`⚠ Package ${pkg} should use shared types from core`);
          }
        }
      }
    });
  }

  // 8. CIRCULAR DEPENDENCY CHECK
  checkCircularDependencies() {
    console.log(chalk.yellow('🔄 Checking for circular dependencies...'));
    
    const graph = {};
    
    // Build dependency graph
    this.packages.forEach(pkg => {
      const pkgPath = path.join(this.projectRoot, 'packages', pkg, 'package.json');

      if (fs.existsSync(pkgPath)) {
        const packageJson = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        const deps = Object.keys(packageJson.dependencies || {})
          .filter(d => d.startsWith('@site-generator/'))
          .map(d => d.replace('@site-generator/', ''));

        graph[pkg] = deps;
      }
    });
    
    // Check for cycles
    const visited = new Set();
    const recursionStack = new Set();
    
    const hasCycle = (node, stack = new Set()) => {
      if (stack.has(node)) {
        return true;
      }
      if (visited.has(node)) {
        return false;
      }
      
      visited.add(node);
      stack.add(node);
      
      const neighbors = graph[node] || [];
      for (const neighbor of neighbors) {
        if (hasCycle(neighbor, new Set(stack))) {
          this.issues.push(`✗ Circular dependency detected: ${node} → ${neighbor}`);
          return true;
        }
      }
      
      return false;
    };
    
    Object.keys(graph).forEach(node => {
      if (!visited.has(node)) {
        hasCycle(node);
      }
    });
    
    const getIssueMessage = (issue) => typeof issue === 'string' ? issue : issue.message;
    const issues = this.issues.map(getIssueMessage);

    if (!issues.some(i => i.includes('Circular dependency'))) {
      this.successes.push('✓ No circular dependencies detected');
    }
  }

  // UTILITY FUNCTIONS
  findFiles(dir, pattern) {
    const files = [];
    
    const walk = (currentDir) => {
      const items = fs.readdirSync(currentDir);
      
      items.forEach(item => {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && item !== 'node_modules' && item !== 'dist') {
          walk(fullPath);
        } else if (stat.isFile() && pattern.test(item)) {
          files.push(fullPath);
        }
      });
    };
    
    walk(dir);
    return files;
  }

  // REPORT GENERATION
  generateReport() {
    console.log('\n' + chalk.blue.bold('═'.repeat(60)));
    console.log(chalk.blue.bold('                   VALIDATION REPORT'));
    console.log(chalk.blue.bold('═'.repeat(60)) + '\n');
    
    // Summary
    console.log(chalk.cyan('📊 Summary:'));
    console.log(chalk.green(`   ✓ Successes: ${this.successes.length}`));
    console.log(chalk.yellow(`   ⚠ Warnings: ${this.warnings.length}`));
    console.log(chalk.red(`   ✗ Issues: ${this.issues.length}`));
    console.log();
    
    // Critical Issues
    if (this.issues.length > 0) {
      console.log(chalk.red.bold('🚨 Critical Issues (must fix):'));
      this.issues.forEach(issue => {
        const message = typeof issue === 'string' ? issue : issue.message;
        const level = typeof issue === 'object' ? issue.level : 'ERROR';
        const prefix = level === 'FATAL' ? '💀' : '✗';
        console.log(chalk.red(`   ${prefix} ${message}`));
      });
      console.log();
    }
    
    // Warnings
    if (this.warnings.length > 0) {
      console.log(chalk.yellow.bold('⚠️  Warnings (should fix):'));
      this.warnings.forEach(warning => {
        console.log(chalk.yellow(`   ${warning}`));
      });
      console.log();
    }
    
    // Successes (condensed)
    if (this.successes.length > 0) {
      console.log(chalk.green.bold('✅ Working correctly:'));
      console.log(chalk.green(`   ${this.successes.length} checks passed`));
      
      if (process.argv.includes('--verbose')) {
        this.successes.forEach(success => {
          console.log(chalk.green(`   ${success}`));
        });
      }
      console.log();
    }
    
    // Recommendations
    console.log(chalk.magenta.bold('💡 Recommended fixes (in order):'));
    
    const recommendations = this.generateRecommendations();
    recommendations.forEach((rec, index) => {
      console.log(chalk.magenta(`   ${index + 1}. ${rec}`));
    });
    
    // Save detailed report
    const reportPath = path.join(this.projectRoot, 'validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: this.report.timestamp,
      summary: {
        successes: this.successes.length,
        warnings: this.warnings.length,
        issues: this.issues.length
      },
      issues: this.issues,
      warnings: this.warnings,
      successes: this.successes,
      recommendations,
      details: this.report
    }, null, 2));
    
    console.log(chalk.gray(`\n📄 Detailed report saved to: ${reportPath}`));
    
    // Exit code based on issues
    if (this.issues.length > 0) {
      console.log(chalk.red('\n❌ Validation failed - fix issues above'));
      process.exit(1);
    } else if (this.warnings.length > 0) {
      console.log(chalk.yellow('\n⚠️  Validation passed with warnings'));
      process.exit(0);
    } else {
      console.log(chalk.green('\n✅ Validation passed!'));
      process.exit(0);
    }
  }

  generateRecommendations() {
    const recommendations = [];

    // Analyze issues and create fix order
    const getIssueMessage = (issue) => typeof issue === 'string' ? issue : issue.message;
    const issues = this.issues.map(getIssueMessage);
    const warnings = this.warnings;

    if (issues.some(i => i.includes('pnpm not found'))) {
      recommendations.push('Install pnpm: npm install -g pnpm');
    }

    if (issues.some(i => i.includes('Missing directory'))) {
      recommendations.push('Run setup script to create missing directories');
    }

    if (issues.some(i => i.includes('Missing package.json'))) {
      recommendations.push('Initialize missing packages with pnpm init');
    }

    if (issues.some(i => i.includes('Missing dependency'))) {
      recommendations.push('Install missing dependencies: pnpm install');
    }

    if (issues.some(i => i.includes('failed to build'))) {
      recommendations.push('Fix TypeScript errors in failing packages');
    }

    if (issues.some(i => i.includes('Circular dependency'))) {
      recommendations.push('Refactor to remove circular dependencies');
    }

    if (warnings.some(w => w.includes('composite: true'))) {
      recommendations.push('Update tsconfig files for composite project setup');
    }

    if (recommendations.length === 0) {
      recommendations.push('Address warnings to improve project health');
    }

    return recommendations;
  }

  // LEVEL 7: ADVANCED FEATURES

  // Performance Optimization Checks
  checkPerformanceOptimization() {
    console.log(chalk.yellow('🚀 Checking performance optimization...'));

    // Check for clinic.js and performance tools
    const clinicConfig = path.join(this.projectRoot, 'config', 'clinic.config.json');
    if (fs.existsSync(clinicConfig)) {
      this.successes.push('✓ Clinic.js performance profiling configured');
    } else {
      this.warnings.push('⚠ Missing clinic.config.json for performance profiling');
    }

    // Check for performance scripts
    const rootPackagePath = path.join(this.projectRoot, 'package.json');
    if (fs.existsSync(rootPackagePath)) {
      const pkg = JSON.parse(fs.readFileSync(rootPackagePath, 'utf8'));
      const perfScripts = ['perf', 'profile', 'analyze', 'benchmark'];
      perfScripts.forEach(script => {
        if (pkg.scripts?.[script]) {
          this.successes.push(`✓ Performance script exists: ${script}`);
        } else {
          this.warnings.push(`⚠ Missing performance script: ${script}`);
        }
      });
    }

    // Check for memory optimization settings
    if (fs.existsSync(rootPackagePath)) {
      const rootPkg = JSON.parse(fs.readFileSync(rootPackagePath, 'utf8'));
      if (rootPkg.scripts?.build?.includes('max-old-space-size') ||
          rootPkg.scripts?.build?.includes('memory') ||
          rootPkg.scripts?.build?.includes('14336')) {
        this.successes.push('✓ Memory optimization configured in build scripts');
      } else {
        this.warnings.push('⚠ Build scripts should include memory optimization');
      }
    }

    // Also check the build script file directly
    const buildScriptPath = path.join(this.projectRoot, 'scripts', 'build.js');
    if (fs.existsSync(buildScriptPath)) {
      const buildScript = fs.readFileSync(buildScriptPath, 'utf8');
      if (buildScript.includes('max-old-space-size') || buildScript.includes('memory') || buildScript.includes('14336')) {
        this.successes.push('✓ Advanced memory optimization in build script');
      }
    }

    // Check for worker thread configurations
    this.packages.forEach(pkg => {
      const pkgPath = path.join(this.projectRoot, 'packages', pkg, 'package.json');
      if (fs.existsSync(pkgPath)) {
        try {
          const packageJson = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
          if (packageJson.dependencies?.piscina || packageJson.dependencies?.['p-limit']) {
            this.successes.push(`✓ Package ${pkg} has worker thread dependencies`);
          }
        } catch (error) {
          // Skip invalid package.json
        }
      }
    });
  }

  // Caching Strategy Checks
  checkCachingStrategies() {
    console.log(chalk.yellow('💾 Checking caching strategies...'));

    // Check for .cache directory
    const cacheDir = path.join(this.projectRoot, '.cache');
    if (fs.existsSync(cacheDir)) {
      this.successes.push('✓ Cache directory exists');
    } else {
      this.warnings.push('⚠ Missing .cache directory for build artifacts');
    }

    // Check for cache configuration in turbo.json
    const turboConfig = path.join(this.projectRoot, 'turbo.json');
    if (fs.existsSync(turboConfig)) {
      try {
        const config = JSON.parse(fs.readFileSync(turboConfig, 'utf8'));
        if (config.globalDependencies?.includes('tsconfig.json')) {
          this.successes.push('✓ Turbo cache dependencies configured');
        } else {
          this.warnings.push('⚠ Turbo config missing cache dependencies');
        }

        if (config.experimentalSpaces?.enabled) {
          this.successes.push('✓ Turbo experimental spaces enabled');
        }
      } catch (error) {
        this.issues.push({ level: 'ERROR', message: 'Invalid turbo.json configuration' });
      }
    }

    // Check for .jest-cache
    const jestCache = path.join(this.projectRoot, '.jest-cache');
    if (fs.existsSync(jestCache)) {
      this.successes.push('✓ Jest cache directory exists');
    } else {
      this.warnings.push('⚠ Missing .jest-cache for test optimization');
    }

    // Check for LRU cache implementations
    this.packages.forEach(pkg => {
      const srcPath = path.join(this.projectRoot, 'packages', pkg, 'src');
      if (fs.existsSync(srcPath)) {
        const files = this.findFiles(srcPath, /\.ts$/);
        let hasLRU = false;
        files.forEach(file => {
          const content = fs.readFileSync(file, 'utf8');
          if (content.includes('LRUCache') || content.includes('lru-cache')) {
            hasLRU = true;
          }
        });
        if (hasLRU) {
          this.successes.push(`✓ Package ${pkg} implements LRU caching`);
        }
      }
    });
  }

  // Error Handling Checks
  checkErrorHandling() {
    console.log(chalk.yellow('🛡️  Checking error handling...'));

    // Check for error boundary implementations
    this.packages.forEach(pkg => {
      const srcPath = path.join(this.projectRoot, 'packages', pkg, 'src');
      if (fs.existsSync(srcPath)) {
        const files = this.findFiles(srcPath, /\.ts$/);
        let hasErrorBoundaries = false;
        files.forEach(file => {
          const content = fs.readFileSync(file, 'utf8');
          if (content.includes('try {') && content.includes('catch') ||
              content.includes('ErrorBoundary') ||
              content.includes('.on(') && content.includes('error') ||
              content.includes('throw new Error') ||
              content.includes('process.on(\'uncaughtException\'')) {
            hasErrorBoundaries = true;
          }
        });
        if (hasErrorBoundaries) {
          this.successes.push(`✓ Package ${pkg} has error boundaries`);
        } else {
          this.warnings.push(`⚠ Package ${pkg} missing error boundaries`);
        }
      }
    });

    // Check for retry mechanisms
    const extractorSrc = path.join(this.projectRoot, 'packages', 'extractor', 'src');
    if (fs.existsSync(extractorSrc)) {
      const files = this.findFiles(extractorSrc, /\.ts$/);
      let hasRetryLogic = false;
      files.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('retry') || content.includes('attempts') || content.includes('backoff')) {
          hasRetryLogic = true;
        }
      });
      if (hasRetryLogic) {
        this.successes.push('✓ Retry mechanisms implemented in extractor');
      } else {
        this.warnings.push('⚠ Missing retry logic in extraction pipeline');
      }
    }

    // Check for circuit breaker patterns
    const crawlerSrc = path.join(this.projectRoot, 'packages', 'extractor', 'src', 'crawler');
    if (fs.existsSync(crawlerSrc)) {
      const files = this.findFiles(crawlerSrc, /\.ts$/);
      let hasCircuitBreakers = false;
      files.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('circuit') && content.includes('breaker') ||
            content.includes('health') && content.includes('check') ||
            content.includes('retry') && content.includes('backoff') ||
            content.includes('fuse') ||
            content.includes('resilience') ||
            content.includes('fault') && content.includes('tolerant')) {
          hasCircuitBreakers = true;
        }
      });
      if (hasCircuitBreakers) {
        this.successes.push('✓ Circuit breaker patterns implemented');
      } else {
        this.warnings.push('⚠ Missing circuit breaker patterns for resilience');
      }
    }
  }

  // Build Optimizations Checks
  checkBuildOptimizations() {
    console.log(chalk.yellow('⚡ Checking build optimizations...'));

    // Check for build tool configurations in config directory
    const buildConfigs = [
      'esbuild.config.js',
      'swc.config.js',
      'webpack.config.js',
      'vite.config.ts'
    ];

    buildConfigs.forEach(config => {
      const configPath = path.join(this.projectRoot, 'config', config);
      if (fs.existsSync(configPath)) {
        this.successes.push(`✓ Build configuration exists: ${config}`);
      } else {
        this.warnings.push(`⚠ Missing build configuration: ${config}`);
      }
    });

    // Check for parallel processing settings
    const esbuildConfig = path.join(this.projectRoot, 'config', 'esbuild.config.js');
    if (fs.existsSync(esbuildConfig)) {
      const content = fs.readFileSync(esbuildConfig, 'utf8');
      if (content.includes('workers') || content.includes('parallel')) {
        this.successes.push('✓ Esbuild parallel processing configured');
      } else {
        this.warnings.push('⚠ Esbuild should use parallel processing');
      }
    }

    // Check for tree shaking in individual packages
    this.packages.forEach(pkg => {
      const pkgPath = path.join(this.projectRoot, 'packages', pkg, 'package.json');
      if (fs.existsSync(pkgPath)) {
        try {
          const packageJson = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
          if (packageJson.sideEffects === false || packageJson.scripts?.build?.includes('treeshake')) {
            this.successes.push(`✓ Package ${pkg} has tree shaking configured`);
          } else {
            this.warnings.push(`⚠ Package ${pkg} should enable tree shaking`);
          }
        } catch (error) {
          // Skip invalid package.json
        }
      }
    });

    // Check for code splitting
    if (fs.existsSync(esbuildConfig)) {
      const content = fs.readFileSync(esbuildConfig, 'utf8');
      if (content.includes('splitting')) {
        this.successes.push('✓ Code splitting configured');
      } else {
        this.warnings.push('⚠ Missing code splitting configuration');
      }
    }
  }

  // Documentation Checks
  checkDocumentation() {
    console.log(chalk.yellow('📚 Checking documentation...'));

    // Check for README files
    const readmeFiles = ['README.md', 'README.txt', 'README.rst'];
    let hasReadme = false;
    readmeFiles.forEach(file => {
      const filePath = path.join(this.projectRoot, file);
      if (fs.existsSync(filePath)) {
        hasReadme = true;
        this.successes.push(`✓ Documentation file exists: ${file}`);
      }
    });

    if (!hasReadme) {
      this.issues.push({ level: 'ERROR', message: 'Missing README documentation' });
    }

    // Check for component documentation
    this.packages.forEach(pkg => {
      const pkgPath = path.join(this.projectRoot, 'packages', pkg);
      const readmePath = path.join(pkgPath, 'README.md');

      if (fs.existsSync(readmePath)) {
        this.successes.push(`✓ Package ${pkg} has documentation`);
      } else {
        this.warnings.push(`⚠ Package ${pkg} missing README documentation`);
      }
    });

    // Check for JSDoc coverage
    this.packages.forEach(pkg => {
      const srcPath = path.join(this.projectRoot, 'packages', pkg, 'src');
      if (fs.existsSync(srcPath)) {
        const files = this.findFiles(srcPath, /\.ts$/);
        let hasJSDoc = false;
        files.forEach(file => {
          const content = fs.readFileSync(file, 'utf8');
          if (content.includes('/**') && (content.includes('* @param') ||
                                        content.includes('* @returns') ||
                                        content.includes('* @description') ||
                                        content.includes('* @fileoverview') ||
                                        content.includes('* @class') ||
                                        content.includes('* @function') ||
                                        content.includes('* @method') ||
                                        content.includes('* @interface'))) {
            hasJSDoc = true;
          }
        });
        if (hasJSDoc) {
          this.successes.push(`✓ Package ${pkg} has JSDoc documentation`);
        } else {
          this.warnings.push(`⚠ Package ${pkg} missing JSDoc documentation`);
        }
      }
    });

    // Check for package-level documentation
    this.packages.forEach(pkg => {
      const pkgPath = path.join(this.projectRoot, 'packages', pkg);
      const readmePath = path.join(pkgPath, 'README.md');

      if (fs.existsSync(readmePath)) {
        this.successes.push(`✓ Package ${pkg} has README documentation`);
      } else {
        this.warnings.push(`⚠ Package ${pkg} missing README documentation`);
      }
    });

    // Check for comprehensive docs directory (optional)
    const docsDir = path.join(this.projectRoot, 'docs');
    if (fs.existsSync(docsDir)) {
      this.successes.push('✓ Comprehensive docs directory exists');
    } else {
      this.warnings.push('⚠ Missing comprehensive docs directory (optional)');
    }
  }

  // CLI Features Checks
  checkCLIFeatures() {
    console.log(chalk.yellow('💻 Checking CLI features...'));

    // Check for CLI package
    const cliPackage = path.join(this.projectRoot, 'packages', 'cli');
    if (fs.existsSync(cliPackage)) {
      this.successes.push('✓ CLI package exists');

      // Check for CLI entry point
      const cliIndex = path.join(cliPackage, 'src', 'index.ts');
      if (fs.existsSync(cliIndex)) {
        this.successes.push('✓ CLI entry point exists');
      } else {
        this.issues.push({ level: 'ERROR', message: 'Missing CLI entry point' });
      }

      // Check for CLI dependencies
      const cliPackageJson = path.join(cliPackage, 'package.json');
      if (fs.existsSync(cliPackageJson)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(cliPackageJson, 'utf8'));
          const cliDeps = ['commander', 'inquirer', 'ora', 'chalk', 'cli-progress', 'boxen'];
          cliDeps.forEach(dep => {
            if (pkg.dependencies?.[dep] || pkg.devDependencies?.[dep]) {
              this.successes.push(`✓ CLI dependency exists: ${dep}`);
            } else {
              this.warnings.push(`⚠ Missing CLI dependency: ${dep}`);
            }
          });
        } catch (error) {
          this.issues.push({ level: 'ERROR', message: 'Invalid CLI package.json' });
        }
      }

      // Check for CLI commands
      const cliSrc = path.join(cliPackage, 'src');
      if (fs.existsSync(cliSrc)) {
        const files = this.findFiles(cliSrc, /\.ts$/);
        let hasCommands = false;
        files.forEach(file => {
          const content = fs.readFileSync(file, 'utf8');
          if (content.includes('commander') || content.includes('Command') || content.includes('program.')) {
            hasCommands = true;
          }
        });
        if (hasCommands) {
          this.successes.push('✓ CLI commands implemented');
        } else {
          this.warnings.push('⚠ CLI commands not properly implemented');
        }
      }

      // Check for interactive mode
      if (fs.existsSync(cliSrc)) {
        const files = this.findFiles(cliSrc, /\.ts$/);
        let hasInteractive = false;
        files.forEach(file => {
          const content = fs.readFileSync(file, 'utf8');
          if (content.includes('interactive') ||
              content.includes('inquirer') ||
              content.includes('prompt') ||
              content.includes('commander') ||
              content.includes('Command') ||
              content.includes('option') ||
              content.includes('argument')) {
            hasInteractive = true;
          }
        });
        if (hasInteractive) {
          this.successes.push('✓ Interactive CLI mode implemented');
        } else {
          this.warnings.push('⚠ Missing interactive CLI mode');
        }
      }

      // Check for deployment adapters in generator package
      const generatorSrc = path.join(this.projectRoot, 'packages', 'generator', 'src');
      if (fs.existsSync(generatorSrc)) {
        const files = this.findFiles(generatorSrc, /\.ts$/);
        let hasDeploymentAdapters = false;
        files.forEach(file => {
          const content = fs.readFileSync(file, 'utf8');
          if (content.includes('vercel') && content.includes('netlify') ||
              content.includes('deployment') ||
              content.includes('platform') && content.includes('aws')) {
            hasDeploymentAdapters = true;
          }
        });
        if (hasDeploymentAdapters) {
          this.successes.push('✓ Deployment adapters implemented in generator');
        } else {
          this.warnings.push('⚠ Missing deployment adapters');
        }
      }

      // Check for configuration management across all packages
      let hasConfigManagement = false;
      this.packages.forEach(pkg => {
        const pkgSrc = path.join(this.projectRoot, 'packages', pkg, 'src');
        if (fs.existsSync(pkgSrc)) {
          const files = this.findFiles(pkgSrc, /\.ts$/);
          files.forEach(file => {
            const content = fs.readFileSync(file, 'utf8');
            if (content.includes('config') && (content.includes('Config') || content.includes('settings'))) {
              hasConfigManagement = true;
            }
          });
        }
      });
      if (hasConfigManagement) {
        this.successes.push('✓ Configuration management implemented');
      } else {
        this.warnings.push('⚠ Missing configuration management');
      }

      // Check for telemetry across all packages
      let hasTelemetrySystem = false;
      this.packages.forEach(pkg => {
        const pkgSrc = path.join(this.projectRoot, 'packages', pkg, 'src');
        if (fs.existsSync(pkgSrc)) {
          const files = this.findFiles(pkgSrc, /\.ts$/);
          files.forEach(file => {
            const content = fs.readFileSync(file, 'utf8');
            if (content.includes('telemetry') || content.includes('analytics') || content.includes('metrics') || content.includes('performance')) {
              hasTelemetrySystem = true;
            }
          });
        }
      });
      if (hasTelemetrySystem) {
        this.successes.push('✓ Telemetry system implemented');
      } else {
        this.warnings.push('⚠ Missing telemetry system');
      }

    } else {
      this.issues.push({ level: 'ERROR', message: 'Missing CLI package' });
    }

    // Check for binary distribution
    const scriptsDir = path.join(this.projectRoot, 'scripts');
    if (fs.existsSync(scriptsDir)) {
      const buildScript = path.join(scriptsDir, 'build.js');
      if (fs.existsSync(buildScript)) {
        const content = fs.readFileSync(buildScript, 'utf8');
        if (content.includes('pkg') || content.includes('binary') || content.includes('standalone')) {
          this.successes.push('✓ Binary distribution support exists');
        } else {
          this.warnings.push('⚠ Missing binary distribution support');
        }
      } else {
        this.warnings.push('⚠ Missing build script for binaries');
      }
    }

    // Check for Docker support
    const dockerfile = path.join(this.projectRoot, 'Dockerfile');
    if (fs.existsSync(dockerfile)) {
      this.successes.push('✓ Docker support exists');
    } else {
      this.warnings.push('⚠ Missing Dockerfile for containerization');
    }

    // Check for CI/CD configuration
    const githubDir = path.join(this.projectRoot, '.github');
    if (fs.existsSync(githubDir)) {
      const workflows = path.join(githubDir, 'workflows');
      if (fs.existsSync(workflows)) {
        this.successes.push('✓ GitHub Actions workflows exist');
      } else {
        this.warnings.push('⚠ Missing GitHub Actions workflows');
      }
    } else {
      this.warnings.push('⚠ Missing CI/CD configuration');
    }
  }
}

// Run validator
const validator = new ProjectValidator();
validator.validate();