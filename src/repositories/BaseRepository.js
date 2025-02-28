/**
 * BaseRepository
 *
 * Base class for data repositories with common CRUD operations.
 */
class BaseRepository {
  /**
   * Creates a new BaseRepository instance
   *
   * @param {Object} db - The database instance
   * @param {string} collection - The name of the collection
   * @param {Object} logger - The logger instance
   */
  constructor(db, collection, logger) {
    this.db = db;
    this.collection = collection;
    this.logger = logger;
  }

  /**
   * Find all items in the collection
   *
   * @returns {Promise<Array>} All items in the collection
   */
  async findAll() {
    return this.db.data[this.collection] || [];
  }

  /**
   * Find an item by uuid
   *
   * @param {string} uuid - The uuid to find
   * @returns {Promise<Object|null>} The found item or null
   */
  async findByUuid(uuid) {
    return (
      this.db.data[this.collection].find((item) => item.uuid === uuid) || null
    );
  }

  /**
   * Count items in the collection
   *
   * @returns {Promise<number>} The number of items
   */
  async count() {
    return this.db.data[this.collection].length;
  }

  /**
   * Insert an item into the collection
   *
   * @param {Object} item - The item to insert
   * @returns {Promise<Object>} The inserted item
   */
  async insert(item) {
    this.db.data[this.collection].push(item);
    await this.db.write();
    return item;
  }

  /**
   * Update an item in the collection
   *
   * @param {string} uuid - The uuid of the item to update
   * @param {Object} updates - The updates to apply
   * @returns {Promise<Object|null>} The updated item or null
   */
  async update(uuid, updates) {
    const index = this.db.data[this.collection].findIndex(
      (item) => item.uuid === uuid
    );

    if (index === -1) {
      return null;
    }

    const updatedItem = {
      ...this.db.data[this.collection][index],
      ...updates,
    };

    this.db.data[this.collection][index] = updatedItem;
    await this.db.write();

    return updatedItem;
  }

  /**
   * Delete an item from the collection
   *
   * @param {string} uuid - The uuid of the item to delete
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async delete(uuid) {
    const index = this.db.data[this.collection].findIndex(
      (item) => item.uuid === uuid
    );

    if (index === -1) {
      return false;
    }

    this.db.data[this.collection].splice(index, 1);
    await this.db.write();

    return true;
  }

  /**
   * Check if an item exists
   *
   * @param {string} uuid - The uuid to check
   * @returns {Promise<boolean>} True if exists, false otherwise
   */
  async exists(uuid) {
    return this.db.data[this.collection].some((item) => item.uuid === uuid);
  }

  /**
   * Insert or update an item in the collection
   *
   * @param {Object} item - The item to upsert
   * @returns {Promise<Object>} The upserted item
   */
  async upsert(item) {
    const exists = await this.exists(item.uuid);

    if (exists) {
      return this.update(item.uuid, item);
    } else {
      return this.insert(item);
    }
  }
}

module.exports = BaseRepository;
