import type {
  Analyzer,
  ExtractedPage,
  Section,
  SectionType,
  SectionPattern,
  SectionIndicator,
  SectionCandidate,
} from '../types/analysis.types';

export class SectionDetector implements Analyzer {
  name = 'section-detector';

  private sectionPatterns!: SectionPattern[];

  constructor() {
    this.initializeSectionPatterns();
  }

  private initializeSectionPatterns(): void {
    this.sectionPatterns = [
      {
        type: 'hero',
        indicators: [
          { position: 'first', weight: 0.3 },
          { heading: /hero|banner|welcome|introduction/i, weight: 0.2 },
          { structure: 'heading+paragraph+cta', weight: 0.3 },
          { wordCount: { min: 20, max: 200 }, weight: 0.2 },
        ],
      },
      {
        type: 'features',
        indicators: [
          { heading: /features|benefits|why|what we offer|capabilities/i, weight: 0.3 },
          { structure: 'list|grid', weight: 0.3 },
          { icons: true, weight: 0.2 },
          { bulletPoints: { min: 3 }, weight: 0.2 },
        ],
      },
      {
        type: 'testimonials',
        indicators: [
          { heading: /testimonial|reviews|what.*say|feedback|customers/i, weight: 0.3 },
          { quotes: true, weight: 0.3 },
          { names: true, weight: 0.2 },
          { structure: 'cards|carousel', weight: 0.2 },
        ],
      },
      {
        type: 'pricing',
        indicators: [
          { heading: /pricing|plans|packages|subscription/i, weight: 0.4 },
          { structure: 'table|cards|comparison', weight: 0.3 },
          { wordCount: { min: 10, max: 100 }, weight: 0.1 },
          { content: /\$\d+|\d+\/month|price|cost/i, weight: 0.2 },
        ],
      },
      {
        type: 'cta',
        indicators: [
          { position: 'last', weight: 0.2 },
          { heading: /get started|sign up|contact|call to action/i, weight: 0.3 },
          { structure: 'button|form', weight: 0.3 },
          { wordCount: { min: 5, max: 50 }, weight: 0.1 },
          { content: /click|button|form|submit|contact/i, weight: 0.1 },
        ],
      },
      {
        type: 'content',
        indicators: [
          { heading: /overview|details|information|content|section|chapter/i, weight: 0.15 },
          { structure: 'paragraphs', weight: 0.3 },
          { wordCount: { min: 20, max: 2000 }, weight: 0.2 }, // More flexible word count
          { bulletPoints: { min: 0 }, weight: 0.1 }, // Neutral for list content
        ],
      },
      {
        type: 'sidebar',
        indicators: [
          { structure: 'list|navigation', weight: 0.3 },
          { wordCount: { min: 10, max: 150 }, weight: 0.2 },
          { bulletPoints: { min: 2 }, weight: 0.2 },
          { content: /menu|navigation|related|links/i, weight: 0.3 },
        ],
      },
      {
        type: 'footer',
        indicators: [
          { position: 'last', weight: 0.3 },
          { heading: /footer|copyright|contact|legal/i, weight: 0.3 },
          { structure: 'links|columns', weight: 0.2 },
          { wordCount: { min: 10, max: 200 }, weight: 0.1 },
          { content: /copyright|©|all rights reserved|privacy/i, weight: 0.1 },
        ],
      },
      {
        type: 'navigation',
        indicators: [
          { position: 'first', weight: 0.2 },
          { structure: 'menu|list|horizontal', weight: 0.3 },
          { wordCount: { min: 5, max: 50 }, weight: 0.2 },
          { content: /home|about|contact|menu|nav/i, weight: 0.3 },
        ],
      },
      {
        type: 'header',
        indicators: [
          { position: 'first', weight: 0.3 },
          { heading: /header|top|main/i, weight: 0.2 },
          { structure: 'logo+navigation', weight: 0.3 },
          { wordCount: { min: 5, max: 30 }, weight: 0.2 },
        ],
      },
      {
        type: 'form',
        indicators: [
          { heading: /form|contact|signup|register/i, weight: 0.3 },
          { structure: 'input|form', weight: 0.4 },
          { wordCount: { min: 5, max: 100 }, weight: 0.1 },
          { content: /email|name|phone|submit|input/i, weight: 0.2 },
        ],
      },
      {
        type: 'comparison',
        indicators: [
          { heading: /compare|comparison|vs|versus/i, weight: 0.3 },
          { structure: 'table|side-by-side', weight: 0.4 },
          { wordCount: { min: 20, max: 300 }, weight: 0.1 },
          { content: /better|advantage|compare|feature/i, weight: 0.2 },
        ],
      },
      {
        type: 'faq',
        indicators: [
          { heading: /faq|questions|frequently asked/i, weight: 0.3 },
          { structure: 'accordion|q-and-a', weight: 0.3 },
          { bulletPoints: { min: 3 }, weight: 0.2 },
          { content: /question|answer|faq|q\:/i, weight: 0.2 },
        ],
      },
    ];
  }

  async analyze(page: ExtractedPage): Promise<Section[]> {
    // Parse markdown to simple structure
    const structure = this.parseMarkdownStructure(page.markdown);

    // Split into potential sections
    const candidates = this.splitIntoSections(structure);

    // Analyze each candidate
    const sections = await Promise.all(
      candidates.map(candidate => this.analyzeSection(candidate, page.url))
    );

    // Filter and sort by confidence
    return sections
      .filter(s => s.confidence > 0.5)
      .sort((a, b) => a.position - b.position);
  }

  private parseMarkdownStructure(markdown: string): any[] {
    const structure: any[] = [];
    const lines = markdown.split('\n');

    let currentElement: any = null;
    let inCodeBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]?.trim() || '';

      // Track code blocks
      if (line.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
      }

      if (inCodeBlock) {
        continue; // Skip code block content
      }

      // Headings
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch && headingMatch[1] && headingMatch[2]) {
        if (currentElement) {
          structure.push(currentElement);
        }
        currentElement = {
          type: 'heading',
          level: headingMatch[1].length,
          text: headingMatch[2],
          line: i,
          content: [],
        };
        continue;
      }

      // Lists
      if (line.match(/^[-*+]\s/) || line.match(/^\d+\.\s/)) {
        if (currentElement && currentElement.type === 'list') {
          currentElement.items.push(line);
        } else {
          if (currentElement) {
            structure.push(currentElement);
          }
          currentElement = {
            type: 'list',
            items: [line],
            line: i,
          };
        }
        continue;
      }

      // Code blocks (inline)
      if (line.startsWith('    ') || line.match(/^`[^`]+`$/)) {
        if (currentElement && currentElement.type === 'code') {
          currentElement.content.push(line);
        } else {
          if (currentElement) {
            structure.push(currentElement);
          }
          currentElement = {
            type: 'code',
            content: [line],
            line: i,
          };
        }
        continue;
      }

      // Links
      if (line.includes('](') && line.includes(')')) {
        if (currentElement && currentElement.type === 'link') {
          currentElement.links.push(line);
        } else {
          if (currentElement) {
            structure.push(currentElement);
          }
          currentElement = {
            type: 'link',
            links: [line],
            line: i,
          };
        }
        continue;
      }

      // Regular paragraphs
      if (line.length > 0) {
        if (currentElement && currentElement.type === 'paragraph') {
          currentElement.content.push(line);
        } else {
          if (currentElement) {
            structure.push(currentElement);
          }
          currentElement = {
            type: 'paragraph',
            content: [line],
            line: i,
          };
        }
      } else {
        // Empty line - end current element
        if (currentElement) {
          structure.push(currentElement);
          currentElement = null;
        }
      }
    }

    // Add final element
    if (currentElement) {
      structure.push(currentElement);
    }

    return structure;
  }

  private splitIntoSections(structure: any[]): SectionCandidate[] {
    const sections: SectionCandidate[] = [];
    let currentSection: SectionCandidate | null = null;

    for (const element of structure) {
      if (element.type === 'heading') {
        // Start new section at each heading
        if (currentSection) {
          sections.push(currentSection);
        }

        currentSection = {
          heading: element,
          content: [],
          position: element.line,
        };
      } else if (currentSection) {
        currentSection.content.push(element);
      } else if (element.type === 'paragraph' || element.type === 'list' || element.type === 'code') {
        // Create sections for standalone content elements
        if (currentSection) {
          sections.push(currentSection);
        }

        currentSection = {
          content: [element],
          position: element.line,
        };
      }
    }

    if (currentSection) {
      sections.push(currentSection);
    }

    return sections;
  }

  private async analyzeSection(candidate: SectionCandidate, pageUrl: string): Promise<Section> {
    const scores = new Map<string, number>();

    // Check each section pattern
    for (const pattern of this.sectionPatterns) {
      const score = this.calculatePatternMatch(candidate, pattern, pageUrl);
      scores.set(pattern.type, score);
    }

    // Get best match
    const sortedScores = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1]);

    let bestMatch = sortedScores[0] || ['content', 0.1];

    // If the best match has low confidence, check if this should be content
    if (bestMatch[1] < 0.3) {
      const contentScore = scores.get('content') || 0;
      if (contentScore > 0.1 || this.shouldBeContentSection(candidate)) {
        bestMatch = ['content', Math.max(contentScore, 0.2)];
      }
    }

    return {
      id: this.generateId(),
      type: bestMatch[0] as SectionType,
      confidence: bestMatch[1],
      headingLevel: candidate.heading?.level || 0,
      wordCount: this.countWords(candidate),
      position: candidate.position,
      content: this.extractContent(candidate),
      metrics: await this.calculateMetrics(candidate),
    };
  }

  private calculatePatternMatch(
    candidate: SectionCandidate,
    pattern: SectionPattern,
    pageUrl: string
  ): number {
    let totalScore = 0;
    let totalWeight = 0;

    for (const indicator of pattern.indicators) {
      const score = this.evaluateIndicator(candidate, indicator, pageUrl);
      totalScore += score * indicator.weight;
      totalWeight += indicator.weight;
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  private evaluateIndicator(
    candidate: SectionCandidate,
    indicator: SectionIndicator,
    pageUrl: string
  ): number {
    // Position indicator
    if (indicator.position === 'first' && candidate.position < 20) {
      return 1;
    }
    if (indicator.position === 'last' && candidate.position > 50) {
      return 1;
    }
    if (indicator.position === 'middle') {
      return 0.5;
    }

    // Heading indicator - more lenient matching
    if (indicator.heading && candidate.heading) {
      const headingText = candidate.heading.text.toLowerCase();
      if (indicator.heading.test(headingText) || headingText.includes(indicator.heading.source.slice(1, -1))) {
        return 1;
      }
    }

    // Structure indicator (simplified)
    if (indicator.structure) {
      const contentTypes = candidate.content.map(c => c.type);
      if (indicator.structure.includes('list') && contentTypes.includes('list')) {
        return 1;
      }
      if (indicator.structure.includes('paragraph') && contentTypes.includes('paragraph')) {
        return 1;
      }
      if (indicator.structure.includes('table') && contentTypes.includes('table')) {
        return 1;
      }
    }

    // Word count indicator
    if (indicator.wordCount) {
      const wordCount = this.countWords(candidate);
      if (wordCount >= indicator.wordCount.min &&
          wordCount <= indicator.wordCount.max) {
        return 1;
      }
    }

    // Icons indicator (simplified)
    if (indicator.icons) {
      const hasIcons = candidate.content.some(c =>
        c.type === 'link' && c.links.some((l: string) => l.includes('icon') || l.includes('svg'))
      );
      return hasIcons ? 1 : 0;
    }

    // Bullet points indicator
    if (indicator.bulletPoints) {
      const listItems = candidate.content.filter(c => c.type === 'list');
      const totalBullets = listItems.reduce((sum, list) => sum + list.items.length, 0);
      return totalBullets >= indicator.bulletPoints.min ? 1 : 0;
    }

    // Quotes indicator
    if (indicator.quotes) {
      const hasQuotes = candidate.content.some(c =>
        c.content && c.content.some((line: string) => line.includes('"') || line.includes('"'))
      );
      return hasQuotes ? 1 : 0;
    }

    // Names indicator
    if (indicator.names) {
      const hasNames = candidate.content.some(c =>
        c.content && c.content.some((line: string) =>
          line.includes('John') || line.includes('Jane') || line.includes('Team')
        )
      );
      return hasNames ? 1 : 0;
    }

    return 0;
  }

  private countWords(candidate: SectionCandidate): number {
    let wordCount = 0;

    if (candidate.heading) {
      wordCount += candidate.heading.text.split(/\s+/).length;
    }

    candidate.content.forEach(element => {
      if (element.type === 'paragraph' && element.content) {
        wordCount += element.content.join(' ').split(/\s+/).length;
      }
      if (element.type === 'list' && element.items) {
        wordCount += element.items.join(' ').split(/\s+/).length;
      }
    });

    return wordCount;
  }

  private extractContent(candidate: SectionCandidate): string {
    let content = '';

    if (candidate.heading) {
      content += candidate.heading.text + '\n\n';
    }

    candidate.content.forEach(element => {
      if (element.type === 'paragraph' && element.content) {
        content += element.content.join('\n') + '\n\n';
      }
      if (element.type === 'list' && element.items) {
        content += element.items.join('\n') + '\n\n';
      }
    });

    return content.trim();
  }

  private async calculateMetrics(candidate: SectionCandidate): Promise<any> {
    const wordCount = this.countWords(candidate);
    const content = this.extractContent(candidate);

    return {
      readabilityScore: this.calculateReadabilityScore(content),
      keywordDensity: this.calculateKeywordDensity(content),
      sentimentScore: 0.5, // Simplified
      complexityScore: wordCount > 100 ? 0.8 : 0.5,
    };
  }

  private calculateReadabilityScore(content: string): number {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = content.split(/\s+/);
    const complexWords = words.filter(word => word.length > 6).length;

    if (sentences.length === 0 || words.length === 0) {
      return 0.5;
    }

    const avgSentenceLength = words.length / sentences.length;
    const complexWordRatio = complexWords / words.length;

    // Simplified readability score
    let score = 1.0;
    if (avgSentenceLength > 20) score -= 0.2;
    if (complexWordRatio > 0.1) score -= 0.1;

    return Math.max(0, Math.min(1, score));
  }

  private calculateKeywordDensity(content: string): number {
    const words = content.toLowerCase().split(/\s+/);
    const wordCount = words.length;

    if (wordCount === 0) return 0;

    // Count word frequencies
    const frequencies = new Map<string, number>();
    words.forEach(word => {
      if (word.length > 3) { // Only consider meaningful words
        frequencies.set(word, (frequencies.get(word) || 0) + 1);
      }
    });

    // Calculate density of top words
    const topWords = Array.from(frequencies.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    let totalDensity = 0;
    topWords.forEach(([word, count]) => {
      totalDensity += count / wordCount;
    });

    return totalDensity;
  }

  private generateId(): string {
    return 'section_' + Math.random().toString(36).substr(2, 9);
  }

  private shouldBeContentSection(candidate: SectionCandidate): boolean {
    // Sections should be content if they:
    // 1. Have reasonable word count (20-2000 words)
    // 2. Have paragraph content
    // 3. Don't match specific patterns well

    const wordCount = this.countWords(candidate);
    const hasParagraphs = candidate.content.some(c => c.type === 'paragraph');

    return wordCount >= 20 && wordCount <= 2000 && hasParagraphs;
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    console.log('🧹 Cleaning up section detector');
    this.sectionPatterns.length = 0;
  }
}
