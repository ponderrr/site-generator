import { readdir, readFile, stat } from "fs/promises";
import { join, extname, basename } from "path";

export interface ExtractedFile {
  path: string;
  filename: string;
  content: string;
  format: "markdown" | "json";
  domain: string;
  timestamp: string;
}

export async function readExtractedFiles(
  inputDir: string,
): Promise<ExtractedFile[]> {
  const files: ExtractedFile[] = [];

  try {
    // Get all subdirectories (domains)
    const entries = await readdir(inputDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const domainDir = join(inputDir, entry.name);
        const domainFiles = await readdir(domainDir);

        for (const filename of domainFiles) {
          // Skip metadata files and non-content files
          if (
            filename.includes("_metadata") ||
            (!filename.endsWith(".md") && !filename.endsWith(".json"))
          ) {
            continue;
          }

          const filepath = join(domainDir, filename);
          const content = await readFile(filepath, "utf-8");
          const ext = extname(filename);

          files.push({
            path: filepath,
            filename,
            content,
            format: ext === ".md" ? "markdown" : "json",
            domain: entry.name,
            timestamp: extractTimestamp(filename),
          });
        }
      }
    }

    return files;
  } catch (error: any) {
    throw new Error(`Failed to read extracted files: ${error.message}`);
  }
}

function extractTimestamp(filename: string): string {
  // Extract timestamp from filename like: example_com_2025-10-06T12-30-45.md
  const match = filename.match(/(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/);
  return match
    ? match[1]
    : new Date().toISOString().replace(/:/g, "-").split(".")[0];
}

export async function directoryExists(path: string): Promise<boolean> {
  try {
    const stats = await stat(path);
    return stats.isDirectory();
  } catch {
    return false;
  }
}
