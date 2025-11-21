/**
 * Index centralisé des middlewares
 * Exporte tous les middlewares pour faciliter les imports
 * Requirement 1.5: THE système SHALL exporter tous les services via un fichier index.js centralisé pour faciliter les imports
 */

const { authMiddleware, adminOnly } = require('./auth');
const { errorHandler, notFoundHandler, jsonErrorHandler } = require('./errorHandler');

module.exports = {
  // Authentification
  authMiddleware,
  adminOnly,
  
  // Gestion des erreurs
  errorHandler,
  notFoundHandler,
  jsonErrorHandler
};
