import * as cheerio from 'cheerio';
import { URL } from 'url';
import { logger } from '@site-generator/core';
import { ExtractionOptions } from './extractor';

export class MediaExtractor {
  constructor(private options: ExtractionOptions) {}

  /**
   * Extract images from HTML
   */
  extractImages(html: string): Array<{ url: string; alt: string; title?: string }> {
    const $ = cheerio.load(html);
    const images: Array<{ url: string; alt: string; title?: string }> = [];

    $('img').each((_, imgElement) => {
      const src = $(imgElement).attr('src');
      const alt = $(imgElement).attr('alt') || '';
      const title = $(imgElement).attr('title') || undefined;

      if (src) {
        try {
          const absoluteUrl = this.resolveUrl(src);
          images.push({
            url: absoluteUrl,
            alt,
            title
          });
        } catch (error) {
          logger.warn(`Invalid image URL: ${src}`, { src });
        }
      }
    });

    return images;
  }

  /**
   * Extract links from HTML
   */
  extractLinks(html: string): Array<{ url: string; text: string; title?: string }> {
    const $ = cheerio.load(html);
    const links: Array<{ url: string; text: string; title?: string }> = [];

    $('a').each((_, linkElement) => {
      const href = $(linkElement).attr('href');
      const text = $(linkElement).text().trim();
      const title = $(linkElement).attr('title') || undefined;

      if (href && text) {
        try {
          const absoluteUrl = this.resolveUrl(href);
          links.push({
            url: absoluteUrl,
            text,
            title
          });
        } catch (error) {
          logger.warn(`Invalid link URL: ${href}`, { href });
        }
      }
    });

    return links;
  }

  /**
   * Extract media files (videos, audio, documents)
   */
  extractMedia(html: string): Array<{
    url: string;
    type: 'video' | 'audio' | 'document';
    title?: string;
    description?: string;
  }> {
    const $ = cheerio.load(html);
    const media: Array<{
      url: string;
      type: 'video' | 'audio' | 'document';
      title?: string;
      description?: string;
    }> = [];

    // Videos
    $('video source').each((_, sourceElement) => {
      const src = $(sourceElement).attr('src');
      if (src) {
        try {
          const absoluteUrl = this.resolveUrl(src);
          media.push({
            url: absoluteUrl,
            type: 'video',
            title: $(sourceElement).attr('title') || undefined
          });
        } catch (error) {
          logger.warn(`Invalid video URL: ${src}`, { src });
        }
      }
    });

    // Audio
    $('audio source').each((_, sourceElement) => {
      const src = $(sourceElement).attr('src');
      if (src) {
        try {
          const absoluteUrl = this.resolveUrl(src);
          media.push({
            url: absoluteUrl,
            type: 'audio',
            title: $(sourceElement).attr('title') || undefined
          });
        } catch (error) {
          logger.warn(`Invalid audio URL: ${src}`, { src });
        }
      }
    });

    // Documents
    $('a[href$=".pdf"], a[href$=".doc"], a[href$=".docx"], a[href$=".xls"], a[href$=".xlsx"]').each((_, linkElement) => {
      const href = $(linkElement).attr('href');
      const text = $(linkElement).text().trim();
      if (href) {
        try {
          const absoluteUrl = this.resolveUrl(href);
          media.push({
            url: absoluteUrl,
            type: 'document',
            title: text || $(linkElement).attr('title') || undefined,
            description: text
          });
        } catch (error) {
          logger.warn(`Invalid document URL: ${href}`, { href });
        }
      }
    });

    return media;
  }

  /**
   * Download media file
   */
  async downloadMedia(url: string, destination: string): Promise<boolean> {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        logger.warn(`Failed to download media: ${response.status}`, { url });
        return false;
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      // In a real implementation, you'd save the buffer to the destination
      logger.info(`Downloaded media file`, { url, size: buffer.length });

      return true;
    } catch (error) {
      logger.error(`Error downloading media`, error instanceof Error ? error : new Error(String(error)), { url });
      return false;
    }
  }

  /**
   * Get media metadata
   */
  async getMediaMetadata(url: string): Promise<{
    size?: number;
    contentType?: string;
    lastModified?: string;
  }> {
    try {
      const response = await fetch(url, { method: 'HEAD' });

      if (!response.ok) {
        return {};
      }

      return {
        size: parseInt(response.headers.get('content-length') || '0'),
        contentType: response.headers.get('content-type') || undefined,
        lastModified: response.headers.get('last-modified') || undefined
      };
    } catch (error) {
      logger.warn(`Failed to get media metadata`, { url, error: error instanceof Error ? error.message : String(error) });
      return {};
    }
  }

  /**
   * Resolve relative URL to absolute URL
   */
  private resolveUrl(url: string, baseUrl?: string): string {
    if (!baseUrl) {
      baseUrl = 'https://example.com'; // Default base URL
    }

    try {
      return new URL(url, baseUrl).href;
    } catch (error) {
      throw new Error(`Invalid URL: ${url}`);
    }
  }
}
