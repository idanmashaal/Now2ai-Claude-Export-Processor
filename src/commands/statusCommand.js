/**
 * Status Command
 *
 * Command to check the status of the database and output statistics.
 */

const chalk = require("chalk");
const path = require("path");
const fs = require("fs-extra");
const dayjs = require("dayjs");
const { createLogger } = require("../utils/logger");
const DatabaseService = require("../services/DatabaseService");
const { formatFileSize } = require("../utils/fileUtils");

/**
 * Run the status command
 *
 * @param {Object} options - Command options
 * @param {string} options.databaseDir - Database directory
 * @param {string} options.outputDir - Output directory
 * @param {boolean} options.verbose - Verbose output
 */
async function runStatusCommand(options) {
  const logger = createLogger(options.verbose);

  console.log(chalk.cyan("Claude AI Chat Export Processor - Status"));
  console.log(chalk.gray("------------------------------------------"));

  try {
    // Check if the database directory exists
    if (!(await fs.pathExists(options.databaseDir))) {
      console.log(chalk.yellow("Database directory does not exist yet."));
      console.log(`Run the ${chalk.cyan("process")} command to create it.`);
      return;
    }

    // Initialize the database service
    const db = new DatabaseService({
      databaseDir: options.databaseDir,
      logger,
    });

    await db.init();

    // Get meta information
    const meta = await db.getMeta();

    // Get counts
    const userCount = await db.users.count();
    const projectCount = await db.projects.count();
    const conversationCount = await db.conversations.count();
    const processedCount = (await db.conversations.findProcessed()).length;
    const unprocessedCount = (await db.conversations.findUnprocessed()).length;

    // Get the most recent conversation
    const recentConversations = await db.conversations.findRecent(1);
    const mostRecent =
      recentConversations.length > 0 ? recentConversations[0] : null;

    // Check if output directory exists
    const outputExists = await fs.pathExists(options.outputDir);
    let markdownFiles = [];
    let totalSize = 0;

    if (outputExists) {
      markdownFiles = (await fs.readdir(options.outputDir)).filter((file) =>
        file.endsWith(".md")
      );

      // Calculate total size
      for (const file of markdownFiles) {
        const filePath = path.join(options.outputDir, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
      }
    }

    // Output the status
    console.log(`${chalk.bold("Database Directory:")} ${options.databaseDir}`);
    console.log(`${chalk.bold("Output Directory:")} ${options.outputDir}`);
    console.log(
      `${chalk.bold("Last Processed:")} ${
        meta.lastProcessed
          ? dayjs(meta.lastProcessed).format("YYYY-MM-DD HH:mm:ss")
          : "Never"
      }`
    );
    console.log(
      `${chalk.bold("Database Version:")} ${meta.version || "Unknown"}`
    );
    console.log("");

    console.log(chalk.cyan("Statistics:"));
    console.log(`${chalk.bold("Users:")} ${userCount}`);
    console.log(`${chalk.bold("Projects:")} ${projectCount}`);
    console.log(`${chalk.bold("Conversations:")} ${conversationCount}`);
    console.log(`${chalk.bold("Processed Conversations:")} ${processedCount}`);
    console.log(
      `${chalk.bold("Unprocessed Conversations:")} ${unprocessedCount}`
    );
    console.log(`${chalk.bold("Markdown Files:")} ${markdownFiles.length}`);
    console.log(
      `${chalk.bold("Total Markdown Size:")} ${formatFileSize(totalSize)}`
    );
    console.log("");

    if (mostRecent) {
      console.log(chalk.cyan("Most Recent Conversation:"));
      console.log(`${chalk.bold("Name:")} ${mostRecent.name || "[Unnamed]"}`);
      console.log(`${chalk.bold("UUID:")} ${mostRecent.uuid}`);
      console.log(
        `${chalk.bold("Created:")} ${dayjs(mostRecent.created_at).format(
          "YYYY-MM-DD HH:mm:ss"
        )}`
      );
      console.log(
        `${chalk.bold("Updated:")} ${dayjs(mostRecent.updated_at).format(
          "YYYY-MM-DD HH:mm:ss"
        )}`
      );
      console.log(
        `${chalk.bold("Messages:")} ${
          mostRecent.chat_messages ? mostRecent.chat_messages.length : 0
        }`
      );
      console.log(
        `${chalk.bold("Processed:")} ${
          mostRecent.processed ? chalk.green("Yes") : chalk.yellow("No")
        }`
      );

      if (mostRecent.processed && mostRecent.markdownPath) {
        console.log(
          `${chalk.bold("Markdown Path:")} ${mostRecent.markdownPath}`
        );
      }
    }
  } catch (error) {
    console.error(chalk.red("Error:"), error.message);

    if (options.verbose) {
      console.error(error);
    }
  }
}

module.exports = {
  runStatusCommand,
};
