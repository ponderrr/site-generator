import { writeFile, readFile } from "fs/promises";
import { URLQueue } from "../queue/URLQueue.js";

export interface CrawlStateData {
  baseUrl: string;
  startedAt: string;
  lastSavedAt: string;
  queue: any;
}

export class CrawlState {
  constructor(
    private baseUrl: string,
    private queue: URLQueue,
  ) {}

  async save(filepath: string): Promise<void> {
    const data: CrawlStateData = {
      baseUrl: this.baseUrl,
      startedAt: new Date().toISOString(),
      lastSavedAt: new Date().toISOString(),
      queue: this.queue.toJSON(),
    };

    await writeFile(filepath, JSON.stringify(data, null, 2), "utf-8");
  }

  static async load(
    filepath: string,
  ): Promise<{ baseUrl: string; queue: URLQueue }> {
    const content = await readFile(filepath, "utf-8");
    const data: CrawlStateData = JSON.parse(content);

    const queue = new URLQueue();
    queue.fromJSON(data.queue);

    return {
      baseUrl: data.baseUrl,
      queue,
    };
  }
}
