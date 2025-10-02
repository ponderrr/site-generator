import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ContentExtractor, ExtractionOptions, ExtractedContent } from './extractor';

// Mock the path module
vi.mock('path', () => ({
  resolve: vi.fn((...args) => args.join('/')),
  dirname: vi.fn((path) => path.split('/').slice(0, -1).join('/') || '/'),
  join: vi.fn((...args) => args.join('/')),
  extname: vi.fn((path) => path.split('.').pop() || ''),
  basename: vi.fn((path) => path.split('/').pop() || ''),
}));
import { HtmlParser } from './html-parser';
import { MarkdownConverter } from './markdown-converter';
import { MediaExtractor } from './media-extractor';
import { UrlNormalizer } from './url-normalizer';
import { ContentFilter } from './content-filter';

describe('ContentExtractor', () => {
  let extractor: ContentExtractor;
  let htmlParser: HtmlParser;
  let markdownConverter: MarkdownConverter;
  let mediaExtractor: MediaExtractor;
  let urlNormalizer: UrlNormalizer;
  let contentFilter: ContentFilter;

  const sampleHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Test Article</title>
    <meta name="description" content="This is a test article">
    <meta name="author" content="Test Author">
</head>
<body>
    <header>
        <nav>Navigation</nav>
    </header>

    <main>
        <article>
            <h1>Main Article Title</h1>
            <p>This is the main content of the article. It contains several paragraphs.</p>

            <h2>Section 1</h2>
            <p>This is section 1 content.</p>

            <h2>Section 2</h2>
            <p>This is section 2 content with some <strong>bold text</strong> and <em>italic text</em>.</p>

            <p>Here's a list:</p>
            <ul>
                <li>Item 1</li>
                <li>Item 2</li>
                <li>Item 3</li>
            </ul>

            <p>And a code block:</p>
            <pre><code>console.log('Hello World');</code></pre>

            <p>Here's a table:</p>
            <table>
                <tr><th>Header 1</th><th>Header 2</th></tr>
                <tr><td>Row 1</td><td>Data 1</td></tr>
                <tr><td>Row 2</td><td>Data 2</td></tr>
            </table>
        </article>
    </main>

    <footer>
        <p>Footer content</p>
    </footer>
</body>
</html>`;

  beforeEach(() => {
    const options: ExtractionOptions = {
      extractImages: true,
      extractLinks: true,
      extractMetadata: true,
      removeAds: true,
      removeNavigation: true
    };

    extractor = new ContentExtractor(options);
    htmlParser = new HtmlParser(options);
    markdownConverter = new MarkdownConverter(options);
    mediaExtractor = new MediaExtractor(options);
    urlNormalizer = new UrlNormalizer();
    contentFilter = new ContentFilter(options);
  });

  describe('ContentExtractor', () => {
    it('should extract content successfully', async () => {
      const result = await extractor.extract('data:text/html,' + encodeURIComponent(sampleHtml));

      expect(result.success).toBe(true);
      expect(result.content).toBeDefined();
      expect(result.content?.title).toBe('Main Article Title');
      expect(result.content?.markdown).toContain('# Main Article Title');
      expect(result.content?.markdown).toContain('This is the main content');
    });

    it('should handle extraction errors', async () => {
      const result = await extractor.extract('invalid-url');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should extract metadata', async () => {
      const result = await extractor.extract('data:text/html,' + encodeURIComponent(sampleHtml));

      expect(result.success).toBe(true);
      expect(result.content?.metadata.title).toBe('Main Article Title');
      expect(result.content?.metadata.description).toBe('This is a test article');
      expect(result.content?.metadata.author).toBe('Test Author');
    });

    it('should count words and calculate reading time', async () => {
      const result = await extractor.extract('data:text/html,' + encodeURIComponent(sampleHtml));

      expect(result.success).toBe(true);
      expect(result.content?.wordCount).toBeGreaterThan(0);
      expect(result.content?.readingTime).toBeGreaterThan(0);
    });

    it('should handle empty content', async () => {
      const emptyHtml = '<html><head><title>Test</title></head><body></body></html>';
      const result = await extractor.extract('data:text/html,' + encodeURIComponent(emptyHtml));

      expect(result.success).toBe(true);
      expect(result.content?.markdown).toBeDefined();
    });

    it('should handle large content', async () => {
      const largeContent = sampleHtml.repeat(100); // 100x the sample content
      const result = await extractor.extract('data:text/html,' + encodeURIComponent(largeContent));

      expect(result.success).toBe(true);
      expect(result.content?.markdown.length).toBeGreaterThan(0);
    });
  });

  describe('HtmlParser', () => {
    it('should parse HTML from string', () => {
      const result = htmlParser.parseFromString(sampleHtml);

      expect(result.success).toBe(true);
      expect(result.html).toBeDefined();
      expect(result.metadata?.contentType).toBe('text/html');
    });

    it('should clean HTML content', () => {
      const cleaned = htmlParser.cleanHtml(sampleHtml);
      expect(cleaned).toBeDefined();
      expect(cleaned.length).toBeLessThanOrEqual(sampleHtml.length);
    });

    it('should validate HTML structure', () => {
      const validation = htmlParser.validateHtml(sampleHtml);
      expect(validation.valid).toBe(true);
      expect(Array.isArray(validation.issues)).toBe(true);
    });

    it('should handle malformed HTML', () => {
      const malformed = '<html><head><title>Test</head><body>';
      const result = htmlParser.parseFromString(malformed);

      expect(result.success).toBe(true);
      expect(result.html).toBeDefined();
    });
  });

  describe('MarkdownConverter', () => {
    it('should convert HTML to Markdown', () => {
      const markdown = markdownConverter.convert(sampleHtml);

      expect(markdown).toBeDefined();
      expect(markdown).toContain('# Main Article Title');
      expect(markdown).toContain('**bold text**');
      expect(markdown).toContain('*italic text*');
      expect(markdown).toMatch(/[-*]\s+Item 1/); // More flexible list matching
      expect(markdown).toContain('```');
    });

    it('should convert Markdown back to HTML', () => {
      const markdown = '# Test\n\n**Bold** and *italic* text';
      const html = markdownConverter.toHtml(markdown);

      expect(html).toContain('<h1>Test</h1>');
      expect(html).toContain('<strong>Bold</strong>');
      expect(html).toContain('<em>italic</em>');
    });

    it('should handle code blocks', () => {
      const htmlWithCode = '<pre><code class="language-javascript">console.log("test");</code></pre>';
      const markdown = markdownConverter.convert(htmlWithCode);

      expect(markdown).toContain('```javascript');
      expect(markdown).toContain('console.log("test");');
    });

    it('should handle tables', () => {
      const htmlWithTable = '<table><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table>';
      const markdown = markdownConverter.convert(htmlWithTable);

      expect(markdown).toContain('| A | B |');
      expect(markdown).toContain('| 1 | 2 |');
    });
  });

  describe('MediaExtractor', () => {
    const htmlWithMedia = `
<html>
<body>
    <img src="https://example.com/image.jpg" alt="Test image" title="My title">
    <a href="https://example.com/link">Link text</a>
    <video><source src="video.mp4"></video>
    <audio><source src="audio.mp3"></audio>
    <a href="document.pdf">Download PDF</a>
</body>
</html>`;

    it('should extract images', () => {
      const images = mediaExtractor.extractImages(htmlWithMedia);

      expect(images.length).toBeGreaterThan(0);
      expect(images[0].url).toContain('example.com/image.jpg');
      expect(images[0].alt).toBe('Test image');
      expect(images[0].title).toBe('My title');
    });

    it('should extract links', () => {
      const links = mediaExtractor.extractLinks(htmlWithMedia);

      expect(links.length).toBeGreaterThan(0);
      expect(links[0].url).toContain('example.com/link');
      expect(links[0].text).toBe('Link text');
    });

    it('should extract media files', () => {
      const media = mediaExtractor.extractMedia(htmlWithMedia);

      expect(media.length).toBeGreaterThan(0);
      expect(media.some(m => m.type === 'video')).toBe(true);
      expect(media.some(m => m.type === 'audio')).toBe(true);
      expect(media.some(m => m.type === 'document')).toBe(true);
    });

    it('should resolve relative URLs', () => {
      const images = mediaExtractor.extractImages('<img src="/relative/path.jpg">');
      expect(images.length).toBeGreaterThan(0);
      expect(images[0].url).toContain('example.com/relative/path.jpg');
    });
  });

  describe('UrlNormalizer', () => {
    it('should normalize URLs', () => {
      const normalized = urlNormalizer.normalize('HTTPS://EXAMPLE.COM:443/PATH/');
      expect(normalized).toBe('https://example.com/path');
    });

    it('should validate URLs', () => {
      expect(urlNormalizer.isValid('https://example.com')).toBe(true);
      expect(urlNormalizer.isValid('not-a-url')).toBe(false);
    });

    it('should extract domain', () => {
      expect(urlNormalizer.getDomain('https://sub.example.com/path')).toBe('sub.example.com');
    });

    it('should extract path', () => {
      expect(urlNormalizer.getPath('https://example.com/path/to/resource')).toBe('/path/to/resource');
    });

    it('should remove query parameters', () => {
      expect(urlNormalizer.removeQuery('https://example.com/path?param=value')).toBe('https://example.com/path');
    });

    it('should remove fragment', () => {
      expect(urlNormalizer.removeFragment('https://example.com/path#section')).toBe('https://example.com/path');
    });

    it('should compare URLs', () => {
      expect(urlNormalizer.areEqual('https://example.com/', 'HTTPS://EXAMPLE.COM:443/')).toBe(true);
    });

    it('should handle relative URLs', () => {
      expect(urlNormalizer.isRelative('/path')).toBe(true);
      expect(urlNormalizer.isRelative('https://example.com/path')).toBe(false);
    });

    it('should convert relative to absolute', () => {
      expect(urlNormalizer.toAbsolute('/path', 'https://example.com')).toBe('https://example.com/path');
    });
  });

  describe('ContentFilter', () => {
    it('should filter markdown content', () => {
      const filtered = contentFilter.filter('# Main\n\nContent with **bold** and *italic* text.');
      expect(filtered).toBeDefined();
      expect(filtered.length).toBeGreaterThan(0);
    });

    it('should filter HTML content', () => {
      const filtered = contentFilter.filterHtml('<script>alert("test")</script><p>Content</p>');
      expect(filtered).toBeDefined();
      expect(filtered).not.toContain('<script>');
    });

    it('should check if content is worth keeping', () => {
      expect(contentFilter.isWorthKeeping('This is a substantial piece of content with many words.')).toBe(true);
      expect(contentFilter.isWorthKeeping('x')).toBe(false);
    });

    it('should extract main content sections', () => {
      const sections = contentFilter.extractMainContent(
        '# Section 1\n\nThis is the first section with enough content to be considered worth keeping for the extraction process.\n\n' +
        '# Section 2\n\nThis is the second section which also contains substantial content that meets the minimum requirements.'
      );
      expect(sections.length).toBeGreaterThan(0);
    });
  });

  describe('Integration Tests', () => {
    it('should work together - full extraction pipeline', async () => {
      const result = await extractor.extract('data:text/html,' + encodeURIComponent(sampleHtml));

      expect(result.success).toBe(true);

      const content = result.content!;
      expect(content.title).toBeDefined();
      expect(content.markdown).toBeDefined();
      expect(content.wordCount).toBeGreaterThan(0);
      expect(content.readingTime).toBeGreaterThan(0);
      expect(content.metadata).toBeDefined();
      expect(content.extractionTime).toBeGreaterThan(0);
    });

    it('should handle batch extraction', async () => {
      const urls = [
        'data:text/html,' + encodeURIComponent('<html><body><h1>Test 1</h1></body></html>'),
        'data:text/html,' + encodeURIComponent('<html><body><h1>Test 2</h1></body></html>')
      ];

      const results = await extractor.extractMultiple(urls);

      expect(results.length).toBe(2);
      expect(results.every(r => r.success)).toBe(true);
    });

    it('should handle different content types', async () => {
      const htmlWithAllFeatures = `
<html>
<body>
    <h1>Title</h1>
    <p>Paragraph with <strong>bold</strong> and <em>italic</em> text.</p>
    <ul><li>Item 1</li><li>Item 2</li></ul>
    <pre><code>console.log('test');</code></pre>
    <table><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table>
    <img src="image.jpg" alt="Test">
    <a href="link.html">Link</a>
</body>
</html>`;

      const result = await extractor.extract('data:text/html,' + encodeURIComponent(htmlWithAllFeatures));

      expect(result.success).toBe(true);
      const content = result.content!;
      expect(content.markdown).toContain('# Title');
      expect(content.markdown).toContain('**bold**');
      expect(content.markdown).toContain('*italic*');
      expect(content.markdown).toContain('Item 1'); // List item formatting varies
      expect(content.markdown).toContain('console.log');
      expect(content.images.length).toBeGreaterThan(0);
      expect(content.links.length).toBeGreaterThan(0);
    });

    it('should handle extraction options', async () => {
      const options: ExtractionOptions = {
        extractImages: false,
        extractLinks: false,
        removeAds: true,
        removeNavigation: true,
        maxContentLength: 100
      };

      const extractorWithOptions = new ContentExtractor(options);
      const result = await extractorWithOptions.extract('data:text/html,' + encodeURIComponent(sampleHtml));

      expect(result.success).toBe(true);
      const content = result.content!;
      expect(content.markdown.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const result = await extractor.extract('https://nonexistent-domain-12345.com');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle malformed HTML', async () => {
      const malformed = '<html><head><title>Test</head><body>';
      const result = await extractor.extract('data:text/html,' + encodeURIComponent(malformed));

      expect(result.success).toBe(true);
      expect(result.content?.title).toBe('Test');
    });

    it('should handle empty responses', async () => {
      const empty = '<html></html>';
      const result = await extractor.extract('data:text/html,' + encodeURIComponent(empty));

      expect(result.success).toBe(true);
      expect(result.content?.markdown).toBeDefined();
    });

    it('should handle very large content', async () => {
      const largeContent = sampleHtml.repeat(1000); // Very large content
      const result = await extractor.extract('data:text/html,' + encodeURIComponent(largeContent));

      expect(result.success).toBe(true);
      expect(result.content).toBeDefined();
    });
  });
});
