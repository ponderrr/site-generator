// Analysis types and interfaces for the site generator
export interface ExtractedPage {
  url: string;
  title: string;
  markdown: string;
  frontmatter: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface AnalysisResult {
  url: string;
  pageType: PageType;
  confidence: number;
  contentMetrics: ContentMetrics;
  sections: Section[];
  embeddings?: number[];
  crossReferences?: CrossReference[];
  relatedPages?: string[];
  analysisTime: number;
  metadata: Record<string, any>;
}

export interface PageAnalysis extends AnalysisResult {
  rawContent: ExtractedPage;
  qualityScore: number;
  recommendations: string[];
}

export interface ContentMetrics {
  readability: ReadabilityScore;
  sentiment: SentimentAnalysis;
  density: DensityMetrics;
  structure: StructureMetrics;
  keywords: KeywordAnalysis;
  quality: number;
  // Backward compatibility property
  keywordsArray?: string[];
}

export interface ReadabilityScore {
  fleschReading: number;
  fleschKincaid: number;
  gunningFog: number;
  smog: number;
  averageSentenceLength: number;
  averageWordLength: number;
  complexWordRatio: number;
  readingTime: number;
}

export interface SentimentAnalysis {
  overall: number; // -1 to 1
  positive: number; // 0 to 1
  negative: number; // 0 to 1
  neutral: number; // 0 to 1
  compound: number; // -1 to 1
  sentences: Array<{
    text: string;
    score: number;
    magnitude: number;
  }>;
}

export interface DensityMetrics {
  paragraphCount: number;
  sentenceCount: number;
  wordCount: number;
  characterCount: number;
  headingCount: number;
  listCount: number;
  linkCount: number;
  imageCount: number;
  codeBlockCount: number;
  informationDensity: number; // content words / total words
}

export interface StructureMetrics {
  headingHierarchy: number; // 0 to 1
  listDepth: number;
  linkRatio: number;
  imageRatio: number;
  codeRatio: number;
  paragraphDistribution: number[]; // distribution of paragraph lengths
}

export interface KeywordAnalysis {
  mainKeywords: Keyword[];
  keywordDensity: Map<string, number>;
  topicClusters: TopicCluster[];
  readabilityKeywords: string[];
  seoKeywords: string[];
}

export interface Keyword {
  word: string;
  frequency: number;
  density: number;
  importance: number;
  position: number[];
}

export interface TopicCluster {
  topic: string;
  keywords: string[];
  score: number;
  sentences: string[];
}

export interface Section {
  id: string;
  type: SectionType;
  confidence: number;
  headingLevel: number;
  wordCount: number;
  position: number;
  content: string;
  metrics: SectionMetrics;
}

export interface SectionMetrics {
  readabilityScore: number;
  keywordDensity: number;
  sentimentScore: number;
  complexityScore: number;
}

export type PageType =
  | 'home'
  | 'about'
  | 'pricing'
  | 'contact'
  | 'blog-post'
  | 'documentation'
  | 'api-reference'
  | 'product'
  | 'service'
  | 'case-study'
  | 'testimonial'
  | 'landing'
  | 'error'
  | 'other';

export type SectionType =
  | 'hero'
  | 'features'
  | 'testimonials'
  | 'pricing'
  | 'cta'
  | 'content'
  | 'sidebar'
  | 'footer'
  | 'navigation'
  | 'header'
  | 'form'
  | 'comparison'
  | 'faq';

export interface CrossReference {
  sourceUrl: string;
  targetUrl: string;
  type: 'similar' | 'reference' | 'duplicate';
  confidence: number;
  sharedSections: string[];
}

export interface ClassificationResult {
  pageType: PageType;
  confidence: number;
  scores: Map<PageType, number>;
  features: FeatureVector;
}

export interface FeatureVector {
  urlFeatures: number[];
  contentFeatures: number[];
  structureFeatures: number[];
  metadataFeatures: number[];
}

export interface Pattern {
  url?: RegExp;
  heading?: RegExp;
  content?: RegExp;
  structure?: string;
  wordCount?: { min: number; max: number };
  icons?: boolean;
  bulletPoints?: { min: number };
  quotes?: boolean;
  names?: boolean;
  position?: 'first' | 'middle' | 'last';
  weight: number;
}

export interface SectionPattern {
  type: SectionType;
  indicators: SectionIndicator[];
}

export interface SectionIndicator {
  position?: 'first' | 'middle' | 'last';
  heading?: RegExp;
  structure?: string;
  wordCount?: { min: number; max: number };
  icons?: boolean;
  bulletPoints?: { min: number };
  quotes?: boolean;
  names?: boolean;
  content?: RegExp;
  weight: number;
}

export interface SectionCandidate {
  heading?: {
    type: string;
    level: number;
    text: string;
    line: number;
    content: any[];
  };
  content: any[];
  position: number;
}

export interface Analyzer {
  name: string;
  analyze(page: ExtractedPage): Promise<any>;
  cleanup(): void;
}

export interface AnalysisOptions {
  batchSize: number;
  cacheTTL: number;
  confidenceThreshold: number;
  enableCrossAnalysis: boolean;
  enableEmbeddings: boolean;
  maxWorkers: number;
}

export interface WorkerPoolOptions {
  minThreads: number;
  maxThreads: number;
  idleTimeout: number;
  maxQueue: number;
  resourceLimits: {
    maxOldGenerationSizeMb: number;
    maxYoungGenerationSizeMb: number;
  };
}

export interface AnalysisProgress {
  completed: number;
  total: number;
  currentBatch: number;
  estimatedTimeRemaining: number;
  workerStats: WorkerStats[];
}

export interface WorkerStats {
  threadId: number;
  status: 'idle' | 'busy' | 'terminating';
  memoryUsage: NodeJS.MemoryUsage;
  tasksCompleted: number;
}

export interface AnalysisWorkerTask {
  type: 'analyze' | 'health-check';
  page?: ExtractedPage;
  analyzers?: string[];
  taskId: string;
}

export interface AnalysisWorkerResult {
  success: boolean;
  result?: AnalysisResult;
  error?: string;
  taskId: string;
  duration: number;
}

export interface AnalysisConfig {
  outputDir: string;
  format: 'json' | 'markdown' | 'html';
  includeRaw: boolean;
  includeMetadata: boolean;
  maxDepth: number;
  followExternalLinks: boolean;
}
