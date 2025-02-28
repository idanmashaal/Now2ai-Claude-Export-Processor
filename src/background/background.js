import { initDatabase } from "../services/database";
import { processZipFile } from "../services/fileProcessor";
import { prepareMarkdownDownload } from "../services/exportService";

// Initialize database when extension starts
initDatabase().catch((error) => {
  console.error("Failed to initialize database:", error);
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Use asynchronous response pattern
  (async () => {
    try {
      const { action, data } = message;

      switch (action) {
        case "processZipFile":
          const results = await processZipFile(data.fileBuffer, data.fileName);
          return results;

        case "prepareMarkdownDownload":
          const downloadUrl = await prepareMarkdownDownload();
          return downloadUrl;

        default:
          throw new Error(`Unknown action: ${action}`);
      }
    } catch (error) {
      console.error(`Error handling message (${message.action}):`, error);
      throw error;
    }
  })()
    .then((response) => sendResponse(response))
    .catch((error) => sendResponse({ error: error.message }));

  // Return true to indicate asynchronous response
  return true;
});
