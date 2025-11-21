/**
 * Routes API pour la gestion des Brainrots
 * GET, POST, PUT, DELETE
 */

const express = require('express');
const router = express.Router();
const { brainrotService } = require('../../services');
const { authMiddleware } = require('../middleware/auth');
const logger = require('../../core/logger');

/**
 * GET /api/brainrots/:serverId
 * Récupère tous les brainrots d'un serveur
 */
router.get('/:serverId', authMiddleware, async (req, res, next) => {
  try {
    const { serverId } = req.params;
    const brainrots = await brainrotService.getAll(serverId);
    res.json(brainrots);
  } catch (error) {
    logger.error('Erreur récupération brainrots', error);
    next(error);
  }
});

/**
 * GET /api/brainrots/:serverId/:id
 * Récupère un brainrot spécifique
 */
router.get('/:serverId/:id', authMiddleware, async (req, res, next) => {
  try {
    const { serverId, id } = req.params;
    const brainrot = await brainrotService.getById(id);
    
    if (!brainrot || brainrot.server_id !== serverId) {
      return res.status(404).json({ error: 'Brainrot non trouvé' });
    }
    
    res.json(brainrot);
  } catch (error) {
    logger.error('Erreur récupération brainrot', error);
    next(error);
  }
});

/**
 * POST /api/brainrots/:serverId
 * Crée un nouveau brainrot
 */
router.post('/:serverId', authMiddleware, async (req, res, next) => {
  try {
    const { serverId } = req.params;
    const { name, rarity, mutation, incomeRate, priceEUR, compte, traits, quantite } = req.body;

    // Validation
    if (!name || !rarity || !mutation) {
      return res.status(400).json({ 
        error: 'Validation échouée',
        message: 'name, rarity et mutation sont requis'
      });
    }

    const brainrot = await brainrotService.create(serverId, {
      name,
      rarity,
      mutation,
      incomeRate: incomeRate || 0,
      priceEUR: priceEUR || 0,
      compte: compte || '',
      traits: traits || [],
      quantite: quantite || 1
    });

    res.status(201).json(brainrot);
  } catch (error) {
    logger.error('Erreur création brainrot', error);
    next(error);
  }
});

/**
 * PUT /api/brainrots/:serverId/:id
 * Modifie un brainrot existant
 */
router.put('/:serverId/:id', authMiddleware, async (req, res, next) => {
  try {
    const { serverId, id } = req.params;
    const updates = req.body;

    const brainrot = await brainrotService.getById(id);
    if (!brainrot || brainrot.server_id !== serverId) {
      return res.status(404).json({ error: 'Brainrot non trouvé' });
    }

    const updated = await brainrotService.update(id, updates);
    res.json(updated);
  } catch (error) {
    logger.error('Erreur modification brainrot', error);
    next(error);
  }
});

/**
 * DELETE /api/brainrots/:serverId/:id
 * Supprime un brainrot
 */
router.delete('/:serverId/:id', authMiddleware, async (req, res, next) => {
  try {
    const { serverId, id } = req.params;

    const brainrot = await brainrotService.getById(id);
    if (!brainrot || brainrot.server_id !== serverId) {
      return res.status(404).json({ error: 'Brainrot non trouvé' });
    }

    await brainrotService.delete(id);
    res.json({ message: 'Brainrot supprimé' });
  } catch (error) {
    logger.error('Erreur suppression brainrot', error);
    next(error);
  }
});

module.exports = router;
