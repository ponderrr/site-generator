import { Command } from "commander";
import { ConfigManager } from "../config/ConfigManager.js";
import { formatSuccess, formatInfo } from "../utils/progress.js";

export function createInitCommand(): Command {
  const command = new Command("init");

  command.description("Initialize configuration file").action(async () => {
    const configManager = new ConfigManager();
    await configManager.load();
    await configManager.save(configManager.get());

    console.log(formatSuccess("✓ Configuration file created"));
    console.log(formatInfo(`  Location: ${configManager.getConfigPath()}`));
    console.log("\nYou can edit this file to customize crawler settings.\n");
  });

  return command;
}
