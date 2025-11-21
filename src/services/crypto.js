/**
 * Service de gestion des prix crypto
 * Récupère et cache les prix depuis CoinGecko
 */

const axios = require('axios');
const logger = require('../config/logger');
const db = require('./database');
const { SUPPORTED_CRYPTOS, INTERVALS } = require('../utils/constants');

class CryptoService {
    constructor() {
        this.cache = new Map();
        this.lastUpdate = 0;
        this.updateInterval = INTERVALS.CACHE_DURATION;
    }

    /**
     * Récupère le prix d'une crypto en EUR
     */
    async getPriceEur(cryptoSymbol) {
        try {
            // Vérifier le cache en mémoire
            if (this.cache.has(cryptoSymbol)) {
                const cached = this.cache.get(cryptoSymbol);
                if (Date.now() - cached.timestamp < this.updateInterval) {
                    return cached.price;
                }
            }

            // Vérifier la base de données
            const dbPrice = await db.queryOne(
                'SELECT price_eur FROM crypto_prices WHERE crypto = ?',
                [cryptoSymbol]
            );

            if (dbPrice) {
                this.cache.set(cryptoSymbol, {
                    price: dbPrice.price_eur,
                    timestamp: Date.now()
                });
                return dbPrice.price_eur;
            }

            // Récupérer depuis l'API
            const price = await this.fetchFromCoinGecko(cryptoSymbol);
            
            // Sauvegarder en base de données
            await this.savePriceToDb(cryptoSymbol, price);
            
            // Mettre en cache
            this.cache.set(cryptoSymbol, {
                price,
                timestamp: Date.now()
            });

            return price;
        } catch (error) {
            logger.error(`Erreur récupération prix ${cryptoSymbol}:`, error);
            throw error;
        }
    }

    /**
     * Récupère le prix depuis CoinGecko
     */
    async fetchFromCoinGecko(cryptoSymbol) {
        try {
            const cryptoData = SUPPORTED_CRYPTOS[cryptoSymbol];
            if (!cryptoData) {
                throw new Error(`Crypto non supportée: ${cryptoSymbol}`);
            }

            const response = await axios.get(
                `https://api.coingecko.com/api/v3/simple/price`,
                {
                    params: {
                        ids: cryptoData.gecko,
                        vs_currencies: 'eur,usd',
                        include_market_cap: false,
                        include_24hr_vol: false,
                        include_last_updated_at: true
                    },
                    timeout: 5000
                }
            );

            const data = response.data[cryptoData.gecko];
            if (!data || !data.eur) {
                throw new Error(`Données invalides pour ${cryptoSymbol}`);
            }

            logger.crypto(`Prix ${cryptoSymbol}: €${data.eur}`);
            return data.eur;
        } catch (error) {
            logger.error(`Erreur CoinGecko ${cryptoSymbol}:`, error.message);
            throw error;
        }
    }

    /**
     * Sauvegarde le prix en base de données
     */
    async savePriceToDb(cryptoSymbol, priceEur) {
        try {
            await db.query(
                `INSERT INTO crypto_prices (crypto, price_eur, price_usd)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE price_eur = ?, updated_at = CURRENT_TIMESTAMP`,
                [cryptoSymbol, priceEur, priceEur * 1.1, priceEur]
            );
        } catch (error) {
            logger.error('Erreur sauvegarde prix DB:', error);
        }
    }

    /**
     * Convertit un montant EUR en crypto
     */
    async convertEurToCrypto(eurAmount, cryptoSymbol) {
        try {
            const priceEur = await this.getPriceEur(cryptoSymbol);
            return eurAmount / priceEur;
        } catch (error) {
            logger.error('Erreur conversion EUR->Crypto:', error);
            throw error;
        }
    }

    /**
     * Convertit un montant crypto en EUR
     */
    async convertCryptoToEur(cryptoAmount, cryptoSymbol) {
        try {
            const priceEur = await this.getPriceEur(cryptoSymbol);
            return cryptoAmount * priceEur;
        } catch (error) {
            logger.error('Erreur conversion Crypto->EUR:', error);
            throw error;
        }
    }

    /**
     * Récupère tous les prix supportés
     */
    async getAllPrices() {
        try {
            const prices = {};
            
            for (const crypto of Object.keys(SUPPORTED_CRYPTOS)) {
                prices[crypto] = await this.getPriceEur(crypto);
            }

            return prices;
        } catch (error) {
            logger.error('Erreur récupération tous les prix:', error);
            throw error;
        }
    }

    /**
     * Rafraîchit tous les prix
     */
    async refreshAllPrices() {
        try {
            logger.info('Rafraîchissement des prix crypto...');
            
            for (const crypto of Object.keys(SUPPORTED_CRYPTOS)) {
                this.cache.delete(crypto);
                await this.getPriceEur(crypto);
            }

            logger.success('Prix crypto rafraîchis');
            return true;
        } catch (error) {
            logger.error('Erreur rafraîchissement prix:', error);
            throw error;
        }
    }
}

module.exports = new CryptoService();
