/**
 * Routes API pour la santé de l'application
 * GET /api/health
 */

const express = require('express');
const router = express.Router();
const databaseConnection = require('../../database/connection');
const logger = require('../../core/logger');

/**
 * GET /api/health
 * Vérifie la santé de l'application et de ses dépendances
 * Ne nécessite pas d'authentification
 */
router.get('/', async (req, res, next) => {
  try {
    const startTime = Date.now();
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {}
    };

    // Vérifier la base de données
    try {
      const connection = await databaseConnection.pool.getConnection();
      await connection.ping();
      connection.release();

      health.checks.database = {
        status: 'healthy',
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      health.status = 'degraded';
      health.checks.database = {
        status: 'unhealthy',
        error: error.message
      };
      logger.warn('Database health check failed', error);
    }

    // Déterminer le code HTTP basé sur le statut global
    const statusCode = health.status === 'healthy' ? 200 : 503;

    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Erreur health check', error);
    next(error);
  }
});

module.exports = router;
