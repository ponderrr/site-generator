import {
  Analyzer,
  ExtractedPage,
  ContentMetrics,
  ReadabilityScore,
  SentimentAnalysis,
  DensityMetrics,
  StructureMetrics,
  KeywordAnalysis,
  Keyword,
  TopicCluster,
} from '../types/analysis.types';

export class ContentMetricsAnalyzer implements Analyzer {
  name = 'content-metrics';

  private readabilityScorer: ReadabilityScorer;
  private sentimentAnalyzer: SentimentAnalyzer;

  constructor() {
    this.readabilityScorer = new ReadabilityScorer();
    this.sentimentAnalyzer = new SentimentAnalyzer();
  }

  async analyze(page: ExtractedPage): Promise<ContentMetrics> {
    // Convert markdown to plain text
    const plainText = this.markdownToPlainText(page.markdown);

    // Parallel metric calculation
    const [
      readability,
      sentiment,
      density,
      structure,
      keywords,
    ] = await Promise.all([
      this.calculateReadability(plainText),
      this.analyzeSentiment(plainText),
      this.calculateDensity(page.markdown, plainText),
      this.analyzeStructure(page.markdown),
      this.extractKeywords(plainText),
    ]);

    return {
      readability,
      sentiment,
      density,
      structure,
      keywords,
      quality: this.calculateQualityScore({
        readability,
        sentiment,
        density,
        structure,
      }),
      keywordsArray: keywords.keywordsArray,
    };
  }

  private markdownToPlainText(markdown: string): string {
    return markdown
      // Remove HTML tags first
      .replace(/<[^>]+>/g, '')
      // Remove markdown formatting
      .replace(/^#{1,6}\s+(.+)$/gm, '$1') // Headings
      .replace(/\*{1,2}(.+?)\*{1,2}/g, '$1') // Bold/italic
      .replace(/`(.+?)`/g, '$1') // Inline code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
      .replace(/^[-*+]\s+(.+)$/gm, '$1') // List items
      .replace(/^\d+\.\s+(.+)$/gm, '$1') // Numbered lists
      .replace(/```[\s\S]*?```/g, '') // Code blocks
      // Clean up whitespace
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .trim();
  }

  private async calculateReadability(text: string): Promise<ReadabilityScore> {
    const sentences = this.splitIntoSentences(text);
    const words = text.split(/\s+/).filter(w => w.length > 0 && /[a-zA-Z]/.test(w)); // Filter out words without letters
    const totalSyllables = words.reduce((sum, word) => sum + this.countSyllables(word), 0);

    if (sentences.length === 0 || words.length === 0) {
      return {
        fleschReading: 0,
        fleschKincaid: 0,
        gunningFog: 0,
        smog: 0,
        averageSentenceLength: 0,
        averageWordLength: 0,
        complexWordRatio: 0,
        readingTime: 0,
      };
    }

    const averageSentenceLength = words.length / sentences.length;
    const averageWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    const complexWords = words.filter(word => this.countSyllables(word) >= 3).length;
    const complexWordRatio = complexWords / words.length;

    // Flesch Reading Ease
    const fleschReading = 206.835 - (1.015 * averageSentenceLength) - (84.6 * averageWordLength);

    // Flesch-Kincaid Grade Level
    const fleschKincaid = 0.39 * averageSentenceLength + 11.8 * averageWordLength - 15.59;

    // Gunning Fog Index
    const gunningFog = 0.4 * (averageSentenceLength + (complexWords / sentences.length * 100));

    // SMOG Index
    const smog = 1.043 * Math.sqrt(complexWords * (30 / sentences.length)) + 3.1291;

    // Reading time (200 words per minute)
    const readingTime = Math.ceil(words.length / 200);

    return {
      fleschReading: Math.max(0, Math.min(100, fleschReading)),
      fleschKincaid: Math.max(0, fleschKincaid),
      gunningFog: Math.max(0, gunningFog),
      smog: Math.max(0, smog),
      averageSentenceLength,
      averageWordLength,
      complexWordRatio,
      readingTime,
    };
  }

  private splitIntoSentences(text: string): string[] {
    // Simple sentence splitting - in practice, use a proper NLP library
    return text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  private countSyllables(word: string): number {
    word = word.toLowerCase();
    let syllableCount = 0;

    // Count vowel groups
    const vowels = 'aeiouy';
    let previousWasVowel = false;

    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i]);
      if (isVowel && !previousWasVowel) {
        syllableCount++;
      }
      previousWasVowel = isVowel;
    }

    // Handle silent 'e'
    if (word.endsWith('e')) {
      syllableCount--;
    }

    return Math.max(1, syllableCount);
  }

  private async analyzeSentiment(text: string): Promise<SentimentAnalysis> {
    const sentences = this.splitIntoSentences(text);

    if (sentences.length === 0) {
      return {
        overall: 0,
        positive: 0,
        negative: 0,
        neutral: 0,
        compound: 0,
        sentences: [],
      };
    }

    let totalPositive = 0;
    let totalNegative = 0;
    let totalNeutral = 0;

    const sentenceSentiments: any[] = [];

    for (const sentence of sentences) {
      const sentiment = this.analyzeSentenceSentiment(sentence);
      sentenceSentiments.push({
        text: sentence,
        score: sentiment.score,
        magnitude: sentiment.magnitude,
      });

      if (sentiment.score > 0.1) {
        totalPositive++;
      } else if (sentiment.score < -0.1) {
        totalNegative++;
      } else {
        totalNeutral++;
      }
    }

    const overall = totalPositive > totalNegative ? 0.5 :
                   totalNegative > totalPositive ? -0.5 : 0;

    const compound = (totalPositive - totalNegative) / sentences.length;

    return {
      overall,
      positive: totalPositive / sentences.length,
      negative: totalNegative / sentences.length,
      neutral: totalNeutral / sentences.length,
      compound,
      sentences: sentenceSentiments,
    };
  }

  private analyzeSentenceSentiment(sentence: string): { score: number; magnitude: number } {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'like', 'best', 'awesome', 'brilliant', 'perfect'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'worst', 'disappointing', 'poor', 'ugly', 'stupid', 'wrong', 'fail'];

    const words = sentence.toLowerCase().split(/\s+/);
    let positiveScore = 0;
    let negativeScore = 0;

    for (const word of words) {
      if (positiveWords.includes(word)) {
        positiveScore++;
      }
      if (negativeWords.includes(word)) {
        negativeScore++;
      }
    }

    const score = (positiveScore - negativeScore) / Math.max(words.length, 1);
    const magnitude = (positiveScore + negativeScore) / Math.max(words.length, 1);

    return { score, magnitude };
  }

  private async calculateDensity(markdown: string, plainText: string): Promise<DensityMetrics> {
    const sentences = this.splitIntoSentences(plainText);
    const words = plainText.split(/\s+/).filter(w => w.length > 0 && /[a-zA-Z]/.test(w));
    const characters = plainText.length;

    // Count markdown elements
    const headingCount = (markdown.match(/^#{1,6}\s/gm) || []).length;
    const listCount = (markdown.match(/^[-*+]\s/gm) || []).length +
                     (markdown.match(/^\d+\.\s/gm) || []).length;
    const linkCount = (markdown.match(/\[([^\]]+)\]\([^)]+\)/g) || []).length;
    const imageCount = (markdown.match(/!\[([^\]]*)\]\([^)]+\)/g) || []).length;
    const codeBlockCount = (markdown.match(/```[\s\S]*?```/g) || []).length;

    // Information density (content words / total words)
    const contentWords = words.filter(word =>
      word.length > 3 && !this.isStopWord(word)
    ).length;
    const informationDensity = words.length > 0 ? contentWords / words.length : 0;

    return {
      paragraphCount: (markdown.match(/\n\n/g) || []).length + 1,
      sentenceCount: sentences.length,
      wordCount: words.length,
      characterCount: characters,
      headingCount,
      listCount,
      linkCount,
      imageCount,
      codeBlockCount,
      informationDensity,
    };
  }

  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these',
      'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him',
      'her', 'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their'
    ]);

    return stopWords.has(word.toLowerCase());
  }

  private async analyzeStructure(markdown: string): Promise<StructureMetrics> {
    const headings = markdown.match(/^#{1,6}\s/gm) || [];
    const headingLevels = headings.map(h => h.trim().length);

    // Calculate heading hierarchy score
    let hierarchyScore = 1.0;
    let previousLevel = 0;

    for (const level of headingLevels) {
      if (level > previousLevel + 1) {
        hierarchyScore -= 0.1; // Penalty for skipped levels
      }
      previousLevel = level;
    }

    hierarchyScore = Math.max(0, hierarchyScore);

    // Calculate other metrics
    const linkCount = (markdown.match(/\[([^\]]+)\]\([^)]+\)/g) || []).length;
    const imageCount = (markdown.match(/!\[([^\]]*)\]\([^)]+\)/g) || []).length;
    const wordCount = markdown.split(/\s+/).filter(w => w.length > 0).length;

    const linkRatio = wordCount > 0 ? linkCount / wordCount : 0;
    const imageRatio = wordCount > 0 ? imageCount / wordCount : 0;

    // Calculate paragraph distribution
    const paragraphs = markdown.split(/\n\n/).filter(p => p.trim().length > 0);
    const paragraphLengths = paragraphs.map(p => p.split(/\s+/).length);
    const paragraphDistribution = this.calculateDistribution(paragraphLengths);

    return {
      headingHierarchy: hierarchyScore,
      listDepth: this.calculateListDepth(markdown),
      linkRatio,
      imageRatio,
      codeRatio: (markdown.match(/```[\s\S]*?```/g) || []).length / Math.max(paragraphs.length, 1),
      paragraphDistribution,
    };
  }

  private calculateListDepth(markdown: string): number {
    const lines = markdown.split('\n');
    let maxDepth = 0;

    for (const line of lines) {
      const match = line.match(/^(\s*)[-*+]\s/);
      if (match) {
        const depth = Math.floor(match[1].length / 2) + 1;
        maxDepth = Math.max(maxDepth, depth);
      }
    }

    return maxDepth;
  }

  private calculateDistribution(values: number[]): number[] {
    const buckets = [0, 0, 0, 0, 0]; // <10, 10-25, 26-50, 51-100, >100

    for (const value of values) {
      if (value < 10) buckets[0]++;
      else if (value < 25) buckets[1]++;
      else if (value < 50) buckets[2]++;
      else if (value < 100) buckets[3]++;
      else buckets[4]++;
    }

    return buckets.map(b => b / Math.max(values.length, 1));
  }

  private async extractKeywords(text: string): Promise<KeywordAnalysis> {
    // More comprehensive word filtering for better keyword extraction
    const words = text.toLowerCase()
      .split(/\s+/)
      .map(w => w.replace(/[^\w\u4e00-\u9fff\$\+\-\*\/\=\^\(\)]/g, '')) // Clean first, keep mathematical symbols
      .filter(w => w.length > 1 && /[a-zA-Z0-9\u4e00-\u9fff]/.test(w) && !this.isStopWord(w));

    // Calculate word frequencies
    const frequencies = new Map<string, number>();
    words.forEach(word => {
      frequencies.set(word, (frequencies.get(word) || 0) + 1);
    });

    // Convert to keyword array
    const keywordArray: Keyword[] = Array.from(frequencies.entries())
      .map(([word, frequency]) => ({
        word,
        frequency,
        density: frequency / words.length,
        importance: this.calculateWordImportance(word, frequency, words.length),
        position: this.findWordPositions(word, text),
      }))
      .sort((a, b) => b.importance - a.importance);

    // Extract main keywords (top 10)
    const mainKeywords = keywordArray.slice(0, 10);

    // Create topic clusters
    const topicClusters = this.createTopicClusters(keywordArray);

    // Build keywordsArray with proper fallback
    let keywordsArray: string[] = [];
    if (mainKeywords.length > 0) {
      keywordsArray = mainKeywords.map(k => k.word);
    } else if (frequencies.size > 0) {
      keywordsArray = Array.from(frequencies.keys()).slice(0, 5);
    } else {
      keywordsArray = [];
    }

    return {
      mainKeywords,
      keywordDensity: frequencies,
      topicClusters,
      readabilityKeywords: this.extractReadabilityKeywords(text),
      seoKeywords: this.extractSEOKeywords(text),
      keywordsArray, // Simple array of keyword strings for compatibility
    };
  }

  private calculateWordImportance(word: string, frequency: number, totalWords: number): number {
    const density = frequency / totalWords;
    const lengthBonus = word.length > 6 ? 1.2 : 1.0;
    const frequencyBonus = frequency > 5 ? 1.5 : 1.0;

    return density * lengthBonus * frequencyBonus;
  }

  private findWordPositions(word: string, text: string): number[] {
    const positions: number[] = [];
    const lowerText = text.toLowerCase();
    const lowerWord = word.toLowerCase();

    let index = 0;
    while ((index = lowerText.indexOf(lowerWord, index)) !== -1) {
      positions.push(index);
      index += word.length;
    }

    return positions;
  }

  private createTopicClusters(keywords: Keyword[]): TopicCluster[] {
    // Simple clustering based on co-occurrence
    const clusters: TopicCluster[] = [];
    const processed = new Set<string>();

    for (const keyword of keywords.slice(0, 20)) { // Top 20 keywords
      if (processed.has(keyword.word)) continue;

      const cluster: TopicCluster = {
        topic: keyword.word,
        keywords: [keyword.word],
        score: keyword.importance,
        sentences: [],
      };

      processed.add(keyword.word);

      // Find related keywords (simplified)
      for (const other of keywords.slice(0, 20)) {
        if (other.word !== keyword.word && !processed.has(other.word)) {
          // Simple relatedness based on shared characters
          const similarity = this.calculateStringSimilarity(keyword.word, other.word);
          if (similarity > 0.3) {
            cluster.keywords.push(other.word);
            cluster.score += other.importance * 0.5;
            processed.add(other.word);
          }
        }
      }

      if (cluster.keywords.length > 1) {
        clusters.push(cluster);
      }
    }

    return clusters.sort((a, b) => b.score - a.score);
  }

  private calculateStringSimilarity(a: string, b: string): number {
    const longer = a.length > b.length ? a : b;
    const shorter = a.length > b.length ? b : a;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(a: string, b: string): number {
    const matrix = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(null));

    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,      // deletion
          matrix[i][j - 1] + 1,      // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }

    return matrix[a.length][b.length];
  }

  private extractReadabilityKeywords(text: string): string[] {
    // Keywords that indicate readability level
    const readabilityKeywords = [
      'understand', 'clear', 'simple', 'easy', 'complex', 'difficult',
      'technical', 'advanced', 'basic', 'beginner', 'expert'
    ];

    const found: string[] = [];
    const words = text.toLowerCase().split(/\s+/);

    for (const keyword of readabilityKeywords) {
      if (words.includes(keyword)) {
        found.push(keyword);
      }
    }

    return found;
  }

  private extractSEOKeywords(text: string): string[] {
    // Keywords that indicate SEO optimization
    const seoKeywords = [
      'keyword', 'search', 'google', 'ranking', 'seo', 'meta',
      'title', 'description', 'h1', 'h2', 'alt', 'link'
    ];

    const found: string[] = [];
    const words = text.toLowerCase().split(/\s+/);

    for (const keyword of seoKeywords) {
      if (words.includes(keyword)) {
        found.push(keyword);
      }
    }

    return found;
  }

  private calculateQualityScore(metrics: {
    readability: ReadabilityScore;
    sentiment: SentimentAnalysis;
    density: DensityMetrics;
    structure: StructureMetrics;
  }): number {
    let score = 0;

    // Readability score (0-100, more lenient)
    const readabilityScore = metrics.readability.fleschReading;
    if (readabilityScore >= 40 && readabilityScore <= 100) {
      score += 0.25; // Base score for readable content
      if (readabilityScore >= 60 && readabilityScore <= 80) {
        score += 0.1; // Bonus for optimal readability
      }
    }

    // Sentiment (prefer any positive or neutral content)
    const sentimentScore = metrics.sentiment.compound;
    if (sentimentScore >= -0.2) { // Not strongly negative
      score += 0.2;
      if (sentimentScore > 0) {
        score += 0.1; // Bonus for positive content
      }
    }

    // Information density (prefer some content)
    const densityScore = metrics.density.informationDensity;
    if (densityScore >= 0.2) {
      score += 0.15;
      if (densityScore >= 0.4 && densityScore <= 0.7) {
        score += 0.1; // Bonus for good density
      }
    }

    // Structure
    if (metrics.structure.headingHierarchy > 0.5) {
      score += 0.1;
    }

    if (metrics.structure.linkRatio > 0) {
      score += 0.05;
    }

    if (metrics.density.wordCount > 10) {
      score += 0.05; // Bonus for substantial content
    }

    return Math.min(1.0, score);
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    console.log('🧹 Cleaning up content metrics analyzer');
    // Clean up any resources if needed
  }
}

// Helper classes for readability and sentiment analysis
class ReadabilityScorer {
  fleschReadingEase(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);

    if (sentences.length === 0 || words.length === 0) {
      return 0;
    }

    const averageSentenceLength = words.length / sentences.length;
    const averageWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    const complexWords = words.filter(word => word.length > 6).length;
    const complexWordRatio = complexWords / words.length;

    return Math.max(0, Math.min(100, 206.835 - (1.015 * averageSentenceLength) - (84.6 * averageWordLength)));
  }

  fleschKincaidGrade(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);

    if (sentences.length === 0 || words.length === 0) {
      return 0;
    }

    const averageSentenceLength = words.length / sentences.length;
    const averageWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;

    return Math.max(0, 0.39 * averageSentenceLength + 11.8 * averageWordLength - 15.59);
  }

  gunningFog(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);

    if (sentences.length === 0 || words.length === 0) {
      return 0;
    }

    const complexWords = words.filter(word => word.length > 6).length;
    return Math.max(0, 0.4 * ((words.length / sentences.length) + (complexWords / sentences.length * 100)));
  }

  smogIndex(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);

    if (sentences.length === 0 || words.length === 0) {
      return 0;
    }

    const complexWords = words.filter(word => word.length > 6).length;
    const polysyllables = words.filter(word => this.countSyllables(word) >= 3).length;

    return Math.max(0, 1.043 * Math.sqrt(polysyllables * (30 / sentences.length)) + 3.1291);
  }

  averageSentenceLength(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/);
    return sentences.length > 0 ? words.length / sentences.length : 0;
  }

  averageWordLength(text: string): number {
    const words = text.split(/\s+/);
    return words.length > 0 ?
      words.reduce((sum, word) => sum + word.length, 0) / words.length : 0;
  }

  complexWordRatio(text: string): number {
    const words = text.split(/\s+/);
    const complexWords = words.filter(word => word.length > 6).length;
    return words.length > 0 ? complexWords / words.length : 0;
  }

  private countSyllables(word: string): number {
    word = word.toLowerCase().replace(/[^a-z]/g, ''); // Remove non-letter characters
    if (word.length === 0) return 0;

    let syllableCount = 0;
    const vowels = 'aeiouy';
    let previousWasVowel = false;

    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i]);
      if (isVowel && !previousWasVowel) {
        syllableCount++;
      }
      previousWasVowel = isVowel;
    }

    // Handle silent 'e'
    if (word.endsWith('e') && syllableCount > 1) {
      syllableCount--;
    }

    return Math.max(1, syllableCount);
  }
}

class SentimentAnalyzer {
  private positiveWords = [
    'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'like',
    'best', 'awesome', 'brilliant', 'perfect', 'beautiful', 'outstanding', 'superb',
    'magnificent', 'incredible', 'extraordinary', 'marvelous', 'splendid', 'fabulous',
    'delightful', 'pleasant', 'joyful', 'happy', 'pleased', 'satisfied', 'grateful',
    'thankful', 'blessed', 'fortunate', 'lucky', 'proud', 'honored', 'respected',
    'admired', 'appreciated', 'valued', 'cherished', 'treasured', 'precious', 'special'
  ];

  private negativeWords = [
    'bad', 'terrible', 'awful', 'horrible', 'hate', 'worst', 'disappointing', 'poor',
    'ugly', 'stupid', 'wrong', 'fail', 'failure', 'pathetic', 'useless', 'worthless',
    'disgusting', 'revolting', 'repulsive', 'offensive', 'annoying', 'irritating',
    'frustrating', 'infuriating', 'maddening', 'exasperating', 'aggravating', 'vexing',
    'troublesome', 'problematic', 'difficult', 'challenging', 'stressful', 'worrying',
    'concerning', 'alarming', 'frightening', 'scary', 'terrifying', 'horrific', 'dreadful'
  ];

  analyze(text: string): SentimentAnalysis {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

    if (sentences.length === 0) {
      return {
        overall: 0,
        positive: 0,
        negative: 0,
        neutral: 0,
        compound: 0,
        sentences: [],
      };
    }

    let totalPositive = 0;
    let totalNegative = 0;
    let totalNeutral = 0;
    const sentenceSentiments: any[] = [];

    for (const sentence of sentences) {
      const sentiment = this.analyzeSentenceSentiment(sentence);
      sentenceSentiments.push({
        text: sentence,
        score: sentiment.score,
        magnitude: sentiment.magnitude,
      });

      if (sentiment.score > 0.1) {
        totalPositive++;
      } else if (sentiment.score < -0.1) {
        totalNegative++;
      } else {
        totalNeutral++;
      }
    }

    const overall = totalPositive > totalNegative ? 0.5 :
                   totalNegative > totalPositive ? -0.5 : 0;

    const compound = (totalPositive - totalNegative) / sentences.length;

    return {
      overall,
      positive: totalPositive / sentences.length,
      negative: totalNegative / sentences.length,
      neutral: totalNeutral / sentences.length,
      compound,
      sentences: sentenceSentiments,
    };
  }

  private analyzeSentenceSentiment(sentence: string): { score: number; magnitude: number } {
    const words = sentence.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    let positiveScore = 0;
    let negativeScore = 0;

    for (const word of words) {
      if (this.positiveWords.includes(word)) {
        positiveScore++;
      }
      if (this.negativeWords.includes(word)) {
        negativeScore++;
      }
    }

    const score = (positiveScore - negativeScore) / Math.max(words.length, 1);
    const magnitude = (positiveScore + negativeScore) / Math.max(words.length, 1);

    return { score, magnitude };
  }
}
