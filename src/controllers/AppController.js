/**
 * AppController
 *
 * The main application controller that orchestrates the various components
 * of the Claude AI Chat Export Processor.
 */

const fs = require("fs-extra");
const path = require("path");
const ora = require("ora");
const chalk = require("chalk");

const ZipProcessor = require("../processors/ZipProcessor");
const DatabaseService = require("../services/DatabaseService");
const MarkdownGenerator = require("../generators/MarkdownGenerator");
const { createLogger } = require("../utils/logger");

class AppController {
  /**
   * Creates a new AppController instance
   *
   * @param {Object} options - Configuration options
   * @param {string} options.zipFilePath - Path to the zip file to process
   * @param {string} options.outputDir - Directory to output markdown files
   * @param {string} options.databaseDir - Directory for database storage
   * @param {boolean} options.incremental - Only process new conversations if true
   * @param {boolean} options.force - Force reprocessing of already processed conversations
   * @param {boolean} options.verbose - Enable verbose logging
   */
  constructor(options) {
    this.zipFilePath = options.zipFilePath;
    this.outputDir = options.outputDir;
    this.databaseDir = options.databaseDir;
    this.incremental = options.incremental;
    this.force = options.force;
    this.verbose = options.verbose;

    // Create a logger
    this.logger = createLogger(this.verbose);

    // Initialize components
    this.zipProcessor = new ZipProcessor(this.logger);
    this.db = new DatabaseService({
      databaseDir: this.databaseDir,
      logger: this.logger,
    });
    this.markdownGenerator = new MarkdownGenerator(this.logger);
  }

  /**
   * Run the main application process
   */
  async run() {
    // Create directories if they don't exist
    await fs.ensureDir(this.outputDir);
    await fs.ensureDir(this.databaseDir);

    this.logger.info("Starting process");

    // Step 1: Extract and process the zip file
    const spinner = ora("Extracting and processing zip file...").start();
    try {
      const data = await this.zipProcessor.process(this.zipFilePath);
      spinner.succeed("Zip file processed successfully");
      this.logger.debug(
        `Processed data: ${data.conversations.length} conversations, ${data.users.length} users, ${data.projects.length} projects`
      );

      // Step 2: Store the data in the database
      spinner.text = "Storing data in database...";
      spinner.start();
      await this.db.init();
      await this.storeData(data);
      spinner.succeed("Data stored in database");

      // Step 3: Generate markdown files
      spinner.text = "Generating markdown files...";
      spinner.start();
      await this.generateMarkdownFiles();
      spinner.succeed("Markdown files generated");

      this.logger.info("Process completed");
    } catch (error) {
      spinner.fail(`Error: ${error.message}`);
      this.logger.error("Process failed", error);
      throw error;
    }
  }

  /**
   * Store the extracted data in the database
   *
   * @param {Object} data - The data extracted from the zip file
   * @param {Array<Object>} data.users - User data
   * @param {Array<Object>} data.projects - Project data
   * @param {Array<Object>} data.conversations - Conversation data
   */
  async storeData({ users, projects, conversations }) {
    // Store users
    for (const user of users) {
      await this.db.users.upsert(user);
    }
    this.logger.info(`Stored ${users.length} users`);

    // Store projects
    for (const project of projects) {
      await this.db.projects.upsert(project);
    }
    this.logger.info(`Stored ${projects.length} projects`);

    // Sort conversations by timestamp (newest first) for efficiency
    const sortedConversations = [...conversations].sort(
      (a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0)
    );

    let processedCount = 0;
    let skippedCount = 0;

    // Process conversations
    for (const conversation of sortedConversations) {
      // Skip invalid conversations
      if (!conversation || !conversation.uuid) {
        this.logger.warn("Skipping invalid conversation without UUID");
        skippedCount++;
        continue;
      }

      const existingConversation = await this.db.conversations.findByUuid(
        conversation.uuid
      );

      // Check if we should process this conversation based on our rules
      const shouldProcess =
        this.force ||
        !existingConversation ||
        !existingConversation.processed ||
        existingConversation.updated_at !== conversation.updated_at;

      if (!shouldProcess) {
        this.logger.debug(
          `Skipping conversation (already processed): ${conversation.uuid}`
        );
        skippedCount++;
        continue;
      }

      // Store the conversation
      await this.db.conversations.upsert(conversation);
      processedCount++;

      this.logger.debug(`Stored conversation: ${conversation.uuid}`);
    }

    this.logger.info(
      `Stored ${processedCount} conversations (skipped ${skippedCount})`
    );
  }

  /**
   * Generate markdown files for all conversations in the database
   */
  async generateMarkdownFiles() {
    const conversations = await this.db.conversations.findAll();
    let generatedCount = 0;
    let skippedCount = 0;

    for (const conversation of conversations) {
      // Skip if already processed and has markdown path (unless force is true)
      if (!this.force && conversation.processed && conversation.markdownPath) {
        this.logger.debug(
          `Skipping markdown generation for already processed conversation: ${conversation.uuid}`
        );
        skippedCount++;
        continue;
      }

      try {
        // Generate the markdown content
        const markdown = await this.markdownGenerator.generate(conversation);

        // Create filename based on timestamp and name/uuid
        const timestamp = new Date(conversation.created_at || new Date())
          .toISOString()
          .replace(/[-:]/g, "")
          .replace("T", "_")
          .slice(0, 15);

        // Create a safe slug from the name or use UUID
        let nameSlug = conversation.uuid;
        if (conversation.name) {
          // Remove non-alphanumeric characters and replace with dashes
          nameSlug = conversation.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 50);

          // If the slug ends up empty after cleaning, fall back to UUID
          if (!nameSlug) {
            nameSlug = conversation.uuid;
          }
        }

        const filename = `${timestamp}_${nameSlug}.md`;
        const outputPath = path.join(this.outputDir, filename);

        // Write the markdown file
        await fs.writeFile(outputPath, markdown, "utf8");

        // Update the conversation in the database
        await this.db.conversations.update(conversation.uuid, {
          processed: true,
          markdownPath: outputPath,
        });

        generatedCount++;
        this.logger.debug(
          `Generated markdown for conversation: ${conversation.uuid} → ${outputPath}`
        );
      } catch (error) {
        this.logger.error(
          `Failed to generate markdown for conversation: ${conversation.uuid}`,
          error
        );
      }
    }

    this.logger.info(
      `Generated ${generatedCount} markdown files (skipped ${skippedCount})`
    );
  }
}

module.exports = AppController;
