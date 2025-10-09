import { Command } from "commander";
import { AnalysisOrchestrator } from "@site-generator/analyzer";
import {
  readExtractedFiles,
  directoryExists,
  writeAnalysisResults,
  writeSummary,
  ProgressDisplay,
  formatSuccess,
  formatError,
  formatWarning,
} from "../utils/index.js";

interface AnalyzeCommandOptions {
  input: string;
  output: string;
  metrics: boolean;
  classification: boolean;
  sections: boolean;
  all: boolean;
  verbose: boolean;
}

export function createAnalyzeCommand(): Command {
  const command = new Command("analyze");

  command
    .description("Analyze extracted content")
    .requiredOption(
      "--input <dir>",
      "Input directory containing extracted content",
    )
    .option(
      "--output <dir>",
      "Output directory for analysis results",
      "./analysis",
    )
    .option(
      "--metrics",
      "Run metrics analysis (quality, readability, SEO)",
      false,
    )
    .option("--classification", "Run page type classification", false)
    .option("--sections", "Run section detection analysis", false)
    .option("--all", "Run all analysis types", false)
    .option("--verbose", "Show detailed logs", false)
    .action(async (options: AnalyzeCommandOptions) => {
      await handleAnalyze(options);
    });

  return command;
}

async function handleAnalyze(options: AnalyzeCommandOptions): Promise<void> {
  const progress = new ProgressDisplay();
  let orchestrator: AnalysisOrchestrator | null = null;

  try {
    // Determine which analyses to run
    const runAll =
      options.all ||
      (!options.metrics && !options.classification && !options.sections);
    const analysisTypes = {
      metrics: runAll || options.metrics,
      classification: runAll || options.classification,
      sections: runAll || options.sections,
    };

    // Display start info
    console.log("\n┌─ Analysis Started " + "─".repeat(30) + "┐");
    console.log(`│ Input: ${options.input.padEnd(45)}│`);
    console.log(`│ Output: ${options.output.padEnd(44)}│`);
    const analysisTypesStr = Object.keys(analysisTypes)
      .filter((k) => analysisTypes[k as keyof typeof analysisTypes])
      .join(", ");
    console.log(`│ Analysis: ${analysisTypesStr.padEnd(40)}│`);
    console.log("└" + "─".repeat(52) + "┘\n");

    // Validate input directory
    if (!(await directoryExists(options.input))) {
      console.error(formatError("Input directory does not exist"));
      console.log(
        formatWarning('Tip: Run "pnpm extract" first to create content'),
      );
      process.exit(1);
    }

    // Read extracted files
    progress.start("Reading extracted files...");
    const files = await readExtractedFiles(options.input);

    if (files.length === 0) {
      progress.fail("No content files found");
      console.log(
        formatWarning("Input directory contains no .md or .json files"),
      );
      process.exit(1);
    }

    progress.succeed(
      `Found ${files.length} file${files.length > 1 ? "s" : ""} to analyze`,
    );

    // Initialize orchestrator
    orchestrator = new AnalysisOrchestrator();

    // Analyze each file
    const allResults: any[] = [];
    const startTime = Date.now();

    for (const file of files) {
      const fileStartTime = Date.now();
      progress.start(`Analyzing ${file.filename}...`);

      // Parse content based on format
      let contentToAnalyze = file.content;
      let extractedTitle = file.filename;
      let extractedUrl = file.path;

      if (file.format === "json") {
        try {
          const parsed = JSON.parse(file.content);
          // Handle different JSON structures
          if (parsed.content) {
            contentToAnalyze =
              parsed.content.markdown ||
              parsed.content.html ||
              parsed.content.text ||
              "";
            extractedTitle =
              parsed.content.metadata?.title ||
              parsed.content.title ||
              file.filename;
            extractedUrl = parsed.content.url || file.path;
          } else {
            contentToAnalyze =
              parsed.markdown ||
              parsed.html ||
              parsed.text ||
              JSON.stringify(parsed);
          }
        } catch {
          console.log(
            formatWarning(
              `Could not parse JSON in ${file.filename}, using raw content`,
            ),
          );
        }
      }

      // Run analysis
      try {
        const analysisResults = await orchestrator.analyzeContent([
          {
            url: extractedUrl,
            title: extractedTitle,
            markdown: contentToAnalyze || "",
            frontmatter: {},
            metadata: {
              format: file.format,
              timestamp: file.timestamp,
            },
          },
        ]);

        const analysisResult = analysisResults[0];

        if (!analysisResult) {
          progress.fail(`Analysis returned no results for ${file.filename}`);
          continue;
        }

        const fileDuration = ((Date.now() - fileStartTime) / 1000).toFixed(1);
        progress.succeed(`Analysis complete (${fileDuration}s)`);

        // Write results
        if (options.verbose) {
          progress.start("Writing analysis files...");
        }

        const writtenFiles = await writeAnalysisResults({
          outputDir: options.output,
          domain: file.domain,
          timestamp: file.timestamp,
          results: {
            full: analysisResult,
            metrics: analysisTypes.metrics
              ? (analysisResult as any).contentMetrics || analysisResult.metrics
              : undefined,
            classification: analysisTypes.classification
              ? (analysisResult as any).classification || {
                  pageType: (analysisResult as any).pageType,
                  confidence: (analysisResult as any).confidence,
                }
              : undefined,
            sections: analysisTypes.sections
              ? analysisResult.sections
              : undefined,
          },
        });

        if (options.verbose) {
          progress.succeed(`Wrote ${writtenFiles.length} file(s)`);
        }

        allResults.push({
          filename: file.filename,
          domain: file.domain,
          result: analysisResult,
        });
      } catch (analyzeError) {
        progress.fail(`Analysis failed for ${file.filename}`);
        if (options.verbose) {
          console.error(analyzeError);
        }
        continue;
      }
    }

    // Generate summary
    progress.start("Generating summary report...");
    const summary = generateSummary(allResults);
    const summaryPath = await writeSummary(options.output, summary);
    progress.succeed("Summary generated");

    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);

    // Display completion summary
    console.log("\n┌─ Analysis Complete " + "─".repeat(30) + "┐");
    console.log(`│ Files Analyzed: ${files.length}`.padEnd(51) + "│");
    console.log(
      `│ Average Quality: ${summary.averageQuality.toFixed(1)}`.padEnd(51) +
        "│",
    );
    console.log(
      `│ Average Readability: ${summary.averageReadability.toFixed(1)}`.padEnd(
        51,
      ) + "│",
    );
    console.log(
      `│ Total Words: ${summary.totalWords.toLocaleString()}`.padEnd(51) + "│",
    );
    console.log(`│ Duration: ${totalDuration}s`.padEnd(51) + "│");
    console.log("└" + "─".repeat(52) + "┘\n");

    // Show output location
    console.log(formatSuccess(`Analysis saved to: ${options.output}`));
    console.log(formatSuccess(`Summary: ${summaryPath}\n`));
  } catch (error) {
    progress.fail("Analysis failed");
    console.error(
      "\n" +
        formatError(error instanceof Error ? error.message : String(error)),
    );
    if (options.verbose && error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    if (orchestrator) {
      try {
        await orchestrator.destroy();
      } catch (cleanupError) {
        // Ignore cleanup errors
        if (options.verbose) {
          console.warn("Cleanup warning:", cleanupError);
        }
      }
    }
  }
}

function generateSummary(results: any[]): any {
  const summary = {
    totalFiles: results.length,
    averageQuality: 0,
    averageReadability: 0,
    pageTypes: {} as Record<string, number>,
    totalWords: 0,
    analyzedAt: new Date().toISOString(),
    files: [] as any[],
  };

  let qualitySum = 0;
  let readabilitySum = 0;
  let qualityCount = 0;
  let readabilityCount = 0;

  for (const item of results) {
    const { result } = item;

    // Try to get metrics from different possible structures
    const metrics = result.metrics || result.contentMetrics;
    const classification = result.classification || {
      pageType: result.pageType,
      confidence: result.confidence,
    };

    // Aggregate metrics
    if (metrics) {
      if (metrics.quality !== undefined) {
        qualitySum += metrics.quality;
        qualityCount++;
      }
      if (metrics.readability !== undefined) {
        readabilitySum += metrics.readability;
        readabilityCount++;
      }
      if (metrics.wordCount) {
        summary.totalWords += metrics.wordCount;
      }
    }

    // Aggregate page types
    if (classification?.pageType) {
      const type = classification.pageType;
      summary.pageTypes[type] = (summary.pageTypes[type] || 0) + 1;
    }

    // Add file info to summary
    summary.files.push({
      filename: item.filename,
      domain: item.domain,
      quality: metrics?.quality || 0,
      pageType: classification?.pageType || "unknown",
      wordCount: metrics?.wordCount || 0,
    });
  }

  summary.averageQuality = qualityCount > 0 ? qualitySum / qualityCount : 0;
  summary.averageReadability =
    readabilityCount > 0 ? readabilitySum / readabilityCount : 0;

  return summary;
}
