/**
 * Middleware de gestion des erreurs
 * Centralise la gestion des erreurs et retourne des réponses structurées
 * Requirement 6.7: WHEN une erreur survient, THE API SHALL retourner un code HTTP approprié et un message d'erreur structuré
 */

const logger = require('../../core/logger');
const {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  DatabaseError,
  ExternalAPIError,
  ConfigurationError,
  RateLimitError,
  ServerError
} = require('../../core/errors');

/**
 * Middleware de gestion des erreurs
 * DOIT être placé en dernier dans la chaîne des middlewares
 * 
 * Gère les erreurs suivantes:
 * - ValidationError (400)
 * - AuthenticationError (401)
 * - AuthorizationError (403)
 * - NotFoundError (404)
 * - RateLimitError (429)
 * - DatabaseError (500)
 * - ExternalAPIError (503)
 * - ServerError (500)
 * - Erreurs génériques (500)
 */
const errorHandler = (err, req, res, next) => {
  // Enregistrer l'erreur
  logger.error(`${req.method} ${req.path}`, err);

  // Déterminer le code de statut et le message
  let statusCode = 500;
  let errorType = 'Internal Server Error';
  let message = 'An unexpected error occurred';
  let details = null;

  // Erreur de validation
  if (err instanceof ValidationError) {
    statusCode = 400;
    errorType = 'Validation Error';
    message = err.message;
    if (err.field) {
      details = { field: err.field };
    }
  }
  // Erreur d'authentification
  else if (err instanceof AuthenticationError) {
    statusCode = 401;
    errorType = 'Authentication Error';
    message = err.message;
  }
  // Erreur d'autorisation
  else if (err instanceof AuthorizationError) {
    statusCode = 403;
    errorType = 'Authorization Error';
    message = err.message;
  }
  // Erreur de ressource non trouvée
  else if (err instanceof NotFoundError) {
    statusCode = 404;
    errorType = 'Not Found';
    message = err.message;
    if (err.resource && err.id) {
      details = { resource: err.resource, id: err.id };
    }
  }
  // Erreur de rate limit
  else if (err instanceof RateLimitError) {
    statusCode = 429;
    errorType = 'Too Many Requests';
    message = err.message;
  }
  // Erreur de base de données
  else if (err instanceof DatabaseError) {
    statusCode = 500;
    errorType = 'Database Error';
    message = 'A database error occurred';
    // Ne pas exposer les détails de la requête en production
    if (process.env.NODE_ENV !== 'production' && err.query) {
      details = { query: err.query };
    }
  }
  // Erreur d'API externe
  else if (err instanceof ExternalAPIError) {
    statusCode = 503;
    errorType = 'External Service Error';
    message = err.message;
    details = { service: err.service };
  }
  // Erreur de configuration
  else if (err instanceof ConfigurationError) {
    statusCode = 500;
    errorType = 'Configuration Error';
    message = 'A configuration error occurred';
  }
  // Erreur serveur générique
  else if (err instanceof ServerError) {
    statusCode = err.statusCode || 500;
    errorType = 'Server Error';
    message = err.message;
  }
  // Erreur personnalisée avec statusCode
  else if (err.statusCode) {
    statusCode = err.statusCode;
    errorType = err.name || 'Error';
    message = err.message;
  }
  // Erreur générique
  else if (err instanceof Error) {
    statusCode = 500;
    errorType = err.name || 'Error';
    message = process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message;
  }

  // Construire la réponse d'erreur
  const errorResponse = {
    error: errorType,
    message: message,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  };

  // Ajouter les détails si disponibles
  if (details) {
    errorResponse.details = details;
  }

  // Ajouter la stack trace en développement
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    errorResponse.stack = err.stack;
  }

  // Envoyer la réponse
  res.status(statusCode).json(errorResponse);
};

/**
 * Middleware pour capturer les routes non trouvées
 * Doit être placé AVANT le middleware d'erreur
 */
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError('Route', req.path);
  error.statusCode = 404;
  next(error);
};

/**
 * Middleware pour valider le JSON
 * Capture les erreurs de parsing JSON
 */
const jsonErrorHandler = (err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    const validationError = new ValidationError('Invalid JSON in request body');
    return errorHandler(validationError, req, res, next);
  }
  next(err);
};

module.exports = {
  errorHandler,
  notFoundHandler,
  jsonErrorHandler
};
