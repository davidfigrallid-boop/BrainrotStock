/**
 * Migrations de base de données
 * Crée les tables nécessaires au démarrage
 */

const logger = require('../config/logger');
const db = require('../services/database');

/**
 * Crée toutes les tables nécessaires
 */
async function runMigrations() {
    try {
        logger.info('Exécution des migrations...');

        // Table des serveurs
        await db.query(`
            CREATE TABLE IF NOT EXISTS servers (
                id VARCHAR(20) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                prefix VARCHAR(10) DEFAULT '/',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Table des brainrots
        await db.query(`
            CREATE TABLE IF NOT EXISTS brainrots (
                id INT AUTO_INCREMENT PRIMARY KEY,
                server_id VARCHAR(20) NOT NULL,
                name VARCHAR(255) NOT NULL,
                rarity VARCHAR(50) NOT NULL,
                mutation VARCHAR(50) NOT NULL DEFAULT 'Default',
                income_rate BIGINT NOT NULL,
                price_eur BIGINT NOT NULL,
                compte VARCHAR(255),
                traits JSON,
                quantite INT DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,
                INDEX idx_server_rarity (server_id, rarity),
                INDEX idx_server_mutation (server_id, mutation)
            )
        `);

        // Table des giveaways
        await db.query(`
            CREATE TABLE IF NOT EXISTS giveaways (
                id INT AUTO_INCREMENT PRIMARY KEY,
                server_id VARCHAR(20) NOT NULL,
                message_id VARCHAR(20) NOT NULL,
                channel_id VARCHAR(20) NOT NULL,
                prize VARCHAR(255) NOT NULL,
                winners_count INT DEFAULT 1,
                end_time BIGINT NOT NULL,
                ended BOOLEAN DEFAULT FALSE,
                winners JSON,
                participants JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,
                INDEX idx_server_ended (server_id, ended),
                INDEX idx_end_time (end_time)
            )
        `);

        // Table du cache des prix crypto
        await db.query(`
            CREATE TABLE IF NOT EXISTS crypto_prices (
                id INT AUTO_INCREMENT PRIMARY KEY,
                crypto VARCHAR(10) NOT NULL UNIQUE,
                price_eur DECIMAL(20, 8) NOT NULL,
                price_usd DECIMAL(20, 8) NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_crypto (crypto)
            )
        `);

        logger.success('Migrations exécutées avec succès');
        return true;
    } catch (error) {
        logger.error('Erreur lors des migrations:', error);
        throw error;
    }
}

module.exports = {
    runMigrations
};
