import type { CrawlStats } from "@site-generator/crawler";

export interface PageResult {
  url: string;
  success: boolean;
  duration: number;
  size?: number;
}

export class ProgressTracker {
  private startTime: number;
  private recentPages: PageResult[] = [];
  private maxRecent = 5;

  constructor() {
    this.startTime = Date.now();
  }

  addPage(result: PageResult): void {
    this.recentPages.unshift(result);
    if (this.recentPages.length > this.maxRecent) {
      this.recentPages.pop();
    }
  }

  getDisplay(stats: CrawlStats): string {
    const elapsed = (Date.now() - this.startTime) / 1000;
    const rate = stats.completed > 0 ? stats.completed / elapsed : 0;
    const remaining = stats.pending + stats.processing;
    const eta = rate > 0 ? remaining / rate : 0;

    const percentage =
      stats.total > 0 ? Math.floor((stats.completed / stats.total) * 100) : 0;
    const barLength = 20;
    const filled = Math.floor((percentage / 100) * barLength);
    const bar = "█".repeat(filled) + "░".repeat(barLength - filled);

    let display = `\nProgress: [${bar}] ${stats.completed}/${stats.total} (${percentage}%)\n\n`;

    display += "┌─ Status " + "─".repeat(50) + "┐\n";
    display += `│ Pending:     ${stats.pending.toString().padEnd(45)}│\n`;
    display += `│ Extracting:  ${stats.processing.toString().padEnd(45)}│\n`;
    display += `│ Completed:   ${stats.completed.toString().padEnd(45)}│\n`;
    display += `│ Failed:      ${stats.failed.toString().padEnd(45)}│\n`;
    display += `│ Discovered:  ${stats.total.toString().padEnd(45)}│\n`;
    display += "└" + "─".repeat(58) + "┘\n\n";

    display += `Rate: ${rate.toFixed(1)} pages/sec  |  `;
    display += `Elapsed: ${this.formatDuration(elapsed)}  |  `;
    display += `Est. remaining: ${this.formatDuration(eta)}\n\n`;

    if (this.recentPages.length > 0) {
      display += "Latest:\n";
      for (const page of this.recentPages) {
        const icon = page.success ? "✓" : "✗";
        const path = new URL(page.url).pathname || "/";
        const truncatedPath =
          path.length > 30 ? path.substring(0, 27) + "..." : path;
        const duration = `(${(page.duration / 1000).toFixed(1)}s`;
        const size = page.size ? `, ${(page.size / 1024).toFixed(1)} KB)` : ")";
        display += `  ${icon} ${truncatedPath.padEnd(30)} ${duration}${size}\n`;
      }
    }

    return display;
  }

  private formatDuration(seconds: number): string {
    if (!isFinite(seconds) || seconds < 0) {
      return "0s";
    }

    if (seconds < 60) {
      return `${Math.floor(seconds)}s`;
    } else if (seconds < 3600) {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}m ${secs}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${mins}m`;
    }
  }

  getElapsed(): number {
    return Date.now() - this.startTime;
  }
}
