/**
 * Handlers pour les commandes de giveaways
 */

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const logger = require('../../config/logger');
const giveawaysService = require('../../services/giveaways');
const { parseDuration, formatDuration } = require('../../utils/helpers');

/**
 * Crée un giveaway
 */
async function handleGiveaway(interaction) {
    try {
        const prize = interaction.options.getString('prize');
        const durationStr = interaction.options.getString('duration');
        const winnersCount = interaction.options.getInteger('winners') || 1;
        const forcedWinner = interaction.options.getUser('forced_winner');

        const durationMinutes = parseDuration(durationStr);
        if (!durationMinutes) {
            return interaction.reply({
                content: '❌ Format de durée invalide (ex: 1min, 1h, 1j, 1sem, 1m, 1an)',
                flags: 64
            });
        }

        const endTime = Date.now() + (durationMinutes * 60 * 1000);

        // Créer le message du giveaway
        const embed = new EmbedBuilder()
            .setTitle('🎉 GIVEAWAY')
            .setDescription(`**${prize}**`)
            .setColor(0xFFE600)
            .addFields(
                { name: 'Gagnants', value: winnersCount.toString(), inline: true },
                { name: 'Fin', value: `<t:${Math.floor(endTime / 1000)}:R>`, inline: true },
                { name: 'Participants', value: '0', inline: true }
            )
            .setFooter({ text: 'Clique sur le bouton pour participer!' });

        const button = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`giveaway_join_${Date.now()}`)
                    .setLabel('Participer')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🎁')
            );

        const message = await interaction.reply({
            embeds: [embed],
            components: [button],
            fetchReply: true
        });

        // Sauvegarder le giveaway
        const giveawayId = await giveawaysService.create(interaction.guildId, {
            messageId: message.id,
            channelId: interaction.channelId,
            prize,
            winnersCount,
            endTime,
            forcedWinner: forcedWinner?.id
        });

        logger.info(`Giveaway créé: ${prize} (${winnersCount} gagnants)`);

        // Planifier la fin du giveaway
        scheduleGiveawayEnd(interaction.client, giveawayId, endTime);
    } catch (error) {
        logger.error('Erreur handleGiveaway:', error);
        await interaction.reply({ content: '❌ Erreur lors de la création du giveaway', flags: 64 });
    }
}

/**
 * Termine un giveaway immédiatement
 */
async function handleGiveawayEnd(interaction) {
    try {
        const messageId = interaction.options.getString('message_id');
        const giveaway = await giveawaysService.getByMessageId(messageId);

        if (!giveaway) {
            return interaction.reply({
                content: '❌ Giveaway non trouvé',
                flags: 64
            });
        }

        const winners = await giveawaysService.endGiveaway(giveaway.id);

        const embed = new EmbedBuilder()
            .setTitle('✅ Giveaway terminé')
            .setColor(0x00FF00)
            .setDescription(`**${giveaway.prize}**\n\n**Gagnants:**\n${winners.map(w => `<@${w}>`).join('\n')}`);

        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        logger.error('Erreur handleGiveawayEnd:', error);
        await interaction.reply({ content: '❌ Erreur lors de la fin du giveaway', flags: 64 });
    }
}

/**
 * Reroll les gagnants d'un giveaway
 */
async function handleGiveawayReroll(interaction) {
    try {
        const messageId = interaction.options.getString('message_id');
        const giveaway = await giveawaysService.getByMessageId(messageId);

        if (!giveaway) {
            return interaction.reply({
                content: '❌ Giveaway non trouvé',
                flags: 64
            });
        }

        const newWinners = await giveawaysService.rerollWinners(giveaway.id);

        const embed = new EmbedBuilder()
            .setTitle('🔄 Giveaway reroll')
            .setColor(0x00FFFF)
            .setDescription(`**${giveaway.prize}**\n\n**Nouveaux gagnants:**\n${newWinners.map(w => `<@${w}>`).join('\n')}`);

        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        logger.error('Erreur handleGiveawayReroll:', error);
        await interaction.reply({ content: '❌ Erreur lors du reroll', flags: 64 });
    }
}

/**
 * Liste tous les giveaways
 */
async function handleGiveawayList(interaction) {
    try {
        const serverId = interaction.guildId;
        const giveaways = await giveawaysService.getAll(serverId);

        if (giveaways.length === 0) {
            return interaction.reply({
                content: '❌ Aucun giveaway sur ce serveur',
                flags: 64
            });
        }

        const active = giveaways.filter(g => !g.ended && g.end_time > Date.now());
        const ended = giveaways.filter(g => g.ended);

        const embeds = [];

        if (active.length > 0) {
            const activeEmbed = new EmbedBuilder()
                .setTitle('🎉 Giveaways actifs')
                .setColor(0x00FF00)
                .setDescription(active.map(g => 
                    `**${g.prize}**\n` +
                    `Gagnants: ${g.winners_count} | Participants: ${g.participants?.length || 0}\n` +
                    `Fin: <t:${Math.floor(g.end_time / 1000)}:R>`
                ).join('\n\n'));
            embeds.push(activeEmbed);
        }

        if (ended.length > 0) {
            const endedEmbed = new EmbedBuilder()
                .setTitle('✅ Giveaways terminés')
                .setColor(0x808080)
                .setDescription(ended.slice(0, 5).map(g => 
                    `**${g.prize}**\n` +
                    `Gagnants: ${g.winners?.map(w => `<@${w}>`).join(', ') || 'Aucun'}`
                ).join('\n\n'));
            embeds.push(endedEmbed);
        }

        await interaction.reply({ embeds });
    } catch (error) {
        logger.error('Erreur handleGiveawayList:', error);
        await interaction.reply({ content: '❌ Erreur lors de l\'affichage', flags: 64 });
    }
}

/**
 * Planifie la fin automatique d'un giveaway
 */
function scheduleGiveawayEnd(client, giveawayId, endTime) {
    const delay = endTime - Date.now();
    
    if (delay > 0) {
        setTimeout(async () => {
            try {
                const giveaway = await giveawaysService.getById(giveawayId);
                if (giveaway && !giveaway.ended) {
                    const winners = await giveawaysService.endGiveaway(giveawayId);
                    logger.info(`Giveaway auto-terminé: ${giveaway.prize} - Gagnants: ${winners.join(', ')}`);
                }
            } catch (error) {
                logger.error('Erreur fin auto giveaway:', error);
            }
        }, delay);
    }
}

module.exports = {
    handleGiveaway,
    handleGiveawayEnd,
    handleGiveawayReroll,
    handleGiveawayList,
    scheduleGiveawayEnd
};
