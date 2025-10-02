import { parentPort } from 'worker_threads';

export default class BaseWorker {
  constructor() {
    this.taskCount = 0;
    this.errorCount = 0;
    this.startTime = Date.now();
  }

  /**
   * Execute a task
   * @param {any} task - The task to execute
   * @returns {Promise<any>} - The result of the task
   */
  async executeTask(task) {
    this.taskCount++;
    const startTime = Date.now();

    try {
      // This should be overridden by subclasses
      const result = await this.processTask(task);
      const duration = Date.now() - startTime;

      return {
        success: true,
        result,
        duration,
        taskId: task.id || `task_${this.taskCount}`,
        workerId: this.constructor.name,
        stats: this.getStats()
      };
    } catch (error) {
      this.errorCount++;
      const duration = Date.now() - startTime;

      return {
        success: false,
        error: error.message,
        duration,
        taskId: task.id || `task_${this.taskCount}`,
        workerId: this.constructor.name,
        stats: this.getStats()
      };
    }
  }

  /**
   * Process the actual task - override in subclasses
   * @param {any} task - The task data
   * @returns {Promise<any>} - The result
   */
  async processTask(task) {
    throw new Error('processTask must be implemented by subclass');
  }

  /**
   * Get worker statistics
   * @returns {object} - Worker stats
   */
  getStats() {
    const memoryUsage = process.memoryUsage();

    return {
      taskCount: this.taskCount,
      errorCount: this.errorCount,
      uptime: Date.now() - this.startTime,
      memoryUsage,
      memoryUsageFormatted: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
      }
    };
  }

  /**
   * Health check
   * @returns {object} - Health status
   */
  healthCheck() {
    const stats = this.getStats();
    const isHealthy = stats.errorCount / Math.max(stats.taskCount, 1) < 0.1; // Less than 10% error rate

    return {
      healthy: isHealthy,
      stats,
      timestamp: Date.now()
    };
  }
}

