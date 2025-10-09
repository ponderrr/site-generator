/**
 * @fileoverview Cache Key Generation Utilities
 *
 * Provides structured cache key generation with versioning for better debugging
 * and cache invalidation strategies.
 */

import { createHash } from "crypto";

export interface CacheKeyOptions {
  version?: string;
  namespace?: string;
  includeTimestamp?: boolean;
  timestampGranularity?: "second" | "minute" | "hour" | "day";
  maxKeyLength?: number;
  includeContentHash?: boolean;
}

export interface CacheKeyData {
  [key: string]: any;
}

/**
 * Cache Key Generator with versioning and debugging support
 */
export class CacheKeyGenerator {
  private defaultOptions: Required<CacheKeyOptions>;

  constructor(options: CacheKeyOptions = {}) {
    this.defaultOptions = {
      version: "1.0.0",
      namespace: "cache",
      includeTimestamp: false,
      timestampGranularity: "hour",
      maxKeyLength: 255,
      includeContentHash: true,
      ...options,
    };
  }

  /**
   * Generate a structured cache key
   */
  generate(data: CacheKeyData, options?: Partial<CacheKeyOptions>): string {
    const opts = { ...this.defaultOptions, ...options };
    const timestamp = this.getTimestamp(opts);

    // Create structured key components
    const components = [
      opts.namespace,
      `v${opts.version}`,
      ...this.getKeyComponents(data, opts),
      timestamp ? `t${timestamp}` : "",
      opts.includeContentHash ? this.generateContentHash(data) : "",
    ].filter(Boolean);

    // Join components with separator
    let key = components.join(":");

    // Truncate if too long
    if (key.length > opts.maxKeyLength) {
      const hash = createHash("md5").update(key).digest("hex").substring(0, 8);
      key = key.substring(0, opts.maxKeyLength - 9) + ":" + hash;
    }

    return key;
  }

  /**
   * Generate cache key for URL-based content
   */
  generateForUrl(
    url: string,
    content?: string,
    metadata?: CacheKeyData,
    options?: Partial<CacheKeyOptions>,
  ): string {
    const data: CacheKeyData = {
      url,
      contentHash: content ? this.hashContent(content) : undefined,
      ...metadata,
    };

    return this.generate(data, {
      namespace: "url",
      includeContentHash: !!content,
      ...options,
    });
  }

  /**
   * Generate cache key for analysis results
   */
  generateForAnalysis(
    pageData: {
      url: string;
      title?: string;
      content?: string;
      metadata?: CacheKeyData;
    },
    analysisType?: string,
    options?: Partial<CacheKeyOptions>,
  ): string {
    const data: CacheKeyData = {
      url: pageData.url,
      title: pageData.title,
      contentHash: pageData.content
        ? this.hashContent(pageData.content)
        : undefined,
      analysisType,
      ...pageData.metadata,
    };

    return this.generate(data, {
      namespace: "analysis",
      includeContentHash: !!pageData.content,
      ...options,
    });
  }

  /**
   * Generate cache key for API responses
   */
  generateForApi(
    endpoint: string,
    params?: CacheKeyData,
    options?: Partial<CacheKeyOptions>,
  ): string {
    const data: CacheKeyData = {
      endpoint,
      ...params,
    };

    return this.generate(data, {
      namespace: "api",
      includeTimestamp: true,
      timestampGranularity: "minute",
      ...options,
    });
  }

  /**
   * Generate cache key for user sessions
   */
  generateForSession(
    userId: string,
    sessionData?: CacheKeyData,
    options?: Partial<CacheKeyOptions>,
  ): string {
    const data: CacheKeyData = {
      userId,
      ...sessionData,
    };

    return this.generate(data, {
      namespace: "session",
      includeTimestamp: true,
      timestampGranularity: "day",
      ...options,
    });
  }

  /**
   * Parse a cache key to extract components
   */
  parse(key: string): {
    namespace: string;
    version: string;
    components: string[];
    timestamp?: string;
    contentHash?: string;
  } {
    const parts = key.split(":");
    const [namespace, version, ...rest] = parts;

    const result = {
      namespace: namespace || "unknown",
      version: version || "unknown",
      components: [] as string[],
      ...(rest.find((p) => p.startsWith("t"))
        ? { timestamp: rest.find((p) => p.startsWith("t"))!.substring(1) }
        : {}),
      ...(rest.find((p) => p.startsWith("h"))
        ? { contentHash: rest.find((p) => p.startsWith("h"))!.substring(1) }
        : {}),
    };

    for (const part of rest) {
      if (!part.startsWith("t") && !part.startsWith("h") && part.length > 0) {
        result.components.push(part);
      }
    }

    return result;
  }

  /**
   * Check if a cache key is expired based on timestamp
   */
  isExpired(key: string, ttlSeconds: number): boolean {
    const parsed = this.parse(key);

    if (!parsed.timestamp) {
      return false; // No timestamp, can't determine expiration
    }

    const keyTime = parseInt(parsed.timestamp, 10);
    const now = this.getTimestampSeconds();

    return now - keyTime > ttlSeconds;
  }

  /**
   * Generate a cache invalidation pattern
   */
  generateInvalidationPattern(
    pattern: string,
    options?: Partial<CacheKeyOptions>,
  ): string {
    const opts = { ...this.defaultOptions, ...options };

    // Replace wildcards with appropriate patterns
    const invalidatedPattern = pattern.replace(/\*/g, "*").replace(/\?/g, "?");

    return `${opts.namespace}:v${opts.version}:${invalidatedPattern}`;
  }

  /**
   * Get timestamp for cache key
   */
  private getTimestamp(options: Required<CacheKeyOptions>): string {
    if (!options.includeTimestamp) {
      return "";
    }

    const now = Date.now();

    switch (options.timestampGranularity) {
      case "second":
        return Math.floor(now / 1000).toString();
      case "minute":
        return Math.floor(now / (1000 * 60)).toString();
      case "hour":
        return Math.floor(now / (1000 * 60 * 60)).toString();
      case "day":
        return Math.floor(now / (1000 * 60 * 60 * 24)).toString();
      default:
        return Math.floor(now / (1000 * 60 * 60)).toString();
    }
  }

  /**
   * Get timestamp in seconds
   */
  private getTimestampSeconds(): number {
    return Math.floor(Date.now() / 1000);
  }

  /**
   * Extract key components from data
   */
  private getKeyComponents(
    data: CacheKeyData,
    options: Required<CacheKeyOptions>,
  ): string[] {
    const components: string[] = [];

    // Add URL hash if present
    if (data["url"]) {
      components.push(this.hashString(data["url"], 8));
    }

    // Add title hash if present
    if (data["title"]) {
      components.push(this.hashString(data["title"], 8));
    }

    // Add other important fields
    const importantFields = ["id", "type", "status", "version"];
    for (const field of importantFields) {
      if (data[field]) {
        components.push(`${field}:${this.hashString(String(data[field]), 6)}`);
      }
    }

    return components;
  }

  /**
   * Generate content hash
   */
  private generateContentHash(data: CacheKeyData): string {
    const contentFields = ["content", "body", "data", "payload"];

    for (const field of contentFields) {
      if (data[field]) {
        return `h${this.hashContent(String(data[field])).substring(0, 8)}`;
      }
    }

    return "";
  }

  /**
   * Hash content using MD5
   */
  private hashContent(content: string): string {
    return createHash("md5").update(content).digest("hex");
  }

  /**
   * Hash string with specified length
   */
  private hashString(str: string, length: number = 8): string {
    return createHash("md5").update(str).digest("hex").substring(0, length);
  }
}

/**
 * Default cache key generator instances
 */
export const analysisCacheKeyGenerator = new CacheKeyGenerator({
  namespace: "analysis",
  version: "1.0.0",
  includeTimestamp: false,
  includeContentHash: true,
});

export const apiCacheKeyGenerator = new CacheKeyGenerator({
  namespace: "api",
  version: "1.0.0",
  includeTimestamp: true,
  timestampGranularity: "minute",
});

export const sessionCacheKeyGenerator = new CacheKeyGenerator({
  namespace: "session",
  version: "1.0.0",
  includeTimestamp: true,
  timestampGranularity: "day",
});

/**
 * Utility functions for common cache key operations
 */
export const CacheKeyUtils = {
  /**
   * Create a simple cache key from a string
   */
  simple: (str: string, namespace: string = "cache"): string => {
    const hash = createHash("md5").update(str).digest("hex").substring(0, 12);
    return `${namespace}:${hash}`;
  },

  /**
   * Create a cache key with version
   */
  versioned: (
    str: string,
    version: string = "1.0.0",
    namespace: string = "cache",
  ): string => {
    const hash = createHash("md5").update(str).digest("hex").substring(0, 12);
    return `${namespace}:v${version}:${hash}`;
  },

  /**
   * Create a cache key with timestamp
   */
  timestamped: (
    str: string,
    granularity: "second" | "minute" | "hour" | "day" = "hour",
  ): string => {
    const hash = createHash("md5").update(str).digest("hex").substring(0, 12);
    const now = Date.now();

    let timestamp: number;
    switch (granularity) {
      case "second":
        timestamp = Math.floor(now / 1000);
        break;
      case "minute":
        timestamp = Math.floor(now / (1000 * 60));
        break;
      case "hour":
        timestamp = Math.floor(now / (1000 * 60 * 60));
        break;
      case "day":
        timestamp = Math.floor(now / (1000 * 60 * 60 * 24));
        break;
    }

    return `cache:${timestamp}:${hash}`;
  },

  /**
   * Validate cache key format
   */
  isValid: (key: string): boolean => {
    // Basic validation - should not be empty and should contain valid characters
    return key.length > 0 && key.length <= 255 && /^[a-zA-Z0-9:_-]+$/.test(key);
  },
};
