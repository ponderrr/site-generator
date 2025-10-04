# @site-generator/cli

Command Line Interface for the Site Generator.

## Overview

The CLI package provides a comprehensive command-line interface for the Site Generator:

- **Interactive Commands**: User-friendly interactive commands
- **Build Pipeline**: Complete build and generation pipeline
- **Development Mode**: Watch mode for development
- **Progress Tracking**: Real-time progress indicators
- **Configuration Management**: Easy configuration setup
- **Update Notifications**: Automatic update notifications

## Installation

```bash
# Global installation
npm install -g @site-generator/cli

# Or use with npx
npx @site-generator/cli
```

## Usage

### Quick Start

```bash
# Initialize a new project
site-generator init

# Build a site
site-generator build

# Watch for changes (development mode)
site-generator watch
```

### Commands

#### Build

Generate a static site from input sources:

```bash
site-generator build [options]

Options:
  -i, --input <path>      Input directory or file (default: ./content)
  -o, --output <path>     Output directory (default: ./dist)
  -c, --config <path>     Configuration file
  -p, --parallel <number> Number of parallel workers (default: 4)
  --no-cache             Disable caching
  --verbose              Verbose output
```

#### Extract

Extract content from URLs or files:

```bash
site-generator extract [options]

Options:
  -u, --url <url>        URL to extract from
  -f, --file <path>      File to extract from
  -o, --output <path>    Output directory (default: ./extracted)
  --format <format>      Output format (json, markdown) (default: json)
  --verbose              Verbose output
```

#### Analyze

Analyze extracted content:

```bash
site-generator analyze [options]

Options:
  -i, --input <path>     Input directory (default: ./extracted)
  -o, --output <path>    Output directory (default: ./analysis)
  --metrics              Generate content metrics
  --sections             Detect content sections
  --verbose              Verbose output
```

#### Watch

Watch for changes and rebuild automatically:

```bash
site-generator watch [options]

Options:
  -i, --input <path>     Input directory (default: ./content)
  -o, --output <path>    Output directory (default: ./dist)
  -c, --config <path>    Configuration file
```

#### Init

Interactive setup wizard:

```bash
site-generator init
```

## Configuration

### Configuration File

Create a `site-generator.config.json` file:

```json
{
  "inputDir": "./content",
  "outputDir": "./dist",
  "theme": "default",
  "parallel": 4,
  "cache": true,
  "optimization": {
    "images": true,
    "css": true,
    "js": true
  },
  "seo": {
    "generateSitemap": true,
    "generateRobots": true
  }
}
```

### Environment Variables

- `SITE_GENERATOR_CONFIG` - Path to configuration file
- `SITE_GENERATOR_CACHE_DIR` - Cache directory path
- `SITE_GENERATOR_LOG_LEVEL` - Logging level (debug, info, warn, error)

## Examples

### Basic Blog Site

```bash
# Create content directory
mkdir content
echo "# My Blog Post" > content/post1.md

# Generate site
site-generator build -i content -o dist
```

### Extract from URL

```bash
# Extract content from a website
site-generator extract -u https://example.com -o extracted
```

### Development Workflow

```bash
# Start watch mode for development
site-generator watch -i content -o dist

# In another terminal, make changes to content
echo "# Updated Post" > content/post1.md
# Site will automatically rebuild
```

## Interactive Mode

The CLI provides an interactive mode for easier configuration:

```bash
site-generator init
```

This will guide you through:

1. **Project Setup**: Name, description, and basic configuration
2. **Input Configuration**: Input directories and file patterns
3. **Output Configuration**: Output directory and build options
4. **Theme Selection**: Choose from available themes
5. **Optimization Options**: Performance and SEO settings

## Progress Indicators

The CLI provides rich progress indicators:

- **Spinners**: For quick operations
- **Progress Bars**: For long-running operations
- **Status Updates**: Real-time status information
- **Error Reporting**: Clear error messages and suggestions

## Error Handling

The CLI includes comprehensive error handling:

- **Validation**: Input validation with helpful error messages
- **Recovery**: Automatic retry with exponential backoff
- **Logging**: Detailed logging for debugging
- **User Guidance**: Suggestions for fixing common issues

## Development

### Building

```bash
pnpm build
```

### Testing

```bash
pnpm test
```

### Development Mode

```bash
pnpm dev
```

## Dependencies

- `commander` - Command line interface framework
- `inquirer` - Interactive command line prompts
- `ora` - Elegant terminal spinners
- `chalk` - Terminal string styling
- `cli-progress` - Progress bars for CLI
- `boxen` - Create boxes in the terminal
- `update-notifier` - Update notifications

## License

MIT
