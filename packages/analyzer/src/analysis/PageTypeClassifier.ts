import type {
  Analyzer,
  ExtractedPage,
  ClassificationResult,
  PageType,
  Pattern,
  FeatureVector,
} from '../types/analysis.types.js';

export class PageTypeClassifier implements Analyzer {
  name = 'page-type-classifier';

  private patterns!: Map<PageType, Pattern[]>;
  private typeIndex!: Map<string, number>;

  constructor() {
    this.initializePatterns();
    this.initializeTypeIndex();
  }

  private initializePatterns(): void {
    this.patterns = new Map([
      ['home', [
        { url: /^\/$|\/index\.|\/home/i, weight: 0.5 },
        { heading: /welcome|home|homepage/i, weight: 0.3 },
        { content: /our mission|who we are|what we do|welcome to/i, weight: 0.2 },
      ]],
      ['about', [
        { url: /about|team|company|our-story/i, weight: 0.5 },
        { heading: /about us|our story|team|company|mission/i, weight: 0.3 },
        { content: /founded in|our team|mission|vision|values/i, weight: 0.2 },
      ]],
      ['pricing', [
        { url: /pricing|plans|subscribe|billing/i, weight: 0.5 },
        { heading: /pricing|plans|tiers|packages|subscription/i, weight: 0.3 },
        { content: /\$\d+|\d+\/month|per user|starting at|pricing/i, weight: 0.2 },
      ]],
      ['contact', [
        { url: /contact|contact-us|get-in-touch/i, weight: 0.5 },
        { heading: /contact|contact us|get in touch|reach us/i, weight: 0.3 },
        { content: /email us|call us|phone|address|location/i, weight: 0.2 },
      ]],
      ['blog-post', [
        { url: /blog|posts|article|news/i, weight: 0.4 },
        { heading: /blog|article|post|tutorial|guide/i, weight: 0.3 },
        { content: /published on|posted on|by.*author|read more/i, weight: 0.3 },
      ]],
      ['documentation', [
        { url: /docs|documentation|guide|manual/i, weight: 0.5 },
        { heading: /documentation|guide|manual|reference/i, weight: 0.3 },
        { content: /installation|configuration|getting started/i, weight: 0.2 },
      ]],
      ['api-reference', [
        { url: /api|reference|docs\/api|developer/i, weight: 0.5 },
        { heading: /api|reference|endpoint|method/i, weight: 0.3 },
        { content: /get|post|put|delete|endpoint|parameter/i, weight: 0.2 },
      ]],
      ['product', [
        { url: /product|products|features|solution/i, weight: 0.4 },
        { heading: /product|features|solution|platform/i, weight: 0.3 },
        { content: /features|benefits|why choose|solution/i, weight: 0.3 },
      ]],
      ['service', [
        { url: /service|services|offering|what-we-do/i, weight: 0.4 },
        { heading: /services|offering|what we do|capabilities/i, weight: 0.3 },
        { content: /services|consulting|support|implementation/i, weight: 0.3 },
      ]],
      ['case-study', [
        { url: /case-study|case|success|customer/i, weight: 0.5 },
        { heading: /case study|success story|customer story/i, weight: 0.3 },
        { content: /challenge|solution|results|implementation/i, weight: 0.2 },
      ]],
      ['testimonial', [
        { url: /testimonial|reviews|testimonials/i, weight: 0.5 },
        { heading: /testimonials|reviews|what.*say|feedback/i, weight: 0.3 },
        { content: /customer.*testimonial|reviews|rating/i, weight: 0.2 },
      ]],
      ['landing', [
        { url: /landing|lp|promo|campaign/i, weight: 0.4 },
        { heading: /landing|special offer|limited time|exclusive/i, weight: 0.3 },
        { content: /sign up|register|join now|special offer/i, weight: 0.3 },
      ]],
      ['error', [
        { url: /error|404|500|not-found/i, weight: 0.6 },
        { heading: /error|404|page not found|oops/i, weight: 0.3 },
        { content: /error|not found|page.*not.*exist/i, weight: 0.1 },
      ]],
    ]);
  }

  private initializeTypeIndex(): void {
    this.typeIndex = new Map();
    const types: PageType[] = [
      'home', 'about', 'pricing', 'contact', 'blog-post', 'documentation',
      'api-reference', 'product', 'service', 'case-study', 'testimonial',
      'landing', 'error', 'other'
    ];

    types.forEach((type, index) => {
      this.typeIndex.set(type, index);
    });
  }

  async analyze(page: ExtractedPage): Promise<ClassificationResult> {
    // Rule-based classification
    const ruleScores = this.calculateRuleScores(page);

    // ML-based classification (simplified - in practice would use actual ML model)
    const mlScores = await this.calculateMLScores(page);

    // Combine scores with weighted average
    const combinedScores = this.combineScores(ruleScores, mlScores, 0.4, 0.6);

    // Get top classification
    const topClass = this.getTopClass(combinedScores);

    return {
      pageType: topClass.type,
      confidence: topClass.confidence,
      scores: combinedScores,
      features: this.extractFeatures(page),
    };
  }

  private calculateRuleScores(page: ExtractedPage): Map<PageType, number> {
    const scores = new Map<PageType, number>();

    for (const [type, patterns] of this.patterns) {
      let score = 0;
      let matchCount = 0;

      for (const pattern of patterns) {
        let patternScore = 0;

        if (pattern.url && pattern.url.test(page.url)) {
          patternScore += pattern.weight * 1.2; // Boost URL matches
          matchCount++;
        }
        if (pattern.heading && pattern.heading.test(page.title)) {
          patternScore += pattern.weight * 1.1; // Boost title matches
          matchCount++;
        }
        if (pattern.content && pattern.content.test(page.markdown)) {
          patternScore += pattern.weight * 0.8; // Content matches are good but less specific
          matchCount++;
        }

        // Bonus for multiple pattern matches within the same type
        if (matchCount > 1) {
          patternScore *= 1.3;
        }

        score += patternScore;
      }

      // Normalize and boost scores for types with multiple matches
      const normalizedScore = Math.min(score, 1.0);
      const boostedScore = matchCount > 0 ? normalizedScore * (1 + (matchCount * 0.1)) : normalizedScore;

      scores.set(type, Math.min(boostedScore, 1.0));
    }

    // Set default score for 'other' type
    if (!scores.has('other')) {
      scores.set('other', 0.05); // Lower default for better discrimination
    }

    return scores;
  }

  private async calculateMLScores(page: ExtractedPage): Promise<Map<PageType, number>> {
    // Extract features for ML model
    const features = await this.extractMLFeatures(page);

    // Simulate ML model predictions (in practice, this would use a real model)
    const predictions = this.simulateModelPrediction(features);

    // Convert to score map
    const scores = new Map<PageType, number>();
    predictions.forEach((score, index) => {
      const type = this.indexToType(index);
      scores.set(type, score);
    });

    return scores;
  }

  private extractFeatures(page: ExtractedPage): FeatureVector {
    const urlFeatures = this.extractURLFeatures(page.url);
    const contentFeatures = this.extractContentFeatures(page.markdown);
    const structureFeatures = this.extractStructureFeatures(page.markdown);
    const metadataFeatures = this.extractMetadataFeatures(page.frontmatter);

    return {
      urlFeatures,
      contentFeatures,
      structureFeatures,
      metadataFeatures,
    };
  }

  private extractURLFeatures(url: string): number[] {
    const features: number[] = [];

    // URL length
    features.push(url.length / 100);

    // Number of path segments
    features.push(url.split('/').length / 10);

    // Has query parameters
    features.push(url.includes('?') ? 1 : 0);

    // Has fragment
    features.push(url.includes('#') ? 1 : 0);

    // Contains keywords
    const keywords = ['about', 'contact', 'pricing', 'blog', 'docs', 'api'];
    keywords.forEach(keyword => {
      features.push(url.toLowerCase().includes(keyword) ? 1 : 0);
    });

    return features;
  }

  private extractContentFeatures(markdown: string): number[] {
    const features: number[] = [];

    // Word count
    const wordCount = markdown.split(/\s+/).length;
    features.push(Math.min(wordCount / 1000, 1)); // Normalize to 0-1

    // Heading count
    const headings = (markdown.match(/^#{1,6}\s/gm) || []).length;
    features.push(headings / 20); // Normalize

    // Link count
    const links = (markdown.match(/\[([^\]]+)\]\(([^)]+)\)/g) || []).length;
    features.push(links / 50); // Normalize

    // Code block count
    const codeBlocks = (markdown.match(/```[\s\S]*?```/g) || []).length;
    features.push(codeBlocks / 10); // Normalize

    // List count
    const lists = (markdown.match(/^[-*+]\s/gm) || []).length;
    features.push(lists / 100); // Normalize

    return features;
  }

  private extractStructureFeatures(markdown: string): number[] {
    const features: number[] = [];

    // Average heading level
    const headings = markdown.match(/^#{1,6}\s/gm) || [];
    const avgLevel = headings.length > 0
      ? headings.reduce((sum, h) => sum + h.length - 1, 0) / headings.length
      : 0;
    features.push(avgLevel / 6); // Normalize to 0-1

    // Heading distribution
    for (let i = 1; i <= 6; i++) {
      const count = (markdown.match(new RegExp(`^#{${i}}\\s`, 'gm')) || []).length;
      features.push(count / 20); // Normalize
    }

    return features;
  }

  private extractMetadataFeatures(frontmatter: Record<string, any>): number[] {
    const features: number[] = [];

    // Has title
    features.push(frontmatter['title'] ? 1 : 0);

    // Has description
    features.push(frontmatter['description'] ? 1 : 0);

    // Has keywords
    features.push(frontmatter['keywords'] && Array.isArray(frontmatter['keywords']) && frontmatter['keywords'].length > 0 ? 1 : 0);

    // Has author
    features.push(frontmatter['author'] ? 1 : 0);

    // Content type
    const contentType = frontmatter['contentType'] || 'page';
    const typeFeatures = this.oneHotEncode(contentType, ['page', 'blog-post', 'documentation', 'product']);
    features.push(...typeFeatures);

    return features;
  }

  private oneHotEncode(value: string, categories: string[]): number[] {
    return categories.map(cat => value === cat ? 1 : 0);
  }

  private async extractMLFeatures(page: ExtractedPage): Promise<number[]> {
    // Combine all feature vectors
    const features = this.extractFeatures(page);
    return [
      ...features.urlFeatures,
      ...features.contentFeatures,
      ...features.structureFeatures,
      ...features.metadataFeatures,
    ];
  }

  private simulateModelPrediction(features: number[]): number[] {
    // Simulate ML model predictions based on features
    // In practice, this would use a real TensorFlow.js or ONNX model
    const predictions: number[] = [];

    for (let i = 0; i < this.typeIndex.size; i++) {
      // Enhanced heuristic-based prediction with better scoring
      let score = 0.1; // Base score

      // URL pattern matching (strong signal)
      if (features[0]! > 0.8) score += 0.4; // Long URLs often indicate documentation
      if (features[1]! > 0.6) score += 0.3; // Many path segments suggest complex structure
      if (features[2]! > 0.5) score += 0.2; // Query parameters suggest dynamic content

      // Content structure (medium signal)
      if (features[5]! > 0.4) score += 0.3; // Many headings suggest structured content
      if (features[6]! > 0.3) score += 0.25; // Many links suggest reference material
      if (features[7]! > 0.2) score += 0.2; // Code blocks suggest technical content

      // Metadata (medium signal)
      if (features[12]! > 0.5) score += 0.2; // Has description suggests well-structured content
      if (features[13]! > 0.5) score += 0.15; // Has keywords suggests SEO optimization

      // Add some randomness but cap at reasonable levels
      score += Math.random() * 0.1;
      predictions.push(Math.min(score, 0.9)); // Cap at 0.9 to leave room for perfect matches
    }

    return predictions;
  }

  private combineScores(
    ruleScores: Map<PageType, number>,
    mlScores: Map<PageType, number>,
    ruleWeight: number,
    mlWeight: number
  ): Map<PageType, number> {
    const combined = new Map<PageType, number>();

    for (const [type, ruleScore] of ruleScores) {
      const mlScore = mlScores.get(type) || 0;
      const combinedScore = ruleScore * ruleWeight + mlScore * mlWeight;
      combined.set(type, combinedScore);
    }

    return combined;
  }

  private getTopClass(scores: Map<PageType, number>): { type: PageType; confidence: number } {
    let topType: PageType = 'other';
    let topScore = 0;

    for (const [type, score] of scores) {
      if (score > topScore) {
        topScore = score;
        topType = type;
      }
    }

    return { type: topType, confidence: topScore };
  }

  private indexToType(index: number): PageType {
    const types: PageType[] = [
      'home', 'about', 'pricing', 'contact', 'blog-post', 'documentation',
      'api-reference', 'product', 'service', 'case-study', 'testimonial',
      'landing', 'error', 'other'
    ];

    return types[index] || 'other';
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    console.log('🧹 Cleaning up page type classifier');
    this.patterns.clear();
    this.typeIndex.clear();
  }
}
