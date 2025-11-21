/**
 * Routes API REST
 * Endpoints pour gérer les brainrots, giveaways et serveurs
 */

const express = require('express');
const router = express.Router();
const logger = require('../../config/logger');
const config = require('../../config');

const brainrotsService = require('../../services/brainrots');
const giveawaysService = require('../../services/giveaways');
const cryptoService = require('../../services/crypto');

/**
 * GET /api/health
 * Endpoint de santé (sans authentification)
 */
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'API BrainrotsMarket fonctionnelle',
        version: '2.0.0',
        timestamp: new Date().toISOString()
    });
});

/**
 * Middleware d'authentification
 */
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token || token !== config.discord.token) {
        return res.status(401).json({ error: 'Non authentifié' });
    }
    
    next();
};

// Appliquer l'authentification à toutes les routes sauf /health
router.use((req, res, next) => {
    if (req.path === '/health') {
        return next();
    }
    authenticate(req, res, next);
});

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
router.get('/brainrots/:serverId', async (req, res) => {
    try {
        const { serverId } = req.params;
        const brainrots = await brainrotsService.getAll(serverId);
        
        res.json({
            success: true,
            data: brainrots
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
router.post('/brainrots/:serverId', async (req, res) => {
    try {
        const { serverId } = req.params;
        const id = await brainrotsService.create(serverId, req.body);
        const brainrot = await brainrotsService.getById(id);
        
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
router.put('/brainrots/:serverId/:brainrotId', async (req, res) => {
    try {
        const { brainrotId } = req.params;
        await brainrotsService.update(brainrotId, req.body);
        const brainrot = await brainrotsService.getById(brainrotId);
        
        res.json({
            success: true,
            message: 'Brainrot mis à jour',
            data: brainrot
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
router.delete('/brainrots/:serverId/:brainrotId', async (req, res) => {
    try {
        const { brainrotId } = req.params;
        await brainrotsService.delete(brainrotId);
        
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
router.get('/giveaways/:serverId', async (req, res) => {
    try {
        const { serverId } = req.params;
        const giveaways = await giveawaysService.getAll(serverId);
        
        res.json({
            success: true,
            data: giveaways
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
router.post('/giveaways/:serverId', async (req, res) => {
    try {
        const { serverId } = req.params;
        const id = await giveawaysService.create(serverId, req.body);
        const giveaway = await giveawaysService.getById(id);
        
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
router.get('/stats/:serverId', async (req, res) => {
    try {
        const { serverId } = req.params;
        const stats = await brainrotsService.getStats(serverId);
        const activeGiveaways = await giveawaysService.getAll(serverId, true);
        
        res.json({
            success: true,
            data: {
                ...stats,
                activeGiveaways: activeGiveaways.length
            }
        });
    } catch (error) {
        logger.error('Erreur GET /stats:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

/**
 * GET /api/crypto/prices
 * Récupère tous les prix crypto
 */
router.get('/crypto/prices', async (req, res) => {
    try {
        const prices = await cryptoService.getAllPrices();
        
        res.json({
            success: true,
            data: prices
        });
    } catch (error) {
        logger.error('Erreur GET /crypto/prices:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

/**
 * POST /api/crypto/convert
 * Convertit une montant EUR en crypto
 */
router.post('/crypto/convert', async (req, res) => {
    try {
        const { amount, crypto } = req.body;
        
        if (!amount || !crypto) {
            return res.status(400).json({ error: 'Paramètres manquants' });
        }
        
        const result = await cryptoService.convertEurToCrypto(amount, crypto);
        
        res.json({
            success: true,
            data: {
                eurAmount: amount,
                crypto,
                cryptoAmount: result
            }
        });
    } catch (error) {
        logger.error('Erreur POST /crypto/convert:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

/**
 * GET /api/servers
 * Récupère la liste des serveurs où le bot est présent
 */
router.get('/servers', async (req, res) => {
    try {
        // Cette route sera appelée par le panel pour récupérer les serveurs
        // Les serveurs sont stockés en base de données
        const servers = await db.query('SELECT id, name FROM servers ORDER BY name');
        
        res.json({
            success: true,
            data: servers
        });
    } catch (error) {
        logger.error('Erreur GET /servers:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
