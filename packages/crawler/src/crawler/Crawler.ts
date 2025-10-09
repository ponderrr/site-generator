import { URLQueue } from "../queue/URLQueue.js";
import { URLNormalizer } from "../normalizer/URLNormalizer.js";
import { LinkDiscovery } from "../discovery/LinkDiscovery.js";
import { SitemapParser } from "../sitemap/SitemapParser.js";
import { RobotsTxtChecker } from "../robots/RobotsTxtChecker.js";
import { CrawlState } from "../state/CrawlState.js";

export interface CrawlerOptions {
  baseUrl: string;
  respectRobotsTxt?: boolean;
  userAgent?: string;
  onProgress?: (stats: any) => void;
}

export class Crawler {
  private queue: URLQueue;
  private normalizer: URLNormalizer;
  private linkDiscovery: LinkDiscovery;
  private sitemapParser: SitemapParser;
  private robotsChecker: RobotsTxtChecker;
  private baseUrl: string;
  private options: Required<CrawlerOptions>;

  constructor(options: CrawlerOptions) {
    this.baseUrl = options.baseUrl;
    this.options = {
      respectRobotsTxt: true,
      userAgent: "site-generator-bot",
      onProgress: () => {},
      ...options,
    };

    this.queue = new URLQueue();
    this.normalizer = new URLNormalizer();
    this.linkDiscovery = new LinkDiscovery();
    this.sitemapParser = new SitemapParser();
    this.robotsChecker = new RobotsTxtChecker();
  }

  async initialize(): Promise<void> {
    // Add base URL
    const normalizedBase = this.normalizer.normalize(this.baseUrl);
    if (normalizedBase) {
      this.queue.add(normalizedBase);
    }

    // Check robots.txt and get sitemaps
    if (this.options.respectRobotsTxt) {
      const robotCheck = await this.robotsChecker.checkUrl(
        this.baseUrl,
        this.options.userAgent,
      );

      // Process sitemaps
      for (const sitemapUrl of robotCheck.sitemapUrls) {
        const urls = await this.sitemapParser.parseSitemap(sitemapUrl);
        const filtered = urls.filter(
          (url) =>
            this.normalizer.isSameDomain(url, this.baseUrl) &&
            !this.normalizer.shouldSkip(url),
        );
        const normalized = filtered
          .map((url) => this.normalizer.normalize(url))
          .filter((url): url is string => url !== null);

        this.queue.addBatch(normalized);
      }
    }

    // Try default sitemap.xml location
    try {
      const defaultSitemap = new URL("/sitemap.xml", this.baseUrl).href;
      const urls = await this.sitemapParser.parseSitemap(defaultSitemap);
      const filtered = urls.filter(
        (url) =>
          this.normalizer.isSameDomain(url, this.baseUrl) &&
          !this.normalizer.shouldSkip(url),
      );
      const normalized = filtered
        .map((url) => this.normalizer.normalize(url))
        .filter((url): url is string => url !== null);

      this.queue.addBatch(normalized);
    } catch {
      // No sitemap.xml found
    }
  }

  async discoverLinks(html: string, pageUrl: string): Promise<string[]> {
    // Discover all links on page
    const discoveredLinks = this.linkDiscovery.discoverLinks(html, pageUrl);

    // Filter to same domain
    const sameDomainLinks = discoveredLinks.filter((url) =>
      this.normalizer.isSameDomain(url, this.baseUrl),
    );

    // Skip unwanted URLs
    const filteredLinks = sameDomainLinks.filter(
      (url) => !this.normalizer.shouldSkip(url),
    );

    // Check robots.txt if enabled
    let allowedLinks = filteredLinks;
    if (this.options.respectRobotsTxt) {
      const checks = await Promise.all(
        filteredLinks.map((url) =>
          this.robotsChecker.checkUrl(url, this.options.userAgent),
        ),
      );
      allowedLinks = filteredLinks.filter((_, index) => checks[index].allowed);
    }

    // Normalize URLs
    const normalizedLinks = allowedLinks
      .map((url) => this.normalizer.normalize(url))
      .filter((url): url is string => url !== null);

    // Add to queue (deduplication handled by queue)
    this.queue.addBatch(normalizedLinks);

    return normalizedLinks;
  }

  getNextUrl(): string | null {
    return this.queue.getNext();
  }

  markCompleted(url: string): void {
    this.queue.markCompleted(url);
    this.options.onProgress(this.queue.getStats());
  }

  markFailed(url: string): void {
    this.queue.markFailed(url);
    this.options.onProgress(this.queue.getStats());
  }

  isEmpty(): boolean {
    return this.queue.isEmpty();
  }

  getStats() {
    return this.queue.getStats();
  }

  async saveState(filepath: string): Promise<void> {
    const state = new CrawlState(this.baseUrl, this.queue);
    await state.save(filepath);
  }

  async loadState(filepath: string): Promise<void> {
    const { baseUrl, queue } = await CrawlState.load(filepath);
    this.baseUrl = baseUrl;
    this.queue = queue;
  }
}
