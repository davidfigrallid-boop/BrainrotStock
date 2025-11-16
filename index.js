require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits, REST, Routes } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const { convertEURToAllCryptos, getSupportedCryptos, updateAllBrainrotsPrices } = require('./cryptoConverter');

// Configuration
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const BRAINROTS_FILE = path.join(__dirname, 'brainrots.json');
const CONFIG_FILE = path.join(__dirname, 'config.json');
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

// État global
let brainrots = [];
let config = {
    defaultCrypto: 'BTC',
    listMessageId: null,
    listChannelId: null
};

// Ordre des raretés pour le tri
const rarityOrder = {
    'Common': 1,
    'Rare': 2,
    'Epic': 3,
    'Legendary': 4,
    'Mythic': 5,
    'Brainrot God': 6,
    'Secret': 7,
    'OG': 8
};

// Couleurs des raretés (pour l'embed)
const rarityColors = {
    'Common': 0xCCCCCC,
    'Rare': 0x3466F6,
    'Epic': 0xA716E7,
    'Legendary': 0xECA741,
    'Mythic': 0xFC6565,
    'Brainrot God': 0xFAFC65,
    'Secret': 0x00FFFF,
    'OG': 0xFF1493
};

// ═══════════════════════════════════════════════════════════
// UTILITAIRES PRIX ABRÉGÉS
// ═══════════════════════════════════════════════════════════

const PRICE_ABBREVIATIONS = {
    k: 1e3, M: 1e6, B: 1e9, T: 1e12, Qa: 1e15
};

function parsePrice(str) {
    if (typeof str === 'number') return str;
    const match = /^([\d.]+)\s*([a-zA-Z]+)?$/.exec(str.trim());
    if (!match) return NaN;
    const [, num, suf] = match;
    return parseFloat(num) * (PRICE_ABBREVIATIONS[suf] || 1);
}

function formatPrice(num) {
    if (isNaN(num) || num === null) return 'N/A';
    if (num >= 1e15) return (num / 1e15).toFixed(2) + "Qa";
    if (num >= 1e12) return (num / 1e12).toFixed(2) + "T";
    if (num >= 1e9)  return (num / 1e9).toFixed(2)  + "B";
    if (num >= 1e6)  return (num / 1e6).toFixed(2)  + "M";
    if (num >= 1e3)  return (num / 1e3).toFixed(2)  + "k";
    return num.toFixed(2);
}

function formatCryptoPrice(price) {
    if (!price || price === null) return 'N/A';
    
    if (price < 0.000001) {
        return price.toExponential(4);
    } else if (price < 0.01) {
        return price.toFixed(8);
    } else if (price < 1) {
        return price.toFixed(6);
    } else {
        return price.toFixed(4);
    }
}

// ═══════════════════════════════════════════════════════════
// FONCTIONS DE GESTION DES FICHIERS
// ═══════════════════════════════════════════════════════════

async function loadBrainrots() {
    try {
        const data = await fs.readFile(BRAINROTS_FILE, 'utf8');
        brainrots = JSON.parse(data);
        console.log(`✅ ${brainrots.length} brainrots chargés`);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log('⚠️ Fichier brainrots.json introuvable, création...');
            brainrots = [];
            await saveBrainrots();
        } else {
            console.error('❌ Erreur lors du chargement des brainrots:', error);
            brainrots = [];
        }
    }
}

async function saveBrainrots() {
    try {
        await fs.writeFile(BRAINROTS_FILE, JSON.stringify(brainrots, null, 2), 'utf8');
        console.log('💾 Brainrots sauvegardés');
    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde:', error);
    }
}

async function loadConfig() {
    try {
        const data = await fs.readFile(CONFIG_FILE, 'utf8');
        config = { ...config, ...JSON.parse(data) };
        console.log('⚙️ Configuration chargée');
    } catch (error) {
        if (error.code === 'ENOENT') {
            await saveConfig();
        } else {
            console.error('❌ Erreur lors du chargement de la config:', error);
        }
    }
}

async function saveConfig() {
    try {
        await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
        console.log('⚙️ Configuration sauvegardée');
    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde de la config:', error);
    }
}

// ═══════════════════════════════════════════════════════════
// FONCTIONS DE TRI ET AGRÉGATION
// ═══════════════════════════════════════════════════════════

function sortBrainrots(brainrotsList) {
    return [...brainrotsList].sort((a, b) => {
        const rarityA = rarityOrder[a.rarity] || 999;
        const rarityB = rarityOrder[b.rarity] || 999;
        
        if (rarityA !== rarityB) {
            return rarityA - rarityB;
        }
        
        return a.name.localeCompare(b.name);
    });
}

/**
 * Agrège les brainrots identiques (même nom, mutations, rareté, compte)
 */
function aggregateBrainrots(brainrotsList) {
    const aggregated = [];
    
    for (const br of brainrotsList) {
        const existing = aggregated.find(item =>
            item.name === br.name &&
            item.rarity === br.rarity &&
            item.compte === br.compte &&
            JSON.stringify(item.mutations) === JSON.stringify(br.mutations)
        );
        
        if (existing) {
            existing.valeur = (existing.valeur || 1) + (br.valeur || 1);
        } else {
            aggregated.push({ ...br, valeur: br.valeur || 1 });
        }
    }
    
    return aggregated;
}

// ═══════════════════════════════════════════════════════════
// CONSTRUCTION DE L'EMBED
// ═══════════════════════════════════════════════════════════

function buildEmbed() {
    const aggregated = aggregateBrainrots(brainrots);
    const sorted = sortBrainrots(aggregated);
    const crypto = config.defaultCrypto;
    
    const embed = new EmbedBuilder()
        .setTitle('🧠 Liste des Brainrots')
        .setColor('#00D9FF')
        .setTimestamp()
        .setFooter({ text: `Auto-refresh: 5 min | Prix en ${crypto}` });

    if (sorted.length === 0) {
        embed.setDescription('*Aucun brainrot disponible*');
        return embed;
    }

    // Grouper par rareté
    const groupedByRarity = {};
    sorted.forEach(br => {
        if (!groupedByRarity[br.rarity]) {
            groupedByRarity[br.rarity] = [];
        }
        groupedByRarity[br.rarity].push(br);
    });

    // Construire les fields par rareté
    Object.keys(groupedByRarity).forEach(rarity => {
        const items = groupedByRarity[rarity];
        const itemsList = items.map(br => {
            const cryptoPrice = br.priceCrypto && br.priceCrypto[crypto] 
                ? formatCryptoPrice(br.priceCrypto[crypto])
                : 'N/A';
            
            const valeurDisplay = br.valeur > 1 ? ` x${br.valeur}` : '';
            const mutationsDisplay = br.mutations && br.mutations.length > 0 
                ? ` [${br.mutations.join(', ')}]` 
                : '';
            
            return `**${br.name}${valeurDisplay}${mutationsDisplay}**\n` +
                   `├ Income: ${formatPrice(parsePrice(br.incomeRate))}/s\n` +
                   `├ Prix: €${formatPrice(parsePrice(br.priceEUR))} (${cryptoPrice} ${crypto})\n`;
        }).join('\n');

        embed.addFields({
            name: `${rarity}`,
            value: itemsList || '*Aucun*',
            inline: false
        });
    });

    return embed;
}

// ═══════════════════════════════════════════════════════════
// MISE À JOUR DE L'EMBED
// ═══════════════════════════════════════════════════════════

async function updateEmbed(client) {
    if (!config.listMessageId || !config.listChannelId) {
        console.log('⚠️ Aucun message à mettre à jour');
        return;
    }

    try {
        const channel = await client.channels.fetch(config.listChannelId);
        const message = await channel.messages.fetch(config.listMessageId);
        const embed = buildEmbed();
        await message.edit({ embeds: [embed] });
        console.log('🔄 Embed mis à jour');
    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour de l\'embed:', error);
        config.listMessageId = null;
        config.listChannelId = null;
        await saveConfig();
    }
}

// ═══════════════════════════════════════════════════════════
// CLIENT DISCORD
// ═══════════════════════════════════════════════════════════

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

client.once('ready', async () => {
    console.log(`✅ Bot connecté en tant que ${client.user.tag}`);
    
    await loadBrainrots();
    await loadConfig();
    
    // Auto-refresh toutes les 5 minutes
    setInterval(() => {
        updateEmbed(client);
    }, REFRESH_INTERVAL);
});

// ═══════════════════════════════════════════════════════════
// COMMANDES SLASH
// ═══════════════════════════════════════════════════════════

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    try {
        switch (commandName) {
            case 'list':
                await handleList(interaction);
                break;
            case 'refresh':
                await handleRefresh(interaction);
                break;
            case 'addbrainrot':
                await handleAddBrainrot(interaction);
                break;
            case 'removebrainrot':
                await handleRemoveBrainrot(interaction);
                break;
            case 'updatebrainrot':
                await handleUpdateBrainrot(interaction);
                break;
            case 'setcrypto':
                await handleSetCrypto(interaction);
                break;
            case 'showcompte':
                await handleShowCompte(interaction);
                break;
        }
    } catch (error) {
        console.error(`❌ Erreur dans la commande ${commandName}:`, error);
        
        const errorMessage = 'Une erreur est survenue lors de l\'exécution de la commande.';
        
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: errorMessage, ephemeral: true });
        } else {
            await interaction.reply({ content: errorMessage, ephemeral: true });
        }
    }
});

// ═══════════════════════════════════════════════════════════
// HANDLERS DES COMMANDES
// ═══════════════════════════════════════════════════════════

async function handleList(interaction) {
    const embed = buildEmbed();
    const message = await interaction.reply({ embeds: [embed], fetchReply: true });
    
    config.listMessageId = message.id;
    config.listChannelId = message.channelId;
    await saveConfig();
}

async function handleRefresh(interaction) {
    await interaction.deferReply({ ephemeral: true });
    
    // Recalculer tous les prix crypto
    await updateAllBrainrotsPrices(brainrots);
    await saveBrainrots();
    
    await updateEmbed(client);
    await interaction.editReply('✅ Liste et prix crypto mis à jour !');
}

async function handleAddBrainrot(interaction) {
    const name = interaction.options.getString('name');
    const rarity = interaction.options.getString('rarity');
    const incomeRate = interaction.options.getString('income_rate');
    const mutations = interaction.options.getString('mutations');
    const priceEUR = interaction.options.getString('price_eur');
    const compte = interaction.options.getString('compte');
    const valeur = interaction.options.getInteger('valeur') || 1;

    await interaction.deferReply({ ephemeral: true });

    // Parser les mutations (séparées par des virgules)
    const mutationArray = mutations ? mutations.split(',').map(m => m.trim()) : [];
    
    // Parser le prix EUR
    const priceEURParsed = parsePrice(priceEUR);
    if (isNaN(priceEURParsed)) {
        return interaction.editReply('❌ Format de prix invalide ! Utilisez: 100, 1k, 1.5M, etc.');
    }

    // Conversion crypto pour TOUTES les cryptos
    const priceCrypto = await convertEURToAllCryptos(priceEURParsed);

    // Vérifier si un brainrot identique existe déjà
    const existing = brainrots.find(br =>
        br.name === name &&
        br.rarity === rarity &&
        br.compte === compte &&
        JSON.stringify(br.mutations) === JSON.stringify(mutationArray)
    );

    if (existing) {
        // Agréger avec l'existant
        existing.valeur = (existing.valeur || 1) + valeur;
        await saveBrainrots();
        await updateEmbed(client);
        
        return interaction.editReply(
            `✅ **${name}** agrégé ! Nouvelle valeur: x${existing.valeur}`
        );
    }

    const newBrainrot = {
        name,
        rarity,
        incomeRate,
        mutations: mutationArray,
        priceEUR: priceEURParsed,
        priceCrypto,
        compte: compte || null,
        valeur
    };

    brainrots.push(newBrainrot);
    await saveBrainrots();
    await updateEmbed(client);

    const mutDisplay = mutationArray.length > 0 ? ` [${mutationArray.join(', ')}]` : '';
    const valDisplay = valeur > 1 ? ` x${valeur}` : '';
    
    await interaction.editReply(
        `✅ **${name}${valDisplay}${mutDisplay}** ajouté !\n` +
        `Rareté: ${rarity}\n` +
        `Prix: €${formatPrice(priceEURParsed)}`
    );
}

async function handleRemoveBrainrot(interaction) {
    const name = interaction.options.getString('name');
    const mutations = interaction.options.getString('mutations');
    
    const mutationArray = mutations ? mutations.split(',').map(m => m.trim()) : [];
    
    // Trouver le brainrot correspondant
    const index = brainrots.findIndex(br => {
        const nameMatch = br.name.toLowerCase() === name.toLowerCase();
        const mutMatch = mutations 
            ? JSON.stringify(br.mutations) === JSON.stringify(mutationArray)
            : true;
        return nameMatch && mutMatch;
    });
    
    if (index === -1) {
        return interaction.reply({ 
            content: '❌ Ce brainrot n\'existe pas !', 
            ephemeral: true 
        });
    }

    const removed = brainrots.splice(index, 1)[0];
    await saveBrainrots();
    await updateEmbed(client);

    const mutDisplay = removed.mutations && removed.mutations.length > 0 
        ? ` [${removed.mutations.join(', ')}]` 
        : '';
    
    await interaction.reply({ 
        content: `✅ **${removed.name}${mutDisplay}** a été supprimé !`, 
        ephemeral: true 
    });
}

async function handleUpdateBrainrot(interaction) {
    const name = interaction.options.getString('name');
    const mutations = interaction.options.getString('mutations_filter');
    const incomeRate = interaction.options.getString('income_rate');
    const newMutations = interaction.options.getString('new_mutations');
    const priceEUR = interaction.options.getString('price_eur');
    const compte = interaction.options.getString('compte');
    const valeur = interaction.options.getInteger('valeur');

    const mutationArray = mutations ? mutations.split(',').map(m => m.trim()) : null;
    
    // Trouver le brainrot
    const brainrot = brainrots.find(br => {
        const nameMatch = br.name.toLowerCase() === name.toLowerCase();
        const mutMatch = mutationArray 
            ? JSON.stringify(br.mutations) === JSON.stringify(mutationArray)
            : true;
        return nameMatch && mutMatch;
    });
    
    if (!brainrot) {
        return interaction.reply({ 
            content: '❌ Ce brainrot n\'existe pas !', 
            ephemeral: true 
        });
    }

    await interaction.deferReply({ ephemeral: true });

    // Mettre à jour les valeurs
    if (incomeRate !== null) brainrot.incomeRate = incomeRate;
    if (newMutations !== null) {
        brainrot.mutations = newMutations.split(',').map(m => m.trim());
    }
    if (compte !== null) brainrot.compte = compte;
    if (valeur !== null) brainrot.valeur = valeur;
    
    if (priceEUR !== null) {
        const priceEURParsed = parsePrice(priceEUR);
        if (isNaN(priceEURParsed)) {
            return interaction.editReply('❌ Format de prix invalide !');
        }
        brainrot.priceEUR = priceEURParsed;
        brainrot.priceCrypto = await convertEURToAllCryptos(priceEURParsed);
    }

    await saveBrainrots();
    await updateEmbed(client);

    await interaction.editReply(`✅ **${name}** mis à jour !`);
}

async function handleSetCrypto(interaction) {
    const crypto = interaction.options.getString('crypto');
    
    await interaction.deferReply({ ephemeral: true });
    
    config.defaultCrypto = crypto;
    await saveConfig();
    
    // Recalculer tous les prix si nécessaire
    await updateAllBrainrotsPrices(brainrots);
    await saveBrainrots();
    
    await updateEmbed(client);

    await interaction.editReply(`✅ Crypto par défaut définie sur **${crypto}** et prix recalculés !`);
}

async function handleShowCompte(interaction) {
    const aggregated = aggregateBrainrots(brainrots);
    const withCompte = aggregated.filter(br => br.compte);
    
    if (withCompte.length === 0) {
        return interaction.reply({
            content: '📊 Aucun brainrot n\'a de compte assigné.',
            ephemeral: true
        });
    }
    
    // Grouper par compte
    const byCompte = {};
    withCompte.forEach(br => {
        if (!byCompte[br.compte]) {
            byCompte[br.compte] = [];
        }
        byCompte[br.compte].push(br);
    });
    
    const embed = new EmbedBuilder()
        .setTitle('📊 Brainrots par Compte')
        .setColor('#FFD700')
        .setTimestamp();
    
    for (const [compte, items] of Object.entries(byCompte)) {
        const itemsList = items.map(br => {
            const valDisplay = br.valeur > 1 ? ` x${br.valeur}` : '';
            const mutDisplay = br.mutations && br.mutations.length > 0 
                ? ` [${br.mutations.join(', ')}]` 
                : '';
            return `• ${br.name}${valDisplay}${mutDisplay} (${br.rarity})`;
        }).join('\n');
        
        embed.addFields({
            name: `Compte: ${compte}`,
            value: itemsList,
            inline: false
        });
    }
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
}

// ═══════════════════════════════════════════════════════════
// ENREGISTREMENT DES COMMANDES
// ═══════════════════════════════════════════════════════════

const commands = [
    new SlashCommandBuilder()
        .setName('list')
        .setDescription('Affiche la liste complète des brainrots'),
    
    new SlashCommandBuilder()
        .setName('refresh')
        .setDescription('Force la mise à jour de la liste et recalcule les prix crypto'),
    
    new SlashCommandBuilder()
        .setName('addbrainrot')
        .setDescription('Ajoute un nouveau brainrot')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Nom du brainrot')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('rarity')
                .setDescription('Rareté')
                .setRequired(true)
                .addChoices(
                    { name: 'Common', value: 'Common' },
                    { name: 'Rare', value: 'Rare' },
                    { name: 'Epic', value: 'Epic' },
                    { name: 'Legendary', value: 'Legendary' },
                    { name: 'Mythic', value: 'Mythic' },
                    { name: 'Brainrot God', value: 'Brainrot God' },
                    { name: 'Secret', value: 'Secret' },
                    { name: 'OG', value: 'OG' }
                ))
        .addStringOption(option =>
            option.setName('income_rate')
                .setDescription('Taux de revenu par seconde (ex: 100, 1k, 1.5M, 2B)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('price_eur')
                .setDescription('Prix en euros (ex: 50, 1k, 1.5M, 2B)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('mutations')
                .setDescription('Mutations séparées par des virgules (ex: Fire, Ice)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('compte')
                .setDescription('Nom du compte où se trouve le brainrot')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('valeur')
                .setDescription('Nombre de brainrots identiques (défaut: 1)')
                .setRequired(false)
                .setMinValue(1))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    new SlashCommandBuilder()
        .setName('removebrainrot')
        .setDescription('Supprime un brainrot')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Nom du brainrot à supprimer')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('mutations')
                .setDescription('Mutations pour identifier le brainrot (si plusieurs avec même nom)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    new SlashCommandBuilder()
        .setName('updatebrainrot')
        .setDescription('Met à jour un brainrot existant')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Nom du brainrot à modifier')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('mutations_filter')
                .setDescription('Mutations pour identifier le brainrot (si plusieurs avec même nom)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('income_rate')
                .setDescription('Nouveau taux de revenu par seconde (ex: 1k, 1.5M)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('new_mutations')
                .setDescription('Nouvelles mutations (remplace les anciennes)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('price_eur')
                .setDescription('Nouveau prix en euros (ex: 1k, 1.5M)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('compte')
                .setDescription('Nouveau compte')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('valeur')
                .setDescription('Nouvelle valeur')
                .setRequired(false)
                .setMinValue(1))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    new SlashCommandBuilder()
        .setName('setcrypto')
        .setDescription('Définit la crypto par défaut et recalcule tous les prix')
        .addStringOption(option =>
            option.setName('crypto')
                .setDescription('Choisir une crypto')
                .setRequired(true)
                .addChoices(...getSupportedCryptos().map(c => ({ name: c, value: c }))))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    new SlashCommandBuilder()
        .setName('showcompte')
        .setDescription('Affiche les brainrots groupés par compte')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        console.log('🔄 Enregistrement des commandes...');
        
        if (GUILD_ID) {
            await rest.put(
                Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
                { body: commands }
            );
            console.log('✅ Commandes de guilde enregistrées');
        } else {
            await rest.put(
                Routes.applicationCommands(CLIENT_ID),
                { body: commands }
            );
            console.log('✅ Commandes globales enregistrées');
        }
        
        client.login(TOKEN);
    } catch (error) {
        console.error('❌ Erreur lors de l\'enregistrement des commandes:', error);
    }
})();
