import { readFile, writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";
import { existsSync } from "fs";
import { homedir } from "os";

export interface SiteGeneratorConfig {
  crawler: {
    concurrency: number;
    maxConcurrency: number;
    delayMs: number;
    maxPages: number;
    respectRobotsTxt: boolean;
    userAgent: string;
  };
  extractor: {
    timeout: number;
    retryAttempts: number;
    format: "markdown" | "json";
  };
}

const DEFAULT_CONFIG: SiteGeneratorConfig = {
  crawler: {
    concurrency: 5,
    maxConcurrency: 10,
    delayMs: 1000,
    maxPages: 1000,
    respectRobotsTxt: true,
    userAgent: "site-generator-bot/1.0",
  },
  extractor: {
    timeout: 30000,
    retryAttempts: 3,
    format: "markdown",
  },
};

export class ConfigManager {
  private configPath: string;
  private config: SiteGeneratorConfig;

  constructor() {
    this.configPath = join(homedir(), ".site-generator", "config.json");
    this.config = DEFAULT_CONFIG;
  }

  async load(): Promise<SiteGeneratorConfig> {
    try {
      if (existsSync(this.configPath)) {
        const content = await readFile(this.configPath, "utf-8");
        const loaded = JSON.parse(content);
        this.config = {
          ...DEFAULT_CONFIG,
          ...loaded,
          crawler: { ...DEFAULT_CONFIG.crawler, ...(loaded.crawler || {}) },
          extractor: {
            ...DEFAULT_CONFIG.extractor,
            ...(loaded.extractor || {}),
          },
        };
      }
    } catch {
      // Use defaults if can't load
    }
    return this.config;
  }

  async save(config: Partial<SiteGeneratorConfig>): Promise<void> {
    this.config = {
      ...this.config,
      ...config,
      crawler: { ...this.config.crawler, ...(config.crawler || {}) },
      extractor: { ...this.config.extractor, ...(config.extractor || {}) },
    };

    const dir = dirname(this.configPath);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    await writeFile(
      this.configPath,
      JSON.stringify(this.config, null, 2),
      "utf-8",
    );
  }

  get(): SiteGeneratorConfig {
    return this.config;
  }

  set(config: Partial<SiteGeneratorConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      crawler: { ...this.config.crawler, ...(config.crawler || {}) },
      extractor: { ...this.config.extractor, ...(config.extractor || {}) },
    };
  }

  getConfigPath(): string {
    return this.configPath;
  }
}
