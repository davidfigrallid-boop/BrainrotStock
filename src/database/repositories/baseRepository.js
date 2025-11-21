/**
 * Repository de base
 * Fournit les méthodes CRUD communes à tous les repositories
 */

const logger = require('../../core/logger');
const db = require('../connection');
const { NotFoundError, DatabaseError } = require('../../core/errors');

class BaseRepository {
  constructor(tableName) {
    this.tableName = tableName;
  }

  /**
   * Récupère tous les enregistrements
   */
  async findAll(filters = {}) {
    try {
      let sql = `SELECT * FROM ${this.tableName}`;
      const values = [];

      // Construire les conditions WHERE
      const conditions = Object.entries(filters)
        .map(([key, value]) => {
          values.push(value);
          return `${key} = ?`;
        });

      if (conditions.length > 0) {
        sql += ` WHERE ${conditions.join(' AND ')}`;
      }

      return await db.query(sql, values);
    } catch (error) {
      logger.error(`Erreur findAll ${this.tableName}:`, error);
      throw new DatabaseError(`Failed to fetch ${this.tableName}`);
    }
  }

  /**
   * Récupère un enregistrement par ID
   */
  async findById(id) {
    try {
      const result = await db.queryOne(
        `SELECT * FROM ${this.tableName} WHERE id = ?`,
        [id]
      );

      if (!result) {
        throw new NotFoundError(this.tableName, id);
      }

      return result;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error(`Erreur findById ${this.tableName}:`, error);
      throw new DatabaseError(`Failed to fetch ${this.tableName}`);
    }
  }

  /**
   * Crée un nouvel enregistrement
   */
  async create(data) {
    try {
      const columns = Object.keys(data);
      const values = Object.values(data);
      const placeholders = columns.map(() => '?').join(', ');

      const sql = `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
      const result = await db.query(sql, values);

      logger.debug(`Enregistrement créé dans ${this.tableName}:`, { id: result.insertId });
      return result.insertId;
    } catch (error) {
      logger.error(`Erreur create ${this.tableName}:`, error);
      throw new DatabaseError(`Failed to create ${this.tableName}`);
    }
  }

  /**
   * Met à jour un enregistrement
   */
  async update(id, data) {
    try {
      const updates = Object.keys(data).map(key => `${key} = ?`).join(', ');
      const values = [...Object.values(data), id];

      const sql = `UPDATE ${this.tableName} SET ${updates} WHERE id = ?`;
      const result = await db.query(sql, values);

      if (result.affectedRows === 0) {
        throw new NotFoundError(this.tableName, id);
      }

      logger.debug(`Enregistrement mis à jour dans ${this.tableName}:`, { id });
      return true;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error(`Erreur update ${this.tableName}:`, error);
      throw new DatabaseError(`Failed to update ${this.tableName}`);
    }
  }

  /**
   * Supprime un enregistrement
   */
  async delete(id) {
    try {
      const result = await db.query(
        `DELETE FROM ${this.tableName} WHERE id = ?`,
        [id]
      );

      if (result.affectedRows === 0) {
        throw new NotFoundError(this.tableName, id);
      }

      logger.debug(`Enregistrement supprimé dans ${this.tableName}:`, { id });
      return true;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error(`Erreur delete ${this.tableName}:`, error);
      throw new DatabaseError(`Failed to delete ${this.tableName}`);
    }
  }

  /**
   * Compte les enregistrements
   */
  async count(filters = {}) {
    try {
      let sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
      const values = [];

      const conditions = Object.entries(filters)
        .map(([key, value]) => {
          values.push(value);
          return `${key} = ?`;
        });

      if (conditions.length > 0) {
        sql += ` WHERE ${conditions.join(' AND ')}`;
      }

      const result = await db.queryOne(sql, values);
      return result.count;
    } catch (error) {
      logger.error(`Erreur count ${this.tableName}:`, error);
      throw new DatabaseError(`Failed to count ${this.tableName}`);
    }
  }

  /**
   * Vérifie si un enregistrement existe
   */
  async exists(id) {
    try {
      const result = await db.queryOne(
        `SELECT id FROM ${this.tableName} WHERE id = ?`,
        [id]
      );
      return !!result;
    } catch (error) {
      logger.error(`Erreur exists ${this.tableName}:`, error);
      return false;
    }
  }
}

module.exports = BaseRepository;
