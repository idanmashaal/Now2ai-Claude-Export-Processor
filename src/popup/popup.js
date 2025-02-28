import "./popup.css";
import { sendMessageToBackground } from "../utils/messaging";

// DOM elements
const fileInput = document.getElementById("zip-file-input");
const fileNameDisplay = document.getElementById("file-name-display");
const processButton = document.getElementById("process-button");
const processingStatus = document.getElementById("processing-status");
const statusText = document.getElementById("status-text");
const resultsSection = document.getElementById("results-section");
const resultsStats = document.getElementById("results-stats");
const downloadAllButton = document.getElementById("download-all-button");

// File handling
let selectedFile = null;

// Event listeners
document.addEventListener("DOMContentLoaded", () => {
  // File selection
  fileInput.addEventListener("change", handleFileSelection);

  // Process button
  processButton.addEventListener("click", processSelectedFile);

  // Download button
  downloadAllButton.addEventListener("click", downloadAllMarkdownFiles);
});

/**
 * Handles file selection from the input
 * @param {Event} event - The change event from the file input
 */
function handleFileSelection(event) {
  selectedFile = event.target.files[0];

  if (selectedFile) {
    fileNameDisplay.textContent = selectedFile.name;
    processButton.disabled = false;
  } else {
    fileNameDisplay.textContent = "No file selected";
    processButton.disabled = true;
  }
}

/**
 * Processes the selected ZIP file
 */
async function processSelectedFile() {
  if (!selectedFile) return;

  // Show processing status
  processButton.disabled = true;
  processingStatus.classList.remove("hidden");
  statusText.textContent = "Reading file...";

  try {
    // Read the file as ArrayBuffer
    const fileBuffer = await readFileAsArrayBuffer(selectedFile);

    // Send to background script for processing
    statusText.textContent = "Processing...";
    const results = await sendMessageToBackground({
      action: "processZipFile",
      data: {
        fileBuffer,
        fileName: selectedFile.name,
      },
    });

    // Display results
    displayResults(results);
  } catch (error) {
    console.error("Error processing file:", error);
    statusText.textContent = `Error: ${error.message}`;
  }
}

/**
 * Reads a file as ArrayBuffer
 * @param {File} file - The file to read
 * @returns {Promise<ArrayBuffer>} The file contents as ArrayBuffer
 */
function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read file"));

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Displays processing results
 * @param {Object} results - The processing results
 */
function displayResults(results) {
  processingStatus.classList.add("hidden");
  resultsSection.classList.remove("hidden");

  resultsStats.innerHTML = `
    <p>Processed ${results.totalConversations} conversations</p>
    <p>New: ${results.newConversations}</p>
    <p>Updated: ${results.updatedConversations}</p>
  `;
}

/**
 * Downloads all generated markdown files as a ZIP
 */
async function downloadAllMarkdownFiles() {
  try {
    statusText.textContent = "Preparing download...";
    processingStatus.classList.remove("hidden");

    const downloadUrl = await sendMessageToBackground({
      action: "prepareMarkdownDownload",
    });

    // Trigger download
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = "claude-markdown-export.zip";
    a.click();

    processingStatus.classList.add("hidden");
  } catch (error) {
    console.error("Error downloading files:", error);
    statusText.textContent = `Error: ${error.message}`;
  }
}
