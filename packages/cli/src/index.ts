#!/usr/bin/env node

/**
 * @fileoverview Command Line Interface for Site Generator
 * Entry point for the site-generator CLI tool
 */

import { Command } from "commander";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import {
  createExtractCommand,
  createAnalyzeCommand,
  createInitCommand,
} from "./commands/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Main entry point
 */
async function main() {
  try {
    // Read package.json for version
    let version = "0.1.0";
    try {
      const pkgPath = join(__dirname, "../package.json");
      const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
      version = pkg.version;
    } catch {
      // Use default version if package.json not found
    }

    const program = new Command();

    program
      .name("site-generator")
      .description("Extract, crawl, and analyze website content")
      .version(version);

    // Add commands
    program.addCommand(createExtractCommand());
    program.addCommand(createAnalyzeCommand());
    program.addCommand(createInitCommand());

    // Parse arguments
    await program.parseAsync();

    // If no command provided, show help
    if (!process.argv.slice(2).length) {
      program.outputHelp();
    }
  } catch (error) {
    console.error("CLI Error:", error);
    process.exit(1);
  }
}

// Run the CLI if this file is executed directly
main();
