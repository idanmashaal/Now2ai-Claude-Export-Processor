/**
 * MarkdownGenerator
 *
 * Generates markdown files from conversation data.
 * Handles special formatting for code blocks, artifacts,
 * and bidirectional text.
 */

const dayjs = require("dayjs");
const bidi = require("bidi-js");

class MarkdownGenerator {
  /**
   * Creates a new MarkdownGenerator instance
   *
   * @param {Object} logger - The logger instance
   */
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Generate a markdown representation of a conversation
   *
   * @param {Object} conversation - The conversation to generate markdown for
   * @returns {Promise<string>} The generated markdown
   */
  async generate(conversation) {
    this.logger.debug(
      `Generating markdown for conversation: ${conversation.uuid}`
    );

    try {
      let markdown = "";

      // Add title
      markdown += `# ${this.getTitle(conversation)}\n\n`;

      // Add metadata
      markdown += this.generateMetadata(conversation);

      // Add messages
      if (
        conversation.chat_messages &&
        Array.isArray(conversation.chat_messages)
      ) {
        for (const message of conversation.chat_messages) {
          markdown += this.generateMessage(message);
        }
      }

      // Add footer
      markdown += "\n\n---\n\n";
      markdown += `Generated at: ${dayjs().format("YYYY-MM-DD HH:mm:ss")}\n`;
      markdown += `Original conversation: https://claude.ai/chat/${conversation.uuid}\n`;

      return markdown;
    } catch (error) {
      this.logger.error(
        `Failed to generate markdown for conversation: ${conversation.uuid}`,
        error
      );
      throw new Error(`Failed to generate markdown: ${error.message}`);
    }
  }

  /**
   * Get the title for the markdown file
   *
   * @param {Object} conversation - The conversation
   * @returns {string} The title
   */
  getTitle(conversation) {
    // If the conversation has a name, use it
    if (conversation.name && conversation.name.trim()) {
      return conversation.name;
    }

    // Otherwise, try to generate a title from the first message
    if (conversation.chat_messages && conversation.chat_messages.length > 0) {
      const firstMessage = conversation.chat_messages[0];
      if (firstMessage.text && firstMessage.text.trim()) {
        // Use the first line of the first message, truncated if necessary
        const firstLine = firstMessage.text.split("\n")[0].trim();
        if (firstLine.length > 50) {
          return `${firstLine.substring(0, 50)}...`;
        }
        return firstLine;
      }
    }

    // Fall back to the conversation UUID
    return `Conversation ${conversation.uuid}`;
  }

  /**
   * Generate metadata section for the markdown
   *
   * @param {Object} conversation - The conversation
   * @returns {string} The metadata markdown
   */
  generateMetadata(conversation) {
    let metadata = "";

    // Add created and updated dates
    if (conversation.created_at) {
      metadata += `- **Created at**: ${dayjs(conversation.created_at).format(
        "YYYY-MM-DD HH:mm:ss"
      )}\n`;
    }

    if (conversation.updated_at) {
      metadata += `- **Last updated**: ${dayjs(conversation.updated_at).format(
        "YYYY-MM-DD HH:mm:ss"
      )}\n`;
    }

    // Add account info if available
    if (conversation.account && conversation.account.uuid) {
      metadata += `- **Account UUID**: ${conversation.account.uuid}\n`;
    }

    // Add separator
    if (metadata) {
      metadata = `## Metadata\n\n${metadata}\n\n`;
      metadata += "---\n\n";
    }

    return metadata;
  }

  /**
   * Generate markdown for a message
   *
   * @param {Object} message - The message
   * @returns {string} The message markdown
   */
  generateMessage(message) {
    if (!message) {
      return "";
    }

    let markdown = "";

    // Add sender and timestamp
    const sender = message.sender === "human" ? "User" : "Claude";
    const timestamp = message.created_at
      ? dayjs(message.created_at).format("YYYY-MM-DD HH:mm:ss")
      : "";

    markdown += `\n\n## ${sender} (${timestamp})\n\n`;

    // Process the message content
    if (message.text) {
      // Check if the text is RTL
      const textDirection = this.detectTextDirection(message.text);

      if (textDirection === "rtl") {
        markdown += '<div dir="rtl">\n\n';
      }

      // Process the message text
      markdown += this.processText(message.text);

      if (textDirection === "rtl") {
        markdown += "\n\n</div>";
      }
    } else if (message.content && Array.isArray(message.content)) {
      // Process each content item
      for (const item of message.content) {
        if (item.type === "text" && item.text) {
          // Check if the text is RTL
          const textDirection = this.detectTextDirection(item.text);

          if (textDirection === "rtl") {
            markdown += '<div dir="rtl">\n\n';
          }

          // Process the text
          markdown += this.processText(item.text);

          if (textDirection === "rtl") {
            markdown += "\n\n</div>";
          }
        } else if (item.type === "tool_use" || item.type === "tool_result") {
          // Process tool use
          markdown += this.processToolUse(item);
        }
      }
    }

    // Process attachments
    if (
      message.attachments &&
      Array.isArray(message.attachments) &&
      message.attachments.length > 0
    ) {
      markdown += "\n\n### Attachments\n\n";

      for (const attachment of message.attachments) {
        markdown += `- **${attachment.file_name}** (${
          attachment.file_type
        }, ${this.formatFileSize(attachment.file_size)})\n`;

        // Include extracted content if available
        if (attachment.extracted_content) {
          // Check if content is RTL
          const contentDirection = this.detectTextDirection(
            attachment.extracted_content
          );

          // Special handling for Hebrew/Arabic text
          if (contentDirection === "rtl") {
            markdown += '\n<div dir="rtl">\n\n```\n';

            // Try to clean up encoding issues with Hebrew/Arabic text
            const cleanedContent = this.cleanRtlText(
              attachment.extracted_content
            );
            markdown += cleanedContent;

            markdown += "\n```\n\n</div>\n";
          } else {
            markdown += "\n```\n";
            markdown += attachment.extracted_content;
            markdown += "\n```\n\n";
          }
        }
      }
    }

    return markdown;
  }

  /**
   * Clean RTL text with potential encoding issues
   *
   * @param {string} text - The RTL text to clean
   * @returns {string} The cleaned text
   */
  cleanRtlText(text) {
    if (!text) {
      return "";
    }

    // Attempt to fix common encoding issues with Hebrew/Arabic
    let cleaned = text;

    // Replace garbled character sequences that commonly appear in broken Hebrew encoding
    cleaned = cleaned.replace(/×—/g, "ח");
    cleaned = cleaned.replace(/×©/g, "ש");
    cleaned = cleaned.replace(/×'/g, "ג");
    cleaned = cleaned.replace(/×'/g, "ב");
    cleaned = cleaned.replace(/×¦/g, "צ");
    cleaned = cleaned.replace(/×"/g, "ה");
    cleaned = cleaned.replace(/×"/g, "ד");
    cleaned = cleaned.replace(/×™/g, "י");
    cleaned = cleaned.replace(/×Ÿ/g, "ן");
    cleaned = cleaned.replace(/×ž/g, "מ");
    cleaned = cleaned.replace(/×œ/g, "ל");
    cleaned = cleaned.replace(/×š/g, "ך");
    cleaned = cleaned.replace(/×£/g, "ף");
    cleaned = cleaned.replace(/×¤/g, "פ");
    cleaned = cleaned.replace(/×¨/g, "ר");
    cleaned = cleaned.replace(/×ª/g, "ת");
    cleaned = cleaned.replace(/×¡/g, "ס");
    cleaned = cleaned.replace(/×˜/g, "ט");
    cleaned = cleaned.replace(/×§/g, "ק");
    cleaned = cleaned.replace(/×¥/g, "ץ");
    cleaned = cleaned.replace(/×›/g, "כ");
    cleaned = cleaned.replace(/×¢/g, "ע");
    cleaned = cleaned.replace(/×¦/g, "צ");
    cleaned = cleaned.replace(/×•/g, "ו");

    // Replace other common broken encoding artifacts
    cleaned = cleaned.replace(/×/g, "");
    cleaned = cleaned.replace(/â€/g, "");
    cleaned = cleaned.replace(/\u00a0/g, " ");

    // Try to detect and fix other encoding issues
    if (
      cleaned.includes("\u00d7") ||
      cleaned.includes("\u00a0") ||
      cleaned.includes("\u2014") ||
      cleaned.includes("\u2022")
    ) {
      // If there are still encoding issues, try to use a different approach
      try {
        // Try to decode as UTF-8
        const decoder = new TextDecoder("utf-8", { fatal: false });
        const encoder = new TextEncoder();
        const bytes = encoder.encode(text);
        cleaned = decoder.decode(bytes);
      } catch (error) {
        // If that fails, leave the original but remove the most problematic characters
        cleaned = text.replace(/[^\u0590-\u05FF\u0600-\u06FF\s\p{P}\w]/gu, "");
      }
    }

    return cleaned;
  }

  /**
   * Detect the text direction (ltr or rtl)
   *
   * @param {string} text - The text to detect direction for
   * @returns {string} 'ltr' or 'rtl'
   */
  detectTextDirection(text) {
    if (!text) {
      return "ltr";
    }

    // Check for explicit Unicode Hebrew/Arabic characters
    const rtlUnicodeRegex =
      /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC\u05d0-\u05ea\u05f0-\u05f4]/;
    if (rtlUnicodeRegex.test(text)) {
      return "rtl";
    }

    // Check for Unicode escape sequences representing Hebrew/Arabic
    if (text.includes("\\u05") || text.includes("\\u06")) {
      return "rtl";
    }

    // Check for common garbled Hebrew patterns
    if (
      (text.includes("\u00d7") && text.includes("\u2014")) || // Common garbled Hebrew markers
      text.includes("\u05d2") ||
      text.includes("\u05d1") ||
      text.includes("\u05e5") // Actual Hebrew letters
    ) {
      return "rtl";
    }

    return "ltr";
  }

  /**
   * Decode Unicode Hebrew text that's already in Unicode format
   *
   * @param {string} text - The text to decode
   * @returns {string} The decoded text
   */
  decodeUnicodeHebrewText(text) {
    if (!text) {
      return "";
    }

    // If the text contains \u escape sequences, try to decode them
    if (text.includes("\\u")) {
      try {
        return JSON.parse(`"${text.replace(/"/g, '\\"')}"`);
      } catch (error) {
        // If JSON parsing fails, return the original text
        return text;
      }
    }

    // Check if the text contains Unicode Hebrew characters
    const unicodeHebrewPattern = /[\u05d0-\u05ea\u05f0-\u05f4]/;
    if (unicodeHebrewPattern.test(text)) {
      // Text already contains proper Hebrew characters, return as is
      return text;
    }

    // For text that contains UTF-8 encoded characters that appear garbled
    if (
      text.includes("\u00d7") ||
      text.includes("\u2014") ||
      text.includes("\u2018") ||
      text.includes("\u2022")
    ) {
      // This looks like garbled Hebrew text, attempt to fix common patterns
      return this.cleanRtlText(text);
    }

    // No obvious encoding issues detected, return the original text
    return text;
  }

  /**
   * Process text content, handling code blocks and other formatting
   *
   * @param {string} text - The text to process
   * @returns {string} The processed text
   */
  processText(text) {
    if (!text) {
      return "";
    }

    // Replace triple backticks with proper markdown code blocks
    // This regex handles language specification
    text = text.replace(/```(\w*)([\s\S]*?)```/g, (match, language, code) => {
      language = language.trim();
      // Remove the first newline if it exists
      code = code.startsWith("\n") ? code.substring(1) : code;
      // Remove the last newline if it exists
      code = code.endsWith("\n") ? code.substring(0, code.length - 1) : code;

      return `\`\`\`${language}\n${code}\n\`\`\``;
    });

    return text;
  }

  /**
   * Process tool use content
   *
   * @param {Object} item - The tool use content
   * @returns {string} The processed markdown
   */
  processToolUse(item) {
    if (!item) {
      return "";
    }

    let markdown = "";

    if (item.type === "tool_use") {
      markdown += `\n\n### Tool Use: ${item.name || "Unknown"}\n\n`;

      // If there's input content, format it as a code block
      if (item.input) {
        markdown += "```json\n";
        markdown += JSON.stringify(item.input, null, 2);
        markdown += "\n```\n\n";
      }
    } else if (item.type === "tool_result") {
      markdown += `\n\n### Tool Result: ${item.name || "Unknown"}\n\n`;

      // If there's output content, format it appropriately
      if (item.content) {
        if (typeof item.content === "string") {
          markdown += "```\n";
          markdown += item.content;
          markdown += "\n```\n\n";
        } else {
          markdown += "```json\n";
          markdown += JSON.stringify(item.content, null, 2);
          markdown += "\n```\n\n";
        }
      }

      // Flag any errors
      if (item.is_error) {
        markdown += "> ⚠️ This tool use resulted in an error.\n\n";
      }
    }

    return markdown;
  }

  /**
   * Format a file size in a human-readable format
   *
   * @param {number} size - The file size in bytes
   * @returns {string} The formatted file size
   */
  formatFileSize(size) {
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
}

module.exports = MarkdownGenerator;
