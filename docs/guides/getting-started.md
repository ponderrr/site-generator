# Getting Started

## Quick Start

Get up and running with the Site Generator in minutes.

### Prerequisites

- Node.js 18+ (recommended: Node.js 20)
- pnpm 8+ (package manager)
- Git (for version control)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/site-generator.git
cd site-generator

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

### Basic Usage

#### 1. Initialize a Project

```bash
# Interactive setup
npx @site-generator/cli init

# Or use command line options
npx @site-generator/cli build -i ./content -o ./dist
```

#### 2. Create Content

Create your first content file:

```bash
mkdir content
echo "# Welcome to My Site

This is my first page created with Site Generator.

## Features

- High performance
- Easy to use
- Highly configurable" > content/index.md
```

#### 3. Generate Your Site

```bash
npx @site-generator/cli build -i ./content -o ./dist
```

#### 4. View Your Site

```bash
# Serve the generated site locally
cd dist
python -m http.server 8000

# Or use any static file server
npx serve dist
```

Visit `http://localhost:8000` to see your generated site!

## Project Structure

After initialization, your project will have this structure:

```
my-site/
├── content/              # Your content files
│   ├── index.md
│   ├── about.md
│   └── blog/
│       └── first-post.md
├── dist/                 # Generated site (auto-created)
├── site-generator.config.json  # Configuration file
└── package.json         # Project dependencies
```

## Configuration

### Basic Configuration

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
    "generateRobots": true,
    "addStructuredData": true
  }
}
```

### Advanced Configuration

```json
{
  "input": {
    "dir": "./content",
    "include": ["**/*.md", "**/*.html"],
    "exclude": ["**/draft-*", "**/.*"]
  },
  "output": {
    "dir": "./dist",
    "clean": true,
    "publicPath": "/",
    "trailingSlash": false
  },
  "theme": {
    "name": "blog",
    "config": {
      "colors": {
        "primary": "#0066cc",
        "secondary": "#666666"
      },
      "layout": {
        "sidebar": true,
        "footer": true
      }
    }
  },
  "optimization": {
    "images": {
      "quality": 80,
      "format": "webp",
      "maxWidth": 1920,
      "generateResponsive": true
    },
    "css": {
      "minify": true,
      "purge": true
    },
    "js": {
      "minify": true,
      "bundle": true
    }
  }
}
```

## Content Types

### Markdown Files

The most common content type. Supports frontmatter for metadata:

```markdown
---
title: "My Blog Post"
description: "A description of my blog post"
author: "John Doe"
date: "2024-01-15"
tags: ["blog", "tutorial"]
---

# My Blog Post

This is the content of my blog post.
```

### HTML Files

For more control over content structure:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>My Page</title>
    <meta name="description" content="Page description" />
  </head>
  <body>
    <h1>My Page</h1>
    <p>Content goes here.</p>
  </body>
</html>
```

### JSON Files

For structured content or data:

```json
{
  "title": "Product Page",
  "description": "Product description",
  "price": "$99.99",
  "features": ["Feature 1", "Feature 2", "Feature 3"]
}
```

## Themes

### Built-in Themes

#### Default Theme

Clean, minimal design suitable for any type of site:

```json
{
  "theme": "default"
}
```

#### Blog Theme

Optimized for blog content with sidebar and navigation:

```json
{
  "theme": "blog",
  "themeConfig": {
    "sidebar": true,
    "showAuthor": true,
    "showDate": true
  }
}
```

#### Documentation Theme

Perfect for technical documentation:

```json
{
  "theme": "documentation",
  "themeConfig": {
    "toc": true,
    "editLink": true,
    "lastUpdated": true
  }
}
```

### Custom Themes

Create your own theme by creating a `themes/` directory:

```
themes/
└── my-theme/
    ├── templates/
    │   ├── page.hbs
    │   ├── post.hbs
    │   └── index.hbs
    ├── assets/
    │   ├── styles/
    │   └── scripts/
    └── partials/
        ├── header.hbs
        └── footer.hbs
```

## Development Workflow

### Watch Mode

For development, use watch mode to automatically rebuild on changes:

```bash
npx @site-generator/cli watch -i ./content -o ./dist
```

### Development Server

For a more advanced development experience:

```bash
# Install development server
npm install -g @site-generator/dev-server

# Start development server
site-generator dev
```

This provides:

- Hot reloading
- Live preview
- Error overlay
- Performance monitoring

### Testing

Run tests to ensure your site generates correctly:

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm test --filter @site-generator/core

# Run tests in watch mode
pnpm test --watch
```

## Deployment

### Static Hosting

The generated site is a collection of static files that can be deployed anywhere:

#### Netlify

1. Connect your repository to Netlify
2. Set build command: `npx @site-generator/cli build`
3. Set publish directory: `dist`

#### Vercel

1. Import your repository to Vercel
2. Set build command: `npx @site-generator/cli build`
3. Set output directory: `dist`

#### GitHub Pages

1. Enable GitHub Pages in repository settings
2. Set source to GitHub Actions
3. Use the provided GitHub Actions workflow

### Custom Deployment

For custom deployment, simply upload the `dist/` folder to your web server:

```bash
# Build the site
npx @site-generator/cli build

# Upload dist/ folder to your server
rsync -av dist/ user@server:/path/to/website/
```

## Troubleshooting

### Common Issues

#### Build Fails

```bash
# Check for syntax errors in content
npx @site-generator/cli build --verbose

# Clean build cache
npx @site-generator/cli build --no-cache
```

#### Performance Issues

```bash
# Reduce parallel workers
npx @site-generator/cli build --parallel 2

# Disable optimizations temporarily
npx @site-generator/cli build --no-optimize
```

#### Memory Issues

```bash
# Increase Node.js memory limit
node --max-old-space-size=8192 ./node_modules/.bin/site-generator build
```

### Getting Help

- **Documentation**: Check the full documentation in the `docs/` folder
- **Issues**: Report bugs on GitHub Issues
- **Discussions**: Join discussions on GitHub Discussions
- **Discord**: Join our Discord server for real-time help

## Next Steps

Now that you have the basics working:

1. **Explore Themes**: Try different built-in themes
2. **Customize Configuration**: Adjust settings for your needs
3. **Add Content**: Create more pages and content
4. **Optimize Performance**: Configure caching and optimization
5. **Set Up CI/CD**: Automate your deployment pipeline

Check out the [Advanced Configuration](advanced-configuration.md) guide for more detailed setup options.
