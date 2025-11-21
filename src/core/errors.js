/**
 * Classes d'erreurs personnalisées
 * Permet une gestion d'erreurs structurée et cohérente
 */

/**
 * Erreur de validation
 */
class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.field = field;
  }
}

/**
 * Erreur d'authentification
 */
class AuthenticationError extends Error {
  constructor(message = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
    this.statusCode = 401;
  }
}

/**
 * Erreur d'autorisation
 */
class AuthorizationError extends Error {
  constructor(message = 'Access denied') {
    super(message);
    this.name = 'AuthorizationError';
    this.statusCode = 403;
  }
}

/**
 * Erreur de ressource non trouvée
 */
class NotFoundError extends Error {
  constructor(resource = 'Resource', id = null) {
    const message = id ? `${resource} with id ${id} not found` : `${resource} not found`;
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
    this.resource = resource;
    this.id = id;
  }
}

/**
 * Erreur de base de données
 */
class DatabaseError extends Error {
  constructor(message, query = null) {
    super(message);
    this.name = 'DatabaseError';
    this.statusCode = 500;
    this.query = query;
  }
}

/**
 * Erreur d'API externe
 */
class ExternalAPIError extends Error {
  constructor(service, message, statusCode = null) {
    super(`${service} API error: ${message}`);
    this.name = 'ExternalAPIError';
    this.statusCode = 503;
    this.service = service;
    this.apiStatusCode = statusCode;
  }
}

/**
 * Erreur de configuration
 */
class ConfigurationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConfigurationError';
    this.statusCode = 500;
  }
}

/**
 * Erreur de rate limit
 */
class RateLimitError extends Error {
  constructor(message = 'Too many requests') {
    super(message);
    this.name = 'RateLimitError';
    this.statusCode = 429;
  }
}

/**
 * Erreur générique du serveur
 */
class ServerError extends Error {
  constructor(message = 'Internal server error') {
    super(message);
    this.name = 'ServerError';
    this.statusCode = 500;
  }
}

module.exports = {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  DatabaseError,
  ExternalAPIError,
  ConfigurationError,
  RateLimitError,
  ServerError
};
