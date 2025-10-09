import * as cheerio from "cheerio";
const logger = {
  info: (...args: any[]) => console.log("[INFO]", ...args),
  error: (...args: any[]) => console.error("[ERROR]", ...args),
  warn: (...args: any[]) => console.warn("[WARN]", ...args),
  debug: (...args: any[]) => console.debug("[DEBUG]", ...args),
};
import type { ExtractionOptions } from "./extractor.js";

export class ContentFilter {
  private stopWords: Set<string>;
  private minWordLength: number = 3;
  private maxWordLength: number = 50;

  // Static regex patterns to avoid recompilation on every call
  private static readonly UNWANTED_SECTION_PATTERNS = [
    /##\s*(?:advertisement|ad|sponsor|promotion)/gi,
    /##\s*(?:comment|discussion)/gi,
    /##\s*(?:related|see also)/gi,
    /##\s*(?:tag|category|archive)/gi,
  ] as const;

  private static readonly BOILERPLATE_PATTERNS = [
    /©\s+\d{4}.*/gi,
    /all rights reserved/gi,
    /privacy policy/gi,
    /terms of service/gi,
    /cookie policy/gi,
    /back to top/gi,
    /print this page/gi,
    /share this/gi,
    /follow us/gi,
    /subscribe/gi,
  ] as const;

  constructor(private options: ExtractionOptions) {
    this.stopWords = new Set([
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
      "is",
      "are",
      "was",
      "were",
      "be",
      "been",
      "being",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "will",
      "would",
      "could",
      "should",
      "may",
      "might",
      "must",
      "can",
      "this",
      "that",
      "these",
      "those",
      "i",
      "you",
      "he",
      "she",
      "it",
      "we",
      "they",
      "me",
      "him",
      "her",
      "us",
      "them",
      "my",
      "your",
      "his",
      "its",
      "our",
      "their",
      "what",
      "which",
      "who",
      "whom",
      "whose",
      "when",
      "where",
      "why",
      "how",
      "all",
      "any",
      "both",
      "each",
      "few",
      "more",
      "most",
      "other",
      "some",
      "such",
      "no",
      "nor",
      "not",
      "only",
      "own",
      "same",
      "so",
      "than",
      "too",
      "very",
      "s",
      "t",
      "can",
      "will",
      "just",
      "don",
      "should",
      "now",
    ]);
  }

  /**
   * Filter markdown content
   */
  filter(markdown: string): string {
    let filtered = markdown;

    // Remove unwanted sections
    filtered = this.removeUnwantedSections(filtered);

    // Remove boilerplate content
    filtered = this.removeBoilerplate(filtered);

    // Clean up formatting
    filtered = this.cleanFormatting(filtered);

    // Remove short or overly long paragraphs
    filtered = this.filterByLength(filtered);

    // Remove low-quality content
    filtered = this.filterByQuality(filtered);

    return filtered.trim();
  }

  /**
   * Filter HTML content before conversion
   */
  filterHtml(html: string): string {
    const $ = cheerio.load(html);

    // Remove script and style elements
    $("script, style, noscript").remove();

    // Remove navigation if requested
    if (this.options.removeNavigation !== false) {
      $("nav, .nav, .navigation, .navbar, .menu").remove();
    }

    // Remove ads if requested
    if (this.options.removeAds !== false) {
      $(
        '[id*="ad"], [class*="ad"], [id*="banner"], [class*="banner"], .advertisement',
      ).remove();
    }

    // Remove footer if requested
    if (this.options.removeNavigation !== false) {
      $("footer, .footer").remove();
    }

    // Remove comments
    $('[id*="comment"], [class*="comment"]').remove();

    // Remove social media widgets
    $(
      '[class*="social"], [id*="social"], [class*="share"], [id*="share"]',
    ).remove();

    return $.html();
  }

  private removeUnwantedSections(markdown: string): string {
    let result = markdown;
    for (const pattern of ContentFilter.UNWANTED_SECTION_PATTERNS) {
      result = result.replace(pattern, "");
    }
    return result;
  }

  private removeBoilerplate(markdown: string): string {
    let result = markdown;
    for (const pattern of ContentFilter.BOILERPLATE_PATTERNS) {
      result = result.replace(pattern, "");
    }
    return result;
  }

  private cleanFormatting(markdown: string): string {
    let cleaned = markdown;

    // Fix multiple consecutive line breaks
    cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

    // Fix spacing around headings
    cleaned = cleaned.replace(/(\n#+\s+.*)\n+/g, "$1\n\n");

    // Fix list formatting
    cleaned = cleaned.replace(/(\n- .+)\n\n/g, "$1\n");

    // Remove trailing whitespace
    cleaned = cleaned.replace(/[ \t]+$/gm, "");

    return cleaned;
  }

  private filterByLength(markdown: string): string {
    const lines = markdown.split("\n");
    const filteredLines: string[] = [];

    for (const line of lines) {
      // Skip very short lines (likely fragments)
      if (line.trim().length < this.minWordLength) {
        continue;
      }

      // Skip very long lines (likely code or URLs)
      if (line.length > 1000) {
        continue;
      }

      // Skip lines with too many words (likely dense content)
      const wordCount = line.split(/\s+/).length;
      if (wordCount > 100) {
        continue;
      }

      filteredLines.push(line);
    }

    return filteredLines.join("\n");
  }

  private filterByQuality(markdown: string): string {
    const lines = markdown.split("\n");
    const filteredLines: string[] = [];

    for (const line of lines) {
      // Skip lines with too many stop words
      const words = line.toLowerCase().split(/\s+/);
      const significantWords = words.filter(
        (word) =>
          word.length >= this.minWordLength && !this.stopWords.has(word),
      );

      if (significantWords.length === 0 && words.length > 3) {
        continue; // Skip lines with only stop words
      }

      // Skip lines with too many special characters
      const specialCharRatio =
        (line.match(/[^a-zA-Z0-9\s]/g) || []).length / line.length;
      if (specialCharRatio > 0.3) {
        continue;
      }

      // Skip lines with excessive capitalization
      const capsRatio = (line.match(/[A-Z]/g) || []).length / line.length;
      if (capsRatio > 0.7) {
        continue;
      }

      filteredLines.push(line);
    }

    return filteredLines.join("\n");
  }

  /**
   * Check if content is worth keeping
   */
  isWorthKeeping(content: string): boolean {
    const wordCount = content.split(/\s+/).length;

    // Too short
    if (wordCount < 10) {
      return false;
    }

    // Too long (single block)
    if (wordCount > 1000) {
      return false;
    }

    // Check quality metrics
    const significantWords = content
      .toLowerCase()
      .split(/\s+/)
      .filter(
        (word) =>
          word.length >= this.minWordLength && !this.stopWords.has(word),
      );

    const qualityRatio = significantWords.length / wordCount;

    return qualityRatio > 0.3; // At least 30% significant words
  }

  /**
   * Extract main content sections
   */
  extractMainContent(markdown: string): string[] {
    const sections: string[] = [];
    const lines = markdown.split("\n");

    let currentSection = "";
    let inCodeBlock = false;

    for (const line of lines) {
      // Track code blocks
      if (line.startsWith("```")) {
        inCodeBlock = !inCodeBlock;
      }

      if (inCodeBlock) {
        currentSection += line + "\n";
        continue;
      }

      // Split on headings
      if (line.match(/^#+\s/)) {
        if (currentSection.trim() && this.isWorthKeeping(currentSection)) {
          sections.push(currentSection.trim());
        }
        currentSection = line + "\n";
      } else {
        currentSection += line + "\n";
      }
    }

    // Add final section
    if (currentSection.trim() && this.isWorthKeeping(currentSection)) {
      sections.push(currentSection.trim());
    }

    return sections;
  }
}
