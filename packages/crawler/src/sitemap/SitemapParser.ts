import { XMLParser } from "fast-xml-parser";

export class SitemapParser {
  private parser: XMLParser;

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
    });
  }

  async parseSitemap(sitemapUrl: string): Promise<string[]> {
    try {
      const response = await fetch(sitemapUrl, {
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        return [];
      }

      const xml = await response.text();
      const parsed = this.parser.parse(xml);

      // Check if it's a sitemap index
      if (parsed.sitemapindex) {
        return await this.parseSitemapIndex(parsed.sitemapindex);
      }

      // Regular sitemap
      if (parsed.urlset && parsed.urlset.url) {
        return this.extractUrls(parsed.urlset.url);
      }

      return [];
    } catch (error) {
      // Sitemap not found or invalid
      return [];
    }
  }

  private async parseSitemapIndex(sitemapindex: any): Promise<string[]> {
    const sitemaps = Array.isArray(sitemapindex.sitemap)
      ? sitemapindex.sitemap
      : [sitemapindex.sitemap];

    const allUrls: string[] = [];

    for (const sitemap of sitemaps) {
      if (sitemap.loc) {
        const urls = await this.parseSitemap(sitemap.loc);
        allUrls.push(...urls);
      }
    }

    return allUrls;
  }

  private extractUrls(urlEntries: any): string[] {
    const entries = Array.isArray(urlEntries) ? urlEntries : [urlEntries];
    return entries.map((entry) => entry.loc).filter(Boolean);
  }
}
