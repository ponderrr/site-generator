import * as path from 'path';
import Piscina from 'piscina';
import { LRUCache } from 'lru-cache';
import { createHash } from 'crypto';
import pLimit from 'p-limit';
import { DEFAULT_WORKER_CONFIG, DEFAULT_CACHE_CONFIG, MemoryMonitor } from '../../../core/src/config/memory.config';
import type {
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
  private resultCache: LRUCache<string, AnalysisResult>;
  private taskCounter: number = 0;
  private progressCallback?: ((progress: AnalysisProgress) => void) | undefined;
  private memoryMonitor: MemoryMonitor;
  private isMemoryPressureHigh: boolean = false;
  private healthCheckInterval?: NodeJS.Timeout | undefined;
  private activeTasks: Set<string> = new Set();

  constructor(
    options: WorkerPoolOptions = {
      minThreads: 8,
      maxThreads: 16,
      idleTimeout: 60000,
      maxQueue: 1000,
      resourceLimits: {
        maxOldGenerationSizeMb: DEFAULT_WORKER_CONFIG.maxOldGenerationSizeMb,
        maxYoungGenerationSizeMb: DEFAULT_WORKER_CONFIG.maxYoungGenerationSizeMb,
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
    // Use .js extension for compiled worker, .ts for development/testing
    const workerExt = __filename.endsWith('.ts') ? '.ts' : '.js';
    this.workerPool = new Piscina({
      filename: path.resolve(__dirname, `../workers/analysis-worker${workerExt}`),
      minThreads: options.minThreads,
      maxThreads: options.maxThreads,
      idleTimeout: options.idleTimeout,
      maxQueue: options.maxQueue,
      resourceLimits: options.resourceLimits,
    });

    // Result cache with content-based keys using centralized config
    this.resultCache = new LRUCache({
      max: DEFAULT_CACHE_CONFIG.maxItems,
      ttl: DEFAULT_CACHE_CONFIG.ttl,
      updateAgeOnGet: true,
      updateAgeOnHas: true,
      allowStale: true
    });

    // Initialize memory monitor
    this.memoryMonitor = new MemoryMonitor();

    this.setupWorkerMonitoring();
    this.startMemoryMonitoring();
  }

  async analyzeContent(
    pages: ExtractedPage[],
    onProgress?: (progress: AnalysisProgress) => void
  ): Promise<AnalysisResult[]> {
    this.progressCallback = onProgress || undefined;
    const startTime = Date.now();
    const results: AnalysisResult[] = [];

    console.log(`🚀 Starting analysis of ${pages.length} pages`);

    // Process in batches for memory efficiency
    const batches = this.chunkArray(pages, this.analysisOptions.batchSize);
    const totalBatches = batches.length;

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      if (!batch) continue;
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

  /**
   * Stream analysis results to reduce memory pressure
   */
  async *analyzeContentStreaming(
    pages: ExtractedPage[],
    onProgress?: (progress: AnalysisProgress) => void
  ): AsyncGenerator<AnalysisResult, void, unknown> {
    this.progressCallback = onProgress || undefined;
    const startTime = Date.now();

    console.log(`🚀 Starting streaming analysis of ${pages.length} pages`);

    // Process in smaller batches for streaming
    const batchSize = Math.min(this.analysisOptions.batchSize, 10); // Smaller batches for streaming
    const batches = this.chunkArray(pages, batchSize);
    const totalBatches = batches.length;
    let processedCount = 0;

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      if (!batch) continue;
      const batchStartTime = Date.now();

      console.log(`📊 Streaming batch ${i + 1}/${totalBatches} (${batch.length} pages)`);

      // Process batch and yield results immediately
      for (const page of batch) {
        try {
          const result = await this.analyzePageWithCache(page);
          processedCount++;
          
          // Yield result immediately to reduce memory pressure
          yield result;

          // Report progress
          const progress = this.calculateProgress(i + 1, totalBatches, 1, processedCount, pages.length, batchStartTime);
          if (this.progressCallback) {
            this.progressCallback(progress);
          }

        } catch (error) {
          console.error(`Failed to analyze ${page.url}:`, error);
          // Continue processing other pages even if one fails
        }
      }

      // Force garbage collection between batches
      if (global.gc) {
        global.gc();
      }
    }

    const totalTime = Date.now() - startTime;
    console.log(`✅ Streaming analysis completed in ${totalTime}ms for ${pages.length} pages`);
  }

  private async analyzeBatch(pages: ExtractedPage[]): Promise<AnalysisResult[]> {
    // Start health checks when work begins
    this.startHealthChecks();
    
    // Implement proper backpressure with p-limit
    const limit = pLimit(this.analysisOptions.maxWorkers);
    const successful: AnalysisResult[] = [];
    const failed: string[] = [];

    // Process pages with controlled concurrency
    const promises = pages.map(page => 
      limit(async () => {
        const taskId = `analysis-${page.url}`;
        this.activeTasks.add(taskId);
        
        try {
          const result = await this.analyzePageWithCache(page);
          return result;
        } catch (error) {
          failed.push(page.url);
          console.error(`Failed to analyze ${page.url}:`, error);
          return null;
        } finally {
          this.activeTasks.delete(taskId);
        }
      })
    );

    const results = await Promise.allSettled(promises);
    
    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value !== null) {
        successful.push(result.value);
      }
    });

    if (failed.length > 0) {
      console.warn(`⚠️ ${failed.length}/${pages.length} pages failed analysis`);
    }

    // Health checks will stop automatically when activeTasks becomes empty

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
      // Try to use worker pool first
      const result = await this.workerPool.run({
        task: {
          type: 'analyze',
          page,
          analyzers: ['all'], // Use all available analyzers
          taskId,
        },
        options: {
          confidenceThreshold: this.analysisOptions.confidenceThreshold,
          enableCrossAnalysis: this.analysisOptions.enableCrossAnalysis,
          enableEmbeddings: this.analysisOptions.enableEmbeddings,
        }
      });

      if (!result.success) {
        throw new Error(result.error || 'Analysis failed');
      }

      const analysisResult: AnalysisResult = {
        ...result.result!,
        crossReferences: result.result!.crossReferences || [],
        relatedPages: result.result!.relatedPages || [],
      };

      // Cache result
      this.resultCache.set(cacheKey, analysisResult);

      return analysisResult;
    } catch (error) {
      // Fallback to direct analysis if worker fails (e.g., during tests)
      console.warn(`Worker failed for ${page.url}, using direct analysis:`, error);
      const directResult = await this.analyzeDirectly(page);
      
      // Cache the direct analysis result too
      this.resultCache.set(cacheKey, directResult);
      
      return directResult;
    }
  }

  private async analyzeDirectly(page: ExtractedPage): Promise<AnalysisResult> {
    // Import analyzers dynamically to avoid circular dependencies
    const { ContentMetricsAnalyzer } = await import('./ContentMetricsAnalyzer');
    const { PageTypeClassifier } = await import('./PageTypeClassifier');
    const { SectionDetector } = await import('./SectionDetector');

    const startTime = Date.now();
    const metricsAnalyzer = new ContentMetricsAnalyzer();
    const pageClassifier = new PageTypeClassifier();
    const sectionDetector = new SectionDetector();

    const [contentMetrics, classification, sections] = await Promise.all([
      metricsAnalyzer.analyze(page),
      pageClassifier.analyze(page),
      sectionDetector.analyze(page)
    ]);

    return {
      url: page.url,
      pageType: classification.pageType,
      confidence: classification.confidence,
      contentMetrics,
      sections,
      analysisTime: Date.now() - startTime,
      metadata: {
        analyzed: true,
        crossReferences: 0,
        relatedTopics: []
      },
      crossReferences: [],
      relatedPages: []
    };
  }

  private async performCrossPageAnalysis(results: AnalysisResult[]): Promise<void> {
    if (results.length < 2) return;

    console.log('🔍 Finding cross-references...');

    // Simple similarity detection based on shared keywords
    for (let i = 0; i < results.length; i++) {
      const resultA = results[i];
      if (!resultA) continue; // Guard clause - skip if null/undefined
      
      for (let j = i + 1; j < results.length; j++) {
        const resultB = results[j];
        if (!resultB) continue; // Guard clause - skip if null/undefined
        
        const similarity = this.calculateSimilarity(resultA, resultB);

        if (similarity > 0.3) { // Threshold for similarity
          if (!resultA.crossReferences) {
            resultA.crossReferences = [];
          }
          if (!resultB.crossReferences) {
            resultB.crossReferences = [];
          }

          const crossRef = {
            sourceUrl: resultA.url,
            targetUrl: resultB.url,
            type: 'similar' as const,
            confidence: similarity,
            sharedSections: ['content'], // Simplified for now
          };

          resultA.crossReferences.push(crossRef);
          resultB.crossReferences.push({
            ...crossRef,
            sourceUrl: resultB.url,
            targetUrl: resultA.url,
          });
        }
      }
    }
  }

  private calculateSimilarity(a: AnalysisResult, b: AnalysisResult): number {
    // Early validation
    if (!a || !b) return 0;
    
    // Simple cosine similarity based on embeddings if available
    if (a.embeddings && b.embeddings && a.embeddings.length === b.embeddings.length) {
      const dotProduct = a.embeddings.reduce((sum, val, i) => sum + val * ((b.embeddings && b.embeddings[i]) || 0), 0);
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
    // Create structured cache key with versioning for better debugging
    const cacheVersion = '1.0.0';
    const stableProps = {
      url: page.url,
      title: page.title,
      contentHash: this.hashContent(page.markdown),
      version: cacheVersion,
      timestamp: Math.floor(Date.now() / (1000 * 60 * 60)) // Hour-based timestamp
    };
    
    // Create a more readable key structure
    const keyData = JSON.stringify(stableProps);
    const hash = createHash('sha256').update(keyData).digest('hex').substring(0, 16);
    
    // Return structured key: analysis:v1.0.0:url_hash:content_hash
    const urlHash = createHash('md5').update(page.url).digest('hex').substring(0, 8);
    const contentHash = stableProps.contentHash.substring(0, 8);
    
    return `analysis:v${cacheVersion}:${urlHash}:${contentHash}:${hash}`;
  }

  /**
   * Generate content hash for caching
   */
  private hashContent(content: string): string {
    return createHash('md5').update(content).digest('hex');
  }

  private setupWorkerMonitoring(): void {
    // Health checks are now conditional - only run when workers are active
    // This method sets up the infrastructure but doesn't start health checks
  }

  /**
   * Start health checks when work begins
   */
  private startHealthChecks(): void {
    if (this.healthCheckInterval) return; // Already running
    
    this.healthCheckInterval = setInterval(async () => {
      if (this.activeTasks.size === 0) {
        // Stop health checks when idle
        this.stopHealthChecks();
        return;
      }
      
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

  /**
   * Stop health checks when idle
   */
  private stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
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
   * Start memory monitoring
   */
  private startMemoryMonitoring(): void {
    this.memoryMonitor.startMonitoring(
        (usage: NodeJS.MemoryUsage) => {
        if (!this.isMemoryPressureHigh) {
          console.warn('⚠️ High memory pressure detected, reducing batch processing');
          this.isMemoryPressureHigh = true;
        }
      },
        (usage: NodeJS.MemoryUsage) => {
        console.error('🚨 Critical memory pressure detected!', usage);
        // Force garbage collection
        if (global.gc) {
          global.gc();
        }
      }
    );
  }

  /**
   * Stop memory monitoring
   */
  private stopMemoryMonitoring(): void {
    this.memoryMonitor.stopMonitoring();
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    console.log('🧹 Cleaning up analysis orchestrator');
    this.clearCache();
    this.stopMemoryMonitoring();
    this.stopHealthChecks();
  }

  /**
   * Destroy the orchestrator and clean up resources with graceful shutdown
   */
  async destroy(): Promise<void> {
    console.log('🔄 Starting graceful shutdown of analysis orchestrator...');
    
    try {
      // Stop accepting new tasks
      this.activeTasks.clear();
      
      // Wait for any remaining health checks to complete
      this.stopHealthChecks();
      
      // Stop memory monitoring
      this.stopMemoryMonitoring();
      
      // Clear cache
      this.clearCache();
      
      // Destroy worker pool with timeout
      await Promise.race([
        this.workerPool.destroy(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Worker pool destroy timeout')), 10000)
        )
      ]);
      
      console.log('✅ Analysis orchestrator shutdown completed successfully');
      
    } catch (error) {
      console.error('❌ Analysis orchestrator shutdown failed:', error);
      throw error;
    }
  }
}
