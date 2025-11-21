/**
 * Commandes Discord pour la gestion des Giveaways
 * Commandes: giveaway, gend, greroll, glist
 */

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const giveawayService = require('../../services/giveawayService');
const logger = require('../../core/logger');
const { ValidationError, NotFoundError } = require('../../core/errors');

/**
 * Commande /giveaway - Crée un nouveau giveaway
 */
const giveawayCommand = {
  data: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Crée un nouveau giveaway')
    .addStringOption(option =>
      option
        .setName('prize')
        .setDescription('Prix du giveaway')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('winners')
        .setDescription('Nombre de gagnants')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    )
    .addIntegerOption(option =>
      option
        .setName('duration')
        .setDescription('Durée en secondes')
        .setRequired(true)
        .setMinValue(60)
    ),
  
  async execute(interaction) {
    try {
      await interaction.deferReply();
      
      const serverId = interaction.guildId;
      const prize = interaction.options.getString('prize');
      const winnersCount = interaction.options.getInteger('winners');
      const duration = interaction.options.getInteger('duration');
      
      // Calculer le temps de fin
      const endTime = Date.now() + (duration * 1000);
      
      // Créer le giveaway
      const giveawayId = await giveawayService.create(serverId, {
        messageId: interaction.id,
        channelId: interaction.channelId,
        prize,
        winners_count: winnersCount,
        endTime
      });
      
      // Créer le bouton de participation
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`giveaway_join_${giveawayId}`)
            .setLabel('🎉 Participer')
            .setStyle(ButtonStyle.Primary)
        );
      
      // Créer l'embed
      const embed = new EmbedBuilder()
        .setColor('#7B2CBF')
        .setTitle('🎉 Nouveau Giveaway!')
        .setDescription(`**Prix:** ${prize}\n**Gagnants:** ${winnersCount}\n**Durée:** ${duration}s`)
        .addFields(
          { name: 'ID', value: String(giveawayId), inline: true },
          { name: 'Participants', value: '0', inline: true },
          { name: 'Fin du giveaway', value: `<t:${Math.floor(endTime / 1000)}:R>`, inline: false }
        )
        .setTimestamp();
      
      await interaction.editReply({ embeds: [embed], components: [row] });
      
      logger.info(`Giveaway créé: ${prize} (${winnersCount} gagnants) - ID: ${giveawayId}`);
    } catch (error) {
      logger.error('Erreur commande giveaway:', error);
      const message = error instanceof ValidationError ? error.message : 'Une erreur est survenue.';
      await interaction.editReply({
        content: `❌ ${message}`
      });
    }
  }
};

/**
 * Commande /gend - Termine un giveaway
 */
const gendCommand = {
  data: new SlashCommandBuilder()
    .setName('gend')
    .setDescription('Termine un giveaway et sélectionne les gagnants')
    .addIntegerOption(option =>
      option
        .setName('id')
        .setDescription('ID du giveaway à terminer')
        .setRequired(true)
        .setMinValue(1)
    ),
  
  async execute(interaction) {
    try {
      await interaction.deferReply();
      
      const giveawayId = interaction.options.getInteger('id');
      
      // Terminer le giveaway
      const giveaway = await giveawayService.endGiveaway(giveawayId);
      
      if (giveaway.winners.length === 0) {
        return await interaction.editReply({
          content: '❌ Aucun participant au giveaway.'
        });
      }
      
      // Créer l'embed avec les gagnants
      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('✅ Giveaway Terminé!')
        .addFields(
          { name: 'Prix', value: giveaway.prize, inline: true },
          { name: 'Gagnants', value: String(giveaway.winners.length), inline: true },
          { name: 'Participants', value: String(giveaway.participants.length), inline: true }
        )
        .setTimestamp();
      
      // Ajouter les gagnants
      const winnersList = giveaway.winners
        .map(winnerId => `<@${winnerId}>`)
        .join('\n');
      
      embed.addFields({
        name: '🏆 Gagnants',
        value: winnersList || 'Aucun',
        inline: false
      });
      
      await interaction.editReply({ embeds: [embed] });
      
      logger.info(`Giveaway terminé: ID ${giveawayId}, ${giveaway.winners.length} gagnants`);
    } catch (error) {
      logger.error('Erreur commande gend:', error);
      const message = error instanceof NotFoundError ? 'Giveaway non trouvé.' : error.message;
      await interaction.editReply({
        content: `❌ ${message}`
      });
    }
  }
};

/**
 * Commande /greroll - Resélectionne les gagnants d'un giveaway
 */
const grerollCommand = {
  data: new SlashCommandBuilder()
    .setName('greroll')
    .setDescription('Resélectionne les gagnants d\'un giveaway')
    .addIntegerOption(option =>
      option
        .setName('id')
        .setDescription('ID du giveaway')
        .setRequired(true)
        .setMinValue(1)
    ),
  
  async execute(interaction) {
    try {
      await interaction.deferReply();
      
      const giveawayId = interaction.options.getInteger('id');
      
      // Resélectionner les gagnants
      const giveaway = await giveawayService.rerollWinners(giveawayId);
      
      if (giveaway.winners.length === 0) {
        return await interaction.editReply({
          content: '❌ Aucun participant au giveaway.'
        });
      }
      
      // Créer l'embed avec les nouveaux gagnants
      const embed = new EmbedBuilder()
        .setColor('#00FFFF')
        .setTitle('🔄 Gagnants Resélectionnés!')
        .addFields(
          { name: 'Prix', value: giveaway.prize, inline: true },
          { name: 'Gagnants', value: String(giveaway.winners.length), inline: true },
          { name: 'Participants', value: String(giveaway.participants.length), inline: true }
        )
        .setTimestamp();
      
      // Ajouter les nouveaux gagnants
      const winnersList = giveaway.winners
        .map(winnerId => `<@${winnerId}>`)
        .join('\n');
      
      embed.addFields({
        name: '🏆 Nouveaux Gagnants',
        value: winnersList || 'Aucun',
        inline: false
      });
      
      await interaction.editReply({ embeds: [embed] });
      
      logger.info(`Gagnants resélectionnés: ID ${giveawayId}, ${giveaway.winners.length} nouveaux gagnants`);
    } catch (error) {
      logger.error('Erreur commande greroll:', error);
      const message = error instanceof NotFoundError ? 'Giveaway non trouvé.' : error.message;
      await interaction.editReply({
        content: `❌ ${message}`
      });
    }
  }
};

/**
 * Commande /glist - Affiche tous les giveaways
 */
const glistCommand = {
  data: new SlashCommandBuilder()
    .setName('glist')
    .setDescription('Affiche tous les giveaways du serveur')
    .addStringOption(option =>
      option
        .setName('status')
        .setDescription('Filtrer par statut')
        .setRequired(false)
        .addChoices(
          { name: 'Actifs', value: 'active' },
          { name: 'Terminés', value: 'ended' }
        )
    ),
  
  async execute(interaction) {
    try {
      await interaction.deferReply();
      
      const serverId = interaction.guildId;
      const statusFilter = interaction.options.getString('status');
      
      // Récupérer tous les giveaways
      const allGiveaways = await giveawayService.getAll(serverId, false);
      
      // Filtrer par statut
      let giveaways = allGiveaways;
      if (statusFilter === 'active') {
        giveaways = allGiveaways.filter(g => !g.ended && g.endTime > Date.now());
      } else if (statusFilter === 'ended') {
        giveaways = allGiveaways.filter(g => g.ended || g.endTime <= Date.now());
      }
      
      if (giveaways.length === 0) {
        return await interaction.editReply({
          content: '❌ Aucun giveaway trouvé avec ces critères.'
        });
      }
      
      // Créer les embeds
      const embeds = [];
      for (let i = 0; i < giveaways.length; i += 10) {
        const chunk = giveaways.slice(i, i + 10);
        const embed = new EmbedBuilder()
          .setColor('#7B2CBF')
          .setTitle(`🎉 Giveaways (${giveaways.length} total)`)
          .setDescription(`Page ${Math.floor(i / 10) + 1}/${Math.ceil(giveaways.length / 10)}`)
          .setTimestamp();
        
        chunk.forEach(giveaway => {
          const status = giveaway.ended ? '✅ Terminé' : '🔄 Actif';
          const timeRemaining = giveaway.ended 
            ? 'Terminé'
            : `<t:${Math.floor(giveaway.endTime / 1000)}:R>`;
          
          embed.addFields({
            name: `${giveaway.prize} (ID: ${giveaway.id})`,
            value: `**Statut:** ${status}\n**Gagnants:** ${giveaway.winners_count}\n**Participants:** ${giveaway.participants.length}\n**Fin:** ${timeRemaining}`,
            inline: false
          });
        });
        
        embeds.push(embed);
      }
      
      await interaction.editReply({ embeds: [embeds[0]] });
    } catch (error) {
      logger.error('Erreur commande glist:', error);
      await interaction.editReply({
        content: '❌ Une erreur est survenue lors de la récupération des giveaways.'
      });
    }
  }
};

// Exporter toutes les commandes
module.exports = [
  giveawayCommand,
  gendCommand,
  grerollCommand,
  glistCommand
];
