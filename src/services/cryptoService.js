/**
 * Service pour les Cryptomonnaies
 * Contient la logique métier pour la gestion des prix crypto et conversions
 */

const axios = require('axios');
const cryptoRepository = require('../database/repositories/cryptoRepository');
const logger = require('../core/logger');
const { ValidationError, ExternalAPIError } = require('../core/errors');

// Constantes
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes en millisecondes
const SUPPORTED_CRYPTOS = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  USDT: 'tether',
  LTC: 'litecoin'
};

class CryptoService {
  constructor() {
    this.cache = new Map();
    this.lastFetchTime = new Map();
  }

  /**
   * Récupère le prix d'une crypto en EUR depuis le cache ou l'API
   * @param {string} symbol - Symbole de la crypto (BTC, ETH, SOL, USDT, LTC)
   * @returns {Promise<number>} Prix en EUR
   */
  async getPriceEur(symbol) {
    try {
      if (!symbol || typeof symbol !== 'string') {
        throw new ValidationError('symbol must be a non-empty string', 'symbol');
      }

      const upperSymbol = symbol.toUpperCase();

      // Vérifier que la crypto est supportée
      if (!SUPPORTED_CRYPTOS[upperSymbol]) {
        throw new ValidationError(
          `Unsupported crypto: ${upperSymbol}. Supported: ${Object.keys(SUPPORTED_CRYPTOS).join(', ')}`,
          'symbol'
        );
      }

      // Vérifier le cache
      if (this.isCacheValid(upperSymbol)) {
        logger.debug(`Prix ${upperSymbol} récupéré du cache`);
        return this.cache.get(upperSymbol);
      }

      // Récupérer depuis l'API CoinGecko
      const price = await this.fetchFromCoinGecko(upperSymbol);

      // Mettre en cache
      this.cache.set(upperSymbol, price);
      this.lastFetchTime.set(upperSymbol, Date.now());

      logger.crypto(`Prix ${upperSymbol} récupéré: €${price}`);
      return price;
    } catch (error) {
      logger.error('Erreur getPriceEur:', error);
      throw error;
    }
  }

  /**
   * Récupère les prix de toutes les cryptos supportées
   * @returns {Promise<Object>} Objet avec les prix de toutes les cryptos
   */
  async getAllPrices() {
    try {
      const prices = {};

      for (const symbol of Object.keys(SUPPORTED_CRYPTOS)) {
        try {
          prices[symbol] = await this.getPriceEur(symbol);
        } catch (error) {
          logger.warn(`Erreur récupération prix ${symbol}:`, error.message);
          // Continuer avec les autres cryptos
        }
      }

      logger.debug('Tous les prix crypto récupérés');
      return prices;
    } catch (error) {
      logger.error('Erreur getAllPrices:', error);
      throw error;
    }
  }

  /**
   * Rafraîchit tous les prix crypto depuis l'API
   * @returns {Promise<Object>} Objet avec les prix rafraîchis
   */
  async refreshAllPrices() {
    try {
      // Vider le cache pour forcer la récupération depuis l'API
      this.cache.clear();
      this.lastFetchTime.clear();

      const prices = await this.getAllPrices();

      // Sauvegarder dans la base de données
      for (const [symbol, price] of Object.entries(prices)) {
        try {
          await cryptoRepository.upsert(symbol, price, price); // USD = EUR pour simplifier
        } catch (error) {
          logger.warn(`Erreur sauvegarde prix ${symbol}:`, error.message);
        }
      }

      logger.crypto('Tous les prix crypto rafraîchis');
      return prices;
    } catch (error) {
      logger.error('Erreur refreshAllPrices:', error);
      throw error;
    }
  }

  /**
   * Récupère le prix d'une crypto depuis l'API CoinGecko
   * @param {string} symbol - Symbole de la crypto
   * @returns {Promise<number>} Prix en EUR
   */
  async fetchFromCoinGecko(symbol) {
    try {
      if (!symbol || typeof symbol !== 'string') {
        throw new ValidationError('symbol must be a non-empty string', 'symbol');
      }

      const upperSymbol = symbol.toUpperCase();

      // Vérifier que la crypto est supportée
      if (!SUPPORTED_CRYPTOS[upperSymbol]) {
        throw new ValidationError(
          `Unsupported crypto: ${upperSymbol}. Supported: ${Object.keys(SUPPORTED_CRYPTOS).join(', ')}`,
          'symbol'
        );
      }

      const cryptoId = SUPPORTED_CRYPTOS[upperSymbol];

      try {
        const response = await axios.get(
          `${COINGECKO_API_URL}/simple/price`,
          {
            params: {
              ids: cryptoId,
              vs_currencies: 'eur',
              include_market_cap: false,
              include_24hr_vol: false,
              include_last_updated_at: false
            },
            timeout: 10000 // 10 secondes de timeout
          }
        );

        const price = response.data[cryptoId]?.eur;

        if (price === undefined || price === null) {
          throw new ExternalAPIError('CoinGecko', `No price data for ${upperSymbol}`);
        }

        logger.debug(`Prix CoinGecko récupéré: ${upperSymbol} = €${price}`);
        return price;
      } catch (error) {
        if (error.response) {
          throw new ExternalAPIError(
            'CoinGecko',
            `HTTP ${error.response.status}: ${error.response.statusText}`,
            error.response.status
          );
        } else if (error.code === 'ECONNABORTED') {
          throw new ExternalAPIError('CoinGecko', 'Request timeout');
        } else {
          throw new ExternalAPIError('CoinGecko', error.message);
        }
      }
    } catch (error) {
      logger.error('Erreur fetchFromCoinGecko:', error);
      throw error;
    }
  }

  /**
   * Convertit un montant en EUR vers une crypto
   * @param {number} amountEur - Montant en EUR
   * @param {string} symbol - Symbole de la crypto
   * @returns {Promise<number>} Montant en crypto
   */
  async convertEurToCrypto(amountEur, symbol) {
    try {
      if (typeof amountEur !== 'number' || amountEur < 0) {
        throw new ValidationError('amountEur must be a positive number', 'amountEur');
      }

      if (!symbol || typeof symbol !== 'string') {
        throw new ValidationError('symbol must be a non-empty string', 'symbol');
      }

      const priceEur = await this.getPriceEur(symbol);

      if (priceEur <= 0) {
        throw new ValidationError('Invalid crypto price');
      }

      const amountCrypto = amountEur / priceEur;

      logger.debug(`Conversion: €${amountEur} = ${amountCrypto} ${symbol.toUpperCase()}`);
      return parseFloat(amountCrypto.toFixed(8)); // 8 décimales pour les cryptos
    } catch (error) {
      logger.error('Erreur convertEurToCrypto:', error);
      throw error;
    }
  }

  /**
   * Convertit un montant en crypto vers EUR
   * @param {number} amountCrypto - Montant en crypto
   * @param {string} symbol - Symbole de la crypto
   * @returns {Promise<number>} Montant en EUR
   */
  async convertCryptoToEur(amountCrypto, symbol) {
    try {
      if (typeof amountCrypto !== 'number' || amountCrypto < 0) {
        throw new ValidationError('amountCrypto must be a positive number', 'amountCrypto');
      }

      if (!symbol || typeof symbol !== 'string') {
        throw new ValidationError('symbol must be a non-empty string', 'symbol');
      }

      const priceEur = await this.getPriceEur(symbol);

      const amountEur = amountCrypto * priceEur;

      logger.debug(`Conversion: ${amountCrypto} ${symbol.toUpperCase()} = €${amountEur}`);
      return parseFloat(amountEur.toFixed(2)); // 2 décimales pour l'EUR
    } catch (error) {
      logger.error('Erreur convertCryptoToEur:', error);
      throw error;
    }
  }

  /**
   * Vérifie si le cache est valide pour une crypto
   * @param {string} symbol - Symbole de la crypto
   * @returns {boolean} True si le cache est valide
   */
  isCacheValid(symbol) {
    const lastFetch = this.lastFetchTime.get(symbol);

    if (!lastFetch) {
      return false;
    }

    const now = Date.now();
    const age = now - lastFetch;

    return age < CACHE_DURATION;
  }

  /**
   * Invalide le cache pour une crypto
   * @param {string} symbol - Symbole de la crypto (optionnel, invalide tout si non fourni)
   */
  invalidateCache(symbol) {
    if (symbol) {
      this.cache.delete(symbol.toUpperCase());
      this.lastFetchTime.delete(symbol.toUpperCase());
      logger.debug(`Cache invalidé pour ${symbol.toUpperCase()}`);
    } else {
      this.cache.clear();
      this.lastFetchTime.clear();
      logger.debug('Cache crypto complètement invalidé');
    }
  }

  /**
   * Récupère les prix depuis la base de données (fallback)
   * @returns {Promise<Object>} Objet avec les prix en base de données
   */
  async getPricesFromDatabase() {
    try {
      const prices = {};
      const dbPrices = await cryptoRepository.findAll();

      for (const record of dbPrices) {
        prices[record.crypto] = record.price_eur;
      }

      logger.debug('Prix crypto récupérés depuis la base de données');
      return prices;
    } catch (error) {
      logger.error('Erreur getPricesFromDatabase:', error);
      throw error;
    }
  }

  /**
   * Récupère le prix d'une crypto avec fallback (cache → API → DB)
   * @param {string} symbol - Symbole de la crypto
   * @returns {Promise<number>} Prix en EUR
   */
  async getPriceWithFallback(symbol) {
    try {
      if (!symbol || typeof symbol !== 'string') {
        throw new ValidationError('symbol must be a non-empty string', 'symbol');
      }

      const upperSymbol = symbol.toUpperCase();

      // Essayer le cache d'abord
      if (this.isCacheValid(upperSymbol)) {
        logger.debug(`Prix ${upperSymbol} récupéré du cache (fallback)`);
        return this.cache.get(upperSymbol);
      }

      // Essayer l'API CoinGecko
      try {
        const price = await this.fetchFromCoinGecko(upperSymbol);
        this.cache.set(upperSymbol, price);
        this.lastFetchTime.set(upperSymbol, Date.now());
        return price;
      } catch (error) {
        logger.warn(`Erreur API CoinGecko, utilisation du fallback:`, error.message);

        // Fallback: utiliser la base de données
        const dbPrice = await cryptoRepository.findBySymbol(upperSymbol);
        if (dbPrice && dbPrice.price_eur) {
          logger.debug(`Prix ${upperSymbol} récupéré depuis la base de données (fallback)`);
          return dbPrice.price_eur;
        }

        // Si rien n'est disponible, relancer l'erreur
        throw error;
      }
    } catch (error) {
      logger.error('Erreur getPriceWithFallback:', error);
      throw error;
    }
  }
}

module.exports = new CryptoService();
