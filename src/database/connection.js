/**
 * Gestion de la connexion MySQL
 * Pool de connexions pour optimiser les performances
 */

const mysql = require('mysql2/promise');
const logger = require('../core/logger');
const config = require('../core/config');
const { DatabaseError } = require('../core/errors');

class DatabaseConnection {
  constructor() {
    this.pool = null;
  }

  /**
   * Initialise le pool de connexions
   */
  async initialize() {
    try {
      logger.database('Initialisation du pool MySQL...');

      // Configuration du pool
      const poolConfig = config.database.url
        ? { uri: config.database.url }
        : {
            host: config.database.host,
            port: config.database.port,
            user: config.database.user,
            password: config.database.password,
            database: config.database.database
          };

      this.pool = mysql.createPool({
        ...poolConfig,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelayMs: 0
      });

      // Tester la connexion
      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();

      logger.success('Pool MySQL initialisé avec succès');
      return true;
    } catch (error) {
      logger.error('Erreur initialisation MySQL:', error);
      throw new DatabaseError(`Failed to initialize database: ${error.message}`);
    }
  }

  /**
   * Exécute une requête SQL
   */
  async query(sql, values = []) {
    if (!this.pool) {
      throw new DatabaseError('Database pool not initialized');
    }

    let connection;
    try {
      connection = await this.pool.getConnection();
      const [results] = await connection.execute(sql, values);
      return results;
    } catch (error) {
      logger.error('Erreur requête SQL:', { sql, error: error.message });
      throw new DatabaseError(error.message, sql);
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  /**
   * Exécute une requête et retourne une seule ligne
   */
  async queryOne(sql, values = []) {
    const results = await this.query(sql, values);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Exécute une transaction
   */
  async transaction(callback) {
    let connection;
    try {
      connection = await this.pool.getConnection();
      await connection.beginTransaction();

      const result = await callback(connection);

      await connection.commit();
      return result;
    } catch (error) {
      if (connection) {
        await connection.rollback();
      }
      logger.error('Erreur transaction:', error);
      throw new DatabaseError(`Transaction failed: ${error.message}`);
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  /**
   * Ferme le pool de connexions
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      logger.info('Pool MySQL fermé');
    }
  }

  /**
   * Obtient les statistiques du pool
   */
  getPoolStats() {
    if (!this.pool) {
      return null;
    }

    return {
      connectionLimit: this.pool.connectionLimit,
      queueLimit: this.pool.queueLimit,
      activeConnections: this.pool._allConnections?.length || 0
    };
  }
}

module.exports = new DatabaseConnection();
