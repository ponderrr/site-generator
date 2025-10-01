import { URL } from 'url';
import { logger } from '@site-generator/core';

export class UrlNormalizer {
  /**
   * Normalize a URL to a standard format
   */
  normalize(url: string): string {
    try {
      // Add protocol if missing
      if (!url.match(/^https?:\/\//i)) {
        url = 'https://' + url;
      }

      const parsedUrl = new URL(url);

      // Normalize hostname
      parsedUrl.hostname = parsedUrl.hostname.toLowerCase();

      // Remove default ports
      if ((parsedUrl.protocol === 'https:' && parsedUrl.port === '443') ||
          (parsedUrl.protocol === 'http:' && parsedUrl.port === '80')) {
        parsedUrl.port = '';
      }

      // Remove trailing slash from path (except root)
      if (parsedUrl.pathname !== '/' && parsedUrl.pathname.endsWith('/')) {
        parsedUrl.pathname = parsedUrl.pathname.slice(0, -1);
      }

      // Sort query parameters
      if (parsedUrl.search) {
        const params = new URLSearchParams(parsedUrl.search);
        const sortedParams = new URLSearchParams();

        Array.from(params.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .forEach(([key, value]) => {
            sortedParams.append(key, value);
          });

        parsedUrl.search = sortedParams.toString();
      }

      return parsedUrl.toString();
    } catch (error) {
      logger.warn(`Failed to normalize URL: ${url}`, { error: error instanceof Error ? error.message : String(error) });
      return url;
    }
  }

  /**
   * Check if URL is valid
   */
  isValid(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get domain from URL
   */
  getDomain(url: string): string {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.hostname;
    } catch {
      return '';
    }
  }

  /**
   * Get path from URL
   */
  getPath(url: string): string {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.pathname;
    } catch {
      return '';
    }
  }

  /**
   * Remove query parameters
   */
  removeQuery(url: string): string {
    try {
      const parsedUrl = new URL(url);
      parsedUrl.search = '';
      return parsedUrl.toString();
    } catch {
      return url;
    }
  }

  /**
   * Remove fragment
   */
  removeFragment(url: string): string {
    try {
      const parsedUrl = new URL(url);
      parsedUrl.hash = '';
      return parsedUrl.toString();
    } catch {
      return url;
    }
  }

  /**
   * Compare two URLs for equality (ignoring minor differences)
   */
  areEqual(url1: string, url2: string): boolean {
    try {
      const normalized1 = this.normalize(url1);
      const normalized2 = this.normalize(url2);
      return normalized1 === normalized2;
    } catch {
      return false;
    }
  }

  /**
   * Check if URL is relative
   */
  isRelative(url: string): boolean {
    return !url.match(/^https?:\/\//i);
  }

  /**
   * Convert relative URL to absolute
   */
  toAbsolute(relativeUrl: string, baseUrl: string): string {
    try {
      return new URL(relativeUrl, baseUrl).href;
    } catch {
      return relativeUrl;
    }
  }

  /**
   * Get URL without trailing slash
   */
  withoutTrailingSlash(url: string): string {
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.pathname !== '/' && parsedUrl.pathname.endsWith('/')) {
        parsedUrl.pathname = parsedUrl.pathname.slice(0, -1);
      }
      return parsedUrl.toString();
    } catch {
      return url;
    }
  }

  /**
   * Get URL with trailing slash
   */
  withTrailingSlash(url: string): string {
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.pathname === '/') {
        return parsedUrl.toString();
      }

      if (!parsedUrl.pathname.endsWith('/')) {
        parsedUrl.pathname += '/';
      }
      return parsedUrl.toString();
    } catch {
      return url;
    }
  }
}
