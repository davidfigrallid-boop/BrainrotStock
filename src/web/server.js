/**
 * Serveur Web Panel Admin
 * API REST et interface web pour gérer le bot
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('../config/logger');

class WebServer {
    constructor(port = 3000) {
        this.app = express();
        this.port = port;
        this.setupMiddleware();
        this.setupRoutes();
    }

    /**
     * Configure les middlewares
     */
    setupMiddleware() {
        // Sécurité
        this.app.use(helmet());

        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000,
            max: 100
        });
        this.app.use(limiter);

        // CORS
        this.app.use(cors({
            origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
            credentials: true
        }));

        // Body parser
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));

        // Fichiers statiques
        this.app.use(express.static(path.join(__dirname, '../web/public')));
    }

    /**
     * Configure les routes
     */
    setupRoutes() {
        // Routes API
        this.app.use('/api', require('./routes/api'));

        // Servir l'index.html pour les routes non-API
        this.app.get('*', (req, res) => {
            res.sendFile(path.join(__dirname, '../web/public/index.html'));
        });

        // Gestion des erreurs
        this.app.use((err, req, res, next) => {
            logger.error('Erreur serveur:', err);
            res.status(500).json({ error: 'Erreur serveur' });
        });
    }

    /**
     * Démarre le serveur
     */
    start() {
        this.app.listen(this.port, () => {
            logger.success(`🌐 Panel web lancé sur http://localhost:${this.port}`);
        });
    }
}

module.exports = WebServer;
