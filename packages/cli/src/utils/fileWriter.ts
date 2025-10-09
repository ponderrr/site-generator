import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export interface WriteFileOptions {
  outputDir: string;
  filename: string;
  content: string;
  createDir?: boolean;
}

export async function writeOutputFile(
  options: WriteFileOptions,
): Promise<string> {
  const { outputDir, filename, content, createDir = true } = options;

  // Ensure output directory exists
  if (createDir && !existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true });
  }

  const filepath = join(outputDir, filename);
  await writeFile(filepath, content, "utf-8");

  return filepath;
}

export function sanitizeDomainForFilename(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/\./g, "_").replace(/[^a-z0-9_]/gi, "");
  } catch {
    return "unknown_domain";
  }
}

export function generateTimestamp(): string {
  return new Date().toISOString().replace(/:/g, "-").split(".")[0];
}

export function generateFilename(
  domain: string,
  timestamp: string,
  extension: string,
): string {
  return `${domain}_${timestamp}.${extension}`;
}
