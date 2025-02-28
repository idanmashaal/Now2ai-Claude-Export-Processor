/**
 * Tests for the MarkdownGenerator
 */

const MarkdownGenerator = require("../src/generators/MarkdownGenerator");

// Mock logger
const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

describe("MarkdownGenerator", () => {
  let markdownGenerator;

  beforeEach(() => {
    // Create a MarkdownGenerator instance
    markdownGenerator = new MarkdownGenerator(mockLogger);

    // Clear mock calls
    jest.clearAllMocks();
  });

  test("should generate markdown for a conversation", async () => {
    // Create test conversation
    const conversation = {
      uuid: "test-uuid-1",
      name: "Test Conversation",
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
    };

    // Generate markdown
    const markdown = await markdownGenerator.generate(conversation);

    // Verify the markdown
    expect(markdown).toContain("# Test Conversation");
    expect(markdown).toContain("## Metadata");
    expect(markdown).toContain("**Created at**");
    expect(markdown).toContain("**Last updated**");
    expect(markdown).toContain("**Account UUID**");

    expect(markdown).toContain("## User");
    expect(markdown).toContain("Hello, Claude!");

    expect(markdown).toContain("## Claude");
    expect(markdown).toContain("Hello! How can I help you today?");

    expect(markdown).toContain(
      "Original conversation: https://claude.ai/chat/test-uuid-1"
    );

    // Verify that logger was called
    expect(mockLogger.debug).toHaveBeenCalled();
  });

  test("should handle conversations without a name", async () => {
    // Create test conversation without a name
    const conversation = {
      uuid: "test-uuid-2",
      created_at: "2025-01-01T12:00:00Z",
      updated_at: "2025-01-01T12:30:00Z",
      account: { uuid: "test-account-uuid" },
      chat_messages: [
        {
          uuid: "test-message-uuid-1",
          text: "What is the meaning of life?",
          sender: "human",
          created_at: "2025-01-01T12:00:00Z",
          updated_at: "2025-01-01T12:00:00Z",
        },
      ],
    };

    // Generate markdown
    const markdown = await markdownGenerator.generate(conversation);

    // Verify that the markdown uses the first message as the title
    expect(markdown).toContain("# What is the meaning of life?");

    // Verify that logger was called
    expect(mockLogger.debug).toHaveBeenCalled();
  });

  test("should handle conversations with code blocks", async () => {
    // Create test conversation with code blocks
    const conversation = {
      uuid: "test-uuid-3",
      name: "Code Examples",
      created_at: "2025-01-01T12:00:00Z",
      updated_at: "2025-01-01T12:30:00Z",
      account: { uuid: "test-account-uuid" },
      chat_messages: [
        {
          uuid: "test-message-uuid-1",
          text: "Can you show me some JavaScript code?",
          sender: "human",
          created_at: "2025-01-01T12:00:00Z",
          updated_at: "2025-01-01T12:00:00Z",
        },
        {
          uuid: "test-message-uuid-2",
          text: 'Here is a simple JavaScript function:\n\n```javascript\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\n\nconsole.log(greet("World"));\n```\n\nThis will output: `Hello, World!`',
          sender: "assistant",
          created_at: "2025-01-01T12:00:05Z",
          updated_at: "2025-01-01T12:00:05Z",
        },
      ],
    };

    // Generate markdown
    const markdown = await markdownGenerator.generate(conversation);

    // Verify that the code block is preserved
    expect(markdown).toContain("```javascript");
    expect(markdown).toContain("function greet(name)");
    expect(markdown).toContain("```");

    // Verify that logger was called
    expect(mockLogger.debug).toHaveBeenCalled();
  });

  test("should handle RTL text", async () => {
    // Create test conversation with RTL text
    const conversation = {
      uuid: "test-uuid-4",
      name: "RTL Example",
      created_at: "2025-01-01T12:00:00Z",
      updated_at: "2025-01-01T12:30:00Z",
      account: { uuid: "test-account-uuid" },
      chat_messages: [
        {
          uuid: "test-message-uuid-1",
          text: "מה שלומך?", // Hebrew "How are you?"
          sender: "human",
          created_at: "2025-01-01T12:00:00Z",
          updated_at: "2025-01-01T12:00:00Z",
        },
      ],
    };

    // Mock the detectTextDirection method to simulate RTL detection
    markdownGenerator.detectTextDirection = jest.fn().mockReturnValue("rtl");

    // Generate markdown
    const markdown = await markdownGenerator.generate(conversation);

    // Verify that the RTL text is wrapped in a div with dir="rtl"
    expect(markdown).toContain('<div dir="rtl">');
    expect(markdown).toContain("</div>");

    // Verify that logger was called
    expect(mockLogger.debug).toHaveBeenCalled();
  });

  test("should handle tool use content", async () => {
    // Create test conversation with tool use
    const conversation = {
      uuid: "test-uuid-5",
      name: "Tool Use Example",
      created_at: "2025-01-01T12:00:00Z",
      updated_at: "2025-01-01T12:30:00Z",
      account: { uuid: "test-account-uuid" },
      chat_messages: [
        {
          uuid: "test-message-uuid-1",
          text: "",
          sender: "assistant",
          created_at: "2025-01-01T12:00:00Z",
          updated_at: "2025-01-01T12:00:00Z",
          content: [
            {
              type: "tool_use",
              name: "calculator",
              input: { expression: "2 + 2" },
            },
            {
              type: "tool_result",
              name: "calculator",
              content: "4",
              is_error: false,
            },
          ],
        },
      ],
    };

    // Generate markdown
    const markdown = await markdownGenerator.generate(conversation);

    // Verify that the tool use is included
    expect(markdown).toContain("### Tool Use: calculator");
    expect(markdown).toContain("### Tool Result: calculator");

    // Verify that logger was called
    expect(mockLogger.debug).toHaveBeenCalled();
  });

  test("should handle attachments", async () => {
    // Create test conversation with attachments
    const conversation = {
      uuid: "test-uuid-6",
      name: "Attachment Example",
      created_at: "2025-01-01T12:00:00Z",
      updated_at: "2025-01-01T12:30:00Z",
      account: { uuid: "test-account-uuid" },
      chat_messages: [
        {
          uuid: "test-message-uuid-1",
          text: "Here is a document.",
          sender: "human",
          created_at: "2025-01-01T12:00:00Z",
          updated_at: "2025-01-01T12:00:00Z",
          attachments: [
            {
              file_name: "test.pdf",
              file_type: "pdf",
              file_size: 1024,
              extracted_content: "This is a test PDF document.",
            },
          ],
        },
      ],
    };

    // Generate markdown
    const markdown = await markdownGenerator.generate(conversation);

    // Verify that the attachment is included
    expect(markdown).toContain("### Attachments");
    expect(markdown).toContain("test.pdf");
    expect(markdown).toContain("This is a test PDF document.");

    // Verify that logger was called
    expect(mockLogger.debug).toHaveBeenCalled();
  });
});
