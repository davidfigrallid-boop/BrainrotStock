/**
 * Routes API pour la gestion des Giveaways
 * GET, POST, PUT, DELETE
 */

const express = require('express');
const router = express.Router();
const { giveawayService } = require('../../services');
const { authMiddleware } = require('../middleware/auth');
const logger = require('../../core/logger');

/**
 * GET /api/giveaways/:serverId
 * Récupère tous les giveaways d'un serveur
 */
router.get('/:serverId', authMiddleware, async (req, res, next) => {
  try {
    const { serverId } = req.params;
    const giveaways = await giveawayService.getAll(serverId);
    res.json(giveaways);
  } catch (error) {
    logger.error('Erreur récupération giveaways', error);
    next(error);
  }
});

/**
 * GET /api/giveaways/:serverId/:id
 * Récupère un giveaway spécifique
 */
router.get('/:serverId/:id', authMiddleware, async (req, res, next) => {
  try {
    const { serverId, id } = req.params;
    const giveaway = await giveawayService.getById(id);
    
    if (!giveaway || giveaway.server_id !== serverId) {
      return res.status(404).json({ error: 'Giveaway non trouvé' });
    }
    
    res.json(giveaway);
  } catch (error) {
    logger.error('Erreur récupération giveaway', error);
    next(error);
  }
});

/**
 * POST /api/giveaways/:serverId
 * Crée un nouveau giveaway
 */
router.post('/:serverId', authMiddleware, async (req, res, next) => {
  try {
    const { serverId } = req.params;
    const { messageId, channelId, prize, winners_count, duration } = req.body;

    // Validation
    if (!prize || !winners_count) {
      return res.status(400).json({ 
        error: 'Validation échouée',
        message: 'prize et winners_count sont requis'
      });
    }

    // Générer messageId et channelId s'ils ne sont pas fournis (pour l'interface web)
    const finalMessageId = messageId || `web-${Date.now()}`;
    const finalChannelId = channelId || 'web-panel';

    // Calculer endTime à partir de duration (en minutes)
    const durationMinutes = duration || 60;
    const endTime = Math.floor((Date.now() + durationMinutes * 60 * 1000) / 1000);

    const giveaway = await giveawayService.create(serverId, {
      messageId: finalMessageId,
      channelId: finalChannelId,
      prize,
      winners_count,
      endTime
    });

    res.status(201).json(giveaway);
  } catch (error) {
    logger.error('Erreur création giveaway', error);
    next(error);
  }
});

/**
 * PUT /api/giveaways/:serverId/:id
 * Modifie un giveaway existant
 */
router.put('/:serverId/:id', authMiddleware, async (req, res, next) => {
  try {
    const { serverId, id } = req.params;
    const updates = req.body;

    const giveaway = await giveawayService.getById(id);
    if (!giveaway || giveaway.server_id !== serverId) {
      return res.status(404).json({ error: 'Giveaway non trouvé' });
    }

    // Si duration est fourni, calculer le nouvel endTime
    if (updates.duration !== undefined) {
      const durationMinutes = updates.duration;
      updates.endTime = Math.floor((Date.now() + durationMinutes * 60 * 1000) / 1000);
      delete updates.duration;
    }

    const updated = await giveawayService.update(id, updates);
    res.json(updated);
  } catch (error) {
    logger.error('Erreur modification giveaway', error);
    next(error);
  }
});

/**
 * DELETE /api/giveaways/:serverId/:id
 * Supprime un giveaway
 */
router.delete('/:serverId/:id', authMiddleware, async (req, res, next) => {
  try {
    const { serverId, id } = req.params;

    const giveaway = await giveawayService.getById(id);
    if (!giveaway || giveaway.server_id !== serverId) {
      return res.status(404).json({ error: 'Giveaway non trouvé' });
    }

    await giveawayService.delete(id);
    res.json({ message: 'Giveaway supprimé' });
  } catch (error) {
    logger.error('Erreur suppression giveaway', error);
    next(error);
  }
});

module.exports = router;
