import { URL } from 'url';
import * as cheerio from 'cheerio';
import { logger } from '@site-generator/core';
import { ExtractionOptions } from './extractor';

export interface HtmlParseResult {
  success: boolean;
  html?: string;
  error?: string;
  warnings?: string[];
  metadata?: {
    contentType: string;
    contentLength: number;
    lastModified?: string;
    statusCode: number;
  };
}

export class HtmlParser {
  private defaultUserAgent = 'Mozilla/5.0 (compatible; SiteGenerator/1.0)';
  private defaultTimeout = 30000;

  constructor(private options: ExtractionOptions) {}

  /**
   * Parse HTML from a URL
   */
  async parse(url: string, options: ExtractionOptions = {}): Promise<HtmlParseResult> {
    const startTime = Date.now();

    try {
      logger.info(`Fetching HTML from ${url}`, { url });

      const response = await this.fetchWithTimeout(url, {
        ...this.options,
        ...options
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
        return {
          success: false,
          error: `Invalid content type: ${contentType}`
        };
      }

      const html = await response.text();

      if (html.length === 0) {
        return {
          success: false,
          error: 'Empty HTML content'
        };
      }

      logger.info(`Successfully fetched HTML from ${url}`, {
        url,
        contentLength: html.length,
        contentType,
        duration: Date.now() - startTime
      });

      return {
        success: true,
        html,
        warnings: [],
        metadata: {
          contentType,
          contentLength: html.length,
          lastModified: response.headers.get('last-modified') || undefined,
          statusCode: response.status
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to fetch HTML from ${url}`, error instanceof Error ? error : new Error(errorMessage), {
        url,
        duration: Date.now() - startTime
      });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Parse HTML from string
   */
  parseFromString(html: string): HtmlParseResult {
    if (html.length === 0) {
      return {
        success: false,
        error: 'Empty HTML content'
      };
    }

    return {
      success: true,
      html,
      warnings: [],
      metadata: {
        contentType: 'text/html',
        contentLength: html.length,
        statusCode: 200
      }
    };
  }

  /**
   * Clean HTML content
   */
  cleanHtml(html: string): string {
    const $ = cheerio.load(html);

    // Remove unwanted elements
    $('script, style, noscript, iframe, object, embed').remove();

    // Remove navigation and footer elements if requested
    if (this.options.removeNavigation !== false) {
      $('nav, .nav, .navigation, .navbar, .header').remove();
    }

    if (this.options.removeAds !== false) {
      $('[id*="ad"], [class*="ad"], [id*="banner"], [class*="banner"], .advertisement').remove();
    }

    // Clean up attributes
    $('*').each((_, element) => {
      const $element = $(element);

      // Remove data attributes that aren't useful
      const dataAttrs = Object.keys(element.attribs).filter(attr =>
        attr.startsWith('data-') && !attr.startsWith('data-src') && !attr.startsWith('data-lazy')
      );
      dataAttrs.forEach(attr => $element.removeAttr(attr));

      // Remove empty attributes
      Object.keys(element.attribs).forEach(attr => {
        if (!element.attribs[attr] || element.attribs[attr].trim() === '') {
          $element.removeAttr(attr);
        }
      });
    });

    return $.html();
  }

  /**
   * Validate HTML structure
   */
  validateHtml(html: string): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    const $ = cheerio.load(html);

    // Check for title
    if (!$('title').length) {
      issues.push('Missing title tag');
    }

    // Check for main content
    if (!$('body').length) {
      issues.push('Missing body tag');
    }

    // Check for excessive nesting
    const maxDepth = this.getElementDepth($('body'));
    if (maxDepth > 50) {
      issues.push(`Excessive nesting depth: ${maxDepth}`);
    }

    // Check for broken links
    $('a[href]').each((_, link) => {
      const href = $(link).attr('href');
      if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
        try {
          new URL(href);
        } catch {
          issues.push(`Invalid URL: ${href}`);
        }
      }
    });

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Get element nesting depth
   */
  private getElementDepth(element: cheerio.Cheerio): number {
    if (element.length === 0) return 0;

    let maxDepth = 0;
    element.children().each((_, child) => {
      const $child = cheerio(child);
      const depth = this.getElementDepth($child) + 1;
      maxDepth = Math.max(maxDepth, depth);
    });

    return maxDepth;
  }

  /**
   * Fetch URL with timeout and retries
   */
  private async fetchWithTimeout(
    url: string,
    options: ExtractionOptions
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || this.defaultTimeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': options.userAgent || this.defaultUserAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        redirect: options.followRedirects !== false ? 'follow' : 'manual',
        follow: options.maxRedirects || 5
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
}
