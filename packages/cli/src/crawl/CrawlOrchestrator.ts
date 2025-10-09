import { Crawler } from "@site-generator/crawler";
import { ContentExtractor } from "@site-generator/extractor";
import type { SiteGeneratorConfig } from "../config/ConfigManager.js";
import {
  writeOutputFile,
  sanitizeDomainForFilename,
  generateTimestamp,
} from "../utils/fileWriter.js";
import { join } from "path";

export interface CrawlOptions {
  baseUrl: string;
  outputDir: string;
  config: SiteGeneratorConfig;
  format: "markdown" | "json";
  onProgress?: (stats: any) => void;
  onPageComplete?: (
    url: string,
    success: boolean,
    duration: number,
    size?: number,
  ) => void;
}

export class CrawlOrchestrator {
  private crawler: Crawler;
  private extractors: ContentExtractor[] = [];
  private lastRequestTime = 0;
  private options: CrawlOptions;
  private pageCount = 0;

  constructor(options: CrawlOptions) {
    this.options = options;

    this.crawler = new Crawler({
      baseUrl: options.baseUrl,
      respectRobotsTxt: options.config.crawler.respectRobotsTxt,
      userAgent: options.config.crawler.userAgent,
      onProgress: options.onProgress,
    });
  }

  async initialize(): Promise<void> {
    await this.crawler.initialize();
  }

  async crawl(): Promise<void> {
    const concurrency = this.options.config.crawler.concurrency;
    const maxPages = this.options.config.crawler.maxPages;

    // Create extractor pool
    for (let i = 0; i < concurrency; i++) {
      this.extractors.push(
        new ContentExtractor({
          usePlaywright: true,
          respectRobotsTxt: false, // Already checked by crawler
          retryAttempts: this.options.config.extractor.retryAttempts,
        }),
      );
    }

    // Process queue with concurrency limit
    const workers: Promise<void>[] = [];

    for (let i = 0; i < concurrency; i++) {
      workers.push(this.worker(i));
    }

    await Promise.all(workers);

    // Cleanup
    for (const extractor of this.extractors) {
      await extractor.close();
    }
  }

  private async worker(workerId: number): Promise<void> {
    const extractor = this.extractors[workerId];

    while (
      !this.crawler.isEmpty() &&
      this.pageCount < this.options.config.crawler.maxPages
    ) {
      const url = this.crawler.getNextUrl();
      if (!url) break;

      try {
        // Rate limiting
        await this.rateLimit();

        // Extract content
        const startTime = Date.now();
        const result = await extractor.extract(url);
        const duration = Date.now() - startTime;

        if (result.success && result.content) {
          // Save content
          const domain = sanitizeDomainForFilename(url);
          const timestamp = generateTimestamp();
          const outputSubdir = join(this.options.outputDir, domain);

          let contentSize = 0;

          if (this.options.format === "markdown" && result.content.markdown) {
            const filename = `${domain}_${timestamp}.md`;
            await writeOutputFile({
              outputDir: outputSubdir,
              filename,
              content: result.content.markdown,
            });
            contentSize = result.content.markdown.length;
          } else if (this.options.format === "json") {
            const filename = `${domain}_${timestamp}.json`;
            const jsonContent = JSON.stringify(result, null, 2);
            await writeOutputFile({
              outputDir: outputSubdir,
              filename,
              content: jsonContent,
            });
            contentSize = jsonContent.length;
          }

          // Save metadata
          const metadataFilename = `${domain}_${timestamp}_metadata.json`;
          const metadata = {
            url: result.content.url,
            title: result.content.title,
            extractedAt: new Date().toISOString(),
            format: this.options.format,
            contentLength: contentSize,
            wordCount: result.content.wordCount,
            readingTime: result.content.readingTime,
            imagesExtracted: result.content.images?.length || 0,
            linksExtracted: result.content.links?.length || 0,
          };
          await writeOutputFile({
            outputDir: outputSubdir,
            filename: metadataFilename,
            content: JSON.stringify(metadata, null, 2),
          });

          // Discover new links
          if (result.content.html) {
            await this.crawler.discoverLinks(result.content.html, url);
          }

          this.crawler.markCompleted(url);
          this.pageCount++;
          this.options.onPageComplete?.(url, true, duration, contentSize);
        } else {
          this.crawler.markFailed(url);
          this.options.onPageComplete?.(url, false, duration);
        }
      } catch (error) {
        this.crawler.markFailed(url);
        this.options.onPageComplete?.(url, false, 0);
      }
    }
  }

  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const delay = this.options.config.crawler.delayMs;
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < delay) {
      await new Promise((resolve) =>
        setTimeout(resolve, delay - timeSinceLastRequest),
      );
    }

    this.lastRequestTime = Date.now();
  }

  getStats() {
    return this.crawler.getStats();
  }

  async saveState(filepath: string): Promise<void> {
    await this.crawler.saveState(filepath);
  }

  async loadState(filepath: string): Promise<void> {
    await this.crawler.loadState(filepath);
  }
}
