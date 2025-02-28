#!/bin/bash

# Create Claude AI Chat Export Processor project structure
# This script creates all the directories and empty files

# Create root directories
mkdir -p src/controllers
mkdir -p src/processors
mkdir -p src/services
mkdir -p src/repositories
mkdir -p src/generators
mkdir -p src/utils
mkdir -p src/commands
mkdir -p test

# Create root files
touch index.js
touch package.json
touch README.md
touch setup.js
touch .gitignore

# Create controller files
touch src/controllers/AppController.js

# Create processor files
touch src/processors/ZipProcessor.js

# Create service files
touch src/services/DatabaseService.js

# Create repository files
touch src/repositories/BaseRepository.js
touch src/repositories/ConversationsRepository.js
touch src/repositories/ProjectsRepository.js
touch src/repositories/UsersRepository.js

# Create generator files
touch src/generators/MarkdownGenerator.js

# Create utility files
touch src/utils/logger.js
touch src/utils/cli.js
touch src/utils/fileUtils.js

# Create command files
touch src/commands/statusCommand.js

# Create test files
touch test/ZipProcessor.test.js
touch test/MarkdownGenerator.test.js

# Make the script executable
chmod +x index.js
chmod +x setup.js

echo "File structure created successfully!"
echo "You can now paste the content into each file in VS Code."