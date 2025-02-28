/**
 * Sends a message to the background script
 * @param {Object} message - The message to send
 * @returns {Promise<any>} - Response from the background script
 */
export function sendMessageToBackground(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      if (response && response.error) {
        reject(new Error(response.error));
        return;
      }

      resolve(response);
    });
  });
}
