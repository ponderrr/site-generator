/**
 * @fileoverview Site Generator - Main entry point for site generation functionality
 */

import { EventEmitter } from 'events';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname, extname, basename } from 'path';
import { createHash } from 'crypto';

/**
 * Site generation configuration interface
 */
export interface SiteGeneratorConfig {
  inputDir: string;
  outputDir: string;
  theme?: string;
  optimizeImages?: boolean;
  optimizeCSS?: boolean;
  optimizeJS?: boolean;
  generateSitemap?: boolean;
  includeMetadata?: boolean;
  parallel?: number;
  cache?: boolean;
  assetOutputDir?: string;
}

/**
 * Page data interface
 */
export interface PageData {
  url: string;
  title: string;
  content: string;
  metadata: Record<string, any>;
  sections?: any[];
  metrics?: Record<string, number>;
}

/**
 * Site generation result interface
 */
export interface GenerationResult {
  pagesGenerated: number;
  assetsProcessed: number;
  outputDir: string;
  sitemapGenerated?: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Main Site Generator class
 */
export interface AssetInfo {
  name: string;
  path: string;
  type: 'image' | 'css' | 'js' | 'other';
  size: number;
  originalPath: string;
}

export class SiteGenerator extends EventEmitter {
  private config: SiteGeneratorConfig;
  private pages: PageData[] = [];
  private assets: AssetInfo[] = [];

  constructor(config: SiteGeneratorConfig) {
    super();
    this.config = {
      theme: 'default',
      optimizeImages: true,
      optimizeCSS: true,
      optimizeJS: true,
      generateSitemap: true,
      includeMetadata: true,
      parallel: 4,
      cache: true,
      assetOutputDir: 'assets',
      ...config
    };
  }

  /**
   * Generate the complete static site
   */
  async generate(pages: PageData[]): Promise<GenerationResult> {
    try {
      this.emit('start', { pageCount: pages.length });
      
      this.pages = pages;
      const result: GenerationResult = {
        pagesGenerated: 0,
        assetsProcessed: 0,
        outputDir: this.config.outputDir,
        errors: [],
        warnings: []
      };

      // Ensure output directory exists
      this.ensureOutputDirectory();

      // Generate pages
      this.emit('progress', { step: 'pages', progress: 0 });
      await this.generatePages(result);

      // Process assets
      if (this.config.optimizeImages || this.config.optimizeCSS || this.config.optimizeJS) {
        this.emit('progress', { step: 'assets', progress: 0 });
        await this.processAssets(result);
      }

      // Generate sitemap
      if (this.config.generateSitemap) {
        this.emit('progress', { step: 'sitemap', progress: 0 });
        await this.generateSitemap(result);
      }

      // Generate metadata
      if (this.config.includeMetadata) {
        this.emit('progress', { step: 'metadata', progress: 0 });
        await this.generateMetadata(result);
      }

      // Generate asset manifest
      if (this.assets.length > 0) {
        this.emit('progress', { step: 'manifest', progress: 0 });
        await this.generateAssetManifest();
      }

      this.emit('complete', result);
      return result;

    } catch (error) {
      const errorMessage = `Generation failed: ${error}`;
      this.emit('error', { error: errorMessage });
      throw new Error(errorMessage);
    }
  }

  /**
   * Generate individual pages
   */
  private async generatePages(result: GenerationResult): Promise<void> {
    for (let i = 0; i < this.pages.length; i++) {
      const page = this.pages[i];
      
      try {
        const html = this.generatePageHTML(page);
        const outputPath = this.getPageOutputPath(page);
        
        writeFileSync(outputPath, html, 'utf8');
        result.pagesGenerated++;
        
        this.emit('progress', { 
          step: 'pages', 
          progress: (i + 1) / this.pages.length,
          current: page.title
        });

      } catch (error) {
        const errorMessage = `Failed to generate page "${page.title}": ${error}`;
        result.errors.push(errorMessage);
        this.emit('warning', { message: errorMessage });
      }
    }
  }

  /**
   * Generate HTML for a single page
   */
  private generatePageHTML(page: PageData): string {
    const template = this.getPageTemplate();
    
    return template
      .replace('{{title}}', this.escapeHTML(page.title))
      .replace('{{content}}', page.content)
      .replace('{{url}}', page.url)
      .replace('{{metadata}}', this.generatePageMetadata(page))
      .replace('{{sections}}', this.generateSectionsHTML(page.sections || []))
      .replace('{{metrics}}', this.generateMetricsHTML(page.metrics || {}));
  }

  /**
   * Get the HTML template for pages
   */
  private getPageTemplate(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{title}}</title>
    {{metadata}}
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1, h2, h3 { color: #333; }
        .metadata { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin: 20px 0; }
        .metric { background: #e8f4fd; padding: 10px; border-radius: 5px; text-align: center; }
        .metric-value { font-size: 1.5em; font-weight: bold; color: #0066cc; }
        .metric-label { font-size: 0.9em; color: #666; }
    </style>
</head>
<body>
    <header>
        <h1>{{title}}</h1>
        <nav>
            <a href="/">Home</a> | 
            <a href="/about">About</a> | 
            <a href="/sitemap.xml">Sitemap</a>
        </nav>
    </header>
    
    <main>
        {{content}}
    </main>
    
    {{sections}}
    {{metrics}}
    
    <footer>
        <p>Generated by Site Generator</p>
    </footer>
</body>
</html>`;
  }

  /**
   * Generate page metadata HTML
   */
  private generatePageMetadata(page: PageData): string {
    if (!this.config.includeMetadata) return '';
    
    const metadata = page.metadata || {};
    const metaTags = Object.entries(metadata)
      .map(([key, value]) => `<meta name="${key}" content="${this.escapeHTML(String(value))}">`)
      .join('\n    ');
    
    return metaTags;
  }

  /**
   * Generate sections HTML
   */
  private generateSectionsHTML(sections: any[]): string {
    if (!sections.length) return '';
    
    const sectionsHTML = sections
      .map(section => {
        switch (section.type) {
          case 'heading':
            return `<h${section.level || 2}>${this.escapeHTML(section.content)}</h${section.level || 2}>`;
          case 'paragraph':
            return `<p>${this.escapeHTML(section.content)}</p>`;
          case 'list':
            const items = section.items?.map((item: string) => `<li>${this.escapeHTML(item)}</li>`).join('') || '';
            return `<ul>${items}</ul>`;
          default:
            return `<div class="section-${section.type}">${this.escapeHTML(section.content || '')}</div>`;
        }
      })
      .join('\n        ');
    
    return `
    <section class="page-sections">
        <h2>Content Sections</h2>
        ${sectionsHTML}
    </section>`;
  }

  /**
   * Generate metrics HTML
   */
  private generateMetricsHTML(metrics: Record<string, number>): string {
    if (!Object.keys(metrics).length) return '';
    
    const metricsHTML = Object.entries(metrics)
      .map(([key, value]) => `
        <div class="metric">
            <div class="metric-value">${value}</div>
            <div class="metric-label">${this.formatMetricLabel(key)}</div>
        </div>`)
      .join('');
    
    return `
    <section class="page-metrics">
        <h2>Content Metrics</h2>
        <div class="metrics">
            ${metricsHTML}
        </div>
    </section>`;
  }

  /**
   * Format metric labels for display
   */
  private formatMetricLabel(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/Word Count/, 'Words')
      .replace(/Reading Time/, 'Read Time (min)');
  }

  /**
   * Get output path for a page
   */
  private getPageOutputPath(page: PageData): string {
    const url = new URL(page.url);
    const pathname = url.pathname === '/' ? '/index' : url.pathname;
    const outputPath = join(this.config.outputDir, `${pathname}.html`);
    
    // Ensure directory exists
    const dir = dirname(outputPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    
    return outputPath;
  }

  /**
   * Process and optimize assets
   */
  private async processAssets(result: GenerationResult): Promise<void> {
    try {
      this.emit('progress', { step: 'assets', progress: 0, message: 'Discovering assets...' });
      
      const assets = await this.discoverAssets();
      let processedCount = 0;
      
      for (let i = 0; i < assets.length; i++) {
        const asset = assets[i];
        if (!asset) continue;
        
        try {
          await this.optimizeAsset(asset);
          processedCount++;
          
          this.emit('progress', { 
            step: 'assets', 
            progress: (i + 1) / assets.length,
            current: asset.name,
            message: `Optimized ${processedCount}/${assets.length} assets`
          });
          
        } catch (error) {
          const errorMessage = `Failed to optimize asset "${asset.name}": ${error}`;
          result.warnings.push(errorMessage);
          this.emit('warning', { message: errorMessage });
        }
      }
      
      result.assetsProcessed = processedCount;
      this.emit('progress', { step: 'assets', progress: 1, message: `Processed ${processedCount} assets` });
      
    } catch (error) {
      const errorMessage = `Asset processing failed: ${error}`;
      result.errors.push(errorMessage);
      this.emit('error', { error: errorMessage });
      throw new Error(errorMessage);
    }
  }

  /**
   * Generate sitemap.xml
   */
  private async generateSitemap(result: GenerationResult): Promise<void> {
    try {
      const sitemap = this.generateSitemapXML();
      const sitemapPath = join(this.config.outputDir, 'sitemap.xml');
      
      writeFileSync(sitemapPath, sitemap, 'utf8');
      result.sitemapGenerated = true;
      
      this.emit('progress', { step: 'sitemap', progress: 1 });
      
    } catch (error) {
      const errorMessage = `Failed to generate sitemap: ${error}`;
      result.errors.push(errorMessage);
      this.emit('warning', { message: errorMessage });
    }
  }

  /**
   * Generate sitemap XML
   */
  private generateSitemapXML(): string {
    const urls = this.pages
      .map(page => `    <url>
        <loc>${page.url}</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>`)
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
  }

  /**
   * Generate site metadata
   */
  private async generateMetadata(result: GenerationResult): Promise<void> {
    try {
      const metadata = {
        siteName: 'Generated Site',
        totalPages: this.pages.length,
        generatedAt: new Date().toISOString(),
        version: '1.0.0',
        pages: this.pages.map(page => ({
          title: page.title,
          url: page.url,
          wordCount: page.metrics?.wordCount || 0
        }))
      };

      const metadataPath = join(this.config.outputDir, 'site-metadata.json');
      writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
      
      this.emit('progress', { step: 'metadata', progress: 1 });
      
    } catch (error) {
      const errorMessage = `Failed to generate metadata: ${error}`;
      result.warnings.push(errorMessage);
      this.emit('warning', { message: errorMessage });
    }
  }

  /**
   * Ensure output directory exists
   */
  private ensureOutputDirectory(): void {
    if (!existsSync(this.config.outputDir)) {
      mkdirSync(this.config.outputDir, { recursive: true });
    }
  }

  /**
   * Escape HTML characters
   */
  private escapeHTML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Get current configuration
   */
  getConfig(): SiteGeneratorConfig {
    return { ...this.config };
  }

  /**
   * Discover assets in the input directory
   */
  private async discoverAssets(): Promise<AssetInfo[]> {
    const assets: AssetInfo[] = [];
    const assetDir = join(this.config.inputDir, this.config.assetOutputDir || 'assets');
    
    if (!existsSync(assetDir)) {
      return assets;
    }

    const discoverInDirectory = (dir: string): void => {
      const items = readdirSync(dir);
      
      for (const item of items) {
        const itemPath = join(dir, item);
        const stats = statSync(itemPath);
        
        if (stats.isDirectory()) {
          discoverInDirectory(itemPath);
        } else if (stats.isFile()) {
          const ext = extname(item).toLowerCase();
          let type: AssetInfo['type'] = 'other';
          
          if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)) {
            type = 'image';
          } else if (ext === '.css') {
            type = 'css';
          } else if (ext === '.js') {
            type = 'js';
          }
          
          assets.push({
            name: item,
            path: itemPath,
            type,
            size: stats.size,
            originalPath: itemPath
          });
        }
      }
    };

    discoverInDirectory(assetDir);
    return assets;
  }

  /**
   * Optimize a single asset
   */
  private async optimizeAsset(asset: AssetInfo): Promise<void> {
    const outputDir = join(this.config.outputDir, this.config.assetOutputDir || 'assets');
    const outputPath = join(outputDir, asset.name);
    
    // Ensure output directory exists
    const outputDirPath = dirname(outputPath);
    if (!existsSync(outputDirPath)) {
      mkdirSync(outputDirPath, { recursive: true });
    }

    switch (asset.type) {
      case 'image':
        if (this.config.optimizeImages) {
          await this.optimizeImage(asset, outputPath);
        } else {
          await this.copyAsset(asset, outputPath);
        }
        break;
        
      case 'css':
        if (this.config.optimizeCSS) {
          await this.optimizeCSS(asset, outputPath);
        } else {
          await this.copyAsset(asset, outputPath);
        }
        break;
        
      case 'js':
        if (this.config.optimizeJS) {
          await this.optimizeJS(asset, outputPath);
        } else {
          await this.copyAsset(asset, outputPath);
        }
        break;
        
      default:
        await this.copyAsset(asset, outputPath);
        break;
    }
  }

  /**
   * Copy asset without optimization
   */
  private async copyAsset(asset: AssetInfo, outputPath: string): Promise<void> {
    const content = readFileSync(asset.path);
    writeFileSync(outputPath, content);
  }

  /**
   * Optimize image asset
   */
  private async optimizeImage(asset: AssetInfo, outputPath: string): Promise<void> {
    // For now, just copy the image
    // In a real implementation, you would use libraries like sharp or imagemin
    await this.copyAsset(asset, outputPath);
    
    // TODO: Implement actual image optimization
    // - Resize images to appropriate dimensions
    // - Convert to modern formats (WebP, AVIF)
    // - Compress with appropriate quality settings
    // - Generate responsive image variants
  }

  /**
   * Optimize CSS asset
   */
  private async optimizeCSS(asset: AssetInfo, outputPath: string): Promise<void> {
    const content = readFileSync(asset.path, 'utf8');
    
    // Basic CSS optimization
    let optimized = content
      // Remove comments
      .replace(/\/\*[\s\S]*?\*\//g, '')
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      // Remove unnecessary semicolons
      .replace(/;}/g, '}')
      // Remove space around colons
      .replace(/:\s+/g, ':')
      .replace(/\s+:/g, ':')
      // Remove space around commas
      .replace(/,\s+/g, ',')
      .replace(/\s+,/g, ',')
      .trim();
    
    writeFileSync(outputPath, optimized);
    
    // TODO: Implement advanced CSS optimization
    // - Minify CSS with cssnano or similar
    // - Remove unused CSS rules
    // - Optimize selectors
    // - Inline critical CSS
    // - Combine and bundle CSS files
  }

  /**
   * Optimize JavaScript asset
   */
  private async optimizeJS(asset: AssetInfo, outputPath: string): Promise<void> {
    const content = readFileSync(asset.path, 'utf8');
    
    // Basic JS optimization
    let optimized = content
      // Remove single-line comments (but preserve // in strings)
      .replace(/\/\/.*$/gm, '')
      // Remove multi-line comments
      .replace(/\/\*[\s\S]*?\*\//g, '')
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      // Remove space around operators
      .replace(/\s*([=+\-*/])\s*/g, '$1')
      .trim();
    
    writeFileSync(outputPath, optimized);
    
    // TODO: Implement advanced JS optimization
    // - Minify with terser or similar
    // - Remove dead code
    // - Tree shake unused exports
    // - Bundle and combine JS files
    // - Add source maps for debugging
  }

  /**
   * Generate asset manifest
   */
  private async generateAssetManifest(): Promise<void> {
    const manifest = {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      assets: this.assets.map(asset => ({
        name: asset.name,
        type: asset.type,
        size: asset.size,
        path: join(this.config.assetOutputDir || 'assets', asset.name),
        hash: this.generateAssetHash(asset)
      }))
    };

    const manifestPath = join(this.config.outputDir, 'asset-manifest.json');
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  }

  /**
   * Generate hash for asset content
   */
  private generateAssetHash(asset: AssetInfo): string {
    const content = readFileSync(asset.path);
    return createHash('md5').update(content).digest('hex').substring(0, 8);
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<SiteGeneratorConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}

// Export default
export default SiteGenerator;
