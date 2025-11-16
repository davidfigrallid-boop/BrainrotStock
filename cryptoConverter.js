const https = require('https');

// Cryptos supportées avec leurs IDs CoinGecko
const SUPPORTED_CRYPTOS = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'SOL': 'solana',
    'XRP': 'ripple',
    'USDT': 'tether',
    'BNB': 'binancecoin',
    'USDC': 'usd-coin',
    'ADA': 'cardano',
    'DOGE': 'dogecoin',
    'TRX': 'tron',
    'AVAX': 'avalanche-2',
    'DOT': 'polkadot',
    'MATIC': 'matic-network',
    'LTC': 'litecoin',
    'SHIB': 'shiba-inu'
};

// Cache pour éviter le rate limiting
const priceCache = {
    data: {},
    lastUpdate: 0,
    CACHE_DURATION: 5 * 60 * 1000 // 5 minutes
};

/**
 * Retourne la liste des cryptos supportées
 */
function getSupportedCryptos() {
    return Object.keys(SUPPORTED_CRYPTOS);
}

/**
 * Récupère TOUS les prix crypto en une seule requête (évite rate limiting)
 * @returns {Promise<Object>} - Objet avec tous les prix { BTC: 45000, ETH: 3000, ... }
 */
async function getAllCryptoPrices() {
    // Vérifier le cache
    const now = Date.now();
    if (priceCache.data && Object.keys(priceCache.data).length > 0 && 
        (now - priceCache.lastUpdate) < priceCache.CACHE_DURATION) {
        console.log('💾 Utilisation du cache crypto');
        return priceCache.data;
    }

    return new Promise((resolve) => {
        const allIds = Object.values(SUPPORTED_CRYPTOS).join(',');
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${allIds}&vs_currencies=eur`;
        
        https.get(url, { 
            headers: { 'User-Agent': 'BrainrotBot/1.0' }
        }, (res) => {
            let data = '';
            
            res.on('data', chunk => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    const prices = {};
                    
                    // Convertir les IDs en symboles
                    for (const [symbol, id] of Object.entries(SUPPORTED_CRYPTOS)) {
                        if (json[id] && json[id].eur) {
                            prices[symbol] = json[id].eur;
                        } else {
                            prices[symbol] = null;
                        }
                    }
                    
                    // Mettre à jour le cache
                    priceCache.data = prices;
                    priceCache.lastUpdate = Date.now();
                    
                    console.log(`✅ Prix crypto récupérés (${Object.keys(prices).length} cryptos)`);
                    resolve(prices);
                } catch (error) {
                    console.error('❌ Erreur parsing JSON:', error.message);
                    resolve(priceCache.data || {}); // Retourner le cache même expiré
                }
            });
        }).on('error', (error) => {
            console.error('❌ Erreur API CoinGecko:', error.message);
            resolve(priceCache.data || {}); // Retourner le cache même expiré
        });
    });
}

/**
 * Convertit un montant EUR en plusieurs cryptos
 * @param {number} amountEUR - Montant en euros
 * @param {string[]} cryptos - Liste des cryptos à convertir (ex: ['BTC', 'ETH'])
 * @returns {Promise<Object>} - Objet avec les montants convertis { BTC: 0.00123, ETH: 0.045, ... }
 */
async function convertEURToCrypto(amountEUR, cryptos = ['BTC']) {
    const allPrices = await getAllCryptoPrices();
    const result = {};
    
    for (const crypto of cryptos) {
        const cryptoUpper = crypto.toUpperCase();
        const eurPrice = allPrices[cryptoUpper];
        
        if (eurPrice && eurPrice > 0) {
            result[cryptoUpper] = amountEUR / eurPrice;
        } else {
            result[cryptoUpper] = null;
        }
    }
    
    return result;
}

/**
 * Convertit un montant EUR en TOUTES les cryptos supportées
 * @param {number} amountEUR - Montant en euros
 * @returns {Promise<Object>} - Objet avec toutes les conversions
 */
async function convertEURToAllCryptos(amountEUR) {
    return await convertEURToCrypto(amountEUR, getSupportedCryptos());
}

/**
 * Met à jour les prix crypto de tous les brainrots
 * @param {Array} brainrots - Liste des brainrots
 * @returns {Promise<Array>} - Brainrots mis à jour
 */
async function updateAllBrainrotsPrices(brainrots) {
    const allPrices = await getAllCryptoPrices();
    
    for (const brainrot of brainrots) {
        if (!brainrot.priceEUR) continue;
        
        brainrot.priceCrypto = {};
        for (const [symbol, eurPrice] of Object.entries(allPrices)) {
            if (eurPrice && eurPrice > 0) {
                brainrot.priceCrypto[symbol] = brainrot.priceEUR / eurPrice;
            } else {
                brainrot.priceCrypto[symbol] = null;
            }
        }
    }
    
    return brainrots;
}

module.exports = {
    getSupportedCryptos,
    getAllCryptoPrices,
    convertEURToCrypto,
    convertEURToAllCryptos,
    updateAllBrainrotsPrices
};
