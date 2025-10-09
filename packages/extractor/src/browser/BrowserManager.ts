import { Browser, chromium } from "playwright";

export class BrowserManager {
  private browser: Browser | null = null;
  private readonly config: {
    headless: boolean;
    timeout: number;
  };

  constructor(config = { headless: true, timeout: 30000 }) {
    this.config = config;
  }

  async getBrowser(): Promise<Browser> {
    if (!this.browser || !this.browser.isConnected()) {
      this.browser = await chromium.launch({
        headless: this.config.headless,
        timeout: this.config.timeout,
      });
    }
    return this.browser;
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  isRunning(): boolean {
    return this.browser !== null && this.browser.isConnected();
  }
}
