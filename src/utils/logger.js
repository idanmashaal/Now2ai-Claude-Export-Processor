/**
 * Logger utility
 *
 * Provides a consistent interface for logging messages.
 */

const chalk = require("chalk");

/**
 * Create a new logger instance
 *
 * @param {boolean} verbose - Whether to enable verbose logging
 * @returns {Object} The logger instance
 */
function createLogger(verbose = false) {
  return {
    /**
     * Log a debug message
     *
     * @param {string} message - The message to log
     * @param {Object} [data] - Additional data to log
     */
    debug(message, data) {
      if (verbose) {
        console.debug(chalk.gray(`[DEBUG] ${message}`));
        if (data) {
          console.debug(data);
        }
      }
    },

    /**
     * Log an info message
     *
     * @param {string} message - The message to log
     * @param {Object} [data] - Additional data to log
     */
    info(message, data) {
      console.info(chalk.blue(`[INFO] ${message}`));
      if (data && verbose) {
        console.info(data);
      }
    },

    /**
     * Log a warning message
     *
     * @param {string} message - The message to log
     * @param {Object} [data] - Additional data to log
     */
    warn(message, data) {
      console.warn(chalk.yellow(`[WARN] ${message}`));
      if (data) {
        console.warn(data);
      }
    },

    /**
     * Log an error message
     *
     * @param {string} message - The message to log
     * @param {Error} [error] - The error object
     */
    error(message, error) {
      console.error(chalk.red(`[ERROR] ${message}`));
      if (error) {
        console.error(error);
      }
    },
  };
}

module.exports = {
  createLogger,
};
