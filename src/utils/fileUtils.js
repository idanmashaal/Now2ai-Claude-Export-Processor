/**
 * File utilities
 *
 * Helper functions for file operations.
 */

const fs = require("fs-extra");
const path = require("path");
const crypto = require("crypto");

/**
 * Create a hash of a file for comparison
 *
 * @param {string} filePath - Path to the file
 * @returns {Promise<string>} The hash of the file
 */
async function createFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("md5");
    const stream = fs.createReadStream(filePath);

    stream.on("data", (data) => {
      hash.update(data);
    });

    stream.on("end", () => {
      resolve(hash.digest("hex"));
    });

    stream.on("error", (error) => {
      reject(error);
    });
  });
}

/**
 * Generate a unique filename based on a conversation
 *
 * @param {Object} conversation - The conversation
 * @returns {string} The unique filename
 */
function generateFilename(conversation) {
  // Extract timestamp from created_at
  const timestamp = conversation.created_at
    ? new Date(conversation.created_at)
        .toISOString()
        .replace(/[-:]/g, "")
        .replace("T", "_")
        .slice(0, 15)
    : new Date()
        .toISOString()
        .replace(/[-:]/g, "")
        .replace("T", "_")
        .slice(0, 15);

  // Create a slug from the conversation name or use the UUID
  const nameSlug = conversation.name
    ? conversation.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 50)
    : conversation.uuid;

  return `${timestamp}_${nameSlug}.md`;
}

/**
 * Find all files in a directory matching a pattern
 *
 * @param {string} dir - The directory to search
 * @param {RegExp} pattern - The pattern to match
 * @returns {Promise<Array<string>>} The matching files
 */
async function findFiles(dir, pattern) {
  const files = await fs.readdir(dir);
  return files
    .filter((file) => pattern.test(file))
    .map((file) => path.join(dir, file));
}

/**
 * Extract conversation UUID from a markdown file
 *
 * @param {string} filePath - Path to the markdown file
 * @returns {Promise<string|null>} The UUID or null if not found
 */
async function extractConversationUuid(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf8");

    // Look for the link to the original conversation
    const match = content.match(/https:\/\/claude\.ai\/chat\/([a-f0-9-]+)/);
    if (match && match[1]) {
      return match[1];
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Ensure a directory exists and is empty
 *
 * @param {string} dir - The directory to ensure
 * @param {boolean} empty - Whether to empty the directory
 * @returns {Promise<void>}
 */
async function ensureDirectory(dir, empty = false) {
  if (empty && (await fs.pathExists(dir))) {
    await fs.emptyDir(dir);
  } else {
    await fs.ensureDir(dir);
  }
}

/**
 * Create a temporary directory
 *
 * @param {string} prefix - Prefix for the directory name
 * @returns {Promise<string>} The path to the temporary directory
 */
async function createTempDirectory(prefix = "claude-export-") {
  const tempDir = path.join(
    require("os").tmpdir(),
    `${prefix}${Date.now()}-${Math.random().toString(36).substring(2, 10)}`
  );

  await fs.ensureDir(tempDir);
  return tempDir;
}

/**
 * Format a file size in a human-readable format
 *
 * @param {number} size - The file size in bytes
 * @returns {string} The formatted file size
 */
function formatFileSize(size) {
  if (size < 1024) {
    return `${size} bytes`;
  } else if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  } else if (size < 1024 * 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  } else {
    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
}

module.exports = {
  createFileHash,
  generateFilename,
  findFiles,
  extractConversationUuid,
  ensureDirectory,
  createTempDirectory,
  formatFileSize,
};
