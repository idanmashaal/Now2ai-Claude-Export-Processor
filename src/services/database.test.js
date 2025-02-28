import { expect } from "chai";
import {
  initDatabase,
  getDatabase,
  storeConversation,
  getAllConversations,
} from "../../src/services/database";

// Mock Dexie for testing
// This is a simple mock to avoid browser dependencies during testing
const mockDb = {
  isOpen: () => true,
  version: () => ({ stores: () => mockDb }),
  open: async () => mockDb,
  conversations: {
    get: async (id) => null,
    add: async (data) => data.uuid,
    update: async (id, data) => id,
    toArray: async () => [],
  },
  processingHistory: {
    add: async (data) => 1,
    toArray: async () => [],
  },
};

// Mock Dexie constructor
global.Dexie = function () {
  return mockDb;
};

describe("Database Service", function () {
  it("should initialize the database", async function () {
    const db = await initDatabase();
    expect(db).to.exist;
  });

  it("should get the database instance", async function () {
    const db = await getDatabase();
    expect(db).to.exist;
  });

  it("should store a new conversation", async function () {
    const testConversation = {
      uuid: "test-uuid",
      title: "Test Conversation",
      created_at: "2025-02-28T15:30:00Z",
      message_count: 10,
      has_artifacts: false,
      filename: "20250228_153000_test-conversation.md",
    };

    const uuid = await storeConversation(testConversation);
    expect(uuid).to.equal("test-uuid");
  });

  it("should retrieve all conversations", async function () {
    const conversations = await getAllConversations();
    expect(conversations).to.be.an("array");
  });
});
