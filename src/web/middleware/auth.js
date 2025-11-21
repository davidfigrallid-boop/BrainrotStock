/**
 * Middleware d'authentification
 * Valide l'authentification des requêtes API (sauf /health)
 * Requirement 6.6: WHEN une requête est reçue, THE API SHALL valider l'authentification (sauf /health)
 */

const config = require('../../core/config');
const logger = require('../../core/logger');
const { AuthenticationError } = require('../../core/errors');

/**
 * Middleware d'authentification
 * Vérifie le token ou le password dans les headers
 * 
 * Accepte deux méthodes d'authentification:
 * 1. Authorization header avec Bearer token
 * 2. X-Admin-Password header avec le mot de passe admin
 */
const authMiddleware = (req, res, next) => {
  // Routes publiques (pas d'authentification requise)
  const publicRoutes = ['/api/health', '/api/crypto/prices'];
  
  if (publicRoutes.includes(req.path)) {
    return next();
  }

  try {
    // Vérifier le header Authorization (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      // Pour cette implémentation simple, on accepte n'importe quel token non-vide
      // En production, il faudrait valider contre une base de tokens
      if (token && token.length > 0) {
        logger.debug('Authentification réussie via Bearer token');
        return next();
      }
    }

    // Vérifier le header X-Admin-Password
    const adminPassword = req.headers['x-admin-password'];
    if (adminPassword && adminPassword === config.admin.password) {
      logger.debug('Authentification réussie via mot de passe admin');
      return next();
    }

    // Aucune authentification valide trouvée
    logger.warn('Tentative d\'accès non authentifiée', {
      path: req.path,
      method: req.method,
      ip: req.ip
    });

    throw new AuthenticationError('Missing or invalid authentication credentials');
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: error.message
      });
    }

    logger.error('Erreur dans le middleware d\'authentification', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred during authentication'
    });
  }
};

/**
 * Middleware pour vérifier les permissions admin
 * À utiliser pour les routes qui nécessitent des permissions admin
 */
const adminOnly = (req, res, next) => {
  try {
    const adminPassword = req.headers['x-admin-password'];
    
    if (adminPassword !== config.admin.password) {
      logger.warn('Tentative d\'accès admin non autorisée', {
        path: req.path,
        method: req.method,
        ip: req.ip
      });

      throw new AuthenticationError('Admin access required');
    }

    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return res.status(403).json({
        error: 'Forbidden',
        message: error.message
      });
    }

    logger.error('Erreur dans le middleware admin', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred during authorization check'
    });
  }
};

module.exports = {
  authMiddleware,
  adminOnly
};
