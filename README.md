# Claude AI Chat Export Processor

A modular, efficient tool for processing Claude AI chat exports from zip files into a local database and generating markdown files for each conversation. The tool handles large JSON files (200MB+) and supports incremental processing.

## Features

- **Import Processing**
  - Extract and parse JSON files from Claude AI export zips
  - Process users, conversations, and projects data
  - Skip previously imported conversations for efficiency
  - Handle large files through stream processing
  - Sort processing by timestamp (descending) for efficiency

- **Database Management**
  - Store and index conversation data for quick retrieval
  - Track processed conversations to avoid duplication
  - Support metadata and relationships between entities

- **Markdown Generation**
  - Generate files with consistent naming: `YYYYMMDD_HHMMSS_name.md` or `YYYYMMDD_HHMMSS_uuid.md`
  - Include conversation metadata and original chat link
  - Support RTL/LTR text rendering automatically
  - Preserve code blocks and generated artifacts
  - Proper attribution (user's full name and "Claude")

- **Command-line Interface**
  - Configurable input/output paths
  - Option for full sync or incremental updates
  - Confirmation prompts with bypass options
  - Progress reporting and error handling

## Installation

### Prerequisites

- Node.js 14.0 or higher
- npm or yarn

### Installation Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/claude-export-processor.git
   cd claude-export-processor
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Make the CLI executable:
   ```bash
   chmod +x index.js
   ```

4. Link the package globally (optional):
   ```bash
   npm link
   ```

## Usage

### Basic Usage

Process a Claude AI export zip file:

```bash
claude-export process path/to/claude-export.zip
```

### Command-line Options

- **-o, --output \<dir\>**: Output directory for markdown files (default: `./output`)
- **-d, --database \<dir\>**: Directory for database storage (default: `./data`)
- **-i, --incremental**: Only process new conversations (default: `false`)
- **-y, --yes**: Skip confirmation prompts (default: `false`)
- **--force**: Force reprocessing of previously processed conversations (default: `false`)
- **-v, --verbose**: Enable verbose logging (default: `false`)
- **-h, --help**: Display help information
- **-V, --version**: Display version information

### Examples

Process a zip file with default settings:
```bash
claude-export process claude-export.zip
```

Process only new conversations and store markdown files in a custom directory:
```bash
claude-export process claude-export.zip -i -o ./markdown-files
```

Force reprocessing of all conversations without confirmation prompts:
```bash
claude-export process claude-export.zip --force -y
```

Enable verbose logging:
```bash
claude-export process claude-export.zip -v
```

## Architecture

The application is structured into several modular components:

### Core Modules

1. **CLI Interface**
   - Parses command-line options and arguments
   - Provides user feedback and confirmation prompts
   - Handles input validation

2. **Zip Processor**
   - Extracts JSON files from zip archives
   - Streams and processes large JSON files efficiently
   - Validates file structure and content

3. **Database Layer**
   - Provides abstract interface for data operations
   - Handles indexing and querying of conversation data
   - Manages metadata and tracking of processed items

4. **Storage Implementation**
   - File-based JSON storage with efficient indexing
   - Handles persistence with atomic operations
   - Optimized for the Node.js environment

5. **Markdown Generator**
   - Processes conversation data into markdown format
   - Handles special formatting for code blocks and artifacts
   - Supports bidirectional text (RTL/LTR)
   - Formats metadata consistently

6. **Application Controller**
   - Orchestrates the overall process flow
   - Manages error handling and recovery
   - Controls processing order and optimization

### Data Flow

1. User provides zip file through CLI
2. Application extracts and streams JSON content
3. Content is processed and stored in database
4. Database is queried to generate markdown files
5. Files are written to specified location

## Development

### Project Structure

```
claude-export-processor/
├── index.js                  # Main entry point
├── package.json              # Project configuration
├── README.md                 # Documentation
├── src/
│   ├── controllers/          # Application controllers
│   │   └── AppController.js  # Main controller
│   ├── generators/           # Content generators
│   │   └── MarkdownGenerator.js
│   ├── processors/           # Data processors
│   │   └── ZipProcessor.js
│   ├── repositories/         # Data repositories
│   │   ├── BaseRepository.js
│   │   ├── ConversationsRepository.js
│   │   ├── ProjectsRepository.js
│   │   └── UsersRepository.js
│   ├── services/             # Service layer
│   │   └── DatabaseService.js
│   └── utils/                # Utility functions
│       ├── cli.js
│       └── logger.js
└── test/                     # Test files
```

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

- Claude AI by Anthropic for the chat export format
- All the open-source libraries used in this project