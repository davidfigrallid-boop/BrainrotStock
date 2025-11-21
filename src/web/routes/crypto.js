/**
 * Routes API pour la gestion des conversions Crypto
 * GET prices, POST convert
 */

const express = require('express');
const router = express.Router();
const { cryptoService } = require('../../services');
const { authMiddleware } = require('../middleware/auth');
const logger = require('../../core/logger');

/**
 * GET /api/crypto/prices
 * Récupère tous les prix crypto en EUR
 */
router.get('/prices', async (req, res, next) => {
  try {
    const prices = await cryptoService.getAllPrices();
    res.json(prices);
  } catch (error) {
    logger.error('Erreur récupération prix crypto', error);
    next(error);
  }
});

/**
 * POST /api/crypto/convert
 * Convertit EUR en Crypto ou Crypto en EUR
 * Body: { amount: number, from: 'EUR' | 'BTC' | 'ETH' | 'SOL' | 'USDT' | 'LTC', to: 'EUR' | 'BTC' | 'ETH' | 'SOL' | 'USDT' | 'LTC' }
 */
router.post('/convert', authMiddleware, async (req, res, next) => {
  try {
    const { amount, from, to } = req.body;

    // Validation
    if (!amount || !from || !to) {
      return res.status(400).json({ 
        error: 'Validation échouée',
        message: 'amount, from et to sont requis'
      });
    }

    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ 
        error: 'Validation échouée',
        message: 'amount doit être un nombre positif'
      });
    }

    const validCryptos = ['EUR', 'BTC', 'ETH', 'SOL', 'USDT', 'LTC'];
    if (!validCryptos.includes(from) || !validCryptos.includes(to)) {
      return res.status(400).json({ 
        error: 'Validation échouée',
        message: `from et to doivent être parmi: ${validCryptos.join(', ')}`
      });
    }

    let result;

    if (from === 'EUR') {
      // EUR vers Crypto
      result = await cryptoService.convertEurToCrypto(amount, to);
    } else if (to === 'EUR') {
      // Crypto vers EUR
      result = await cryptoService.convertCryptoToEur(amount, from);
    } else {
      // Crypto vers Crypto (via EUR)
      const amountEur = await cryptoService.convertCryptoToEur(amount, from);
      result = await cryptoService.convertEurToCrypto(amountEur, to);
    }

    res.json({
      from,
      to,
      amount,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Erreur conversion crypto', error);
    next(error);
  }
});

module.exports = router;
