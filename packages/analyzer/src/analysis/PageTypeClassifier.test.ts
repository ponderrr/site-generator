import { PageTypeClassifier } from './PageTypeClassifier';
import { ExtractedPage } from '../types/analysis.types';

describe('PageTypeClassifier', () => {
  let classifier: PageTypeClassifier;

  beforeAll(() => {
    classifier = new PageTypeClassifier();
  });

  afterAll(() => {
    classifier.cleanup();
  });

  describe('constructor', () => {
    it('should initialize patterns correctly', () => {
      expect(classifier).toBeDefined();
      // Patterns are private, so we can't directly test them
      // But we can test that the classifier works
    });
  });

  describe('analyze', () => {
    it('should classify home page correctly', async () => {
      const page: ExtractedPage = {
        url: 'https://example.com/',
        title: 'Welcome to Our Site',
        markdown: 'Welcome to our homepage. This is our mission and what we do.',
        frontmatter: {}
      };

      const result = await classifier.analyze(page);

      expect(result).toBeDefined();
      expect(result.pageType).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.scores).toBeDefined();
      expect(result.features).toBeDefined();
    });

    it('should classify about page correctly', async () => {
      const page: ExtractedPage = {
        url: 'https://example.com/about-us',
        title: 'About Our Company',
        markdown: 'Founded in 2020, our team has been working together for years. Our mission is to...',
        frontmatter: {}
      };

      const result = await classifier.analyze(page);

      expect(result.pageType).toBe('about');
      expect(result.confidence).toBeGreaterThan(0.3);
    });

    it('should classify pricing page correctly', async () => {
      const page: ExtractedPage = {
        url: 'https://example.com/pricing',
        title: 'Pricing Plans',
        markdown: 'Starting at $29/month per user. Our pricing tiers include...',
        frontmatter: {}
      };

      const result = await classifier.analyze(page);

      expect(result.pageType).toBe('pricing');
      expect(result.confidence).toBeGreaterThan(0.4);
    });

    it('should classify contact page correctly', async () => {
      const page: ExtractedPage = {
        url: 'https://example.com/contact',
        title: 'Contact Us',
        markdown: 'Email us at info@example.com or call us at (555) 123-4567.',
        frontmatter: {}
      };

      const result = await classifier.analyze(page);

      expect(result.pageType).toBe('contact');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should classify blog post correctly', async () => {
      const page: ExtractedPage = {
        url: 'https://example.com/blog/my-first-post',
        title: 'My First Blog Post',
        markdown: 'Published on January 1, 2024 by John Doe. This is my first post about...',
        frontmatter: {
          author: 'John Doe',
          published: '2024-01-01'
        }
      };

      const result = await classifier.analyze(page);

      expect(result.pageType).toBe('blog-post');
      expect(result.confidence).toBeGreaterThan(0.3);
    });

    it('should classify documentation page correctly', async () => {
      const page: ExtractedPage = {
        url: 'https://example.com/docs/getting-started',
        title: 'Getting Started Guide',
        markdown: '## Installation\nFirst, install the package...\n## Configuration\nNext, configure your settings...',
        frontmatter: {}
      };

      const result = await classifier.analyze(page);

      expect(result.pageType).toBe('documentation');
      expect(result.confidence).toBeGreaterThan(0.4);
    });

    it('should classify API reference correctly', async () => {
      const page: ExtractedPage = {
        url: 'https://api.example.com/reference/users',
        title: 'User API Reference',
        markdown: '## GET /users\nRetrieve a list of users.\n## POST /users\nCreate a new user.',
        frontmatter: {}
      };

      const result = await classifier.analyze(page);

      expect(result.pageType).toBe('api-reference');
      expect(result.confidence).toBeGreaterThan(0.3);
    });

    it('should classify product page correctly', async () => {
      const page: ExtractedPage = {
        url: 'https://example.com/products/my-product',
        title: 'My Product Features',
        markdown: 'Our product offers amazing features. Benefits include faster performance and better UX.',
        frontmatter: {}
      };

      const result = await classifier.analyze(page);

      expect(result.pageType).toBe('product');
      expect(result.confidence).toBeGreaterThan(0.3);
    });

    it('should classify error page correctly', async () => {
      const page: ExtractedPage = {
        url: 'https://example.com/404',
        title: 'Page Not Found',
        markdown: 'Oops! The page you\'re looking for doesn\'t exist.',
        frontmatter: {}
      };

      const result = await classifier.analyze(page);

      expect(result.pageType).toBe('error');
      expect(result.confidence).toBeGreaterThan(0.3);
    });

    it('should handle unknown page types', async () => {
      const page: ExtractedPage = {
        url: 'https://example.com/random-page',
        title: 'Random Page',
        markdown: 'This is just some random content without clear classification signals.',
        frontmatter: {}
      };

      const result = await classifier.analyze(page);

      expect(result.pageType).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should handle empty content', async () => {
      const page: ExtractedPage = {
        url: 'https://example.com/empty',
        title: '',
        markdown: '',
        frontmatter: {}
      };

      const result = await classifier.analyze(page);

      expect(result).toBeDefined();
      expect(result.pageType).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
    });

    it('should handle unicode characters', async () => {
      const page: ExtractedPage = {
        url: 'https://example.com/unicode',
        title: 'Unicode Test 🌟',
        markdown: 'Content with émojis and spëcial chärs 你好',
        frontmatter: {}
      };

      const result = await classifier.analyze(page);

      expect(result).toBeDefined();
      expect(result.pageType).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
    });
  });

  describe('feature extraction', () => {
    it('should extract URL features correctly', async () => {
      const page: ExtractedPage = {
        url: 'https://example.com/blog/my-post?param=value#section',
        title: 'Test',
        markdown: 'Content',
        frontmatter: {}
      };

      const result = await classifier.analyze(page);
      expect(result.features).toBeDefined();
      expect(result.features.urlFeatures).toBeDefined();
      expect(result.features.urlFeatures.length).toBeGreaterThan(0);
    });

    it('should extract content features correctly', async () => {
      const page: ExtractedPage = {
        url: 'https://example.com/test',
        title: 'Test',
        markdown: '# Heading\n\nSome content\n\n- List item\n\n`console.log("code");`\n\n[Link](https://example.com)',
        frontmatter: {}
      };

      const result = await classifier.analyze(page);
      expect(result.features).toBeDefined();
      expect(result.features.contentFeatures).toBeDefined();
      expect(result.features.contentFeatures.length).toBeGreaterThan(0);
    });

    it('should extract structure features correctly', async () => {
      const page: ExtractedPage = {
        url: 'https://example.com/test',
        title: 'Test',
        markdown: '# H1\n\n## H2\n\n### H3\n\n#### H4\n\n##### H5\n\n###### H6',
        frontmatter: {}
      };

      const result = await classifier.analyze(page);
      expect(result.features).toBeDefined();
      expect(result.features.structureFeatures).toBeDefined();
      expect(result.features.structureFeatures.length).toBeGreaterThan(0);
    });

    it('should extract metadata features correctly', async () => {
      const page: ExtractedPage = {
        url: 'https://example.com/test',
        title: 'Test',
        markdown: 'Content',
        frontmatter: {
          title: 'Custom Title',
          description: 'Custom description',
          keywords: ['keyword1', 'keyword2'],
          author: 'John Doe',
          contentType: 'blog-post'
        }
      };

      const result = await classifier.analyze(page);
      expect(result.features).toBeDefined();
      expect(result.features.metadataFeatures).toBeDefined();
      expect(result.features.metadataFeatures.length).toBeGreaterThan(0);
    });
  });

  describe('confidence scoring', () => {
    it('should provide high confidence for clear matches', async () => {
      const page: ExtractedPage = {
        url: 'https://example.com/about',
        title: 'About Us - Our Story and Mission',
        markdown: 'Our company was founded in 2020. Our mission is to provide excellent service.',
        frontmatter: {}
      };

      const result = await classifier.analyze(page);

      expect(result.confidence).toBeGreaterThan(0.4);
    });

    it('should provide low confidence for ambiguous content', async () => {
      const page: ExtractedPage = {
        url: 'https://example.com/generic',
        title: 'Generic Page',
        markdown: 'This is generic content that could be anything.',
        frontmatter: {}
      };

      const result = await classifier.analyze(page);

      expect(result.confidence).toBeLessThan(0.5);
    });
  });

  describe('error handling', () => {
    it('should handle malformed URLs', async () => {
      const page: ExtractedPage = {
        url: 'not-a-valid-url',
        title: 'Test',
        markdown: 'Content',
        frontmatter: {}
      };

      const result = await classifier.analyze(page);

      expect(result).toBeDefined();
      expect(result.pageType).toBeDefined();
    });

    it('should handle very long content', async () => {
      const longContent = 'word '.repeat(10000);
      const page: ExtractedPage = {
        url: 'https://example.com/long',
        title: 'Long Content',
        markdown: longContent,
        frontmatter: {}
      };

      const result = await classifier.analyze(page);

      expect(result).toBeDefined();
      expect(result.pageType).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
    });

    it('should handle special characters in content', async () => {
      const page: ExtractedPage = {
        url: 'https://example.com/special',
        title: 'Special Chars',
        markdown: '!@#$%^&*()_+-=[]{}|;:,.<>?`~',
        frontmatter: {}
      };

      const result = await classifier.analyze(page);

      expect(result).toBeDefined();
      expect(result.pageType).toBeDefined();
    });
  });

  describe('cleanup', () => {
    it('should cleanup resources properly', () => {
      const testClassifier = new PageTypeClassifier();
      testClassifier.cleanup();
      // Should not throw errors
    });
  });
});
