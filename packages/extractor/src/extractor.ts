import { EventEmitter } from "events";
import * as cheerio from "cheerio";
import TurndownService from "turndown";
import { URL } from "url";
// Temporarily import logger directly to avoid worker initialization issues
// import { logger } from '@site-generator/core';
const logger = {
  info: (...args: any[]) => console.log("[INFO]", ...args),
  error: (...args: any[]) => console.error("[ERROR]", ...args),
  warn: (...args: any[]) => console.warn("[WARN]", ...args),
  debug: (...args: any[]) => console.debug("[DEBUG]", ...args),
};
import { HtmlParser } from "./html-parser.js";
import { MarkdownConverter } from "./markdown-converter.js";
import { MediaExtractor } from "./media-extractor.js";
import { UrlNormalizer } from "./url-normalizer.js";
import { ContentFilter } from "./content-filter.js";
import { BrowserManager } from "./browser/BrowserManager.js";
import { PlaywrightRenderer } from "./renderers/PlaywrightRenderer.js";
import { checkRobotsTxt } from "./utils/robotsTxt.js";
import { JSDOM } from "jsdom";
import createDOMPurify from "dompurify";

export interface ExtractionOptions {
  extractImages?: boolean;
  extractLinks?: boolean;
  extractMetadata?: boolean;
  extractTables?: boolean;
  extractCode?: boolean;
  removeAds?: boolean;
  removeNavigation?: boolean;
  maxContentLength?: number;
  maxConcurrency?: number;
  timeout?: number;
  userAgent?: string;
  followRedirects?: boolean;
  maxRedirects?: number;
  usePlaywright?: boolean; // Enable Playwright rendering for SPAs
  respectRobotsTxt?: boolean; // Check robots.txt before extraction
  retryAttempts?: number; // Number of retry attempts for failed extractions
}

export interface ExtractedContent {
  url: string;
  title: string;
  markdown: string;
  html: string;
  text: string;
  metadata: Record<string, any>;
  images: Array<{
    url: string;
    alt: string;
    title?: string;
  }>;
  links: Array<{
    url: string;
    text: string;
    title?: string;
  }>;
  tables: Array<{
    headers: string[];
    rows: string[][];
    caption?: string;
  }>;
  codeBlocks: Array<{
    language?: string;
    code: string;
    file?: string;
  }>;
  extractionTime: number;
  wordCount: number;
  readingTime: number;
}

export interface ExtractionResult {
  success: boolean;
  content?: ExtractedContent;
  error?: string;
  warnings?: string[];
  metrics?: {
    extractionTime: number;
    contentLength: number;
    imagesExtracted: number;
    linksExtracted: number;
  };
}

export declare interface ContentExtractor {
  on<U extends keyof ExtractorEvents>(
    event: U,
    listener: ExtractorEvents[U],
  ): this;

  emit<U extends keyof ExtractorEvents>(
    event: U,
    ...args: Parameters<ExtractorEvents[U]>
  ): boolean;
}

export interface ExtractorEvents {
  "content-extracted": (result: ExtractionResult) => void;
  "extraction-error": (error: Error, url: string) => void;
  "extraction-progress": (url: string, progress: number) => void;
  "extraction-completed": (results: ExtractionResult[]) => void;
}

export class ContentExtractor extends EventEmitter {
  private htmlParser: HtmlParser;
  private markdownConverter: MarkdownConverter;
  private mediaExtractor: MediaExtractor;
  private urlNormalizer: UrlNormalizer;
  private contentFilter: ContentFilter;
  private turndownService: TurndownService;
  private extractionQueue: Array<{ url: string; options?: ExtractionOptions }> =
    [];
  private activeExtractions: Set<string> = new Set();
  private abortController?: AbortController;
  private defaultOptions: ExtractionOptions;
  private domPurify: ReturnType<typeof createDOMPurify>;
  private browserManager?: BrowserManager;
  private playwrightRenderer?: PlaywrightRenderer;

  constructor(options: ExtractionOptions = {}) {
    super();

    this.defaultOptions = options;
    this.htmlParser = new HtmlParser(options);
    this.markdownConverter = new MarkdownConverter(options);
    this.mediaExtractor = new MediaExtractor(options);
    this.urlNormalizer = new UrlNormalizer();
    this.contentFilter = new ContentFilter(options);

    this.turndownService = new TurndownService({
      headingStyle: "atx",
      hr: "---",
      bulletListMarker: "-",
      codeBlockStyle: "fenced",
      fence: "```",
      emDelimiter: "*",
      strongDelimiter: "**",
      linkStyle: "inlined",
      linkReferenceStyle: "full",
    });

    // Configure turndown rules
    this.configureTurndown();

    // Initialize DOMPurify for HTML sanitization
    const window = new JSDOM("").window;
    this.domPurify = createDOMPurify(window);

    // Initialize Playwright components if usePlaywright is true
    if (options.usePlaywright) {
      this.browserManager = new BrowserManager();
      this.playwrightRenderer = new PlaywrightRenderer(this.browserManager);
    }
  }

  /**
   * Extract content from a single URL
   */
  async extract(
    url: string,
    options: ExtractionOptions = {},
  ): Promise<ExtractionResult> {
    const startTime = Date.now();
    const normalizedUrl = this.urlNormalizer.normalize(url);

    // Merge default options with method options (method options take precedence)
    const mergedOptions = { ...this.defaultOptions, ...options };

    if (this.activeExtractions.has(normalizedUrl)) {
      logger.warn(`Extraction already in progress for ${normalizedUrl}`);
      return {
        success: false,
        error: "Extraction already in progress for this URL",
      };
    }

    this.activeExtractions.add(normalizedUrl);
    this.emit("extraction-progress", normalizedUrl, 0);

    try {
      logger.info(`Starting extraction for ${normalizedUrl}`, {
        url: normalizedUrl,
      });

      // Check robots.txt if respectRobotsTxt is enabled
      if (mergedOptions.respectRobotsTxt) {
        const robotsCheck = await checkRobotsTxt(normalizedUrl);
        if (!robotsCheck.allowed) {
          return {
            success: false,
            error: robotsCheck.reason || "Blocked by robots.txt",
          };
        }
      }

      let htmlContent;

      // Use Playwright if enabled, otherwise use standard parser
      if (mergedOptions.usePlaywright && this.playwrightRenderer) {
        logger.info(`Using Playwright renderer for ${normalizedUrl}`);
        const retryAttempts = mergedOptions.retryAttempts || 3;

        for (let attempt = 0; attempt < retryAttempts; attempt++) {
          try {
            const renderResult =
              await this.playwrightRenderer.render(normalizedUrl);
            htmlContent = {
              success: true,
              html: renderResult.html,
              title: renderResult.title,
              url: renderResult.url,
            };
            break;
          } catch (error) {
            if (attempt === retryAttempts - 1) {
              throw error;
            }
            // Exponential backoff
            await new Promise((resolve) =>
              setTimeout(resolve, 2000 * Math.pow(2, attempt)),
            );
          }
        }
      } else {
        // Parse HTML using standard parser
        this.emit("extraction-progress", normalizedUrl, 25);
        htmlContent = await this.htmlParser.parse(normalizedUrl, options);
      }

      if (!htmlContent || !htmlContent.success) {
        throw new Error(htmlContent?.error || "Failed to parse HTML");
      }

      // Extract metadata
      this.emit("extraction-progress", normalizedUrl, 50);
      const metadata = this.extractMetadata(htmlContent.html!, normalizedUrl);

      // Convert to markdown
      this.emit("extraction-progress", normalizedUrl, 75);
      const markdown = this.markdownConverter.convert(htmlContent.html!);

      // Extract media and links
      const images = this.mediaExtractor.extractImages(htmlContent.html!);
      const links = this.mediaExtractor.extractLinks(htmlContent.html!);

      // Filter content
      let filteredMarkdown = this.contentFilter.filter(markdown);

      // Apply max content length after filtering
      if (
        mergedOptions.maxContentLength &&
        filteredMarkdown.length > mergedOptions.maxContentLength
      ) {
        filteredMarkdown = filteredMarkdown.substring(
          0,
          mergedOptions.maxContentLength,
        );
      }

      // Extract structured data
      const tables = this.extractTables(htmlContent.html!);
      const codeBlocks = this.extractCodeBlocks(htmlContent.html!);

      // Calculate metrics
      const text = this.extractText(htmlContent.html!);
      const wordCount = this.countWords(text);
      const readingTime = Math.ceil(wordCount / 200); // 200 words per minute

      const content: ExtractedContent = {
        url: normalizedUrl,
        title: metadata["title"] || "Untitled",
        markdown: filteredMarkdown,
        html: this.sanitizeHtml(htmlContent.html!),
        text,
        metadata,
        images,
        links,
        tables,
        codeBlocks,
        extractionTime: Date.now() - startTime,
        wordCount,
        readingTime,
      };

      const result: ExtractionResult = {
        success: true,
        content,
        warnings: htmlContent.warnings || [],
        metrics: {
          extractionTime: content.extractionTime,
          contentLength: filteredMarkdown.length,
          imagesExtracted: images.length,
          linksExtracted: links.length,
        },
      };

      this.emit("extraction-progress", normalizedUrl, 100);
      this.emit("content-extracted", result);

      logger.info(`Successfully extracted content from ${normalizedUrl}`, {
        url: normalizedUrl,
        wordCount,
        readingTime,
        images: images.length,
        links: links.length,
      });

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      const result: ExtractionResult = {
        success: false,
        error: errorMessage,
      };

      this.emit(
        "extraction-error",
        error instanceof Error ? error : new Error(errorMessage),
        normalizedUrl,
      );

      // Log error safely without throwing
      try {
        logger.error(
          `Failed to extract content from ${normalizedUrl}`,
          error instanceof Error ? error : new Error(errorMessage),
          {
            url: normalizedUrl,
          },
        );
      } catch {
        // Ignore logger errors
      }

      return result;
    } finally {
      this.activeExtractions.delete(normalizedUrl);
    }
  }

  /**
   * Extract content from multiple URLs
   */
  async extractMultiple(
    urls: string[],
    options: ExtractionOptions = {},
  ): Promise<ExtractionResult[]> {
    const results: ExtractionResult[] = [];
    const batchSize = options.maxConcurrency || 5;

    logger.info(`Starting batch extraction of ${urls.length} URLs`, {
      count: urls.length,
    });

    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      const batchPromises = batch.map((url) => this.extract(url, options));
      const batchResults = await Promise.all(batchPromises);

      results.push(...batchResults);

      // Add small delay between batches to avoid overwhelming servers
      if (i + batchSize < urls.length) {
        await this.delay(1000);
      }
    }

    this.emit("extraction-completed", results);
    logger.info(`Completed batch extraction`, {
      total: urls.length,
      successful: results.filter((r) => r.success).length,
    });

    return results;
  }

  /**
   * Extract content from URLs in queue
   */
  async extractFromQueue(
    options: ExtractionOptions = {},
  ): Promise<ExtractionResult[]> {
    const results: ExtractionResult[] = [];

    while (this.extractionQueue.length > 0) {
      const { url } = this.extractionQueue.shift()!;
      const result = await this.extract(url, options);
      results.push(result);
    }

    return results;
  }

  /**
   * Add URL to extraction queue
   */
  queueExtraction(url: string, options?: ExtractionOptions): void {
    const normalizedUrl = this.urlNormalizer.normalize(url);
    this.extractionQueue.push({ url: normalizedUrl, options: options || {} });
    logger.info(`Queued extraction for ${normalizedUrl}`, {
      url: normalizedUrl,
    });
  }

  /**
   * Get queue status
   */
  getQueueStatus(): {
    queued: number;
    active: number;
    completed: number;
    failed: number;
  } {
    return {
      queued: this.extractionQueue.length,
      active: this.activeExtractions.size,
      completed: 0, // Would need to track this in a real implementation
      failed: 0,
    };
  }

  /**
   * Abort ongoing extractions
   */
  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
    this.extractionQueue.length = 0;
    this.activeExtractions.clear();
    logger.info("Aborted all extractions");
  }

  /**
   * Configure Turndown service
   */
  private configureTurndown(): void {
    // Add custom rules for better markdown conversion
    this.turndownService.addRule("codeBlocks", {
      filter: (node: any) => {
        return node.nodeName === "PRE" && node.firstChild?.nodeName === "CODE";
      },
      replacement: (content: any, node: any) => {
        const codeElement = node.firstChild as Element;
        const language =
          codeElement.getAttribute("class")?.replace("language-", "") || "";
        return `\`\`\`${language}\n${content}\n\`\`\``;
      },
    });

    this.turndownService.addRule("tables", {
      filter: "table",
      replacement: (content: any, node: any) => {
        // Let the markdown converter handle tables
        return content;
      },
    });
  }

  /**
   * Extract metadata from HTML
   */
  private extractMetadata(html: string, url: string): Record<string, any> {
    const $ = cheerio.load(html);
    const metadata: Record<string, any> = {};

    // Extract meta tags
    $("meta").each((_, element) => {
      const name = $(element).attr("name") || $(element).attr("property");
      const content = $(element).attr("content");

      if (name && content) {
        metadata[name] = content;
      }
    });

    // Extract title and clean it (handle malformed HTML)
    // Prefer h1 in article/main over title tag for better content extraction
    let title =
      $("article h1, main h1").first().text().trim() ||
      $("h1").first().text().trim() ||
      $("title").text().trim();
    // Remove any HTML tags that leaked through due to malformed HTML
    title = title.replace(/<[^>]*>/g, "").trim();
    metadata["title"] = title;

    // Extract description
    if (!metadata["description"]) {
      metadata["description"] =
        $('meta[name="description"]').attr("content") ||
        $('meta[property="og:description"]').attr("content") ||
        "";
    }

    // Extract author
    if (!metadata["author"]) {
      metadata["author"] =
        $('meta[name="author"]').attr("content") ||
        $('meta[property="article:author"]').attr("content") ||
        "";
    }

    // Extract published date
    if (!metadata["published"]) {
      metadata["published"] =
        $('meta[property="article:published_time"]').attr("content") ||
        $("time[datetime]").attr("datetime") ||
        "";
    }

    // Extract structured data
    const jsonLd = $('script[type="application/ld+json"]').html();
    if (jsonLd) {
      try {
        metadata["structuredData"] = JSON.parse(jsonLd);
      } catch (e) {
        // Ignore invalid JSON-LD
      }
    }

    return metadata;
  }

  /**
   * Extract tables from HTML
   */
  private extractTables(html: string): ExtractedContent["tables"] {
    const $ = cheerio.load(html);
    const tables: ExtractedContent["tables"] = [];

    $("table").each((_, tableElement) => {
      const headers: string[] = [];
      const rows: string[][] = [];

      // Extract headers
      $(tableElement)
        .find("th")
        .each((_, th) => {
          headers.push($(th).text().trim());
        });

      // Extract rows
      $(tableElement)
        .find("tr")
        .each((_, tr) => {
          const row: string[] = [];
          $(tr)
            .find("td")
            .each((_, td) => {
              row.push($(td).text().trim());
            });

          if (row.length > 0) {
            rows.push(row);
          }
        });

      if (headers.length > 0 || rows.length > 0) {
        tables.push({
          headers,
          rows,
          caption: $(tableElement).find("caption").text().trim(),
        });
      }
    });

    return tables;
  }

  /**
   * Extract code blocks from HTML
   */
  private extractCodeBlocks(html: string): ExtractedContent["codeBlocks"] {
    const $ = cheerio.load(html);
    const codeBlocks: ExtractedContent["codeBlocks"] = [];

    $("pre code").each((_, codeElement) => {
      const code = $(codeElement).text();
      const className = $(codeElement).attr("class") || "";
      const language = className.replace("language-", "");

      codeBlocks.push({
        language,
        code,
        ...($(codeElement).attr("data-file") && {
          file: $(codeElement).attr("data-file")!,
        }),
      });
    });

    return codeBlocks;
  }

  /**
   * Extract plain text from HTML
   */
  private extractText(html: string): string {
    const $ = cheerio.load(html);
    $("script, style, nav, header, footer").remove(); // Remove non-content elements
    return $.text().trim();
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text.split(/\s+/).filter((word) => word.length > 0).length;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Sanitize HTML content using DOMPurify
   */
  private sanitizeHtml(html: string): string {
    return this.domPurify.sanitize(html, {
      ALLOWED_TAGS: [
        "p",
        "br",
        "strong",
        "em",
        "u",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "ul",
        "ol",
        "li",
        "a",
        "img",
        "table",
        "tr",
        "td",
        "th",
        "code",
        "pre",
        "blockquote",
      ],
      ALLOWED_ATTR: ["href", "src", "alt", "title", "class"],
      ALLOW_DATA_ATTR: false,
    });
  }

  /**
   * Close browser and cleanup resources
   */
  async close(): Promise<void> {
    if (this.playwrightRenderer) {
      await this.playwrightRenderer.close();
    }
  }
}

// Default extractor instance - can be imported directly when needed
const defaultExtractor = new ContentExtractor();
