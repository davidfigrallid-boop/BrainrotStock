const fs = require('fs').promises;
const path = require('path');

/**
 * Script pour importer automatiquement tous les brainrots depuis Brainrots_Cleaned.txt
 * Utilisation: node importBrainrots.js
 */

// Valeurs par défaut selon la rareté
const RARITY_DEFAULTS = {
    'Common': { incomeRate: 100, muta: 5, priceEUR: 10 },
    'Rare': { incomeRate: 250, muta: 15, priceEUR: 50 },
    'Epic': { incomeRate: 500, muta: 30, priceEUR: 150 },
    'Legendary': { incomeRate: 1000, muta: 50, priceEUR: 500 },
    'Mythic': { incomeRate: 2500, muta: 100, priceEUR: 1500 },
    'Brainrot God': { incomeRate: 5000, muta: 200, priceEUR: 5000 },
    'Secret': { incomeRate: 10000, muta: 500, priceEUR: 15000 },
    'OG': { incomeRate: 25000, muta: 1000, priceEUR: 50000 }
};

async function importBrainrots() {
    console.log('🔄 Début de l\'importation...\n');

    try {
        // Lire le fichier TXT
        const txtPath = path.join(__dirname, 'Brainrots_Cleaned.txt');
        const txtContent = await fs.readFile(txtPath, 'utf8');
        
        // Parser les lignes
        const lines = txtContent
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        console.log(`📄 ${lines.length} lignes trouvées\n`);

        // Convertir en objets brainrots
        const brainrots = [];
        const errors = [];

        for (const line of lines) {
            try {
                const parts = line.split(' - ');
                
                if (parts.length !== 2) {
                    errors.push(`❌ Format invalide: ${line}`);
                    continue;
                }

                const name = parts[0].trim();
                const rarity = parts[1].trim();

                // Vérifier que la rareté existe
                if (!RARITY_DEFAULTS[rarity]) {
                    errors.push(`❌ Rareté inconnue pour "${name}": ${rarity}`);
                    continue;
                }

                const defaults = RARITY_DEFAULTS[rarity];

                brainrots.push({
                    name,
                    rarity,
                    incomeRate: defaults.incomeRate,
                    muta: defaults.muta,
                    priceEUR: defaults.priceEUR,
                    priceCrypto: {} // Sera rempli par le bot lors de l'ajout
                });

                console.log(`✅ ${name} (${rarity})`);
            } catch (error) {
                errors.push(`❌ Erreur sur la ligne: ${line} - ${error.message}`);
            }
        }

        // Afficher les erreurs éventuelles
        if (errors.length > 0) {
            console.log('\n⚠️ Erreurs rencontrées:');
            errors.forEach(err => console.log(err));
            console.log('');
        }

        // Sauvegarder dans brainrots.json
        const jsonPath = path.join(__dirname, 'brainrots.json');
        await fs.writeFile(jsonPath, JSON.stringify(brainrots, null, 2), 'utf8');

        console.log(`\n💾 ${brainrots.length} brainrots sauvegardés dans brainrots.json`);
        
        // Statistiques par rareté
        console.log('\n📊 Statistiques par rareté:');
        const stats = {};
        brainrots.forEach(br => {
            stats[br.rarity] = (stats[br.rarity] || 0) + 1;
        });

        Object.keys(stats).sort((a, b) => {
            const orderA = Object.keys(RARITY_DEFAULTS).indexOf(a);
            const orderB = Object.keys(RARITY_DEFAULTS).indexOf(b);
            return orderA - orderB;
        }).forEach(rarity => {
            console.log(`   ${rarity}: ${stats[rarity]}`);
        });

        console.log('\n✅ Import terminé avec succès !');
        console.log('\n💡 Note: Les prix crypto seront calculés automatiquement par le bot');
        console.log('   lors du premier lancement ou via les commandes /addbrainrot');

    } catch (error) {
        console.error('\n❌ Erreur fatale:', error.message);
        process.exit(1);
    }
}

// Lancer l'import
importBrainrots();