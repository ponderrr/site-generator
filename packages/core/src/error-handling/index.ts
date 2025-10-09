import { ProcessingError, ErrorContext, RetryConfig } from "../types/index.js";

export class ErrorHandler {
  private errorCounts: Map<string, number> = new Map();
  private circuitBreakers: Map<
    string,
    {
      failures: number;
      lastFailure: number;
      state: "closed" | "open" | "half-open";
      resetTimeout?: NodeJS.Timeout;
    }
  > = new Map();

  constructor(
    private retryConfig: RetryConfig = {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffFactor: 2,
      retryableErrors: ["NETWORK_ERROR", "TIMEOUT", "TEMPORARY_FAILURE"],
    },
  ) {}

  /**
   * Handle an error with retry logic
   */
  async handleWithRetry<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    customRetryConfig?: Partial<RetryConfig>,
  ): Promise<T> {
    const config = { ...this.retryConfig, ...customRetryConfig };
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        // Check circuit breaker
        if (this.isCircuitOpen(context.component)) {
          throw this.createProcessingError(
            "Circuit breaker is open",
            "CIRCUIT_OPEN",
            context,
            false,
          );
        }

        const result = await operation();

        // Reset error count on success
        this.errorCounts.delete(this.getErrorKey(context));
        this.updateCircuitBreaker(context.component, false);

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.recordError(context, lastError);

        const isRetryable = this.isRetryableError(lastError, config);

        if (!isRetryable || attempt === config.maxAttempts) {
          this.updateCircuitBreaker(context.component, true);
          throw this.enrichError(lastError, context, attempt);
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffFactor, attempt - 1),
          config.maxDelay,
        );

        await this.delay(delay);
      }
    }

    // This should never be reached, but just in case
    throw this.enrichError(lastError!, context, config.maxAttempts);
  }

  /**
   * Create a standardized processing error
   */
  createProcessingError(
    message: string,
    code: string,
    context: ErrorContext,
    retryable: boolean = false,
    severity: "low" | "medium" | "high" | "critical" = "medium",
  ): ProcessingError {
    const error = new Error(message) as ProcessingError;
    error.code = code;
    error.context = context;
    error.timestamp = Date.now();
    error.retryable = retryable;
    error.severity = severity;
    return error;
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: Error, config: RetryConfig): boolean {
    if (error instanceof Error && "retryable" in error) {
      return (error as ProcessingError).retryable;
    }

    return (
      config.retryableErrors?.some(
        (errorType) =>
          error.message.includes(errorType) || error.name.includes(errorType),
      ) ?? false
    );
  }

  /**
   * Enrich an error with context information
   */
  private enrichError(
    error: Error,
    context: ErrorContext,
    attempts: number,
  ): Error {
    const enrichedError = new Error(
      `${error.message} (Operation: ${context.operation}, Component: ${context.component}, Attempts: ${attempts})`,
    );
    enrichedError.stack = `${enrichedError.stack}\nContext: ${JSON.stringify(context, null, 2)}`;
    return enrichedError;
  }

  /**
   * Record an error occurrence
   */
  private recordError(context: ErrorContext, error: Error): void {
    const key = this.getErrorKey(context);
    const count = this.errorCounts.get(key) || 0;
    this.errorCounts.set(key, count + 1);
  }

  /**
   * Get error count for a context
   */
  getErrorCount(context: ErrorContext): number {
    return this.errorCounts.get(this.getErrorKey(context)) || 0;
  }

  /**
   * Update circuit breaker state
   */
  private updateCircuitBreaker(component: string, failed: boolean): void {
    const breaker = this.circuitBreakers.get(component) || {
      failures: 0,
      lastFailure: 0,
      state: "closed" as const,
    };

    if (failed) {
      breaker.failures++;
      breaker.lastFailure = Date.now();
      breaker.state = breaker.failures >= 5 ? "open" : "closed";

      // Schedule automatic reset when circuit opens
      if (breaker.state === "open") {
        this.scheduleCircuitBreakerReset(component);
      }
    } else {
      breaker.failures = Math.max(0, breaker.failures - 1);
      breaker.state = breaker.failures === 0 ? "closed" : "half-open";

      // Clear any pending reset timeout on success
      if (breaker.resetTimeout) {
        clearTimeout(breaker.resetTimeout);
        breaker.resetTimeout = undefined;
      }
    }

    this.circuitBreakers.set(component, breaker);
  }

  /**
   * Schedule automatic circuit breaker reset
   */
  private scheduleCircuitBreakerReset(component: string): void {
    const breaker = this.circuitBreakers.get(component);
    if (!breaker) return;

    const resetTimeout = 60000; // 1 minute

    // Clear any existing reset timeout before scheduling a new one
    if (breaker.resetTimeout) {
      clearTimeout(breaker.resetTimeout);
    }

    breaker.resetTimeout = setTimeout(() => {
      const currentBreaker = this.circuitBreakers.get(component);
      if (currentBreaker && currentBreaker.state === "open") {
        currentBreaker.state = "half-open";
        currentBreaker.failures = 0; // Reset failure count for half-open
        currentBreaker.resetTimeout = undefined;
        this.circuitBreakers.set(component, currentBreaker);
        console.log(
          `🔄 Circuit breaker for ${component} automatically reset to half-open`,
        );
      }
    }, resetTimeout);

    this.circuitBreakers.set(component, breaker);
  }

  /**
   * Check if circuit breaker is open
   */
  private isCircuitOpen(component: string): boolean {
    const breaker = this.circuitBreakers.get(component);
    if (!breaker) return false;

    if (breaker.state === "open") {
      // Check if we should transition to half-open
      const timeSinceLastFailure = Date.now() - breaker.lastFailure;
      if (timeSinceLastFailure > 60000) {
        // 1 minute
        breaker.state = "half-open";
        this.circuitBreakers.set(component, breaker);
        return false;
      }
      return true;
    }

    return false;
  }

  /**
   * Get circuit breaker status
   */
  getCircuitBreakerStatus(): Array<{
    component: string;
    state: "closed" | "open" | "half-open";
    failures: number;
    lastFailure: number;
  }> {
    return Array.from(this.circuitBreakers.entries()).map(
      ([component, breaker]) => ({
        component,
        ...breaker,
      }),
    );
  }

  /**
   * Reset circuit breaker for a component
   */
  resetCircuitBreaker(component: string): void {
    const breaker = this.circuitBreakers.get(component);
    if (breaker && breaker.resetTimeout) {
      clearTimeout(breaker.resetTimeout);
    }
    this.circuitBreakers.delete(component);
  }

  /**
   * Reset all circuit breakers
   */
  resetAllCircuitBreakers(): void {
    // Clear all pending timeouts before clearing breakers
    for (const [component, breaker] of this.circuitBreakers) {
      if (breaker.resetTimeout) {
        clearTimeout(breaker.resetTimeout);
      }
    }
    this.circuitBreakers.clear();
  }

  private getErrorKey(context: ErrorContext): string {
    return `${context.component}:${context.operation}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Default error handler instance
export const defaultErrorHandler = new ErrorHandler();

// Utility functions for common error patterns
export const ErrorPatterns = {
  isNetworkError: (error: Error): boolean => {
    return (
      error.message.includes("ECONNRESET") ||
      error.message.includes("ENOTFOUND") ||
      error.message.includes("ETIMEDOUT") ||
      error.message.includes("network")
    );
  },

  isTimeoutError: (error: Error): boolean => {
    return (
      error.message.includes("timeout") || error.message.includes("ETIMEDOUT")
    );
  },

  isTemporaryError: (error: Error): boolean => {
    return (
      error.message.includes("503") ||
      error.message.includes("502") ||
      error.message.includes("500") ||
      error.message.includes("temporary")
    );
  },

  getErrorSeverity: (error: Error): "low" | "medium" | "high" | "critical" => {
    if (
      ErrorPatterns.isNetworkError(error) ||
      ErrorPatterns.isTimeoutError(error)
    ) {
      return "medium";
    }
    if (ErrorPatterns.isTemporaryError(error)) {
      return "high";
    }
    return "low";
  },
};
