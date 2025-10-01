# 🚀 Site Generator - Advanced Content Analysis & Processing Platform

**A comprehensive, enterprise-grade content analysis and processing system designed for intelligent website content extraction, analysis, and optimization.**

## 📋 What This System Does

This site generator provides intelligent content processing capabilities for websites, including:

- **Content Extraction**: Extract and process HTML content from web pages
- **Intelligent Analysis**: Classify page types, assess content quality, and analyze structure
- **Performance Optimization**: High-speed parallel processing with advanced caching
- **Content Generation**: Transform and optimize content for various output formats

## 🏗️ Architecture Overview

The system is organized as a monorepo with specialized packages:

### 📦 Core Packages

- **`@site-generator/core`**: Shared utilities, caching, validation, logging, and worker pools
- **`@site-generator/extractor`**: Content extraction and HTML processing capabilities
- **`@site-generator/analyzer`**: Content analysis engine with classification and quality assessment
- **`@site-generator/generator`**: Site generation and content optimization
- **`@site-generator/cli`**: Command line interface for easy usage
- **`@site-generator/testing`**: Comprehensive testing utilities

### ⚡ Key Features

- **High-Performance Processing**: Multi-threaded architecture with parallel processing
- **Intelligent Content Analysis**: Page classification, quality scoring, and structure detection
- **Advanced Caching**: LRU cache with memory optimization and TTL support
- **Error Recovery**: Circuit breaker patterns and retry logic for reliability
- **Resource Monitoring**: Performance tracking and health checks
- **Comprehensive Testing**: Extensive test coverage across all components

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 20.0.0
- **pnpm** >= 8.0.0
- **Git LFS** >= 3.0.0 ([Install](https://git-lfs.github.com/))

> **Note:** This project uses Git LFS for large binary files. Run `git lfs install` before cloning.

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd site-generator

# Initialize Git LFS (one-time setup)
git lfs install

# Install dependencies
pnpm install
```

### Development

```bash
# Start development with monitoring
pnpm dev

# Build with live monitoring
pnpm build:watch

# Monitor real-time performance
pnpm monitor
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests with live monitoring
pnpm test:watch

# Run tests with coverage report
pnpm test:coverage
```

### Content Processing

```bash
# Run content analysis examples
pnpm analyze

# Test content extraction
pnpm extract

# Test page classification
pnpm classify
```

### Performance Analysis

```bash
# Comprehensive performance suite
pnpm perf

# Heap profiling with Clinic.js
pnpm perf:clinic

# Automated benchmarking
pnpm benchmark
```

## 🔧 Available Scripts

```bash
# Development
pnpm dev              # Start development with monitoring
pnpm build:watch      # Build with live monitoring
pnpm monitor          # Real-time performance monitoring

# Testing & Quality
pnpm test            # Run all tests
pnpm test:watch      # Run tests with live monitoring
pnpm test:coverage   # Run tests with coverage report
pnpm lint            # ESLint code analysis
pnpm format          # Format code with Prettier

# Building
pnpm build            # Standard build
pnpm build:prod       # Production optimized build
pnpm type-check       # TypeScript validation

# Content Processing
pnpm analyze         # Run content analysis examples
pnpm extract         # Test content extraction
pnpm classify        # Test page classification

# Performance
pnpm perf            # Comprehensive performance suite
pnpm benchmark       # Automated benchmarking

# Maintenance
pnpm clean           # Clean all build artifacts
```

## 📁 Project Structure

```
packages/
├── core/           # Shared utilities and core functionality
├── extractor/      # Content extraction and HTML processing
├── analyzer/       # Content analysis and classification
├── generator/      # Site generation and optimization
├── cli/           # Command line interface
└── testing/       # Testing utilities

scripts/           # Build and development scripts
config/           # Configuration files
test/             # Integration tests
```

## 🛠️ Configuration

- **Node.js 20.0.0+** required
- **pnpm** workspace configuration with performance optimizations
- **Turbo** for build orchestration and caching
- **TypeScript** with incremental compilation

## 📊 System Capabilities

The system is designed to handle:
- High-volume content processing with parallel workers
- Intelligent content classification and quality assessment
- Memory-efficient operations with advanced caching
- Robust error handling and recovery mechanisms
- Comprehensive testing and performance monitoring

This platform provides a solid foundation for building advanced content processing applications with enterprise-grade performance and reliability.

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed setup instructions, development workflow, and guidelines.

### Quick Contributor Setup

```bash
# Clone and setup
git clone <repository-url>
cd site-generator
git lfs install
pnpm install

# Verify setup
pnpm build
pnpm test
```

For detailed instructions, troubleshooting, and best practices, see [CONTRIBUTING.md](./CONTRIBUTING.md).