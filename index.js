#!/usr/bin/env node

/**
 * Claude AI Chat Export Processor
 * Main entry point for the application
 *
 * This CLI tool processes Claude AI chat exports from zip files, stores them
 * in a local database, and generates markdown files for each conversation.
 */

const { Command } = require("commander");
const chalk = require("chalk");
const path = require("path");
const { version } = require(path.join(__dirname, "package.json"));
const AppController = require("./src/controllers/AppController");
const { promptConfirmation } = require("./src/utils/cli");

// Create the program instance
const program = new Command();

// Configure the CLI
program
  .name("claude-export-processor")
  .description("Process Claude AI chat exports and generate markdown files")
  .version(version);

// Define the main command
program
  .command("process")
  .description("Process Claude AI chat exports from zip file")
  .argument("<zipFile>", "Path to Claude AI export zip file")
  .option(
    "-o, --output <dir>",
    "Output directory for markdown files",
    "./output"
  )
  .option("-d, --database <dir>", "Directory for database storage", "./data")
  .option("-i, --incremental", "Only process new conversations", false)
  .option("-y, --yes", "Skip confirmation prompts", false)
  .option(
    "--force",
    "Force reprocessing of previously processed conversations",
    false
  )
  .option("-v, --verbose", "Enable verbose logging", false)
  .action(async (zipFile, options) => {
    try {
      if (!options.yes) {
        console.log(chalk.cyan("Claude AI Chat Export Processor"));
        console.log(chalk.gray("--------------------------------"));
        console.log(`Processing: ${chalk.yellow(zipFile)}`);
        console.log(`Output directory: ${chalk.yellow(options.output)}`);
        console.log(`Database directory: ${chalk.yellow(options.database)}`);
        console.log(
          `Mode: ${
            options.incremental
              ? chalk.yellow("Incremental")
              : chalk.yellow("Full")
          }`
        );

        const confirmed = await promptConfirmation(
          "Continue with these settings?"
        );
        if (!confirmed) {
          console.log(chalk.yellow("Process cancelled."));
          process.exit(0);
        }
      }

      const appController = new AppController({
        zipFilePath: zipFile,
        outputDir: options.output,
        databaseDir: options.database,
        incremental: options.incremental,
        force: options.force,
        verbose: options.verbose,
      });

      await appController.run();
      console.log(chalk.green("Process completed successfully."));
    } catch (error) {
      console.error(chalk.red("Error:"), error.message);
      if (options.verbose) {
        console.error(error);
      }
      process.exit(1);
    }
  });

// Status command
program
  .command("status")
  .description("Check the status of the database and generated files")
  .option("-d, --database <dir>", "Directory for database storage", "./data")
  .option(
    "-o, --output <dir>",
    "Output directory for markdown files",
    "./output"
  )
  .option("-v, --verbose", "Enable verbose logging", false)
  .action(async (options) => {
    try {
      const { runStatusCommand } = require("./src/commands/statusCommand");
      await runStatusCommand(options);
    } catch (error) {
      console.error(chalk.red("Error:"), error.message);
      if (options.verbose) {
        console.error(error);
      }
      process.exit(1);
    }
  });

// Parse the CLI arguments
program.parse();
