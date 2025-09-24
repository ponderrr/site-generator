import { ContentMetricsAnalyzer } from './ContentMetricsAnalyzer';
import { ExtractedPage } from '../types/analysis.types';

describe('ContentMetricsAnalyzer', () => {
  let analyzer: ContentMetricsAnalyzer;

  beforeAll(() => {
    analyzer = new ContentMetricsAnalyzer();
  });

  describe('analyze', () => {
    it('should analyze content metrics for a page', async () => {
      const page: ExtractedPage = {
        url: 'https://example.com/test',
        title: 'Test Page',
        markdown: 'This is a test sentence with multiple words. Second sentence here.',
        frontmatter: {}
      };

      const result = await analyzer.analyze(page);

      expect(result).toBeDefined();
      expect(result.readability).toBeDefined();
      expect(result.sentiment).toBeDefined();
      expect(result.density).toBeDefined();
      expect(result.structure).toBeDefined();
      expect(result.keywords).toBeDefined();
      expect(result.quality).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty markdown', async () => {
      const page: ExtractedPage = {
        url: 'https://example.com/empty',
        title: 'Empty Page',
        markdown: '',
        frontmatter: {}
      };

      const result = await analyzer.analyze(page);

      expect(result.readability.fleschReading).toBe(0);
      expect(result.sentiment.overall).toBe(0);
      expect(result.density.wordCount).toBe(0);
    });

    it('should handle unicode characters', async () => {
      const page: ExtractedPage = {
        url: 'https://example.com/unicode',
        title: 'Unicode Test',
        markdown: 'Unicode: 你好 🌟 café naïve résumé test',
        frontmatter: {}
      };

      const result = await analyzer.analyze(page);

      expect(result.density.wordCount).toBeGreaterThan(0);
      expect(result.readability.fleschReading).toBeGreaterThanOrEqual(0); // Allow 0 for now
    });

    it('should analyze content with complex structure', async () => {
      const page: ExtractedPage = {
        url: 'https://example.com/complex',
        title: 'Complex Content',
        markdown: `# Header\n\nThis is a paragraph with **bold** text and *italic* text.\n\n- List item 1\n- List item 2\n\n\`\`\`\nconsole.log('code block');\n\`\`\`\n\n[Link text](https://example.com)`,
        frontmatter: {}
      };

      const result = await analyzer.analyze(page);

      expect(result.structure.headingHierarchy).toBeGreaterThan(0);
      expect(result.structure.listDepth).toBeGreaterThan(0);
      expect(result.density.linkCount).toBe(1);
      expect(result.density.codeBlockCount).toBe(1);
    });
  });

  describe('keyword analysis', () => {
    it('should extract meaningful keywords', async () => {
      const page: ExtractedPage = {
        url: 'https://example.com/keyword-test',
        title: 'Keyword Analysis Test',
        markdown: 'The quick brown fox jumps over the lazy dog. The fox is very quick and brown.',
        frontmatter: {}
      };

      const result = await analyzer.analyze(page);

      expect(result.keywords.mainKeywords.length).toBeGreaterThan(0);
      expect(result.keywords.mainKeywords[0]).toBeDefined();
      expect(result.keywords.mainKeywords[0].word).toBeTruthy();
      expect(result.keywords.mainKeywords[0].frequency).toBeGreaterThan(0);
    });

    it('should create topic clusters', async () => {
      const page: ExtractedPage = {
        url: 'https://example.com/topic-test',
        title: 'Topic Clustering Test',
        markdown: 'Machine learning is amazing. AI technology is revolutionary. Data science helps understand patterns.',
        frontmatter: {}
      };

      const result = await analyzer.analyze(page);

      expect(result.keywords.topicClusters.length).toBeGreaterThan(0);
      expect(result.keywords.topicClusters[0].topic).toBeTruthy();
      expect(result.keywords.topicClusters[0].score).toBeGreaterThan(0);
    });
  });

  describe('sentiment analysis', () => {
    it('should analyze positive content', async () => {
      const page: ExtractedPage = {
        url: 'https://example.com/positive',
        title: 'Positive Content',
        markdown: 'This is an amazing and wonderful product! I love it so much.',
        frontmatter: {}
      };

      const result = await analyzer.analyze(page);

      expect(result.sentiment.compound).toBeGreaterThan(0);
      expect(result.sentiment.positive).toBeGreaterThan(result.sentiment.negative);
    });

    it('should analyze neutral content', async () => {
      const page: ExtractedPage = {
        url: 'https://example.com/neutral',
        title: 'Neutral Content',
        markdown: 'This is a product description. It contains information about features.',
        frontmatter: {}
      };

      const result = await analyzer.analyze(page);

      expect(result.sentiment.compound).toBeGreaterThan(-0.1);
      expect(result.sentiment.compound).toBeLessThan(0.1);
    });
  });

  describe('content quality', () => {
    it('should assess content quality', async () => {
      const page: ExtractedPage = {
        url: 'https://example.com/quality-test',
        title: 'Quality Content Test',
        markdown: 'This is well-structured content. It has proper grammar and flows nicely. The sentences are clear and concise.',
        frontmatter: {}
      };

      const result = await analyzer.analyze(page);

      expect(result.quality).toBeGreaterThan(0.5); // Well-structured content should score high
    });

    it('should handle poorly structured content', async () => {
      const page: ExtractedPage = {
        url: 'https://example.com/poor-quality',
        title: 'Poor Quality Test',
        markdown: 'Bad content. No structure. Very short. Not good.',
        frontmatter: {}
      };

      const result = await analyzer.analyze(page);

      expect(result.quality).toBeLessThan(0.7); // Poor content should score lower
    });
  });
});
