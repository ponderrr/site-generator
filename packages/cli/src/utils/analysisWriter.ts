import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export interface AnalysisWriteOptions {
  outputDir: string;
  domain: string;
  timestamp: string;
  results: {
    full?: any;
    metrics?: any;
    classification?: any;
    sections?: any;
  };
}

export async function writeAnalysisResults(
  options: AnalysisWriteOptions,
): Promise<string[]> {
  const { outputDir, domain, timestamp, results } = options;
  const domainDir = join(outputDir, domain);

  // Ensure output directory exists
  await mkdir(domainDir, { recursive: true });

  const writtenFiles: string[] = [];

  // Write full analysis
  if (results.full) {
    const filename = `${domain}_${timestamp}_analysis.json`;
    const filepath = join(domainDir, filename);
    await writeFile(filepath, JSON.stringify(results.full, null, 2), "utf-8");
    writtenFiles.push(filepath);
  }

  // Write individual analysis components
  if (results.metrics) {
    const filename = `${domain}_${timestamp}_metrics.json`;
    const filepath = join(domainDir, filename);
    await writeFile(
      filepath,
      JSON.stringify(results.metrics, null, 2),
      "utf-8",
    );
    writtenFiles.push(filepath);
  }

  if (results.classification) {
    const filename = `${domain}_${timestamp}_classification.json`;
    const filepath = join(domainDir, filename);
    await writeFile(
      filepath,
      JSON.stringify(results.classification, null, 2),
      "utf-8",
    );
    writtenFiles.push(filepath);
  }

  if (results.sections) {
    const filename = `${domain}_${timestamp}_sections.json`;
    const filepath = join(domainDir, filename);
    await writeFile(
      filepath,
      JSON.stringify(results.sections, null, 2),
      "utf-8",
    );
    writtenFiles.push(filepath);
  }

  return writtenFiles;
}

export async function writeSummary(
  outputDir: string,
  summary: any,
): Promise<string> {
  // Ensure output directory exists
  await mkdir(outputDir, { recursive: true });

  const filepath = join(outputDir, "summary.json");
  await writeFile(filepath, JSON.stringify(summary, null, 2), "utf-8");
  return filepath;
}
