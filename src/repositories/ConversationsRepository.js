/**
 * ConversationsRepository
 *
 * Repository for managing conversation data.
 */
const BaseRepository = require("./BaseRepository");

class ConversationsRepository extends BaseRepository {
  /**
   * Creates a new ConversationsRepository instance
   *
   * @param {Object} db - The database instance
   * @param {Object} logger - The logger instance
   */
  constructor(db, logger) {
    super(db, "conversations", logger);
  }

  /**
   * Find all conversations
   *
   * @returns {Promise<Array>} All conversations
   */
  async findAll() {
    return this.db.data.conversations || [];
  }

  /**
   * Find conversations by name (fuzzy match)
   *
   * @param {string} name - The name to find
   * @returns {Promise<Array>} The matching conversations
   */
  async findByName(name) {
    const lowerName = name.toLowerCase();
    return this.db.data.conversations.filter(
      (conversation) =>
        conversation.name && conversation.name.toLowerCase().includes(lowerName)
    );
  }

  /**
   * Find conversations by account uuid
   *
   * @param {string} accountUuid - The account uuid to find
   * @returns {Promise<Array>} The matching conversations
   */
  async findByAccount(accountUuid) {
    return this.db.data.conversations.filter(
      (conversation) =>
        conversation.account && conversation.account.uuid === accountUuid
    );
  }

  /**
   * Find recent conversations
   *
   * @param {number} limit - The maximum number of conversations to return
   * @returns {Promise<Array>} The recent conversations
   */
  async findRecent(limit = 20) {
    return [...this.db.data.conversations]
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .slice(0, limit);
  }

  /**
   * Find conversations that have not been processed yet
   *
   * @returns {Promise<Array>} The unprocessed conversations
   */
  async findUnprocessed() {
    return this.db.data.conversations.filter(
      (conversation) => !conversation.processed
    );
  }

  /**
   * Find processed conversations
   *
   * @returns {Promise<Array>} The processed conversations
   */
  async findProcessed() {
    return this.db.data.conversations.filter(
      (conversation) => conversation.processed
    );
  }

  /**
   * Find conversations by date range
   *
   * @param {string} startDate - The start date (ISO string)
   * @param {string} endDate - The end date (ISO string)
   * @returns {Promise<Array>} The matching conversations
   */
  async findByDateRange(startDate, endDate) {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    return this.db.data.conversations.filter((conversation) => {
      const createdAt = new Date(conversation.created_at).getTime();
      return createdAt >= start && createdAt <= end;
    });
  }

  /**
   * Find conversations with a specific message content
   *
   * @param {string} content - The content to search for
   * @returns {Promise<Array>} The matching conversations
   */
  async findByContent(content) {
    const lowerContent = content.toLowerCase();

    return this.db.data.conversations.filter((conversation) => {
      if (
        !conversation.chat_messages ||
        !Array.isArray(conversation.chat_messages)
      ) {
        return false;
      }

      return conversation.chat_messages.some((message) => {
        if (!message.text) {
          return false;
        }

        return message.text.toLowerCase().includes(lowerContent);
      });
    });
  }

  /**
   * Mark a conversation as processed
   *
   * @param {string} uuid - The conversation uuid
   * @param {string} markdownPath - The path to the generated markdown file
   * @returns {Promise<Object|null>} The updated conversation or null
   */
  async markAsProcessed(uuid, markdownPath) {
    return this.update(uuid, {
      processed: true,
      markdownPath,
    });
  }
}

module.exports = ConversationsRepository;
