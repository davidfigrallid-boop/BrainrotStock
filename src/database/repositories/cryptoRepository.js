/**
 * Repository pour les Prix Crypto
 * Gère l'accès aux données des prix crypto
 */

const BaseRepository = require('./baseRepository');
const db = require('../connection');
const logger = require('../../core/logger');
const { DatabaseError } = require('../../core/errors');

class CryptoRepository extends BaseRepository {
  constructor() {
    super('crypto_prices');
  }

  /**
   * Récupère le prix d'une crypto par symbole
   */
  async findBySymbol(symbol) {
    try {
      const result = await db.queryOne(
        'SELECT * FROM crypto_prices WHERE crypto = ?',
        [symbol]
      );
      return result || null;
    } catch (error) {
      logger.error('Erreur findBySymbol crypto:', error);
      throw new DatabaseError('Failed to fetch crypto price');
    }
  }

  /**
   * Récupère tous les prix crypto
   */
  async findAll() {
    try {
      const results = await db.query('SELECT * FROM crypto_prices ORDER BY crypto');
      return results;
    } catch (error) {
      logger.error('Erreur findAll crypto:', error);
      throw new DatabaseError('Failed to fetch crypto prices');
    }
  }

  /**
   * Crée ou met à jour un prix crypto
   */
  async upsert(symbol, priceEur, priceUsd) {
    try {
      const result = await db.query(
        `INSERT INTO crypto_prices (crypto, price_eur, price_usd)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          price_eur = ?,
          price_usd = ?,
          updated_at = CURRENT_TIMESTAMP`,
        [symbol, priceEur, priceUsd, priceEur, priceUsd]
      );

      logger.debug(`Prix crypto mis à jour: ${symbol} = €${priceEur}`);
      return result.insertId || true;
    } catch (error) {
      logger.error('Erreur upsert crypto:', error);
      throw new DatabaseError('Failed to save crypto price');
    }
  }

  /**
   * Récupère les prix mis à jour récemment
   */
  async findRecent(minutes = 5) {
    try {
      const results = await db.query(
        `SELECT * FROM crypto_prices 
        WHERE updated_at > DATE_SUB(NOW(), INTERVAL ? MINUTE)
        ORDER BY crypto`,
        [minutes]
      );
      return results;
    } catch (error) {
      logger.error('Erreur findRecent crypto:', error);
      throw new DatabaseError('Failed to fetch recent crypto prices');
    }
  }

  /**
   * Supprime les prix expirés
   */
  async deleteOld(days = 30) {
    try {
      const result = await db.query(
        `DELETE FROM crypto_prices 
        WHERE updated_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
        [days]
      );

      logger.debug(`Anciens prix crypto supprimés: ${result.affectedRows} lignes`);
      return result.affectedRows;
    } catch (error) {
      logger.error('Erreur deleteOld crypto:', error);
      throw new DatabaseError('Failed to delete old crypto prices');
    }
  }
}

module.exports = new CryptoRepository();
