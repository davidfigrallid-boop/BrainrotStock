const https = require('https');

// Cryptos supportées avec leurs IDs CoinGecko et CoinCap
const SUPPORTED_CRYPTOS = {
    'BTC': { gecko: 'bitcoin', cap: 'bitcoin' },
    'ETH': { gecko: 'ethereum', cap: 'ethereum' },
    'SOL': { gecko: 'solana', cap: 'solana' },
    'USDT': { gecko: 'tether', cap: 'tether' },
    'LTC': { gecko: 'litecoin', cap: 'litecoin' }
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
 * Récupère les prix depuis CoinCap (API alternative)
 */
async function getPricesFromCoinCap() {
    return new Promise((resolve) => {
        const symbols = Object.keys(SUPPORTED_CRYPTOS).join(',');
        const url = `https://api.coincap.io/v2/assets?ids=${Object.values(SUPPORTED_CRYPTOS).map(c => c.cap).join(',')}`;
        
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
                    
                    if (json.data) {
                        // Taux EUR/USD approximatif (peut être amélioré)
                        const EUR_USD_RATE = 1.08;
                        
                        for (const [symbol, ids] of Object.entries(SUPPORTED_CRYPTOS)) {
                            const asset = json.data.find(a => a.id === ids.cap);
                            if (asset && asset.priceUsd) {
                                prices[symbol] = parseFloat(asset.priceUsd) / EUR_USD_RATE;
                            } else {
                                prices[symbol] = null;
                            }
                        }
                    }
                    
                    console.log(`✅ Prix crypto récupérés via CoinCap (${Object.keys(prices).length} cryptos)`);
                    resolve(prices);
                } catch (error) {
                    console.error('❌ Erreur parsing CoinCap:', error.message);
                    resolve({});
                }
            });
        }).on('error', (error) => {
            console.error('❌ Erreur API CoinCap:', error.message);
            resolve({});
        });
    });
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

    // Essayer CoinGecko d'abord
    const geckoIds = Object.values(SUPPORTED_CRYPTOS).map(c => c.gecko).join(',');
    const geckoUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${geckoIds}&vs_currencies=eur`;
    
    return new Promise((resolve) => {
        https.get(geckoUrl, { 
            headers: { 'User-Agent': 'BrainrotBot/1.0' },
            timeout: 5000
        }, (res) => {
            let data = '';
            
            res.on('data', chunk => {
                data += chunk;
            });
            
            res.on('end', async () => {
                try {
                    const json = JSON.parse(data);
                    const prices = {};
                    
                    // Vérifier si on a une erreur de rate limit
                    if (json.status && json.status.error_code === 429) {
                        console.log('⚠️ Rate limit CoinGecko, utilisation de CoinCap...');
                        const capPrices = await getPricesFromCoinCap();
                        priceCache.data = capPrices;
                        priceCache.lastUpdate = Date.now();
                        return resolve(capPrices);
                    }
                    
                    // Convertir les IDs en symboles
                    for (const [symbol, ids] of Object.entries(SUPPORTED_CRYPTOS)) {
                        if (json[ids.gecko] && json[ids.gecko].eur) {
                            prices[symbol] = json[ids.gecko].eur;
                        } else {
                            prices[symbol] = null;
                        }
                    }
                    
                    // Si tous les prix sont null, essayer CoinCap
                    const validPrices = Object.values(prices).filter(p => p !== null);
                    if (validPrices.length === 0) {
                        console.log('⚠️ Aucun prix CoinGecko, utilisation de CoinCap...');
                        const capPrices = await getPricesFromCoinCap();
                        priceCache.data = capPrices;
                        priceCache.lastUpdate = Date.now();
                        return resolve(capPrices);
                    }
                    
                    // Mettre à jour le cache
                    priceCache.data = prices;
                    priceCache.lastUpdate = Date.now();
                    
                    console.log(`✅ Prix crypto récupérés via CoinGecko (${validPrices.length}/${Object.keys(prices).length} cryptos)`);
                    resolve(prices);
                } catch (error) {
                    console.error('❌ Erreur parsing CoinGecko:', error.message);
                    console.log('⚠️ Tentative avec CoinCap...');
                    const capPrices = await getPricesFromCoinCap();
                    if (Object.keys(capPrices).length > 0) {
                        priceCache.data = capPrices;
                        priceCache.lastUpdate = Date.now();
                        resolve(capPrices);
                    } else {
                        resolve(priceCache.data || {});
                    }
                }
            });
        }).on('error', async (error) => {
            console.error('❌ Erreur API CoinGecko:', error.message);
            console.log('⚠️ Tentative avec CoinCap...');
            const capPrices = await getPricesFromCoinCap();
            if (Object.keys(capPrices).length > 0) {
                priceCache.data = capPrices;
                priceCache.lastUpdate = Date.now();
                resolve(capPrices);
            } else {
                resolve(priceCache.data || {});
            }
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
