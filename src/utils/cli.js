/**
 * CLI utilities
 *
 * Helper functions for the command-line interface.
 */

const inquirer = require("inquirer");
const ora = require("ora");

/**
 * Prompt for confirmation
 *
 * @param {string} message - The message to display
 * @param {boolean} defaultValue - The default value
 * @returns {Promise<boolean>} True if confirmed, false otherwise
 */
async function promptConfirmation(message, defaultValue = true) {
  const { confirmed } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirmed",
      message,
      default: defaultValue,
    },
  ]);

  return confirmed;
}

/**
 * Prompt for a value
 *
 * @param {string} message - The message to display
 * @param {string} defaultValue - The default value
 * @returns {Promise<string>} The entered value
 */
async function promptInput(message, defaultValue = "") {
  const { value } = await inquirer.prompt([
    {
      type: "input",
      name: "value",
      message,
      default: defaultValue,
    },
  ]);

  return value;
}

/**
 * Prompt for a selection from a list
 *
 * @param {string} message - The message to display
 * @param {Array<string>} choices - The choices to select from
 * @param {string} defaultValue - The default value
 * @returns {Promise<string>} The selected value
 */
async function promptSelect(message, choices, defaultValue) {
  const { value } = await inquirer.prompt([
    {
      type: "list",
      name: "value",
      message,
      choices,
      default: defaultValue,
    },
  ]);

  return value;
}

/**
 * Create a spinner for async operations
 *
 * @param {string} text - The initial text to display
 * @returns {Object} The spinner instance
 */
function createSpinner(text) {
  return ora(text).start();
}

module.exports = {
  promptConfirmation,
  promptInput,
  promptSelect,
  createSpinner,
};
