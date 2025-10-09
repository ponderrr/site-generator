import { LogEntry } from "../types/index.js";
import { EventEmitter } from "events";

export class Logger extends EventEmitter {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private maxLogs: number = 10000;
  private enabled: boolean = true;

  private constructor() {
    super();
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  debug(message: string, metadata?: Record<string, any>): void {
    this.log("debug", message, metadata);
  }

  info(message: string, metadata?: Record<string, any>): void {
    this.log("info", message, metadata);
  }

  warn(message: string, metadata?: Record<string, any>): void {
    this.log("warn", message, metadata);
  }

  error(message: string, error?: Error, metadata?: Record<string, any>): void {
    this.log("error", message, metadata, error);
  }

  private log(
    level: LogEntry["level"],
    message: string,
    metadata?: Record<string, any>,
    error?: Error,
  ): void {
    if (!this.enabled) return;

    const logEntry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      metadata,
      error,
    };

    this.logs.push(logEntry);

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Emit log event
    this.emit("log", logEntry);

    // Also emit specific level events
    this.emit(level, logEntry);

    // Console output for certain levels
    if (level === "error") {
      console.error(message, error, metadata);
    } else if (level === "warn") {
      console.warn(message, metadata);
    } else if (level === "info") {
      console.info(message, metadata);
    } else if (level === "debug") {
      console.debug(message, metadata);
    }
  }

  getLogs(
    level?: LogEntry["level"],
    filter?: { component?: string },
    limit?: number,
  ): LogEntry[] {
    let filteredLogs = level
      ? this.logs.filter((log) => log.level === level)
      : this.logs;

    if (filter?.component) {
      filteredLogs = filteredLogs.filter(
        (log) => log.metadata?.component === filter.component,
      );
    }

    return limit ? filteredLogs.slice(-limit) : filteredLogs;
  }

  clearLogs(): void {
    this.logs = [];
  }

  setMaxLogs(max: number): void {
    this.maxLogs = max;
    if (this.logs.length > max) {
      this.logs = this.logs.slice(-max);
    }
  }

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }

  getStats(): {
    total: number;
    debug: number;
    info: number;
    warn: number;
    error: number;
  } {
    const stats = {
      total: this.logs.length,
      debug: 0,
      info: 0,
      warn: 0,
      error: 0,
    };

    this.logs.forEach((log) => {
      stats[log.level]++;
    });

    return stats;
  }
}

export const logger = Logger.getInstance();
