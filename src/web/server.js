/**
 * Serveur Express - Configuration et initialisation
 * Gère les middlewares, les routes et la sécurité
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');
const config = require('../core/config');
const logger = require('../core/logger');

class WebServer {
  constructor() {
    this.app = express();
    this.port = config.web.port;
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Configure tous les middlewares
   */
  setupMiddleware() {
    // Sécurité - Headers HTTP
    this.app.use(helmet());

    // Servir les fichiers statiques (AVANT rate limiting pour éviter de limiter les assets)
    this.app.use(express.static(path.join(__dirname, 'public'), {
      maxAge: '1d',
      etag: false
    }));

    // Rate limiting - 100 requêtes par 15 minutes
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // 100 requêtes
      message: 'Trop de requêtes, veuillez réessayer plus tard',
      standardHeaders: true, // Retourner les infos de rate limit dans les headers
      legacyHeaders: false, // Désactiver les headers X-RateLimit-*
      skip: (req) => {
        // Ne pas limiter les fichiers statiques et /health
        return req.url.startsWith('/css') || 
               req.url.startsWith('/js') || 
               req.url.startsWith('/images') ||
               req.url.endsWith('.html') ||
               req.url === '/api/health';
      }
    });
    this.app.use('/api', limiter);

    // CORS - Autoriser les requêtes cross-origin
    this.app.use(cors({
      origin: config.web.corsOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // Body parser - JSON et URL-encoded
    this.app.use(bodyParser.json({ limit: '10mb' }));
    this.app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

    // Middleware de logging des requêtes
    this.app.use((req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        logger.api(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
      });
      next();
    });
  }

  /**
   * Configure les routes
   */
  setupRoutes() {
    // Routes API
    this.app.use('/api/brainrots', require('./routes/brainrots'));
    this.app.use('/api/giveaways', require('./routes/giveaways'));
    this.app.use('/api/crypto', require('./routes/crypto'));
    this.app.use('/api/stats', require('./routes/stats'));
    this.app.use('/api/health', require('./routes/health'));

    // Servir index.html pour les routes non-API (SPA)
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'public/index.html'));
    });

    // Catch-all pour les routes non trouvées
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'Route non trouvée',
        path: req.path,
        method: req.method
      });
    });
  }

  /**
   * Configure la gestion des erreurs
   */
  setupErrorHandling() {
    // Middleware de gestion des erreurs (DOIT être en dernier)
    this.app.use((err, req, res, next) => {
      logger.error('Erreur serveur', err);

      // Erreur de validation
      if (err.status === 400) {
        return res.status(400).json({
          error: 'Erreur de validation',
          message: err.message
        });
      }

      // Erreur d'authentification
      if (err.status === 401) {
        return res.status(401).json({
          error: 'Non authentifié',
          message: err.message
        });
      }

      // Erreur de ressource non trouvée
      if (err.status === 404) {
        return res.status(404).json({
          error: 'Ressource non trouvée',
          message: err.message
        });
      }

      // Erreur serveur générique
      res.status(err.status || 500).json({
        error: 'Erreur serveur',
        message: config.isDevelopment ? err.message : 'Une erreur est survenue'
      });
    });
  }

  /**
   * Démarre le serveur
   */
  start() {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.port, () => {
          logger.success(`Serveur web lancé sur http://localhost:${this.port}`);
          resolve(this.server);
        });
      } catch (error) {
        logger.error('Erreur au démarrage du serveur web', error);
        reject(error);
      }
    });
  }

  /**
   * Arrête le serveur
   */
  stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          logger.info('Serveur web arrêté');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Retourne l'instance Express
   */
  getApp() {
    return this.app;
  }
}

module.exports = WebServer;
