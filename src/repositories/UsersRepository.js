/**
 * UsersRepository
 *
 * Repository for managing user data.
 */
const BaseRepository = require("./BaseRepository");

class UsersRepository extends BaseRepository {
  /**
   * Creates a new UsersRepository instance
   *
   * @param {Object} db - The database instance
   * @param {Object} logger - The logger instance
   */
  constructor(db, logger) {
    super(db, "users", logger);
  }

  /**
   * Find a user by email address
   *
   * @param {string} email - The email address to find
   * @returns {Promise<Object|null>} The found user or null
   */
  async findByEmail(email) {
    return (
      this.db.data.users.find((user) => user.email_address === email) || null
    );
  }

  /**
   * Find a user by name (fuzzy match)
   *
   * @param {string} name - The name to find
   * @returns {Promise<Array>} The matching users
   */
  async findByName(name) {
    const lowerName = name.toLowerCase();
    return this.db.data.users.filter(
      (user) =>
        user.full_name && user.full_name.toLowerCase().includes(lowerName)
    );
  }
}

module.exports = UsersRepository;
