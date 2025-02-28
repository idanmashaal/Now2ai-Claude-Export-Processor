/**
 * ZipProcessor
 *
 * Extracts and processes Claude AI chat export zip files.
 * Handles streaming of large JSON files to ensure memory efficiency.
 */

const AdmZip = require("adm-zip");
const path = require("path");
const { createReadStream } = require("fs");
const { pipeline } = require("stream/promises");
const { parser } = require("stream-json/Parser");
const { streamArray } = require("stream-json/streamers/StreamArray");
const { pick } = require("stream-json/filters/Pick");

class ZipProcessor {
  /**
   * Creates a new ZipProcessor instance
   *
   * @param {Object} logger - The logger instance
   */
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Process a Claude AI chat export zip file
   *
   * @param {string} zipFilePath - Path to the zip file
   * @returns {Promise<Object>} The extracted data
   */
  async process(zipFilePath) {
    this.logger.debug(`Processing zip file: ${zipFilePath}`);

    try {
      // Read the zip file
      const zip = new AdmZip(zipFilePath);

      // Extract the zip file entries
      const entries = zip.getEntries();

      // Find the required files
      const conversationsEntry = entries.find((e) =>
        e.entryName.includes("conversations.json")
      );
      const usersEntry = entries.find((e) =>
        e.entryName.includes("users.json")
      );
      const projectsEntry = entries.find((e) =>
        e.entryName.includes("projects.json")
      );

      if (!conversationsEntry) {
        throw new Error("Missing conversations.json file in the zip archive");
      }

      // Create a temporary directory for extracted files
      const tempDir = path.join(process.cwd(), ".temp");
      zip.extractAllTo(tempDir, true);

      // Process the files
      const users = usersEntry
        ? await this.processJsonFile(path.join(tempDir, usersEntry.entryName))
        : [];
      const projects = projectsEntry
        ? await this.processJsonFile(
            path.join(tempDir, projectsEntry.entryName)
          )
        : [];
      const conversations = await this.processConversationsFile(
        path.join(tempDir, conversationsEntry.entryName)
      );

      this.logger.debug(
        `Processed ${conversations.length} conversations, ${users.length} users, ${projects.length} projects`
      );

      return {
        users,
        projects,
        conversations,
      };
    } catch (error) {
      this.logger.error("Failed to process zip file", error);
      throw new Error(`Failed to process zip file: ${error.message}`);
    }
  }

  /**
   * Process a JSON file and return its content
   *
   * @param {string} filePath - Path to the JSON file
   * @returns {Promise<Array>} The parsed JSON content
   */
  async processJsonFile(filePath) {
    this.logger.debug(`Processing JSON file: ${filePath}`);

    try {
      // For smaller files, we can just read and parse them directly
      const content = require(filePath);
      return Array.isArray(content) ? content : [];
    } catch (error) {
      this.logger.error(`Failed to process JSON file: ${filePath}`, error);
      return [];
    }
  }

  /**
   * Process a large conversations JSON file using streaming
   * to ensure memory efficiency
   *
   * @param {string} filePath - Path to the conversations JSON file
   * @returns {Promise<Array>} The parsed conversations
   */
  async processConversationsFile(filePath) {
    this.logger.debug(`Processing conversations file: ${filePath}`);

    return new Promise((resolve, reject) => {
      const conversations = [];

      // Create the processing pipeline
      const fileStream = createReadStream(filePath);
      const jsonParser = parser();
      const arrayStreamer = streamArray();

      // Handle errors
      fileStream.on("error", (error) => {
        this.logger.error(`Error reading file: ${filePath}`, error);
        reject(new Error(`Error reading file: ${error.message}`));
      });

      jsonParser.on("error", (error) => {
        this.logger.error(`Error parsing JSON: ${filePath}`, error);
        reject(new Error(`Error parsing JSON: ${error.message}`));
      });

      // Process each conversation
      arrayStreamer.on("data", ({ value }) => {
        conversations.push(value);

        // Log progress for large files
        if (conversations.length % 100 === 0) {
          this.logger.debug(
            `Processed ${conversations.length} conversations so far...`
          );
        }
      });

      // Handle completion
      arrayStreamer.on("end", () => {
        this.logger.debug(
          `Completed processing ${conversations.length} conversations`
        );
        resolve(conversations);
      });

      // Connect the streams
      fileStream.pipe(jsonParser).pipe(arrayStreamer);
    });
  }
}

module.exports = ZipProcessor;
