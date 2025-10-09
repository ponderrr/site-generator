# @site-generator/crawler

Crawler core infrastructure for discovering and crawling entire websites.

## Features

- **URL Queue Management**: Tracks pending, processing, completed, and failed URLs
- **URL Normalization**: Cleans and deduplicates URLs
- **Link Discovery**: Extracts links from HTML pages
- **Sitemap Parsing**: Parses sitemap.xml files for URL discovery
- **Robots.txt Compliance**: Respects robots.txt rules
- **State Management**: Save and resume crawl state

## Usage

```typescript
import { Crawler } from "@site-generator/crawler";

const crawler = new Crawler({
  baseUrl: "https://example.com",
  respectRobotsTxt: true,
  onProgress: (stats) => {
    console.log("Progress:", stats);
  },
});

await crawler.initialize();

// Crawl loop
while (!crawler.isEmpty()) {
  const url = crawler.getNextUrl();
  if (!url) break;

  try {
    // Extract page and discover links
    const html = await fetchPage(url);
    await crawler.discoverLinks(html, url);
    crawler.markCompleted(url);
  } catch (error) {
    crawler.markFailed(url);
  }
}

console.log("Crawl complete:", crawler.getStats());
```
