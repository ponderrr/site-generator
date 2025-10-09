# Contributing to Site Generator

Thank you for your interest in contributing to the Site Generator project! This guide will help you get started.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Code Quality](#code-quality)
- [Submitting Changes](#submitting-changes)
- [Git LFS Setup](#git-lfs-setup)

## 🔧 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 20.0.0 ([Download](https://nodejs.org/))
- **pnpm** >= 8.0.0 ([Install](https://pnpm.io/installation))
- **Git** >= 2.30.0 ([Download](https://git-scm.com/))
- **Git LFS** >= 3.0.0 ([Install](https://git-lfs.github.com/))

### Verify Installation

```bash
node --version    # Should be >= 20.0.0
pnpm --version    # Should be >= 8.0.0
git --version     # Should be >= 2.30.0
git lfs version   # Should be >= 3.0.0
```

## 🚀 Getting Started

### 1. Clone the Repository

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/site-generator.git
cd site-generator
```

### 2. Set Up Git LFS

**IMPORTANT:** This repository uses Git LFS for large binary files only (images, videos in `extracted/` directory).

```bash
# Initialize Git LFS (one-time setup)
git lfs install

# Fetch LFS files (if any exist)
git lfs pull
```

> **Note:** Configuration files (package.json, tsconfig.json, etc.) are stored in regular Git, NOT in LFS.
> If you encounter LFS-related errors with config files, see the [Git LFS Setup](#git-lfs-setup) section below.

### 3. Install Dependencies

```bash
# Install all dependencies using pnpm
pnpm install
```

This will install dependencies for all packages in the monorepo.

### 4. Build the Project

```bash
# Build all packages
pnpm build

# Or build with live monitoring
pnpm build:watch
```

### 5. Verify Setup

```bash
# Run tests to ensure everything is working
pnpm test

# Run linter
pnpm lint

# Check TypeScript compilation
pnpm type-check
```

If all commands succeed, you're ready to start developing! 🎉

## 💻 Development Workflow

### Start Development Mode

```bash
# Start development with hot reload and monitoring
pnpm dev
```

This will:

- Build all packages in watch mode
- Start the development server
- Monitor performance metrics in real-time

### Working with Individual Packages

```bash
# Work on a specific package
cd packages/core
pnpm build
pnpm test

# Or use Turbo to build a specific package from root
turbo build --filter=@site-generator/core
```

### Common Commands

```bash
# Development
pnpm dev              # Start development mode
pnpm build:watch      # Build with live monitoring

# Testing
pnpm test             # Run all tests
pnpm test:watch       # Run tests in watch mode
pnpm test:coverage    # Generate coverage report

# Code Quality
pnpm lint             # Run ESLint
pnpm format           # Format code with Prettier
pnpm type-check       # Check TypeScript types

# Performance
pnpm perf             # Run performance benchmarks
pnpm perf:clinic      # Profile with Clinic.js
pnpm monitor          # Monitor real-time performance

# Maintenance
pnpm clean            # Clean build artifacts
```

## 📁 Project Structure

```
site-generator/
├── packages/
│   ├── core/           # Shared utilities, caching, validation
│   ├── extractor/      # HTML parsing and content extraction
│   ├── analyzer/       # Content analysis and classification
│   ├── generator/      # Site generation and optimization
│   ├── cli/            # Command-line interface
│   └── testing/        # Testing utilities
├── scripts/            # Build and utility scripts
├── config/             # Configuration files
├── test/               # Integration tests
└── docs/               # Documentation
```

Each package follows this structure:

```
package/
├── src/                # Source TypeScript files
├── dist/               # Compiled JavaScript (generated)
├── package.json        # Package manifest
└── tsconfig.json       # TypeScript configuration
```

## 🧪 Testing

### Writing Tests

- Place tests next to the code they test: `MyComponent.test.ts`
- Use descriptive test names: `describe('ContentAnalyzer', () => { it('should detect article pages correctly', ...) })`
- Follow the AAA pattern: Arrange, Act, Assert

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests for a specific package
cd packages/analyzer
pnpm test

# Run tests in watch mode (great for TDD)
pnpm test:watch

# Run with coverage
pnpm test:coverage
```

### Test Coverage

We aim for:

- ✅ **80%+ overall coverage**
- ✅ **90%+ coverage for core utilities**
- ✅ **100% coverage for critical paths**

## ✨ Code Quality

### Linting

We use ESLint with TypeScript support:

```bash
# Run linter
pnpm lint

# Auto-fix issues
pnpm lint --fix
```

### Formatting

We use Prettier for consistent code formatting:

```bash
# Format all files
pnpm format

# Check formatting without changes
pnpm format --check
```

### Pre-commit Hooks

We use `simple-git-hooks` and `lint-staged` to run checks before commits:

- **ESLint** runs on `.ts`, `.tsx`, `.js`, `.jsx` files
- **Prettier** formats all supported files
- **Vitest** runs related tests for TypeScript changes
- **Tests** run before pushing

The hooks are automatically installed when you run `pnpm install`.

### TypeScript

- Use strict mode (enabled by default)
- Prefer interfaces over types for object shapes
- Always type function parameters and return values
- Avoid `any` - use `unknown` if type is truly unknown

## 📤 Submitting Changes

### 1. Create a Feature Branch

```bash
# Create and switch to a new branch
git checkout -b feat/your-feature-name

# Or for bug fixes
git checkout -b fix/issue-description
```

Branch naming conventions:

- `feat/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Adding or updating tests
- `chore/` - Maintenance tasks

### 2. Make Your Changes

- Write clean, readable code
- Add tests for new functionality
- Update documentation as needed
- Keep commits focused and atomic

### 3. Commit Your Changes

```bash
# Stage your changes
git add .

# Commit with a descriptive message
git commit -m "feat: add content quality scoring algorithm"
```

Commit message format:

```
<type>: <subject>

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:

- `feat: implement page classification algorithm`
- `fix: resolve memory leak in worker pool`
- `docs: update API documentation for ContentAnalyzer`
- `test: add tests for SectionDetector`

### 4. Push and Create Pull Request

```bash
# Push your branch to GitHub
git push origin feat/your-feature-name
```

Then create a Pull Request on GitHub with:

- Clear title and description
- Link to related issues (if any)
- Screenshots (for UI changes)
- Test results (if applicable)

### Pull Request Checklist

Before submitting a PR, ensure:

- [ ] Code follows the project style guide
- [ ] All tests pass (`pnpm test`)
- [ ] Linter passes (`pnpm lint`)
- [ ] Type checking passes (`pnpm type-check`)
- [ ] New code has tests
- [ ] Documentation is updated
- [ ] Commits are clean and well-described
- [ ] No unnecessary files are committed

## 🗄️ Git LFS Setup

This project uses Git LFS **only** for large binary files in the `extracted/` directory (images, videos, PDFs).

### What's Tracked by LFS

✅ **In LFS:**

- Large images: `extracted/**/*.{jpg,png,gif,pdf}`
- Videos: `extracted/**/*.{mp4,mov,avi}`
- Audio: `extracted/**/*.{mp3,wav,flac}`
- Large data files: `extracted/**/*.{sql,csv}`

❌ **NOT in LFS (regular Git):**

- Configuration files: `package.json`, `tsconfig.json`
- Lock files: `pnpm-lock.yaml`, `yarn.lock`
- All `.config.js` and `.config.json` files
- Build artifacts: `*.tsbuildinfo`, `*.log`

### Troubleshooting LFS Issues

#### Issue: Getting LFS Pointer Files Instead of Content

**Symptoms:**

- `package.json` contains `version https://git-lfs.github.com/spec/v1`
- `pnpm install` fails with JSON parse errors
- Config files appear to be pointer files

**Solution:**

```bash
# This should NOT happen with the current setup
# If it does, the repository needs to be migrated
# Contact the maintainer or see LFS-MIGRATION-GUIDE.md
```

#### Issue: LFS Not Installed

**Symptoms:**

- Error: `git-lfs filter required but not installed`

**Solution:**

```bash
# Install Git LFS
# macOS
brew install git-lfs

# Windows
# Download from https://git-lfs.github.com/

# Linux
sudo apt-get install git-lfs

# Initialize LFS
git lfs install
```

## 🤝 Getting Help

If you run into any issues:

1. **Check the documentation** in the `docs/` folder
2. **Search existing issues** on GitHub
3. **Ask in discussions** on GitHub
4. **Contact maintainers** via email or Slack

## 📝 License

By contributing to this project, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Site Generator! 🎉
