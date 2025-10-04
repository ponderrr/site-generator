# @site-generator/generator

Static site generation engine for the Site Generator.

## Overview

The generator package handles the creation of optimized static sites from analyzed content:

- **Template Engine**: Flexible template system for site generation
- **Asset Optimization**: Image optimization and asset processing
- **SEO Optimization**: Meta tags, structured data, and sitemaps
- **Performance Optimization**: Code splitting and lazy loading
- **Theme Support**: Multiple theme options and customization
- **Build Pipeline**: Comprehensive build and optimization pipeline

## Installation

```bash
pnpm add @site-generator/generator
```

## Usage

### Basic Generation

```typescript
import { SiteGenerator } from '@site-generator/generator';

const generator = new SiteGenerator({
  inputDir: './content',
  outputDir: './dist',
  theme: 'default',
  optimizeImages: true,
  generateSitemap: true
});

const result = await generator.generate(pages);
```

### Theme Configuration

```typescript
const generator = new SiteGenerator({
  theme: 'blog',
  themeConfig: {
    colors: {
      primary: '#0066cc',
      secondary: '#666666'
    },
    layout: {
      sidebar: true,
      footer: true
    }
  }
});
```

### Asset Optimization

```typescript
const generator = new SiteGenerator({
  optimizeImages: true,
  imageConfig: {
    quality: 80,
    format: 'webp',
    maxWidth: 1920,
    generateResponsive: true
  }
});
```

## API Reference

### Classes

- `SiteGenerator` - Main site generation orchestrator
- `TemplateEngine` - Template processing and rendering
- `AssetProcessor` - Asset optimization and processing
- `SEOOptimizer` - SEO optimization utilities

### Types

- `SiteGeneratorConfig` - Configuration for site generation
- `GenerationResult` - Result of generation operation
- `PageData` - Page data structure
- `ThemeConfig` - Theme configuration options

## Themes

### Built-in Themes

- **default** - Clean, minimal design
- **blog** - Blog-focused layout
- **documentation** - Documentation site layout
- **portfolio** - Portfolio showcase layout
- **corporate** - Professional business layout

### Custom Themes

```typescript
const customTheme = {
  name: 'my-theme',
  templates: {
    page: './templates/page.hbs',
    post: './templates/post.hbs',
    index: './templates/index.hbs'
  },
  assets: {
    css: ['./styles/main.css'],
    js: ['./scripts/main.js']
  },
  partials: {
    header: './partials/header.hbs',
    footer: './partials/footer.hbs'
  }
};
```

## Features

### SEO Optimization

- **Meta Tags**: Automatic meta tag generation
- **Structured Data**: JSON-LD structured data
- **Sitemap**: XML sitemap generation
- **Robots.txt**: Search engine directives
- **Canonical URLs**: Proper canonical URL handling

### Performance Features

- **Code Splitting**: Automatic code splitting
- **Lazy Loading**: Image and component lazy loading
- **Minification**: CSS and JavaScript minification
- **Compression**: Gzip and Brotli compression
- **Caching**: Browser caching optimization

### Asset Processing

- **Image Optimization**: Automatic image optimization
- **Responsive Images**: Multiple image sizes
- **WebP Support**: Modern image format support
- **SVG Optimization**: SVG file optimization
- **Font Optimization**: Web font optimization

## Configuration

```typescript
interface GeneratorConfig {
  input: {
    dir: string;
    include: string[];
    exclude: string[];
  };
  output: {
    dir: string;
    clean: boolean;
    publicPath: string;
  };
  theme: {
    name: string;
    config: Record<string, any>;
  };
  optimization: {
    images: boolean;
    css: boolean;
    js: boolean;
    html: boolean;
  };
  seo: {
    generateSitemap: boolean;
    generateRobots: boolean;
    addStructuredData: boolean;
  };
}
```

## Build Pipeline

The generator follows a comprehensive build pipeline:

1. **Content Processing**: Process and validate input content
2. **Template Rendering**: Render pages using templates
3. **Asset Processing**: Optimize and process assets
4. **SEO Optimization**: Add SEO enhancements
5. **Performance Optimization**: Apply performance optimizations
6. **Output Generation**: Generate final static files

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

- `@site-generator/core` - Core utilities
- `@site-generator/extractor` - Content extraction
- `@site-generator/analyzer` - Content analysis
- `next` - React framework for static generation
- `react` - UI library
- `tailwindcss` - CSS framework
- `sharp` - Image processing
- `@vercel/og` - Open Graph image generation

## License

MIT
