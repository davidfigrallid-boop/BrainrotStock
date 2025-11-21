/**
 * Routes API pour les statistiques
 * GET /api/stats/:serverId
 */

const express = require('express');
const router = express.Router();
const { brainrotService, giveawayService } = require('../../services');
const { authMiddleware } = require('../middleware/auth');
const logger = require('../../core/logger');

/**
 * GET /api/stats/:serverId
 * Récupère les statistiques d'un serveur
 */
router.get('/:serverId', authMiddleware, async (req, res, next) => {
  try {
    const { serverId } = req.params;

    // Récupérer les statistiques des brainrots
    const brainrotStats = await brainrotService.getStats(serverId);
    
    // Récupérer les giveaways actifs
    const allGiveaways = await giveawayService.getAll(serverId);
    const activeGiveaways = allGiveaways.filter(g => !g.ended);
    const completedGiveaways = allGiveaways.filter(g => g.ended);

    res.json({
      brainrots: brainrotStats,
      giveaways: {
        total: allGiveaways.length,
        active: activeGiveaways.length,
        completed: completedGiveaways.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Erreur récupération statistiques', error);
    next(error);
  }
});

module.exports = router;
