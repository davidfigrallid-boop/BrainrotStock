/**
 * Routes API REST
 * Endpoints pour gérer les brainrots, giveaways et serveurs
 */

const express = require('express');
const router = express.Router();
const logger = require('../../config/logger');

/**
 * Middleware d'authentification
 */
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token || token !== process.env.DISCORD_TOKEN) {
        return res.status(401).json({ error: 'Non authentifié' });
    }
    
    next();
};

// Appliquer l'authentification à toutes les routes
router.use(authenticate);

/**
 * GET /api/servers
 * Récupère la liste des serveurs
 */
router.get('/servers', (req, res) => {
    try {
        // À implémenter avec les données réelles du bot
        res.json({
            success: true,
            data: []
        });
    } catch (error) {
        logger.error('Erreur GET /servers:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

/**
 * GET /api/brainrots/:serverId
 * Récupère les brainrots d'un serveur
 */
router.get('/brainrots/:serverId', (req, res) => {
    try {
        const { serverId } = req.params;
        
        res.json({
            success: true,
            data: []
        });
    } catch (error) {
        logger.error('Erreur GET /brainrots:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

/**
 * POST /api/brainrots/:serverId
 * Crée un brainrot
 */
router.post('/brainrots/:serverId', (req, res) => {
    try {
        const { serverId } = req.params;
        const brainrot = req.body;
        
        res.json({
            success: true,
            message: 'Brainrot créé',
            data: brainrot
        });
    } catch (error) {
        logger.error('Erreur POST /brainrots:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

/**
 * PUT /api/brainrots/:serverId/:brainrotId
 * Met à jour un brainrot
 */
router.put('/brainrots/:serverId/:brainrotId', (req, res) => {
    try {
        const { serverId, brainrotId } = req.params;
        const updates = req.body;
        
        res.json({
            success: true,
            message: 'Brainrot mis à jour',
            data: updates
        });
    } catch (error) {
        logger.error('Erreur PUT /brainrots:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

/**
 * DELETE /api/brainrots/:serverId/:brainrotId
 * Supprime un brainrot
 */
router.delete('/brainrots/:serverId/:brainrotId', (req, res) => {
    try {
        const { serverId, brainrotId } = req.params;
        
        res.json({
            success: true,
            message: 'Brainrot supprimé'
        });
    } catch (error) {
        logger.error('Erreur DELETE /brainrots:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

/**
 * GET /api/giveaways/:serverId
 * Récupère les giveaways d'un serveur
 */
router.get('/giveaways/:serverId', (req, res) => {
    try {
        const { serverId } = req.params;
        
        res.json({
            success: true,
            data: []
        });
    } catch (error) {
        logger.error('Erreur GET /giveaways:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

/**
 * POST /api/giveaways/:serverId
 * Crée un giveaway
 */
router.post('/giveaways/:serverId', (req, res) => {
    try {
        const { serverId } = req.params;
        const giveaway = req.body;
        
        res.json({
            success: true,
            message: 'Giveaway créé',
            data: giveaway
        });
    } catch (error) {
        logger.error('Erreur POST /giveaways:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

/**
 * GET /api/stats/:serverId
 * Récupère les statistiques d'un serveur
 */
router.get('/stats/:serverId', (req, res) => {
    try {
        const { serverId } = req.params;
        
        res.json({
            success: true,
            data: {
                totalBrainrots: 0,
                totalValue: 0,
                uniqueTypes: 0,
                activeGiveaways: 0
            }
        });
    } catch (error) {
        logger.error('Erreur GET /stats:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
