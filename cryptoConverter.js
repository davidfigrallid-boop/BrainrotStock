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

/**
 * Retourne la liste des cryptos supportées
 */
function getSupportedCryptos() {
    return Object.keys(SUPPORTED_CRYPTOS);
}

/**
 * Récupère le prix actuel d'une crypto en EUR depuis CoinGecko
 * @param {string} cryptoSymbol - Symbole de la crypto (ex: 'BTC', 'ETH')
 * @returns {Promise<number|null>} - Prix en EUR ou null si erreur
 */
async function getCryptoPrice(cryptoSymbol) {
    const cryptoId = SUPPORTED_CRYPTOS[cryptoSymbol.toUpperCase()];
    
    if (!cryptoId) {
        console.error(`❌ Crypto non supportée: ${cryptoSymbol}`);
        return null;
    }

    return new Promise((resolve) => {
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoId}&vs_currencies=eur`;
        
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
                    
                    if (json[cryptoId] && json[cryptoId].eur) {
                        const price = json[cryptoId].eur;
                        console.log(`✅ Prix ${cryptoSymbol}: €${price}`);
                        resolve(price);
                    } else {
                        console.error(`❌ Prix non trouvé pour ${cryptoSymbol}`);
                        resolve(null);
                    }
                } catch (error) {
                    console.error(`❌ Erreur parsing JSON pour ${cryptoSymbol}:`, error.message);
                    resolve(null);
                }
            });
        }).on('error', (error) => {
            console.error(`❌ Erreur API CoinGecko pour ${cryptoSymbol}:`, error.message);
            resolve(null);
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
    const result = {};
    
    // Convertir toutes les cryptos demandées
    for (const crypto of cryptos) {
        const cryptoUpper = crypto.toUpperCase();
        const eurPrice = await getCryptoPrice(cryptoUpper);
        
        if (eurPrice && eurPrice > 0) {
            // Calculer combien de crypto pour X euros
            result[cryptoUpper] = amountEUR / eurPrice;
        } else {
            result[cryptoUpper] = 'N/A';
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
 * Met à jour les prix crypto d'un brainrot existant
 * @param {Object} brainrot - Objet brainrot avec au moins { priceEUR }
 * @param {string[]} cryptos - Liste des cryptos à mettre à jour
 * @returns {Promise<Object>} - Brainrot mis à jour
 */
async function updateBrainrotCryptoPrices(brainrot, cryptos = null) {
    if (!brainrot.priceEUR) {
        console.error('❌ Brainrot sans priceEUR');
        return brainrot;
    }
    
    const cryptosToUpdate = cryptos || getSupportedCryptos();
    const newPrices = await convertEURToCrypto(brainrot.priceEUR, cryptosToUpdate);
    
    // Fusionner avec les prix existants
    brainrot.priceCrypto = {
        ...brainrot.priceCrypto,
        ...newPrices
    };
    
    return brainrot;
}

module.exports = {
    getSupportedCryptos,
    getCryptoPrice,
    convertEURToCrypto,
    convertEURToAllCryptos,
    updateBrainrotCryptoPrices
};