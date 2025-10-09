import { BrowserManager } from "../browser/BrowserManager.js";
import type { Page, BrowserContext } from "playwright";

export interface RenderResult {
  html: string;
  url: string;
  title: string;
  errors: string[];
  warnings: string[];
  requestCount: number;
  failedRequests: number;
}

export class PlaywrightRenderer {
  private browserManager: BrowserManager;

  constructor(browserManager: BrowserManager) {
    this.browserManager = browserManager;
  }

  async render(url: string): Promise<RenderResult> {
    const browser = await this.browserManager.getBrowser();
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: "Mozilla/5.0 (site-generator-bot/1.0)",
    });

    let page: Page | null = null;
    const errors: string[] = [];
    const warnings: string[] = [];
    let requestCount = 0;
    let failedRequestCount = 0;

    try {
      page = await context.newPage();

      // Track page errors
      page.on("pageerror", (error) => {
        errors.push(`Page error: ${error.message}`);
      });

      page.on("console", (msg) => {
        if (msg.type() === "error") {
          errors.push(`Console error: ${msg.text()}`);
        } else if (msg.type() === "warning") {
          warnings.push(`Console warning: ${msg.text()}`);
        }
      });

      // Track requests
      page.on("request", () => {
        requestCount++;
      });

      page.on("requestfailed", () => {
        failedRequestCount++;
      });

      // Navigate and wait for network idle
      await page.goto(url, {
        waitUntil: "networkidle",
        timeout: 30000,
      });

      // Wait a bit more for any lazy-loaded content
      await page.waitForTimeout(2000);

      // Get page info
      const html = await page.content();
      const title = await page.title();

      return {
        html,
        url: page.url(),
        title,
        errors,
        warnings,
        requestCount,
        failedRequests: failedRequestCount,
      };
    } finally {
      if (page) await page.close();
      await context.close();
    }
  }

  async close(): Promise<void> {
    await this.browserManager.close();
  }
}
