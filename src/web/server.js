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
const config = require('../config');

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

        // Fichiers statiques (AVANT rate limiting)
        this.app.use(express.static(path.join(__dirname, 'public'), {
            maxAge: '1d',
            etag: false
        }));

        // Rate limiting (APRÈS fichiers statiques)
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000,
            max: 100,
            skip: (req) => req.url.startsWith('/css') || req.url.startsWith('/js') || req.url.endsWith('.html')
        });
        this.app.use(limiter);

        // CORS
        this.app.use(cors({
            origin: config.web.corsOrigin,
            credentials: true
        }));

        // Body parser
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));
    }

    /**
     * Configure les routes
     */
    setupRoutes() {
        // Routes API
        this.app.use('/api', require('./routes/api'));

        // Servir l'index.html pour les routes non-API (SPA)
        this.app.get('/', (req, res) => {
            const indexPath = path.join(__dirname, 'public/index.html');
            res.sendFile(indexPath);
        });

        // Gestion des erreurs
        this.app.use((err, req, res) => {
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
