/**
 * Handlers pour les commandes de gestion des brainrots
 */

const { EmbedBuilder } = require('discord.js');
const logger = require('../../config/logger');
const brainrotsService = require('../../services/brainrots');
const { RARITY_HEX_COLORS, RARITY_COLORS } = require('../../utils/constants');
const { formatPrice, formatCryptoPrice } = require('../../utils/helpers');

/**
 * Affiche la liste des brainrots
 */
async function handleList(interaction) {
    try {
        const serverId = interaction.guildId;
        const brainrots = await brainrotsService.getAll(serverId);

        if (brainrots.length === 0) {
            return interaction.reply({
                content: '❌ Aucun brainrot trouvé sur ce serveur',
                flags: 64
            });
        }

        // Grouper par rareté
        const byRarity = {};
        brainrots.forEach(br => {
            if (!byRarity[br.rarity]) byRarity[br.rarity] = [];
            byRarity[br.rarity].push(br);
        });

        const embeds = [];
        for (const [rarity, items] of Object.entries(byRarity)) {
            const embed = new EmbedBuilder()
                .setTitle(`${RARITY_COLORS[rarity]} ${rarity}`)
                .setColor(RARITY_HEX_COLORS[rarity])
                .setDescription(items.map(br => 
                    `**${br.name}** (${br.mutation})\n` +
                    `💰 ${formatPrice(br.price_eur)} EUR | 📈 ${formatPrice(br.income_rate)}/s\n` +
                    `${br.traits?.length > 0 ? `✨ ${br.traits.join(', ')}` : ''}`
                ).join('\n\n'));
            
            embeds.push(embed);
        }

        await interaction.reply({ embeds: embeds.slice(0, 10) });
    } catch (error) {
        logger.error('Erreur handleList:', error);
        await interaction.reply({ content: '❌ Erreur lors de l\'affichage', flags: 64 });
    }
}

/**
 * Ajoute un brainrot
 */
async function handleAddBrainrot(interaction) {
    try {
        const serverId = interaction.guildId;
        const name = interaction.options.getString('name');
        const rarity = interaction.options.getString('rarity');
        const mutation = interaction.options.getString('mutation');
        const incomeRate = interaction.options.getString('income_rate');
        const priceEur = interaction.options.getString('price_eur');
        const compte = interaction.options.getString('compte');
        const traitsStr = interaction.options.getString('traits');
        const quantite = interaction.options.getInteger('quantite') || 1;

        const traits = traitsStr ? traitsStr.split(',').map(t => t.trim()) : [];

        const id = await brainrotsService.create(serverId, {
            name,
            rarity,
            mutation,
            incomeRate,
            priceEur,
            compte,
            traits,
            quantite
        });

        const embed = new EmbedBuilder()
            .setTitle('✅ Brainrot créé')
            .setColor(0x00FF00)
            .addFields(
                { name: 'Nom', value: name, inline: true },
                { name: 'Rareté', value: rarity, inline: true },
                { name: 'Mutation', value: mutation, inline: true },
                { name: 'Prix EUR', value: formatPrice(priceEur), inline: true },
                { name: 'Revenu/s', value: formatPrice(incomeRate), inline: true },
                { name: 'Quantité', value: quantite.toString(), inline: true }
            );

        if (compte) embed.addFields({ name: 'Compte', value: compte });
        if (traits.length > 0) embed.addFields({ name: 'Traits', value: traits.join(', ') });

        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        logger.error('Erreur handleAddBrainrot:', error);
        await interaction.reply({ content: '❌ Erreur lors de la création', flags: 64 });
    }
}

/**
 * Supprime un brainrot
 */
async function handleRemoveBrainrot(interaction) {
    try {
        const serverId = interaction.guildId;
        const name = interaction.options.getString('name');

        const brainrots = await brainrotsService.getAll(serverId);
        const target = brainrots.find(br => br.name.toLowerCase() === name.toLowerCase());

        if (!target) {
            return interaction.reply({
                content: `❌ Brainrot "${name}" non trouvé`,
                flags: 64
            });
        }

        await brainrotsService.delete(target.id);

        const embed = new EmbedBuilder()
            .setTitle('✅ Brainrot supprimé')
            .setColor(0xFF0000)
            .setDescription(`${target.name} (${target.rarity}) a été supprimé`);

        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        logger.error('Erreur handleRemoveBrainrot:', error);
        await interaction.reply({ content: '❌ Erreur lors de la suppression', flags: 64 });
    }
}

/**
 * Met à jour un brainrot
 */
async function handleUpdateBrainrot(interaction) {
    try {
        const serverId = interaction.guildId;
        const name = interaction.options.getString('name');
        const incomeRate = interaction.options.getString('income_rate');
        const newMutation = interaction.options.getString('new_mutation');
        const newTraits = interaction.options.getString('new_traits');
        const priceEur = interaction.options.getString('price_eur');
        const compte = interaction.options.getString('compte');
        const quantite = interaction.options.getInteger('quantite');

        const brainrots = await brainrotsService.getAll(serverId);
        const target = brainrots.find(br => br.name.toLowerCase() === name.toLowerCase());

        if (!target) {
            return interaction.reply({
                content: `❌ Brainrot "${name}" non trouvé`,
                flags: 64
            });
        }

        const updates = {};
        if (incomeRate) updates.incomeRate = incomeRate;
        if (newMutation) updates.mutation = newMutation;
        if (newTraits) updates.traits = newTraits.split(',').map(t => t.trim());
        if (priceEur) updates.priceEur = priceEur;
        if (compte) updates.compte = compte;
        if (quantite) updates.quantite = quantite;

        await brainrotsService.update(target.id, updates);

        const embed = new EmbedBuilder()
            .setTitle('✅ Brainrot mis à jour')
            .setColor(0x00FFFF)
            .setDescription(`${target.name} a été modifié`);

        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        logger.error('Erreur handleUpdateBrainrot:', error);
        await interaction.reply({ content: '❌ Erreur lors de la mise à jour', flags: 64 });
    }
}

/**
 * Ajoute un trait à un brainrot
 */
async function handleAddTrait(interaction) {
    try {
        const serverId = interaction.guildId;
        const name = interaction.options.getString('name');
        const trait = interaction.options.getString('trait');

        const brainrots = await brainrotsService.getAll(serverId);
        const target = brainrots.find(br => br.name.toLowerCase() === name.toLowerCase());

        if (!target) {
            return interaction.reply({
                content: `❌ Brainrot "${name}" non trouvé`,
                flags: 64
            });
        }

        await brainrotsService.addTrait(target.id, trait);

        const embed = new EmbedBuilder()
            .setTitle('✅ Trait ajouté')
            .setColor(0x00FF00)
            .setDescription(`${trait} a été ajouté à ${target.name}`);

        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        logger.error('Erreur handleAddTrait:', error);
        await interaction.reply({ content: '❌ Erreur lors de l\'ajout du trait', flags: 64 });
    }
}

/**
 * Retire un trait d'un brainrot
 */
async function handleRemoveTrait(interaction) {
    try {
        const serverId = interaction.guildId;
        const name = interaction.options.getString('name');
        const trait = interaction.options.getString('trait');

        const brainrots = await brainrotsService.getAll(serverId);
        const target = brainrots.find(br => br.name.toLowerCase() === name.toLowerCase());

        if (!target) {
            return interaction.reply({
                content: `❌ Brainrot "${name}" non trouvé`,
                flags: 64
            });
        }

        await brainrotsService.removeTrait(target.id, trait);

        const embed = new EmbedBuilder()
            .setTitle('✅ Trait retiré')
            .setColor(0xFF0000)
            .setDescription(`${trait} a été retiré de ${target.name}`);

        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        logger.error('Erreur handleRemoveTrait:', error);
        await interaction.reply({ content: '❌ Erreur lors du retrait du trait', flags: 64 });
    }
}

/**
 * Affiche les brainrots groupés par compte
 */
async function handleShowCompte(interaction) {
    try {
        const serverId = interaction.guildId;
        const brainrots = await brainrotsService.getAll(serverId);

        const byCompte = {};
        brainrots.forEach(br => {
            const compte = br.compte || 'Sans compte';
            if (!byCompte[compte]) byCompte[compte] = [];
            byCompte[compte].push(br);
        });

        const embeds = [];
        for (const [compte, items] of Object.entries(byCompte)) {
            const embed = new EmbedBuilder()
                .setTitle(`📦 ${compte}`)
                .setColor(0xFFE600)
                .setDescription(items.map(br => 
                    `**${br.name}** (${br.rarity})\n` +
                    `💰 ${formatPrice(br.price_eur)} EUR`
                ).join('\n\n'));
            
            embeds.push(embed);
        }

        await interaction.reply({ embeds: embeds.slice(0, 10) });
    } catch (error) {
        logger.error('Erreur handleShowCompte:', error);
        await interaction.reply({ content: '❌ Erreur lors de l\'affichage', flags: 64 });
    }
}

/**
 * Affiche les statistiques
 */
async function handleStats(interaction) {
    try {
        const serverId = interaction.guildId;
        const stats = await brainrotsService.getStats(serverId);

        const embed = new EmbedBuilder()
            .setTitle('📊 Statistiques du Marketplace')
            .setColor(0x00D9FF)
            .addFields(
                { name: 'Total Brainrots', value: stats.totalBrainrots.toString(), inline: true },
                { name: 'Types uniques', value: stats.uniqueTypes.toString(), inline: true },
                { name: 'Valeur totale', value: stats.totalValueFormatted, inline: true }
            );

        for (const [rarity, count] of Object.entries(stats.byRarity)) {
            embed.addFields({ name: rarity, value: count.toString(), inline: true });
        }

        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        logger.error('Erreur handleStats:', error);
        await interaction.reply({ content: '❌ Erreur lors de l\'affichage des stats', flags: 64 });
    }
}

module.exports = {
    handleList,
    handleAddBrainrot,
    handleRemoveBrainrot,
    handleUpdateBrainrot,
    handleAddTrait,
    handleRemoveTrait,
    handleShowCompte,
    handleStats
};
