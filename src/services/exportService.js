import JSZip from "jszip";
import { getAllConversations } from "./database";

/**
 * Prepare all markdown files for download as a ZIP
 * @returns {Promise<string>} URL for downloading the ZIP file
 */
export async function prepareMarkdownDownload() {
  try {
    // Get all conversations from database
    const conversations = await getAllConversations();

    if (conversations.length === 0) {
      throw new Error("No processed conversations found");
    }

    // Create a new ZIP file
    const zip = new JSZip();

    // Add placeholder markdown content for each conversation
    // This will be replaced with actual markdown generation in Phase 3
    conversations.forEach((conversation) => {
      const markdownContent = generatePlaceholderMarkdown(conversation);
      zip.file(conversation.filename, markdownContent);
    });

    // Generate ZIP file
    const zipBlob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: {
        level: 6,
      },
    });

    // Create a download URL
    return URL.createObjectURL(zipBlob);
  } catch (error) {
    console.error("Error preparing markdown download:", error);
    throw new Error(`Failed to prepare download: ${error.message}`);
  }
}

/**
 * Generate placeholder markdown content for a conversation
 * Will be replaced with actual markdown generation in Phase 3
 * @param {Object} conversation - The conversation data
 * @returns {string} Markdown content
 */
function generatePlaceholderMarkdown(conversation) {
  return `# ${conversation.title || "Untitled Conversation"}

> This is a placeholder markdown file for conversation ${conversation.uuid}
> Created at: ${conversation.created_at}
> Processed at: ${conversation.last_processed}
> Message count: ${conversation.message_count}

*Full markdown conversion will be implemented in Phase 3*
`;
}
