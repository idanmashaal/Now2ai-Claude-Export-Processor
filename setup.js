#!/usr/bin/env node

/**
 * Setup script for Claude AI Chat Export Processor
 *
 * This script helps with installation and initial setup.
 */

const fs = require("fs-extra");
const path = require("path");
const chalk = require("chalk");
const inquirer = require("inquirer");
const { execSync } = require("child_process");

async function main() {
  console.log(chalk.cyan("Claude AI Chat Export Processor - Setup"));
  console.log(chalk.gray("------------------------------------------"));

  try {
    // Check Node.js version
    const nodeVersion = process.version;
    const versionMatch = nodeVersion.match(/^v(\d+)\./);
    const majorVersion = versionMatch ? parseInt(versionMatch[1], 10) : 0;

    if (majorVersion < 14) {
      console.log(
        chalk.yellow(
          `You are using Node.js ${nodeVersion}. This application requires Node.js 14 or higher.`
        )
      );
      const continueAnyway = await inquirer.prompt([
        {
          type: "confirm",
          name: "continue",
          message: "Continue anyway?",
          default: false,
        },
      ]);

      if (!continueAnyway.continue) {
        console.log(chalk.red("Setup cancelled."));
        process.exit(1);
      }
    } else {
      console.log(chalk.green(`Node.js version ${nodeVersion} detected. ✓`));
    }

    // Ensure directories exist
    await fs.ensureDir("./data");
    await fs.ensureDir("./output");

    console.log(chalk.green("Created data and output directories. ✓"));

    // Install dependencies
    console.log(chalk.blue("Installing dependencies..."));

    try {
      execSync("npm install", { stdio: "inherit" });
      console.log(chalk.green("Dependencies installed successfully. ✓"));
    } catch (error) {
      console.error(chalk.red("Failed to install dependencies."));
      console.error(error.message);

      const continueAnyway = await inquirer.prompt([
        {
          type: "confirm",
          name: "continue",
          message: "Continue with setup?",
          default: true,
        },
      ]);

      if (!continueAnyway.continue) {
        console.log(chalk.red("Setup cancelled."));
        process.exit(1);
      }
    }

    // Make index.js executable
    try {
      fs.chmodSync("./index.js", 0o755);
      console.log(chalk.green("Made index.js executable. ✓"));
    } catch (error) {
      console.warn(
        chalk.yellow(
          'Could not make index.js executable. You may need to run "chmod +x index.js" manually.'
        )
      );
    }

    // Check if we should link the package
    const linkPackage = await inquirer.prompt([
      {
        type: "confirm",
        name: "link",
        message: "Would you like to install the CLI globally?",
        default: true,
      },
    ]);

    if (linkPackage.link) {
      try {
        execSync("npm link", { stdio: "inherit" });
        console.log(chalk.green("CLI installed globally. ✓"));
        console.log(chalk.blue("You can now run the CLI with:"));
        console.log(chalk.cyan("claude-export process <zipFile>"));
      } catch (error) {
        console.error(chalk.red("Failed to install CLI globally."));
        console.error(error.message);
        console.log(chalk.blue("You can still run the CLI with:"));
        console.log(chalk.cyan("node index.js process <zipFile>"));
      }
    } else {
      console.log(chalk.blue("You can run the CLI with:"));
      console.log(chalk.cyan("node index.js process <zipFile>"));
    }

    console.log("");
    console.log(chalk.green("Setup complete! ✓"));
    console.log("");
    console.log("Next steps:");
    console.log("1. Download a Claude AI chat export zip file");
    console.log("2. Run the CLI to process the export");
    console.log("3. Check the output directory for generated markdown files");
    console.log("");
    console.log("For more information, see the README.md file.");
  } catch (error) {
    console.error(chalk.red("Error during setup:"), error.message);
    console.error(error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(chalk.red("Unhandled error:"), error.message);
  console.error(error);
  process.exit(1);
});
