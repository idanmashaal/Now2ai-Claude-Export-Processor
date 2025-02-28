import Dexie from "dexie";

// Database instance
let db;

/**
 * Initialize the database with schema
 * @returns {Promise<Dexie>} The initialized database instance
 */
export async function initDatabase() {
  db = new Dexie("ClaudeExportProcessor");

  // Define database schema - version 1
  db.version(1).stores({
    conversations:
      "uuid, title, created_at, last_processed, filename, message_count, has_artifacts",
    processingHistory: "++id, timestamp",
  });

  // Open the database
  await db.open();
  console.log("Database initialized successfully");

  return db;
}

/**
 * Get the database instance, initializing if needed
 * @returns {Promise<Dexie>} The database instance
 */
export async function getDatabase() {
  if (!db || !db.isOpen()) {
    await initDatabase();
  }
  return db;
}

/**
 * Add or update a conversation in the database
 * @param {Object} conversation - The conversation data to store
 * @returns {Promise<string>} The UUID of the stored conversation
 */
export async function storeConversation(conversation) {
  const db = await getDatabase();

  // Check if conversation already exists
  const existing = await db.conversations.get(conversation.uuid);

  if (existing) {
    // Update existing conversation
    await db.conversations.update(conversation.uuid, {
      ...conversation,
      last_processed: new Date().toISOString(),
    });
  } else {
    // Add new conversation
    await db.conversations.add({
      ...conversation,
      last_processed: new Date().toISOString(),
    });
  }

  return conversation.uuid;
}

/**
 * Get all conversations from the database
 * @returns {Promise<Array>} All stored conversations
 */
export async function getAllConversations() {
  const db = await getDatabase();
  return db.conversations.toArray();
}

/**
 * Get conversations by date range
 * @param {Date} startDate - The start date
 * @param {Date} endDate - The end date
 * @returns {Promise<Array>} Matching conversations
 */
export async function getConversationsByDateRange(startDate, endDate) {
  const db = await getDatabase();

  return db.conversations
    .where("created_at")
    .between(startDate.toISOString(), endDate.toISOString())
    .toArray();
}

/**
 * Record a processing history entry
 * @param {Object} historyEntry - The processing history data
 * @returns {Promise<number>} The ID of the stored history entry
 */
export async function recordProcessingHistory(historyEntry) {
  const db = await getDatabase();

  // Add timestamp if not provided
  if (!historyEntry.timestamp) {
    historyEntry.timestamp = new Date().toISOString();
  }

  return db.processingHistory.add(historyEntry);
}

/**
 * Get all processing history entries
 * @returns {Promise<Array>} All processing history entries
 */
export async function getProcessingHistory() {
  const db = await getDatabase();
  return db.processingHistory.toArray();
}
