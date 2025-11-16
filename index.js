const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits, REST, Routes } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const { convertEURToCrypto, getSupportedCryptos } = require('./cryptoConverter');

// Configuration
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID; // Optionnel pour les commandes de guilde

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
// FONCTIONS DE TRI ET FORMATAGE
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

function formatCryptoPrice(price) {
    if (!price || price === 'N/A') return 'N/A';
    
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
// CONSTRUCTION DE L'EMBED
// ═══════════════════════════════════════════════════════════

function buildEmbed() {
    const sorted = sortBrainrots(brainrots);
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
            
            return `**${br.name}**\n` +
                   `├ Income: ${br.incomeRate}/h\n` +
                   `├ Muta: ${br.muta}\n` +
                   `├ Prix: €${br.priceEUR} (${cryptoPrice} ${crypto})\n`;
        }).join('\n');

        embed.addFields({
            name: `${getRarityEmoji(rarity)} ${rarity}`,
            value: itemsList || '*Aucun*',
            inline: false
        });
    });

    return embed;
}

function getRarityEmoji(rarity) {
    const emojis = {
        'Common': '⚪',
        'Rare': '🔵',
        'Epic': '🟣',
        'Legendary': '🟠',
        'Mythic': '🔴',
        'Brainrot God': '⭐',
        'Secret': '🌟',
        'OG': '💎'
    };
    return emojis[rarity] || '📦';
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
        // Réinitialiser si le message n'existe plus
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
    
    // Stocker l'ID du message pour les futures mises à jour
    config.listMessageId = message.id;
    config.listChannelId = message.channelId;
    await saveConfig();
}

async function handleRefresh(interaction) {
    await interaction.deferReply({ ephemeral: true });
    await updateEmbed(client);
    await interaction.editReply('✅ Liste mise à jour !');
}

async function handleAddBrainrot(interaction) {
    const name = interaction.options.getString('name');
    const rarity = interaction.options.getString('rarity');
    const incomeRate = interaction.options.getNumber('income_rate');
    const muta = interaction.options.getInteger('muta');
    const priceEUR = interaction.options.getNumber('price_eur');
    const crypto = interaction.options.getString('crypto') || config.defaultCrypto;

    // Vérifier si existe déjà
    if (brainrots.some(br => br.name.toLowerCase() === name.toLowerCase())) {
        return interaction.reply({ 
            content: '❌ Un brainrot avec ce nom existe déjà !', 
            ephemeral: true 
        });
    }

    await interaction.deferReply({ ephemeral: true });

    // Conversion crypto
    const priceCrypto = await convertEURToCrypto(priceEUR, [crypto]);

    const newBrainrot = {
        name,
        rarity,
        incomeRate,
        muta,
        priceEUR,
        priceCrypto
    };

    brainrots.push(newBrainrot);
    await saveBrainrots();
    await updateEmbed(client);

    await interaction.editReply(
        `✅ **${name}** ajouté !\n` +
        `Rareté: ${rarity}\n` +
        `Prix: €${priceEUR} → ${formatCryptoPrice(priceCrypto[crypto])} ${crypto}`
    );
}

async function handleRemoveBrainrot(interaction) {
    const name = interaction.options.getString('name');
    
    const index = brainrots.findIndex(br => br.name.toLowerCase() === name.toLowerCase());
    
    if (index === -1) {
        return interaction.reply({ 
            content: '❌ Ce brainrot n\'existe pas !', 
            ephemeral: true 
        });
    }

    const removed = brainrots.splice(index, 1)[0];
    await saveBrainrots();
    await updateEmbed(client);

    await interaction.reply({ 
        content: `✅ **${removed.name}** a été supprimé !`, 
        ephemeral: true 
    });
}

async function handleUpdateBrainrot(interaction) {
    const name = interaction.options.getString('name');
    const incomeRate = interaction.options.getNumber('income_rate');
    const muta = interaction.options.getInteger('muta');
    const priceEUR = interaction.options.getNumber('price_eur');
    const crypto = interaction.options.getString('crypto');

    const brainrot = brainrots.find(br => br.name.toLowerCase() === name.toLowerCase());
    
    if (!brainrot) {
        return interaction.reply({ 
            content: '❌ Ce brainrot n\'existe pas !', 
            ephemeral: true 
        });
    }

    await interaction.deferReply({ ephemeral: true });

    // Mettre à jour les valeurs
    if (incomeRate !== null) brainrot.incomeRate = incomeRate;
    if (muta !== null) brainrot.muta = muta;
    if (priceEUR !== null) {
        brainrot.priceEUR = priceEUR;
        // Recalculer les prix crypto
        const targetCrypto = crypto || config.defaultCrypto;
        brainrot.priceCrypto = await convertEURToCrypto(priceEUR, [targetCrypto]);
    }

    await saveBrainrots();
    await updateEmbed(client);

    await interaction.editReply(`✅ **${name}** mis à jour !`);
}

async function handleSetCrypto(interaction) {
    const crypto = interaction.options.getString('crypto');
    
    config.defaultCrypto = crypto;
    await saveConfig();
    await updateEmbed(client);

    await interaction.reply({ 
        content: `✅ Crypto par défaut définie sur **${crypto}**`, 
        ephemeral: true 
    });
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
        .setDescription('Force la mise à jour de la liste'),
    
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
        .addNumberOption(option =>
            option.setName('income_rate')
                .setDescription('Taux de revenu par heure')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('muta')
                .setDescription('Valeur de muta')
                .setRequired(true))
        .addNumberOption(option =>
            option.setName('price_eur')
                .setDescription('Prix en euros')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('crypto')
                .setDescription('Crypto pour la conversion (défaut: BTC)')
                .setRequired(false)
                .addChoices(...getSupportedCryptos().map(c => ({ name: c, value: c }))))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    new SlashCommandBuilder()
        .setName('removebrainrot')
        .setDescription('Supprime un brainrot')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Nom du brainrot à supprimer')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    new SlashCommandBuilder()
        .setName('updatebrainrot')
        .setDescription('Met à jour un brainrot existant')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Nom du brainrot à modifier')
                .setRequired(true))
        .addNumberOption(option =>
            option.setName('income_rate')
                .setDescription('Nouveau taux de revenu')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('muta')
                .setDescription('Nouvelle valeur de muta')
                .setRequired(false))
        .addNumberOption(option =>
            option.setName('price_eur')
                .setDescription('Nouveau prix en euros')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('crypto')
                .setDescription('Crypto pour recalculer le prix')
                .setRequired(false)
                .addChoices(...getSupportedCryptos().map(c => ({ name: c, value: c }))))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    new SlashCommandBuilder()
        .setName('setcrypto')
        .setDescription('Définit la crypto par défaut pour les affichages')
        .addStringOption(option =>
            option.setName('crypto')
                .setDescription('Choisir une crypto')
                .setRequired(true)
                .addChoices(...getSupportedCryptos().map(c => ({ name: c, value: c }))))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        console.log('🔄 Enregistrement des commandes...');
        
        if (GUILD_ID) {
            // Commandes de guilde (instantané)
            await rest.put(
                Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
                { body: commands }
            );
            console.log('✅ Commandes de guilde enregistrées');
        } else {
            // Commandes globales (peut prendre jusqu'à 1h)
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