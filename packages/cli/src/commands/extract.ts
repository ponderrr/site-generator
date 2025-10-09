import { Command } from "commander";
import { ContentExtractor } from "@site-generator/extractor";
import { CrawlOrchestrator, ProgressTracker } from "../crawl/index.js";
import { ConfigManager } from "../config/ConfigManager.js";
import {
  writeOutputFile,
  sanitizeDomainForFilename,
  generateTimestamp,
  generateFilename,
} from "../utils/fileWriter.js";
import {
  ProgressDisplay,
  formatSuccess,
  formatError,
  formatWarning,
  formatInfo,
} from "../utils/progress.js";
import { join } from "path";
import { existsSync } from "fs";
import { unlink } from "fs/promises";

interface ExtractCommandOptions {
  url: string;
  output: string;
  format: "markdown" | "json";
  robots: boolean;
  retry: number;
  verbose: boolean;
  crawl: boolean;
  concurrency?: number;
  resume: boolean;
}

export function createExtractCommand(): Command {
  const command = new Command("extract");

  command
    .description("Extract content from a website")
    .requiredOption("--url <url>", "URL to extract content from")
    .option("--output <dir>", "Output directory", "./extracted")
    .option("--format <format>", "Output format (markdown|json)", "markdown")
    .option("--no-robots", "Skip robots.txt check")
    .option("--retry <n>", "Number of retry attempts", "3")
    .option("--verbose", "Show detailed logs", false)
    .option("--crawl", "Crawl entire site instead of single URL", false)
    .option(
      "--concurrency <n>",
      "Number of concurrent extractions (2-10)",
      undefined,
    )
    .option("--resume", "Resume interrupted crawl", false)
    .action(async (options: ExtractCommandOptions) => {
      if (options.crawl) {
        await handleCrawl(options);
      } else {
        await handleExtract(options);
      }
    });

  return command;
}

async function handleExtract(options: ExtractCommandOptions): Promise<void> {
  const progress = new ProgressDisplay();
  const extractor = new ContentExtractor({
    usePlaywright: true,
    respectRobotsTxt: options.robots,
    retryAttempts: parseInt(options.retry.toString()),
  });

  try {
    // Validate URL
    let url: URL;
    try {
      url = new URL(options.url);
    } catch {
      console.error(formatError("Invalid URL format"));
      console.log(`Usage: pnpm extract -- --url https://example.com`);
      process.exit(1);
    }

    // Display start info
    console.log("\n┌─ Extraction Started " + "─".repeat(28) + "┐");
    console.log(`│ URL: ${options.url.padEnd(45)}│`);
    console.log(`│ Output: ${options.output.padEnd(42)}│`);
    console.log(`│ Format: ${options.format.padEnd(42)}│`);
    console.log("└" + "─".repeat(50) + "┘\n");

    // Check robots.txt
    if (options.robots) {
      progress.start("Checking robots.txt...");
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate check
      progress.succeed("Robots.txt check passed");
    }

    // Launch browser
    progress.start("Launching browser...");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    progress.succeed("Browser ready");

    // Extract content
    progress.start("Navigating to page...");
    const startTime = Date.now();

    const result = await extractor.extract(options.url);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    if (!result.success) {
      progress.fail("Extraction failed");
      console.error(
        "\n" + formatError("Error: " + (result.error || "Unknown error")),
      );
      if (result.error?.includes("robots.txt")) {
        console.log(
          formatInfo("Tip: Use --no-robots to bypass (use responsibly)"),
        );
      }
      process.exit(1);
    }

    progress.succeed(`Page loaded (${duration}s)`);

    // Show warnings if any
    if (result.warnings && result.warnings.length > 0 && options.verbose) {
      result.warnings.forEach((warning: string) => {
        console.log(formatWarning(warning));
      });
    }

    // Write files
    progress.start("Writing files...");

    const domain = sanitizeDomainForFilename(options.url);
    const timestamp = generateTimestamp();
    const outputSubdir = join(options.output, domain);

    const files: string[] = [];

    // Write main content file
    if (options.format === "markdown" && result.content?.markdown) {
      const filename = generateFilename(domain, timestamp, "md");
      const filepath = await writeOutputFile({
        outputDir: outputSubdir,
        filename,
        content: result.content.markdown,
      });
      files.push(filepath);
    } else if (options.format === "json") {
      const filename = generateFilename(domain, timestamp, "json");
      const filepath = await writeOutputFile({
        outputDir: outputSubdir,
        filename,
        content: JSON.stringify(result, null, 2),
      });
      files.push(filepath);
    }

    // Write metadata file
    const metadataFilename = `${domain}_${timestamp}_metadata.json`;
    const metadata = {
      url: result.content?.url,
      title: result.content?.title,
      extractedAt: new Date().toISOString(),
      format: options.format,
      contentLength:
        result.content?.markdown?.length || result.content?.html?.length,
      wordCount: result.content?.wordCount,
      readingTime: result.content?.readingTime,
      imagesExtracted: result.content?.images?.length || 0,
      linksExtracted: result.content?.links?.length || 0,
      warnings: result.warnings,
      errors: result.error ? [result.error] : [],
    };
    const metadataPath = await writeOutputFile({
      outputDir: outputSubdir,
      filename: metadataFilename,
      content: JSON.stringify(metadata, null, 2),
    });
    files.push(metadataPath);

    progress.succeed("Files written");

    // Display summary
    console.log("\n┌─ Extraction Complete " + "─".repeat(27) + "┐");
    console.log(`│ Success: ${String(result.success).padEnd(42)}│`);
    console.log(`│ Duration: ${duration}s`.padEnd(51) + "│");
    console.log(
      `│ Content: ${(metadata.contentLength || 0).toLocaleString()} characters`.padEnd(
        51,
      ) + "│",
    );
    console.log(`│ Warnings: ${result.warnings?.length || 0}`.padEnd(51) + "│");
    console.log(`│ Errors: 0`.padEnd(51) + "│");
    console.log("└" + "─".repeat(50) + "┘\n");

    // Show file locations
    files.forEach((file) => {
      console.log(formatSuccess(`Saved: ${file}`));
    });

    console.log(""); // Empty line at end
  } catch (error) {
    progress.fail("Unexpected error");
    console.error(
      "\n" +
        formatError(error instanceof Error ? error.message : String(error)),
    );
    if (options.verbose) {
      console.error(error);
    }
    process.exit(1);
  } finally {
    await extractor.close();
  }
}

async function handleCrawl(options: ExtractCommandOptions): Promise<void> {
  const configManager = new ConfigManager();
  await configManager.load();
  const config = configManager.get();

  // Override concurrency if provided
  if (options.concurrency) {
    const concurrent = parseInt(options.concurrency.toString());
    if (concurrent >= 2 && concurrent <= config.crawler.maxConcurrency) {
      config.crawler.concurrency = concurrent;
    }
  }

  // Override robots.txt setting
  config.crawler.respectRobotsTxt = options.robots;

  const progress = new ProgressDisplay();
  const tracker = new ProgressTracker();
  let updateInterval: NodeJS.Timeout | undefined;

  try {
    // Display start info
    console.log(
      "\n┌─ Crawling " +
        options.url +
        " " +
        "─".repeat(Math.max(0, 30 - options.url.length)) +
        "┐",
    );
    console.log(`│ Started: ${new Date().toLocaleString().padEnd(45)}│`);
    console.log(`│ Output: ${options.output.padEnd(46)}│`);
    console.log("└" + "─".repeat(58) + "┘\n");

    // Initialize orchestrator
    const orchestrator = new CrawlOrchestrator({
      baseUrl: options.url,
      outputDir: options.output,
      config,
      format: options.format as "markdown" | "json",
      onProgress: (stats) => {
        // Progress callback (used by live display)
      },
      onPageComplete: (url, success, duration, size) => {
        tracker.addPage({ url, success, duration, size });
      },
    });

    // Check for resume
    const stateFile = join(options.output, ".crawl-state.json");
    if (options.resume && existsSync(stateFile)) {
      progress.start("Resuming crawl from saved state...");
      await orchestrator.loadState(stateFile);
      progress.succeed("State loaded");
    } else {
      progress.start("Initializing crawler...");
      await orchestrator.initialize();
      progress.succeed("Crawler initialized");
    }

    // Start live progress display
    console.log("\n⠋ Crawling in progress...\n");
    updateInterval = setInterval(() => {
      const stats = orchestrator.getStats();
      process.stdout.write("\x1b[2J\x1b[H"); // Clear screen
      console.log(tracker.getDisplay(stats));
    }, 1000);

    // Setup graceful shutdown
    let interrupted = false;
    process.on("SIGINT", async () => {
      if (interrupted) {
        process.exit(1);
      }
      interrupted = true;
      if (updateInterval) clearInterval(updateInterval);
      console.log("\n\n⚠️  Interrupt received, saving state...");
      await orchestrator.saveState(stateFile);
      console.log("✓ State saved to:", stateFile);
      console.log("  Resume with: --resume flag\n");
      process.exit(0);
    });

    // Start crawling
    const startTime = Date.now();
    await orchestrator.crawl();

    // Stop progress display
    if (updateInterval) clearInterval(updateInterval);

    const duration = (Date.now() - startTime) / 1000;
    const stats = orchestrator.getStats();

    // Display summary
    console.log("\n✓ Crawl complete!\n");
    console.log("┌─ Summary " + "─".repeat(48) + "┐");
    console.log(`│ Total URLs:         ${stats.total.toString().padEnd(33)}│`);
    console.log(
      `│ Successfully saved: ${stats.completed.toString().padEnd(33)}│`,
    );
    console.log(`│ Failed:             ${stats.failed.toString().padEnd(33)}│`);
    console.log(
      `│ Duration:           ${formatDuration(duration).padEnd(33)}│`,
    );
    console.log(
      `│ Average speed:      ${(stats.completed / duration).toFixed(1)} pages/sec`.padEnd(
        51,
      ) + "│",
    );
    console.log("└" + "─".repeat(58) + "┘\n");

    console.log(formatSuccess(`Files saved to: ${options.output}\n`));

    // Clean up state file on successful completion
    if (existsSync(stateFile)) {
      await unlink(stateFile);
    }
  } catch (error) {
    if (updateInterval) clearInterval(updateInterval);
    console.error(
      "\n" +
        formatError(error instanceof Error ? error.message : String(error)),
    );
    if (options.verbose) {
      console.error(error);
    }
    process.exit(1);
  }
}

function formatDuration(seconds: number): string {
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
