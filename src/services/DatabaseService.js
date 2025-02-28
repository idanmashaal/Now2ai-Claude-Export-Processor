/**
 * DatabaseService
 *
 * Provides an interface for storing and retrieving data using LowDB.
 * Handles data persistence and indexing.
 */

const fs = require("fs-extra");
const path = require("path");
const { Low } = require("lowdb");
const { JSONFile } = require("lowdb/node");
const lodash = require("lodash");

// Import repository classes
const UsersRepository = require("../repositories/UsersRepository");
const ProjectsRepository = require("../repositories/ProjectsRepository");
const ConversationsRepository = require("../repositories/ConversationsRepository");

class DatabaseService {
  /**
   * Creates a new DatabaseService instance
   *
   * @param {Object} options - Configuration options
   * @param {string} options.databaseDir - Directory for database storage
   * @param {Object} options.logger - Logger instance
   */
  constructor({ databaseDir, logger }) {
    this.databaseDir = databaseDir;
    this.logger = logger;

    // Database file paths
    this.usersDbPath = path.join(databaseDir, "users.json");
    this.projectsDbPath = path.join(databaseDir, "projects.json");
    this.conversationsDbPath = path.join(databaseDir, "conversations.json");
    this.metaDbPath = path.join(databaseDir, "meta.json");

    // Database instances
    this.usersDb = null;
    this.projectsDb = null;
    this.conversationsDb = null;
    this.metaDb = null;

    // Repository instances
    this.users = null;
    this.projects = null;
    this.conversations = null;
  }

  /**
   * Initialize the database
   */
  async init() {
    this.logger.debug("Initializing database");

    // Ensure the database directory exists
    await fs.ensureDir(this.databaseDir);

    // Initialize databases
    this.usersDb = await this.createDatabase(this.usersDbPath, { users: [] });
    this.projectsDb = await this.createDatabase(this.projectsDbPath, {
      projects: [],
    });
    this.conversationsDb = await this.createDatabase(this.conversationsDbPath, {
      conversations: [],
    });
    this.metaDb = await this.createDatabase(this.metaDbPath, {
      lastProcessed: null,
      version: "1.0.0",
      stats: {
        totalConversations: 0,
        totalUsers: 0,
        totalProjects: 0,
      },
    });

    // Initialize repositories
    this.users = new UsersRepository(this.usersDb, this.logger);
    this.projects = new ProjectsRepository(this.projectsDb, this.logger);
    this.conversations = new ConversationsRepository(
      this.conversationsDb,
      this.logger
    );

    // Set lodash as the helper library
    this.usersDb.chain = lodash.chain(this.usersDb.data);
    this.projectsDb.chain = lodash.chain(this.projectsDb.data);
    this.conversationsDb.chain = lodash.chain(this.conversationsDb.data);
    this.metaDb.chain = lodash.chain(this.metaDb.data);

    this.logger.debug("Database initialized");
  }

  /**
   * Create a new database instance
   *
   * @param {string} filePath - Path to the database file
   * @param {Object} defaultData - Default data structure
   * @returns {Low} The database instance
   */
  async createDatabase(filePath, defaultData) {
    // Create the database file if it doesn't exist
    if (!(await fs.pathExists(filePath))) {
      await fs.writeJSON(filePath, defaultData);
    }

    // Create the adapter
    const adapter = new JSONFile(filePath);

    // Create the database with default data
    const db = new Low(adapter, defaultData);

    // Read the database
    await db.read();

    return db;
  }

  /**
   * Update the metadata
   *
   * @param {Object} meta - Metadata to update
   */
  async updateMeta(meta) {
    this.metaDb.data = {
      ...this.metaDb.data,
      ...meta,
      lastProcessed: new Date().toISOString(),
      stats: {
        totalConversations: await this.conversations.count(),
        totalUsers: await this.users.count(),
        totalProjects: await this.projects.count(),
      },
    };

    await this.metaDb.write();
  }

  /**
   * Get the database metadata
   *
   * @returns {Object} The metadata
   */
  async getMeta() {
    return this.metaDb.data;
  }
}

module.exports = DatabaseService;
