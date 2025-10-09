export interface CrawlStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
}

export class URLQueue {
  private pending: Set<string> = new Set();
  private processing: Set<string> = new Set();
  private completed: Set<string> = new Set();
  private failed: Set<string> = new Set();

  add(url: string): boolean {
    // Only add if we haven't seen it before
    if (
      this.pending.has(url) ||
      this.processing.has(url) ||
      this.completed.has(url) ||
      this.failed.has(url)
    ) {
      return false;
    }

    this.pending.add(url);
    return true;
  }

  addBatch(urls: string[]): number {
    let added = 0;
    for (const url of urls) {
      if (this.add(url)) {
        added++;
      }
    }
    return added;
  }

  getNext(): string | null {
    const iterator = this.pending.values();
    const result = iterator.next();

    if (result.done) {
      return null;
    }

    const url = result.value;
    this.pending.delete(url);
    this.processing.add(url);
    return url;
  }

  markCompleted(url: string): void {
    this.processing.delete(url);
    this.completed.add(url);
  }

  markFailed(url: string): void {
    this.processing.delete(url);
    this.failed.add(url);
  }

  isEmpty(): boolean {
    return this.pending.size === 0 && this.processing.size === 0;
  }

  getStats(): CrawlStats {
    return {
      pending: this.pending.size,
      processing: this.processing.size,
      completed: this.completed.size,
      failed: this.failed.size,
      total:
        this.pending.size +
        this.processing.size +
        this.completed.size +
        this.failed.size,
    };
  }

  toJSON() {
    return {
      pending: Array.from(this.pending),
      processing: Array.from(this.processing),
      completed: Array.from(this.completed),
      failed: Array.from(this.failed),
    };
  }

  fromJSON(data: any): void {
    this.pending = new Set(data.pending || []);
    this.processing = new Set(data.processing || []);
    this.completed = new Set(data.completed || []);
    this.failed = new Set(data.failed || []);

    // Move processing back to pending (interrupted crawl)
    for (const url of this.processing) {
      this.pending.add(url);
    }
    this.processing.clear();
  }
}
