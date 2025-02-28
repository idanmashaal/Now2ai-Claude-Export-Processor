/**
 * Tests for the ZipProcessor
 */

const path = require("path");
const fs = require("fs-extra");
const ZipProcessor = require("../src/processors/ZipProcessor");

// Mock logger
const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Helper to create a test zip file
async function createTestZip(testDir, data) {
  const AdmZip = require("adm-zip");
  const zip = new AdmZip();

  // Create test files
  if (data.conversations) {
    zip.addFile(
      "conversations.json",
      Buffer.from(JSON.stringify(data.conversations))
    );
  }

  if (data.users) {
    zip.addFile("users.json", Buffer.from(JSON.stringify(data.users)));
  }

  if (data.projects) {
    zip.addFile("projects.json", Buffer.from(JSON.stringify(data.projects)));
  }

  // Save the zip file
  const zipPath = path.join(testDir, "test-export.zip");
  zip.writeZip(zipPath);

  return zipPath;
}

describe("ZipProcessor", () => {
  let testDir;
  let zipProcessor;

  beforeAll(async () => {
    // Create a temporary directory for test files
    testDir = path.join(__dirname, ".tmp");
    await fs.ensureDir(testDir);

    // Create a ZipProcessor instance
    zipProcessor = new ZipProcessor(mockLogger);
  });

  afterAll(async () => {
    // Clean up the temporary directory
    await fs.remove(testDir);
  });

  beforeEach(() => {
    // Clear mock calls
    jest.clearAllMocks();
  });

  test("should process a valid zip file", async () => {
    // Create test data
    const testData = {
      conversations: [
        {
          uuid: "test-uuid-1",
          name: "Test Conversation 1",
          created_at: "2025-01-01T12:00:00Z",
          updated_at: "2025-01-01T12:30:00Z",
          account: { uuid: "test-account-uuid" },
          chat_messages: [
            {
              uuid: "test-message-uuid-1",
              text: "Hello, Claude!",
              sender: "human",
              created_at: "2025-01-01T12:00:00Z",
              updated_at: "2025-01-01T12:00:00Z",
            },
            {
              uuid: "test-message-uuid-2",
              text: "Hello! How can I help you today?",
              sender: "assistant",
              created_at: "2025-01-01T12:00:05Z",
              updated_at: "2025-01-01T12:00:05Z",
            },
          ],
        },
      ],
      users: [
        {
          uuid: "test-user-uuid",
          full_name: "Test User",
          email_address: "test@example.com",
        },
      ],
      projects: [
        {
          uuid: "test-project-uuid",
          name: "Test Project",
          description: "A test project",
          created_at: "2025-01-01T11:00:00Z",
          updated_at: "2025-01-01T11:00:00Z",
          creator: {
            uuid: "test-user-uuid",
            full_name: "Test User",
          },
        },
      ],
    };

    // Create a test zip file
    const zipPath = await createTestZip(testDir, testData);

    // Process the zip file
    const result = await zipProcessor.process(zipPath);

    // Verify the result
    expect(result).toHaveProperty("conversations");
    expect(result).toHaveProperty("users");
    expect(result).toHaveProperty("projects");

    expect(result.conversations).toHaveLength(1);
    expect(result.users).toHaveLength(1);
    expect(result.projects).toHaveLength(1);

    expect(result.conversations[0].uuid).toBe("test-uuid-1");
    expect(result.users[0].uuid).toBe("test-user-uuid");
    expect(result.projects[0].uuid).toBe("test-project-uuid");

    // Verify that logger was called
    expect(mockLogger.debug).toHaveBeenCalled();
  });

  test("should handle missing files gracefully", async () => {
    // Create test data with only conversations
    const testData = {
      conversations: [
        {
          uuid: "test-uuid-1",
          name: "Test Conversation 1",
          created_at: "2025-01-01T12:00:00Z",
          updated_at: "2025-01-01T12:30:00Z",
          account: { uuid: "test-account-uuid" },
          chat_messages: [],
        },
      ],
    };

    // Create a test zip file
    const zipPath = await createTestZip(testDir, testData);

    // Process the zip file
    const result = await zipProcessor.process(zipPath);

    // Verify the result
    expect(result).toHaveProperty("conversations");
    expect(result).toHaveProperty("users");
    expect(result).toHaveProperty("projects");

    expect(result.conversations).toHaveLength(1);
    expect(result.users).toHaveLength(0); // No users file
    expect(result.projects).toHaveLength(0); // No projects file

    // Verify that logger was called
    expect(mockLogger.debug).toHaveBeenCalled();
  });

  test("should throw an error if conversations.json is missing", async () => {
    // Create test data without conversations
    const testData = {
      users: [
        {
          uuid: "test-user-uuid",
          full_name: "Test User",
          email_address: "test@example.com",
        },
      ],
    };

    // Create a test zip file
    const zipPath = await createTestZip(testDir, testData);

    // Process the zip file and expect an error
    await expect(zipProcessor.process(zipPath)).rejects.toThrow(
      "Missing conversations.json"
    );

    // Verify that error logger was called
    expect(mockLogger.error).toHaveBeenCalled();
  });
});
