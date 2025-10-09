import ora from "ora";
import chalk from "chalk";

export class ProgressDisplay {
  private spinner: any;

  start(message: string) {
    this.spinner = ora(message).start();
  }

  succeed(message: string) {
    if (this.spinner) {
      this.spinner.succeed(message);
    }
  }

  fail(message: string) {
    if (this.spinner) {
      this.spinner.fail(message);
    }
  }

  update(message: string) {
    if (this.spinner) {
      this.spinner.text = message;
    }
  }

  stop() {
    if (this.spinner) {
      this.spinner.stop();
    }
  }
}

export function formatSuccess(message: string): string {
  return chalk.green("✓") + " " + message;
}

export function formatError(message: string): string {
  return chalk.red("✗") + " " + message;
}

export function formatWarning(message: string): string {
  return chalk.yellow("⚠") + " " + message;
}

export function formatInfo(message: string): string {
  return chalk.blue("ℹ") + " " + message;
}
