import type { AnalysisWorkerTask, AnalysisWorkerResult, ExtractedPage, PageAnalysis } from '../types/analysis.types';
import { ContentMetricsAnalyzer } from '../analysis/ContentMetricsAnalyzer';
import { PageTypeClassifier } from '../analysis/PageTypeClassifier';
import { SectionDetector } from '../analysis/SectionDetector';

export interface AnalysisWorkerData {
  task: AnalysisWorkerTask;
  options: {
    confidenceThreshold: number;
    enableCrossAnalysis: boolean;
    enableEmbeddings: boolean;
  };
}

export default async function analysisWorker(data: AnalysisWorkerData): Promise<AnalysisWorkerResult> {
  const { task, options } = data;
  const startTime = Date.now();

  try {
    // Validate task.page exists
    if (!task.page) {
      throw new Error('No page data provided');
    }

    const page = task.page;

    // Initialize analysis components
    const metricsAnalyzer = new ContentMetricsAnalyzer();
    const pageClassifier = new PageTypeClassifier();
    const sectionDetector = new SectionDetector();

    // Perform comprehensive analysis
    const analysis: PageAnalysis = {
      url: page.url,
      pageType: 'blog' as any, // Default type, will be updated
      confidence: 0,
      contentMetrics: await metricsAnalyzer.analyze(page),
      sections: await sectionDetector.analyze(page),
      analysisTime: 0,
      metadata: {},
      rawContent: page,
      qualityScore: 0,
      recommendations: []
    };

    // Step 1: Classify page type
    try {
      const classification = await pageClassifier.analyze(page);
      analysis.pageType = classification.pageType;
      analysis.confidence = classification.confidence;
    } catch (error) {
      console.warn(`Page classification failed for ${page.url}:`, error);
    }

    // Step 2: Content metrics and sections are already set above

    // Step 3: Calculate quality score and recommendations
    try {
      if (analysis.contentMetrics && analysis.contentMetrics.quality !== undefined) {
        analysis.qualityScore = analysis.contentMetrics.quality;

        // Generate basic recommendations based on analysis
        analysis.recommendations = [];
        if (analysis.contentMetrics.quality < 0.5) {
          analysis.recommendations.push('Improve content structure and readability');
        }
        if (analysis.sections.length < 3) {
          analysis.recommendations.push('Add more content sections for better organization');
        }
      } else {
        // Fallback quality score if not available from contentMetrics
        analysis.qualityScore = 0.5;
        analysis.recommendations = ['Content analysis incomplete'];
      }
    } catch (error) {
      console.warn(`Quality analysis failed for ${page.url}:`, error);
      analysis.qualityScore = 0.5;
    }

    // Step 4: Initialize metadata and cross-page analysis
    // Initialize metadata properties using bracket notation
    analysis.metadata['analyzed'] = true;
    analysis.metadata['crossReferences'] = 0;
    analysis.metadata['relatedTopics'] = [];

    // Note: Cross-page analysis is handled separately in the orchestrator
    // These are just placeholders

    // Step 5: Generate embeddings (if enabled)
    if (options.enableEmbeddings) {
      try {
        analysis.embeddings = await generateSimpleEmbeddings(page);
      } catch (error) {
        console.warn(`Embedding generation failed for ${page.url}:`, error);
      }
    }

    analysis.analysisTime = Date.now() - startTime;

    return {
      success: true,
      result: analysis
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Extract related topics from multiple pages
 */
function extractRelatedTopics(pages: ExtractedPage[]): string[] {
  const topics = new Set<string>();

  pages.forEach(page => {
    // Simple topic extraction from title and content
    const titleWords = page.title.toLowerCase().split(/\s+/);
    const contentWords = page.markdown.toLowerCase().split(/\s+/);

    [...titleWords, ...contentWords]
      .filter(word => word.length > 3)
      .forEach(word => topics.add(word));
  });

  return Array.from(topics).slice(0, 10); // Return top 10 topics
}

/**
 * Generate simple embeddings using basic text features
 */
async function generateSimpleEmbeddings(page: ExtractedPage): Promise<number[]> {
  // Simple embedding generation based on text features
  const text = `${page.title} ${page.markdown}`.toLowerCase();

  // Create a simple hash-based embedding
  const features = [
    text.length,
    text.split('.').length, // Sentence count
    text.split(/\s+/).length, // Word count
    (text.match(/\b\w+\b/g) || []).filter(word => word.length > 4).length, // Long words
    text.split(',').length, // Comma count
    text.split('?').length - 1, // Question count
    text.split('!').length - 1, // Exclamation count
    (text.match(/\b(and|or|but|with|for|the|a|an|of|to|in|on|at|by)\b/g) || []).length, // Common words
  ];

  // Normalize features to 0-1 range
  const maxFeature = Math.max(...features);
  return features.map(f => f / maxFeature);
}
