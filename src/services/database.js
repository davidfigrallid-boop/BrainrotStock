/**
 * Service de gestion de la base de données MySQL
 * Gère la connexion et les opérations de base
 */

const mysql = require('mysql2/promise');
const logger = require('../config/logger');
const config = require('../config');

class DatabaseService {
    constructor() {
        this.pool = null;
    }

    /**
     * Initialise la connexion à la base de données
     */
    async initialize() {
        try {
            logger.database('Connexion à MySQL...');
            
            // Utiliser MYSQL_PUBLIC_URL si disponible (Railway), sinon config individuelle
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
                queueLimit: 0
            });

            // Tester la connexion
            const connection = await this.pool.getConnection();
            await connection.ping();
            connection.release();

            logger.success('Connexion MySQL établie');
            return true;
        } catch (error) {
            logger.error('Erreur connexion MySQL:', error);
            throw error;
        }
    }

    /**
     * Exécute une requête SQL
     */
    async query(sql, values = []) {
        try {
            const connection = await this.pool.getConnection();
            const [results] = await connection.execute(sql, values);
            connection.release();
            return results;
        } catch (error) {
            logger.error('Erreur requête SQL:', { sql, error: error.message });
            throw error;
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
     * Ferme la connexion
     */
    async close() {
        if (this.pool) {
            await this.pool.end();
            logger.info('Connexion MySQL fermée');
        }
    }
}

// Instance singleton
const db = new DatabaseService();

module.exports = db;
