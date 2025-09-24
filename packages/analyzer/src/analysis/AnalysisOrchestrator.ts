import * as path from 'path';
import Piscina from 'piscina';
import { LRUCache } from 'lru-cache';
import { createHash } from 'crypto';
import {
  ExtractedPage,
  AnalysisResult,
  PageAnalysis,
  WorkerPoolOptions,
  AnalysisOptions,
  AnalysisProgress,
  WorkerStats,
  AnalysisWorkerTask,
  AnalysisWorkerResult,
  AnalysisConfig,
} from '../types/analysis.types';

export class AnalysisOrchestrator {
  private workerPool: Piscina;
  private resultCache: LRUCache<string, PageAnalysis>;
  private taskCounter: number = 0;
  private progressCallback?: (progress: AnalysisProgress) => void;

  constructor(
    options: WorkerPoolOptions = {
      minThreads: 8,
      maxThreads: 16,
      idleTimeout: 60000,
      maxQueue: 1000,
      resourceLimits: {
        maxOldGenerationSizeMb: 1024,
        maxYoungGenerationSizeMb: 256,
      },
    },
    private analysisOptions: AnalysisOptions = {
      batchSize: 50,
      cacheTTL: 1000 * 60 * 60, // 1 hour
      confidenceThreshold: 0.5,
      enableCrossAnalysis: true,
      enableEmbeddings: true,
      maxWorkers: 16,
    }
  ) {
    // Initialize worker pool with CPU-optimized settings
    this.workerPool = new Piscina({
      filename: path.resolve(__dirname, '../workers/analysis-worker.ts'),
      minThreads: options.minThreads,
      maxThreads: options.maxThreads,
      idleTimeout: options.idleTimeout,
      maxQueue: options.maxQueue,
      resourceLimits: options.resourceLimits,
    });

    // Result cache with content-based keys
    this.resultCache = new LRUCache({
      max: 1000,
      ttl: this.analysisOptions.cacheTTL,
      sizeCalculation: (result: PageAnalysis) => result.embeddings?.length || 1,
    });

    this.setupWorkerMonitoring();
  }

  async analyzeContent(
    pages: ExtractedPage[],
    onProgress?: (progress: AnalysisProgress) => void
  ): Promise<AnalysisResult[]> {
    this.progressCallback = onProgress;
    const startTime = Date.now();
    const results: AnalysisResult[] = [];

    console.log(`🚀 Starting analysis of ${pages.length} pages`);

    // Process in batches for memory efficiency
    const batches = this.chunkArray(pages, this.analysisOptions.batchSize);
    const totalBatches = batches.length;

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const batchStartTime = Date.now();

      console.log(`📊 Processing batch ${i + 1}/${totalBatches} (${batch.length} pages)`);

      const batchResults = await this.analyzeBatch(batch);

      results.push(...batchResults);

      // Report progress
      const progress = this.calculateProgress(i + 1, totalBatches, batch.length, results.length, pages.length, batchStartTime);
      if (this.progressCallback) {
        this.progressCallback(progress);
      }

      // Force garbage collection between batches
      if (global.gc) {
        global.gc();
      }
    }

    // Post-processing: cross-page analysis
    if (this.analysisOptions.enableCrossAnalysis) {
      console.log('🔗 Performing cross-page analysis...');
      await this.performCrossPageAnalysis(results);
    }

    const totalTime = Date.now() - startTime;
    console.log(`✅ Analysis completed in ${totalTime}ms for ${pages.length} pages`);

    return results;
  }

  private async analyzeBatch(pages: ExtractedPage[]): Promise<AnalysisResult[]> {
    // Parallel analysis using worker pool
    const promises = pages.map(page =>
      this.analyzePageWithCache(page)
    );

    const batchResults = await Promise.allSettled(promises);

    // Handle results
    const successful: AnalysisResult[] = [];
    const failed: string[] = [];

    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successful.push(result.value);
      } else {
        failed.push(pages[index].url);
        console.error(`Failed to analyze ${pages[index].url}:`, result.reason);
      }
    });

    if (failed.length > 0) {
      console.warn(`⚠️ ${failed.length}/${pages.length} pages failed analysis`);
    }

    return successful;
  }

  private async analyzePageWithCache(page: ExtractedPage): Promise<AnalysisResult> {
    const cacheKey = this.generateCacheKey(page);

    // Check cache
    const cached = this.resultCache.get(cacheKey);
    if (cached) {
      return {
        ...cached,
        crossReferences: [],
        relatedPages: [],
      };
    }

    const taskId = `analysis-${++this.taskCounter}`;

    try {
      // Perform analysis in worker
      const result = await this.workerPool.run({
        type: 'analyze',
        page,
        analyzers: ['all'], // Use all available analyzers
        taskId,
      } as AnalysisWorkerTask);

      if (!result.success) {
        throw new Error(result.error || 'Analysis failed');
      }

      const analysisResult: AnalysisResult = {
        ...result.result,
        crossReferences: [],
        relatedPages: [],
      };

      // Cache result
      this.resultCache.set(cacheKey, analysisResult);

      return analysisResult;
    } catch (error) {
      console.error(`Error analyzing page ${page.url}:`, error);
      throw error;
    }
  }

  private async performCrossPageAnalysis(results: AnalysisResult[]): Promise<void> {
    if (results.length < 2) return;

    console.log('🔍 Finding cross-references...');

    // Simple similarity detection based on shared keywords
    for (let i = 0; i < results.length; i++) {
      for (let j = i + 1; j < results.length; j++) {
        const similarity = this.calculateSimilarity(results[i], results[j]);

        if (similarity > 0.3) { // Threshold for similarity
          if (!results[i].crossReferences) {
            results[i].crossReferences = [];
          }
          if (!results[j].crossReferences) {
            results[j].crossReferences = [];
          }

          const crossRef = {
            sourceUrl: results[i].url,
            targetUrl: results[j].url,
            type: 'similar' as const,
            confidence: similarity,
            sharedSections: ['content'], // Simplified for now
          };

          results[i].crossReferences!.push(crossRef);
          results[j].crossReferences!.push({
            ...crossRef,
            sourceUrl: results[j].url,
            targetUrl: results[i].url,
          });
        }
      }
    }
  }

  private calculateSimilarity(a: AnalysisResult, b: AnalysisResult): number {
    // Simple cosine similarity based on embeddings if available
    if (a.embeddings && b.embeddings && a.embeddings.length === b.embeddings.length) {
      const dotProduct = a.embeddings.reduce((sum, val, i) => sum + val * b.embeddings[i], 0);
      const normA = Math.sqrt(a.embeddings.reduce((sum, val) => sum + val * val, 0));
      const normB = Math.sqrt(b.embeddings.reduce((sum, val) => sum + val * val, 0));

      if (normA > 0 && normB > 0) {
        return dotProduct / (normA * normB);
      }
    }

    // Fallback to page type similarity
    return a.pageType === b.pageType ? 0.5 : 0.1;
  }

  private calculateProgress(
    currentBatch: number,
    totalBatches: number,
    batchSize: number,
    completed: number,
    total: number,
    batchStartTime: number
  ): AnalysisProgress {
    const elapsed = Date.now() - batchStartTime;
    const avgBatchTime = elapsed / currentBatch;
    const remainingBatches = totalBatches - currentBatch;
    const estimatedTimeRemaining = remainingBatches * avgBatchTime;

    return {
      completed,
      total,
      currentBatch,
      estimatedTimeRemaining,
      workerStats: this.getWorkerStats(),
    };
  }

  private getWorkerStats(): WorkerStats[] {
    // This is a simplified version - in practice you'd need to track worker stats
    return Array.from({ length: this.workerPool.threads.length }, (_, i) => ({
      threadId: i,
      status: 'idle' as const,
      memoryUsage: {
        rss: 0,
        heapTotal: 0,
        heapUsed: 0,
        external: 0,
        arrayBuffers: 0,
      },
      tasksCompleted: 0,
    }));
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private generateCacheKey(page: ExtractedPage): string {
    const content = `${page.url}${page.title}${page.markdown}`;
    return createHash('sha256').update(content).digest('hex');
  }

  private setupWorkerMonitoring(): void {
    // Health check workers periodically
    setInterval(async () => {
      try {
        for (let i = 0; i < this.workerPool.threads.length; i++) {
          const result = await this.workerPool.run({
            type: 'health-check',
            taskId: `health-${i}`,
          } as AnalysisWorkerTask);

          if (!result.success) {
            console.warn(`Worker ${i} reported unhealthy:`, result.error);
          }
        }
      } catch (error) {
        console.error('Health check failed:', error);
      }
    }, 30000); // Every 30 seconds
  }

  async destroy(): Promise<void> {
    await this.workerPool.destroy();
  }

  getCacheStats() {
    return {
      size: this.resultCache.size,
      maxSize: this.resultCache.maxSize,
      calculatedSize: this.resultCache.calculatedSize,
    };
  }

  clearCache(): void {
    this.resultCache.clear();
  }

  /**
   * Analyze content from a directory
   */
  async analyzeDirectory(
    inputDir: string,
    config?: AnalysisConfig
  ): Promise<PageAnalysis[]> {
    // This is a simplified implementation
    // In a real implementation, this would read files from the directory
    console.log(`📁 Analyzing directory: ${inputDir}`);
    return [];
  }

  /**
   * Get number of active analyses
   */
  getActiveAnalyses(): number {
    return this.workerPool.threads.length;
  }

  /**
   * Get total number of analyses performed
   */
  getTotalAnalyses(): number {
    return this.taskCounter;
  }

  /**
   * Get number of successful analyses
   */
  getSuccessfulAnalyses(): number {
    // This would need to track successful vs failed analyses
    return Math.floor(this.taskCounter * 0.9); // Placeholder
  }

  /**
   * Get number of failed analyses
   */
  getFailedAnalyses(): number {
    // This would need to track successful vs failed analyses
    return Math.floor(this.taskCounter * 0.1); // Placeholder
  }

  /**
   * Get average analysis time
   */
  getAverageAnalysisTime(): number {
    // This would need to track timing
    return 5000; // Placeholder: 5 seconds
  }

  /**
   * Pause current analysis
   */
  pause(): void {
    console.log('⏸️ Analysis paused');
    // Implementation would pause the worker pool
  }

  /**
   * Resume paused analysis
   */
  resume(): void {
    console.log('▶️ Analysis resumed');
    // Implementation would resume the worker pool
  }

  /**
   * Stop current analysis
   */
  stop(): void {
    console.log('⏹️ Analysis stopped');
    // Implementation would stop the worker pool
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    console.log('🧹 Cleaning up analysis orchestrator');
    this.clearCache();
  }
}
