/**
 * ProjectsRepository
 *
 * Repository for managing project data.
 */
const BaseRepository = require("./BaseRepository");

class ProjectsRepository extends BaseRepository {
  /**
   * Creates a new ProjectsRepository instance
   *
   * @param {Object} db - The database instance
   * @param {Object} logger - The logger instance
   */
  constructor(db, logger) {
    super(db, "projects", logger);
  }

  /**
   * Find projects by name (fuzzy match)
   *
   * @param {string} name - The name to find
   * @returns {Promise<Array>} The matching projects
   */
  async findByName(name) {
    const lowerName = name.toLowerCase();
    return this.db.data.projects.filter(
      (project) =>
        project.name && project.name.toLowerCase().includes(lowerName)
    );
  }

  /**
   * Find projects by creator uuid
   *
   * @param {string} creatorUuid - The creator uuid to find
   * @returns {Promise<Array>} The matching projects
   */
  async findByCreator(creatorUuid) {
    return this.db.data.projects.filter(
      (project) => project.creator && project.creator.uuid === creatorUuid
    );
  }

  /**
   * Find recent projects
   *
   * @param {number} limit - The maximum number of projects to return
   * @returns {Promise<Array>} The recent projects
   */
  async findRecent(limit = 10) {
    return [...this.db.data.projects]
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .slice(0, limit);
  }
}

module.exports = ProjectsRepository;
