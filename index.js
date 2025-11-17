require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits, REST, Routes, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const { convertEURToAllCryptos, getSupportedCryptos, updateAllBrainrotsPrices } = require('./cryptoConverter');

// Configuration
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const BRAINROTS_FILE = path.join(__dirname, 'brainrots.json');
const CONFIG_FILE = path.join(__dirname, 'config.json');
const GIVEAWAYS_FILE = path.join(__dirname, 'giveaways.json');
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

// État global
let brainrots = [];
let giveaways = [];
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

// Couleurs des raretés (carrés colorés Unicode)
const rarityColors = {
    'Common': '⬜',
    'Rare': '🟦',
    'Epic': '🟪',
    'Legendary': '🟧',
    'Mythic': '🟥',
    'Brainrot God': '🌈',
    'Secret': '⬛',
    'OG': '⭐'
};

// Mutations prédéfinies (obligatoires)
const MUTATIONS = [
    'Default', 'Gold', 'Diamond', 'Rainbow', 'Lava', 
    'Bloodrot', 'Celestial', 'Candy', 'Galaxy', 'Yin Yang'
];

// Traits prédéfinis (obligatoires)
const TRAITS = [
    'Bloodmoon', 'Taco', 'Galactic', 'Explosive', 'Bubblegum',
    'Zombie', 'Glitched', 'Claws', 'Fireworks', 'Nyan',
    'Fire', 'Rain', 'Snowy', 'Cometstruck', 'Disco',
    'Water', 'TenB', 'Matteo Hat', 'Brazil Flag', 'Sleep',
    'UFO', 'Mygame43', 'Spider', 'Strawberry', 'Extinct',
    'Paint', 'Sombrero', 'Tie', 'Wizard Hat', 'Indonesia Flag',
    'Meowl', 'Pumpkin', 'R.I.P.'
];

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

async function loadGiveaways() {
    try {
        const data = await fs.readFile(GIVEAWAYS_FILE, 'utf8');
        giveaways = JSON.parse(data);
        console.log(`✅ ${giveaways.length} giveaways chargés`);
    } catch (error) {
        if (error.code === 'ENOENT') {
            giveaways = [];
            await saveGiveaways();
        } else {
            console.error('❌ Erreur lors du chargement des giveaways:', error);
            giveaways = [];
        }
    }
}

async function saveGiveaways() {
    try {
        await fs.writeFile(GIVEAWAYS_FILE, JSON.stringify(giveaways, null, 2), 'utf8');
        console.log('💾 Giveaways sauvegardés');
    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde des giveaways:', error);
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
            item.mutation === br.mutation &&
            JSON.stringify(item.traits) === JSON.stringify(br.traits)
        );
        
        if (existing) {
            existing.quantite = (existing.quantite || 1) + (br.quantite || 1);
        } else {
            aggregated.push({ ...br, quantite: br.quantite || 1 });
        }
    }
    
    return aggregated;
}

// ═══════════════════════════════════════════════════════════
// CONSTRUCTION DE L'EMBED
// ═══════════════════════════════════════════════════════════

function buildEmbed(viewMode = 'rarity') {
    const aggregated = aggregateBrainrots(brainrots);
    const sorted = sortBrainrots(aggregated);
    const crypto = config.defaultCrypto;
    
    const embed = new EmbedBuilder()
        .setColor(0xFFE600)
        .setTimestamp()
        .setFooter({ text: `Auto-refresh: 5 min | Prix en ${crypto}` });

    if (sorted.length === 0) {
        embed.setDescription('*Aucun brainrot disponible*');
        return embed;
    }

    switch (viewMode) {
        case 'rarity':
            embed.setTitle('🎨 Par Rareté');
            buildRarityView(embed, sorted, crypto);
            break;
        case 'price_eur':
            embed.setTitle('💰 Trié par Prix EUR');
            buildPriceEURView(embed, sorted, crypto);
            break;
        case 'income':
            embed.setTitle('📈 Trié par Income');
            buildIncomeView(embed, sorted, crypto);
            break;
        case 'mutations':
            embed.setTitle('🧬 Par Mutation');
            buildMutationsView(embed, sorted, crypto);
            break;
        case 'traits':
            embed.setTitle('✨ Par Trait');
            buildTraitsView(embed, sorted, crypto);
            break;
    }

    return embed;
}

function buildRarityView(embed, sorted, crypto) {
    const groupedByRarity = {};
    sorted.forEach(br => {
        if (!groupedByRarity[br.rarity]) {
            groupedByRarity[br.rarity] = [];
        }
        groupedByRarity[br.rarity].push(br);
    });

    // Gap de 2 après le titre
    embed.setDescription('\n\n');

    Object.keys(groupedByRarity).forEach(rarity => {
        const items = groupedByRarity[rarity];
        const colorEmoji = rarityColors[rarity] || '📦';
        
        // Gap de 1 entre les brainrots
        const itemsList = items.map(br => formatBrainrotLine(br, crypto, true)).join('\n');

        embed.addFields({
            name: `${colorEmoji} ${rarity}`,
            value: itemsList + '\n\n', // Gap de 2 après la section
            inline: false
        });
    });
}

function buildPriceEURView(embed, sorted, crypto) {
    const sortedByPrice = [...sorted].sort((a, b) => {
        const priceA = parsePrice(a.priceEUR);
        const priceB = parsePrice(b.priceEUR);
        return priceB - priceA;
    });

    // Gap de 2 après le titre, puis gap de 1 entre les brainrots
    const itemsList = sortedByPrice.map(br => formatBrainrotLine(br, crypto, true)).join('\n');
    
    embed.setDescription('\n\n' + (itemsList || '*Aucun brainrot*'));
}

function buildIncomeView(embed, sorted, crypto) {
    const sortedByIncome = [...sorted].sort((a, b) => {
        const incomeA = parsePrice(a.incomeRate);
        const incomeB = parsePrice(b.incomeRate);
        return incomeB - incomeA;
    });

    // Gap de 2 après le titre, puis gap de 1 entre les brainrots
    const itemsList = sortedByIncome.map(br => formatBrainrotLine(br, crypto, true)).join('\n');
    
    embed.setDescription('\n\n' + (itemsList || '*Aucun brainrot*'));
}

function buildMutationsView(embed, sorted, crypto) {
    const groupedByMutation = {};
    
    sorted.forEach(br => {
        const mutation = br.mutation || 'Sans mutation';
        if (!groupedByMutation[mutation]) {
            groupedByMutation[mutation] = [];
        }
        groupedByMutation[mutation].push(br);
    });

    // Gap de 2 après le titre
    embed.setDescription('\n\n');

    Object.keys(groupedByMutation).sort().forEach(mutation => {
        const items = groupedByMutation[mutation];
        // Gap de 1 entre les brainrots
        const itemsList = items.map(br => formatBrainrotLine(br, crypto, true)).join('\n');

        embed.addFields({
            name: `🧬 ${mutation}`,
            value: itemsList + '\n\n', // Gap de 2 après la section
            inline: false
        });
    });
}

function buildTraitsView(embed, sorted, crypto) {
    const groupedByTrait = {};
    
    sorted.forEach(br => {
        const traits = br.traits || [];
        if (traits.length === 0) {
            if (!groupedByTrait['Sans trait']) {
                groupedByTrait['Sans trait'] = [];
            }
            groupedByTrait['Sans trait'].push(br);
        } else {
            traits.forEach(trait => {
                if (!groupedByTrait[trait]) {
                    groupedByTrait[trait] = [];
                }
                groupedByTrait[trait].push(br);
            });
        }
    });

    // Gap de 2 après le titre
    embed.setDescription('\n\n');

    Object.keys(groupedByTrait).sort().forEach(trait => {
        const items = groupedByTrait[trait];
        // Gap de 1 entre les brainrots
        const itemsList = items.map(br => formatBrainrotLine(br, crypto, true)).join('\n');

        embed.addFields({
            name: `✨ ${trait}`,
            value: itemsList + '\n\n', // Gap de 2 après la section
            inline: false
        });
    });
}

function formatBrainrotLine(br, crypto, showTraits = false) {
    const cryptoPrice = br.priceCrypto && br.priceCrypto[crypto] 
        ? formatCryptoPrice(br.priceCrypto[crypto])
        : 'N/A';
    
    const quantiteDisplay = br.quantite > 1 ? ` x${br.quantite}` : '';
    const mutationDisplay = br.mutation ? ` [${br.mutation}]` : '';
    const traitsDisplay = showTraits && br.traits && br.traits.length > 0 
        ? ` {${br.traits.join(', ')}}` 
        : '';
    
    return `**${br.name}${quantiteDisplay}${mutationDisplay}${traitsDisplay}**\n` +
           `├ Income: ${formatPrice(parsePrice(br.incomeRate))}/s\n` +
           `├ Prix: €${formatPrice(parsePrice(br.priceEUR))} (${cryptoPrice} ${crypto})\n`;
}

function createNavigationButtons() {
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('view_rarity')
                .setLabel('Rareté')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🎨'),
            new ButtonBuilder()
                .setCustomId('view_price_eur')
                .setLabel('Prix EUR')
                .setStyle(ButtonStyle.Success)
                .setEmoji('💰'),
            new ButtonBuilder()
                .setCustomId('view_income')
                .setLabel('Income')
                .setStyle(ButtonStyle.Success)
                .setEmoji('📈'),
            new ButtonBuilder()
                .setCustomId('view_mutations')
                .setLabel('Mutations')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🧬'),
            new ButtonBuilder()
                .setCustomId('view_traits')
                .setLabel('Traits')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('✨')
        );
    
    return row;
}

// ═══════════════════════════════════════════════════════════
// MISE À JOUR DE L'EMBED
// ═══════════════════════════════════════════════════════════

async function updateEmbed(client, viewMode = 'rarity') {
    if (!config.listMessageId || !config.listChannelId) {
        console.log('⚠️ Aucun message à mettre à jour');
        return;
    }

    try {
        const channel = await client.channels.fetch(config.listChannelId);
        const message = await channel.messages.fetch(config.listMessageId);
        const embed = buildEmbed(viewMode);
        const buttons = createNavigationButtons();
        
        // Garder les fichiers existants (banner)
        const existingFiles = Array.from(message.attachments.values());
        
        await message.edit({ 
            embeds: [embed], 
            components: [buttons],
            files: existingFiles
        });
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

client.once('clientReady', async () => {
    console.log(`✅ Bot connecté en tant que ${client.user.tag}`);
    
    await loadBrainrots();
    await loadConfig();
    await loadGiveaways();
    
    // Auto-refresh toutes les 5 minutes
    setInterval(() => {
        updateEmbed(client);
    }, REFRESH_INTERVAL);
    
    // Vérifier les giveaways toutes les 10 secondes
    setInterval(() => {
        checkGiveaways(client);
    }, 10000);
});

// ═══════════════════════════════════════════════════════════
// COMMANDES SLASH
// ═══════════════════════════════════════════════════════════

client.on('interactionCreate', async interaction => {
    // Gestion des boutons
    if (interaction.isButton()) {
        try {
            // Bouton giveaway
            if (interaction.customId === 'giveaway_join') {
                const giveaway = giveaways.find(g => g.messageId === interaction.message.id);
                
                if (!giveaway) {
                    return interaction.reply({ content: '❌ Giveaway introuvable !', flags: 64 });
                }
                
                if (giveaway.ended) {
                    return interaction.reply({ content: '❌ Ce giveaway est terminé !', flags: 64 });
                }
                
                const userId = interaction.user.id;
                
                if (giveaway.participants.includes(userId)) {
                    giveaway.participants = giveaway.participants.filter(id => id !== userId);
                    await saveGiveaways();
                    await updateGiveawayEmbed(client, giveaway);
                    return interaction.reply({ content: '❌ Vous avez quitté le giveaway !', flags: 64 });
                } else {
                    giveaway.participants.push(userId);
                    await saveGiveaways();
                    await updateGiveawayEmbed(client, giveaway);
                    return interaction.reply({ content: '✅ Vous participez au giveaway !', flags: 64 });
                }
            }
            
            // Boutons navigation brainrots
            const viewMode = interaction.customId.replace('view_', '');
            const embed = buildEmbed(viewMode);
            const buttons = createNavigationButtons();
            
            // Garder tous les fichiers existants (banner)
            const existingFiles = Array.from(interaction.message.attachments.values());
            
            await interaction.update({ 
                embeds: [embed], 
                components: [buttons],
                files: existingFiles
            });
        } catch (error) {
            console.error('❌ Erreur bouton:', error);
        }
        return;
    }

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
            case 'addtrait':
                await handleAddTrait(interaction);
                break;
            case 'removetrait':
                await handleRemoveTrait(interaction);
                break;
            case 'giveaway':
                await handleGiveaway(interaction);
                break;
            case 'gend':
                await handleGiveawayEnd(interaction);
                break;
            case 'greroll':
                await handleGiveawayReroll(interaction);
                break;
            case 'glist':
                await handleGiveawayList(interaction);
                break;
            case 'clear':
                await handleClear(interaction);
                break;
            case 'announce':
                await handleAnnounce(interaction);
                break;
            case 'stats':
                await handleStats(interaction);
                break;
        }
    } catch (error) {
        console.error(`❌ Erreur dans la commande ${commandName}:`, error);
        
        const errorMessage = 'Une erreur est survenue lors de l\'exécution de la commande.';
        
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: errorMessage, flags: 64 });
        } else {
            await interaction.reply({ content: errorMessage, flags: 64 });
        }
    }
});

// ═══════════════════════════════════════════════════════════
// FONCTIONS GIVEAWAY
// ═══════════════════════════════════════════════════════════

function buildGiveawayEmbed(giveaway) {
    const endTime = Math.floor(giveaway.endTime / 1000);
    const now = Math.floor(Date.now() / 1000);
    const timeLeft = endTime - now;
    
    let timeDisplay;
    if (timeLeft <= 0) {
        timeDisplay = '**TERMINÉ**';
    } else {
        timeDisplay = `<t:${endTime}:R>`;
    }
    
    const embed = new EmbedBuilder()
        .setTitle('🎉 GIVEAWAY 🎉')
        .setDescription(`\n\n**${giveaway.prize}**\n\n`)
        .addFields(
            { name: '⏰ Se termine', value: timeDisplay, inline: true },
            { name: '👥 Participants', value: `${giveaway.participants.length}`, inline: true },
            { name: '🎁 Gagnants', value: `${giveaway.winners}`, inline: true }
        )
        .setColor(0xFF0000)
        .setImage('attachment://Robux.jpg')
        .setFooter({ text: 'Cliquez sur 🎉 pour participer !' })
        .setTimestamp();
    
    return embed;
}

function createGiveawayButton() {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('giveaway_join')
                .setLabel('Participer')
                .setStyle(ButtonStyle.Success)
                .setEmoji('🎉')
        );
}

async function checkGiveaways(client) {
    const now = Date.now();
    
    for (const giveaway of giveaways) {
        if (giveaway.ended) continue;
        
        if (now >= giveaway.endTime) {
            await endGiveaway(client, giveaway);
        } else {
            // Mettre à jour l'embed avec le temps restant
            await updateGiveawayEmbed(client, giveaway);
        }
    }
}

async function updateGiveawayEmbed(client, giveaway) {
    try {
        const channel = await client.channels.fetch(giveaway.channelId);
        const message = await channel.messages.fetch(giveaway.messageId);
        const embed = buildGiveawayEmbed(giveaway);
        const button = createGiveawayButton();
        
        const robuxPath = path.join(__dirname, 'Robux.jpg');
        let files = [];
        try {
            await fs.access(robuxPath);
            files = message.attachments.size > 0 ? Array.from(message.attachments.values()) : [robuxPath];
        } catch (error) {
            files = message.attachments.size > 0 ? Array.from(message.attachments.values()) : [];
        }
        
        await message.edit({ embeds: [embed], components: [button], files });
    } catch (error) {
        console.error('❌ Erreur mise à jour giveaway:', error);
    }
}

async function endGiveaway(client, giveaway) {
    giveaway.ended = true;
    
    try {
        const channel = await client.channels.fetch(giveaway.channelId);
        const message = await channel.messages.fetch(giveaway.messageId);
        
        let winnersText;
        if (giveaway.participants.length === 0) {
            winnersText = 'Aucun participant 😢';
        } else if (giveaway.forcedWinner) {
            winnersText = `<@${giveaway.forcedWinner}>`;
        } else {
            const winnersList = [];
            const participants = [...giveaway.participants];
            for (let i = 0; i < Math.min(giveaway.winners, participants.length); i++) {
                const randomIndex = Math.floor(Math.random() * participants.length);
                winnersList.push(participants[randomIndex]);
                participants.splice(randomIndex, 1);
            }
            winnersText = winnersList.map(id => `<@${id}>`).join(', ');
        }
        
        const endEmbed = new EmbedBuilder()
            .setTitle('🎉 GIVEAWAY TERMINÉ 🎉')
            .setDescription(`\n\n**${giveaway.prize}**\n\n`)
            .addFields(
                { name: '🏆 Gagnant(s)', value: winnersText, inline: false },
                { name: '👥 Participants', value: `${giveaway.participants.length}`, inline: true }
            )
            .setColor(0x00FF00)
            .setImage('attachment://Robux.jpg')
            .setTimestamp();
        
        const robuxPath = path.join(__dirname, 'Robux.jpg');
        let files = [];
        try {
            await fs.access(robuxPath);
            files = message.attachments.size > 0 ? Array.from(message.attachments.values()) : [robuxPath];
        } catch (error) {
            files = message.attachments.size > 0 ? Array.from(message.attachments.values()) : [];
        }
        
        await message.edit({ embeds: [endEmbed], components: [], files });
        await channel.send(`🎉 Félicitations ${winnersText} ! Vous avez gagné **${giveaway.prize}** !`);
        
        await saveGiveaways();
    } catch (error) {
        console.error('❌ Erreur fin giveaway:', error);
    }
}

// ═══════════════════════════════════════════════════════════
// HANDLERS DES COMMANDES
// ═══════════════════════════════════════════════════════════

async function handleList(interaction) {
    const embed = buildEmbed('rarity');
    const buttons = createNavigationButtons();
    
    // Charger la banner
    const bannerPath = path.join(__dirname, 'Banner.png');
    let files = [];
    let content = '';
    
    try {
        await fs.access(bannerPath);
        files = [bannerPath];
        // La banner sera affichée comme image séparée, pas dans l'embed
    } catch (error) {
        console.log('⚠️ Banner.png introuvable, embed sans image');
    }
    
    const message = await interaction.reply({ 
        content: content || undefined,
        embeds: [embed], 
        components: [buttons], 
        files,
        fetchReply: true 
    });
    
    config.listMessageId = message.id;
    config.listChannelId = message.channelId;
    await saveConfig();
}

async function handleRefresh(interaction) {
    await interaction.deferReply({ flags: 64 });
    
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
    const mutation = interaction.options.getString('mutation');
    const traits = interaction.options.getString('traits');
    const priceEUR = interaction.options.getString('price_eur');
    const compte = interaction.options.getString('compte');
    const quantite = interaction.options.getInteger('quantite') || 1;

    await interaction.deferReply({ flags: 64 });

    // Parser et valider les traits
    let traitsArray = [];
    if (traits) {
        traitsArray = traits.split(',').map(t => t.trim());
        
        // Vérifier que tous les traits sont valides
        const invalidTraits = traitsArray.filter(t => !TRAITS.includes(t));
        if (invalidTraits.length > 0) {
            return interaction.editReply(
                `❌ Traits invalides: ${invalidTraits.join(', ')}\n\n` +
                `**Traits disponibles:**\n${TRAITS.join(', ')}`
            );
        }
    }
    
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
        br.mutation === mutation &&
        JSON.stringify(br.traits) === JSON.stringify(traitsArray)
    );

    if (existing) {
        // Agréger avec l'existant
        existing.quantite = (existing.quantite || 1) + quantite;
        await saveBrainrots();
        await updateEmbed(client);
        
        return interaction.editReply(
            `✅ **${name}** agrégé ! Nouvelle quantité: x${existing.quantite}`
        );
    }

    const newBrainrot = {
        name,
        rarity,
        incomeRate,
        mutation,
        traits: traitsArray,
        priceEUR: priceEURParsed,
        priceCrypto,
        compte: compte || null,
        quantite: quantite
    };

    brainrots.push(newBrainrot);
    await saveBrainrots();
    await updateEmbed(client);

    const mutDisplay = mutation ? ` [${mutation}]` : '';
    const traitsDisplay = traitsArray.length > 0 ? ` {${traitsArray.join(', ')}}` : '';
    const quantiteDisplay = quantite > 1 ? ` x${quantite}` : '';
    
    await interaction.editReply(
        `✅ **${name}${quantiteDisplay}${mutDisplay}${traitsDisplay}** ajouté !\n` +
        `Rareté: ${rarity}\n` +
        `Prix: €${formatPrice(priceEURParsed)}`
    );
}

async function handleRemoveBrainrot(interaction) {
    const name = interaction.options.getString('name');
    const mutation = interaction.options.getString('mutation');
    const traitsFilter = interaction.options.getString('traits_filter');
    
    const traitsArray = traitsFilter ? traitsFilter.split(',').map(t => t.trim()) : null;
    
    // Trouver le brainrot correspondant
    const index = brainrots.findIndex(br => {
        const nameMatch = br.name.toLowerCase() === name.toLowerCase();
        const mutMatch = mutation ? br.mutation === mutation : true;
        const traitsMatch = traitsArray 
            ? JSON.stringify(br.traits) === JSON.stringify(traitsArray)
            : true;
        return nameMatch && mutMatch && traitsMatch;
    });
    
    if (index === -1) {
        return interaction.reply({ 
            content: '❌ Ce brainrot n\'existe pas !', 
            flags: 64 
        });
    }

    const removed = brainrots.splice(index, 1)[0];
    await saveBrainrots();
    await updateEmbed(client);

    const mutDisplay = removed.mutation ? ` [${removed.mutation}]` : '';
    const traitsDisplay = removed.traits && removed.traits.length > 0 
        ? ` {${removed.traits.join(', ')}}` 
        : '';
    
    await interaction.reply({ 
        content: `✅ **${removed.name}${mutDisplay}${traitsDisplay}** a été supprimé !`, 
        flags: 64 
    });
}

async function handleUpdateBrainrot(interaction) {
    const name = interaction.options.getString('name');
    const mutationFilter = interaction.options.getString('mutation_filter');
    const incomeRate = interaction.options.getString('income_rate');
    const newMutation = interaction.options.getString('new_mutation');
    const newTraits = interaction.options.getString('new_traits');
    const priceEUR = interaction.options.getString('price_eur');
    const compte = interaction.options.getString('compte');
    const quantite = interaction.options.getInteger('quantite');
    
    // Trouver le brainrot
    const brainrot = brainrots.find(br => {
        const nameMatch = br.name.toLowerCase() === name.toLowerCase();
        const mutMatch = mutationFilter ? br.mutation === mutationFilter : true;
        return nameMatch && mutMatch;
    });
    
    if (!brainrot) {
        return interaction.reply({ 
            content: '❌ Ce brainrot n\'existe pas !', 
            flags: 64 
        });
    }

    await interaction.deferReply({ flags: 64 });

    // Mettre à jour les valeurs
    if (incomeRate !== null) brainrot.incomeRate = incomeRate;
    if (newMutation !== null) brainrot.mutation = newMutation;
    
    // Mettre à jour les traits
    if (newTraits !== null) {
        const traitsArray = newTraits.split(',').map(t => t.trim());
        
        // Vérifier que tous les traits sont valides
        const invalidTraits = traitsArray.filter(t => !TRAITS.includes(t));
        if (invalidTraits.length > 0) {
            return interaction.editReply(
                `❌ Traits invalides: ${invalidTraits.join(', ')}\n\n` +
                `**Traits disponibles:**\n${TRAITS.join(', ')}`
            );
        }
        
        brainrot.traits = traitsArray;
    }
    
    if (compte !== null) brainrot.compte = compte;
    if (quantite !== null) brainrot.quantite = quantite;
    
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
    
    await interaction.deferReply({ flags: 64 });
    
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
            flags: 64
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
        .setColor(0xFFD700)
        .setTimestamp();
    
    for (const [compte, items] of Object.entries(byCompte)) {
        const itemsList = items.map(br => {
            const quantiteDisplay = br.quantite > 1 ? ` x${br.quantite}` : '';
            const mutDisplay = br.mutation ? ` [${br.mutation}]` : '';
            const traitsDisplay = br.traits && br.traits.length > 0 
                ? ` {${br.traits.join(', ')}}` 
                : '';
            return `• ${br.name}${quantiteDisplay}${mutDisplay}${traitsDisplay} (${br.rarity})`;
        }).join('\n');
        
        embed.addFields({
            name: `Compte: ${compte}`,
            value: itemsList,
            inline: false
        });
    }
    
    await interaction.reply({ embeds: [embed], flags: 64 });
}

async function handleAddTrait(interaction) {
    const name = interaction.options.getString('name');
    const mutationFilter = interaction.options.getString('mutation_filter');
    const trait = interaction.options.getString('trait');
    
    // Valider le trait
    if (!TRAITS.includes(trait)) {
        return interaction.reply({
            content: `❌ Trait invalide: "${trait}". Utilisez l'autocomplete pour choisir un trait valide.`,
            flags: 64
        });
    }
    
    // Trouver le brainrot
    const brainrot = brainrots.find(br => {
        const nameMatch = br.name.toLowerCase() === name.toLowerCase();
        const mutMatch = mutationFilter ? br.mutation === mutationFilter : true;
        return nameMatch && mutMatch;
    });
    
    if (!brainrot) {
        return interaction.reply({
            content: '❌ Ce brainrot n\'existe pas !',
            flags: 64
        });
    }
    
    // Initialiser les traits si nécessaire
    if (!brainrot.traits) {
        brainrot.traits = [];
    }
    
    // Vérifier si le trait existe déjà
    if (brainrot.traits.includes(trait)) {
        return interaction.reply({
            content: `❌ Le trait "${trait}" est déjà présent sur **${brainrot.name}** !`,
            flags: 64
        });
    }
    
    // Ajouter le trait
    brainrot.traits.push(trait);
    await saveBrainrots();
    await updateEmbed(client);
    
    await interaction.reply({
        content: `✅ Trait "${trait}" ajouté à **${brainrot.name}** !\nTraits actuels: {${brainrot.traits.join(', ')}}`,
        flags: 64
    });
}

async function handleRemoveTrait(interaction) {
    const name = interaction.options.getString('name');
    const mutationFilter = interaction.options.getString('mutation_filter');
    const trait = interaction.options.getString('trait');
    
    // Trouver le brainrot
    const brainrot = brainrots.find(br => {
        const nameMatch = br.name.toLowerCase() === name.toLowerCase();
        const mutMatch = mutationFilter ? br.mutation === mutationFilter : true;
        return nameMatch && mutMatch;
    });
    
    if (!brainrot) {
        return interaction.reply({
            content: '❌ Ce brainrot n\'existe pas !',
            flags: 64
        });
    }
    
    // Vérifier si le brainrot a des traits
    if (!brainrot.traits || brainrot.traits.length === 0) {
        return interaction.reply({
            content: `❌ **${brainrot.name}** n'a aucun trait !`,
            flags: 64
        });
    }
    
    // Vérifier si le trait existe
    const traitIndex = brainrot.traits.indexOf(trait);
    if (traitIndex === -1) {
        return interaction.reply({
            content: `❌ Le trait "${trait}" n'est pas présent sur **${brainrot.name}** !\nTraits actuels: {${brainrot.traits.join(', ')}}`,
            flags: 64
        });
    }
    
    // Retirer le trait
    brainrot.traits.splice(traitIndex, 1);
    await saveBrainrots();
    await updateEmbed(client);
    
    const remainingTraits = brainrot.traits.length > 0 
        ? `\nTraits restants: {${brainrot.traits.join(', ')}}` 
        : '\nPlus aucun trait.';
    
    await interaction.reply({
        content: `✅ Trait "${trait}" retiré de **${brainrot.name}** !${remainingTraits}`,
        flags: 64
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
            option.setName('mutation')
                .setDescription('Mutation (obligatoire)')
                .setRequired(true)
                .addChoices(...MUTATIONS.map(m => ({ name: m, value: m }))))
        .addStringOption(option =>
            option.setName('income_rate')
                .setDescription('Taux de revenu par seconde (ex: 100, 1k, 1.5M, 2B)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('price_eur')
                .setDescription('Prix en euros (ex: 50, 1k, 1.5M, 2B)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('compte')
                .setDescription('Nom du compte où se trouve le brainrot')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('traits')
                .setDescription('Traits séparés par des virgules (ex: Fire, Taco, Zombie)')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('quantite')
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
            option.setName('mutation')
                .setDescription('Mutation pour identifier le brainrot (si plusieurs avec même nom)')
                .setRequired(false)
                .addChoices(...MUTATIONS.map(m => ({ name: m, value: m }))))
        .addStringOption(option =>
            option.setName('traits_filter')
                .setDescription('Traits pour identifier le brainrot (ex: Fire, Taco)')
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
            option.setName('mutation_filter')
                .setDescription('Mutation pour identifier le brainrot (si plusieurs avec même nom)')
                .setRequired(false)
                .addChoices(...MUTATIONS.map(m => ({ name: m, value: m }))))
        .addStringOption(option =>
            option.setName('income_rate')
                .setDescription('Nouveau taux de revenu par seconde (ex: 1k, 1.5M)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('new_mutation')
                .setDescription('Nouvelle mutation')
                .setRequired(false)
                .addChoices(...MUTATIONS.map(m => ({ name: m, value: m }))))
        .addStringOption(option =>
            option.setName('new_traits')
                .setDescription('Nouveaux traits séparés par des virgules (ex: Fire, Taco)')
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
            option.setName('quantite')
                .setDescription('Nouvelle quantité')
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
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    new SlashCommandBuilder()
        .setName('addtrait')
        .setDescription('Ajoute un trait à un brainrot existant')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Nom du brainrot')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('trait')
                .setDescription('Trait à ajouter')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('mutation_filter')
                .setDescription('Mutation pour identifier le brainrot (si plusieurs avec même nom)')
                .setRequired(false)
                .addChoices(...MUTATIONS.map(m => ({ name: m, value: m }))))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    new SlashCommandBuilder()
        .setName('removetrait')
        .setDescription('Retire un trait d\'un brainrot existant')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Nom du brainrot')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('trait')
                .setDescription('Trait à retirer')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('mutation_filter')
                .setDescription('Mutation pour identifier le brainrot (si plusieurs avec même nom)')
                .setRequired(false)
                .addChoices(...MUTATIONS.map(m => ({ name: m, value: m }))))
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
