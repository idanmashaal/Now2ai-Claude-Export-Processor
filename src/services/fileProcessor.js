import JSZip from "jszip";
import { storeConversation, recordProcessingHistory } from "./database";

/**
 * Process a Claude export ZIP file
 * @param {ArrayBuffer} fileBuffer - The ZIP file as ArrayBuffer
 * @param {string} fileName - The name of the uploaded file
 * @returns {Promise<Object>} Processing results
 */
export async function processZipFile(fileBuffer, fileName) {
  try {
    // Load ZIP file
    const zip = new JSZip();
    await zip.loadAsync(fileBuffer);

    // Track processing statistics
    const stats = {
      totalConversations: 0,
      newConversations: 0,
      updatedConversations: 0,
    };

    // Process each file in the ZIP
    const processingPromises = [];

    zip.forEach((relativePath, zipEntry) => {
      // Only process JSON files
      if (!zipEntry.name.endsWith(".json") || zipEntry.dir) {
        return;
      }

      const processPromise = processJsonFile(zipEntry);
      processingPromises.push(processPromise);
    });

    // Wait for all processing to complete
    const results = await Promise.all(processingPromises);

    // Compile statistics
    results.forEach((result) => {
      stats.totalConversations++;

      if (result.isNew) {
        stats.newConversations++;
      } else {
        stats.updatedConversations++;
      }
    });

    // Record processing history
    await recordProcessingHistory({
      timestamp: new Date().toISOString(),
      files_processed: stats.totalConversations,
      new_conversations: stats.newConversations,
      updated_conversations: stats.updatedConversations,
    });

    return stats;
  } catch (error) {
    console.error("Error processing ZIP file:", error);
    throw new Error(`Failed to process ZIP file: ${error.message}`);
  }
}

/**
 * Process a single JSON file from the ZIP
 * @param {Object} zipEntry - The JSZip file entry
 * @returns {Promise<Object>} Processing result
 */
async function processJsonFile(zipEntry) {
  try {
    // Extract file content
    const content = await zipEntry.async("string");
    const data = JSON.parse(content);

    // TODO: Process conversation data
    // This is a placeholder until we implement the full parsing logic in Phase 2

    // For now, create a minimal conversation object
    const conversation = {
      uuid: data.uuid || crypto.randomUUID(),
      title: data.title || "Untitled Conversation",
      created_at: data.created_at || new Date().toISOString(),
      message_count: data.messages?.length || 0,
      has_artifacts: false, // Will be determined in Phase 2
      filename: generateFilename(data.title || "untitled", data.created_at),
    };

    // Store in database
    const existingId = await storeConversation(conversation);

    return {
      uuid: conversation.uuid,
      isNew: !existingId,
    };
  } catch (error) {
    console.error(`Error processing file ${zipEntry.name}:`, error);
    throw error;
  }
}

/**
 * Generate a filename for the Markdown export
 * @param {string} title - The conversation title
 * @param {string} timestamp - ISO timestamp string
 * @returns {string} Formatted filename
 */
function generateFilename(title, timestamp) {
  const date = new Date(timestamp || Date.now());

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  // Format: YYYYMMDD_HHMMSS_sanitized-title.md
  const dateString = `${year}${month}${day}_${hours}${minutes}${seconds}`;

  // Sanitize title for filename
  const sanitizedTitle = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .substring(0, 50); // Limit length

  return `${dateString}_${sanitizedTitle}.md`;
}
