/**
 * Commandes Discord pour la gestion des Brainrots
 * Commandes: list, addbrainrot, removebrainrot, updatebrainrot, addtrait, removetrait, showcompte, stats
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const brainrotService = require('../../services/brainrotService');
const logger = require('../../core/logger');
const { ValidationError, NotFoundError } = require('../../core/errors');
const { MUTATIONS, isValidMutation, isValidTrait } = require('../../core/enums');
const NumberParser = require('../../core/parsers/NumberParser');
const { buildListEmbed } = require('../handlers/listCommandHandlers');

/**
 * Commande /list - Affiche tous les brainrots avec interface améliorée
 */

const listCommand = {
  data: new SlashCommandBuilder()
    .setName('list')
    .setDescription('Affiche tous les brainrots du serveur'),
  
  async execute(interaction) {
    try {
      await interaction.deferReply();
      
      const serverId = interaction.guildId;
      const brainrots = await brainrotService.getAll(serverId);
      
      // Build and send the embed
      const embed = buildListEmbed(brainrots);
      
      await interaction.editReply({ 
        embeds: [embed]
      });
      
    } catch (error) {
      logger.error('Erreur commande list:', error);
      await interaction.editReply({
        content: '❌ Une erreur est survenue lors de la récupération des brainrots.'
      });
    }
  }
};

/**
 * Commande /addbrainrot - Ajoute un nouveau brainrot
 */
const addBrainrotCommand = {
  data: new SlashCommandBuilder()
    .setName('addbrainrot')
    .setDescription('Ajoute un nouveau brainrot')
    .addStringOption(option =>
      option
        .setName('name')
        .setDescription('Nom du brainrot')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('rarity')
        .setDescription('Rareté du brainrot')
        .setRequired(true)
        .addChoices(
          { name: 'Common', value: 'Common' },
          { name: 'Uncommon', value: 'Uncommon' },
          { name: 'Rare', value: 'Rare' },
          { name: 'Epic', value: 'Epic' },
          { name: 'Legendary', value: 'Legendary' },
          { name: 'Mythical', value: 'Mythical' },
          { name: 'Brainrot God', value: 'Brainrot God' },
          { name: 'Secret', value: 'Secret' },
          { name: 'OG', value: 'OG' }
        )
    )
    .addStringOption(option =>
      option
        .setName('price_eur')
        .setDescription('Prix en EUR (supporte les abréviations: 1k, 1M, 1B, etc.)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('income_rate')
        .setDescription('Revenu en EUR/s (supporte les abréviations: 1k, 1M, 1B, etc.)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('mutation')
        .setDescription('Mutation (obligatoire)')
        .setRequired(true)
        .addChoices(
          { name: 'Default', value: 'Default' },
          { name: 'Gold', value: 'Gold' },
          { name: 'Diamond', value: 'Diamond' },
          { name: 'Rainbow', value: 'Rainbow' },
          { name: 'Bloodrot', value: 'Bloodrot' },
          { name: 'Candy', value: 'Candy' },
          { name: 'Lava', value: 'Lava' },
          { name: 'Galaxy', value: 'Galaxy' },
          { name: 'Yin-Yang', value: 'Yin-Yang' },
          { name: 'Radioactive', value: 'Radioactive' }
        )
    )
    .addStringOption(option =>
      option
        .setName('traits')
        .setDescription('Traits (séparés par des virgules, ex: Flying,Electric)')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('compte')
        .setDescription('Compte associé')
        .setRequired(false)
    )
    .addIntegerOption(option =>
      option
        .setName('quantite')
        .setDescription('Quantité')
        .setRequired(false)
        .setMinValue(1)
    ),
  
  async execute(interaction) {
    try {
      await interaction.deferReply();
      
      const serverId = interaction.guildId;
      
      // Parse price with abbreviations
      let priceEUR;
      try {
        priceEUR = NumberParser.parse(interaction.options.getString('price_eur'));
      } catch (error) {
        return await interaction.editReply({
          content: `❌ Prix invalide: ${error.message}`
        });
      }
      
      // Parse income rate with abbreviations
      let incomeRate;
      try {
        incomeRate = NumberParser.parse(interaction.options.getString('income_rate'));
      } catch (error) {
        return await interaction.editReply({
          content: `❌ Revenu invalide: ${error.message}`
        });
      }
      
      // Validate mutation
      const mutation = interaction.options.getString('mutation');
      if (!isValidMutation(mutation)) {
        return await interaction.editReply({
          content: `❌ Mutation invalide: "${mutation}". Mutations valides: ${Object.values(MUTATIONS).join(', ')}`
        });
      }
      
      // Parse and validate traits
      let traits = [];
      const traitsInput = interaction.options.getString('traits');
      if (traitsInput) {
        traits = traitsInput.split(',').map(t => t.trim()).filter(t => t.length > 0);
        
        // Validate each trait
        const invalidTraits = traits.filter(trait => !isValidTrait(trait));
        if (invalidTraits.length > 0) {
          return await interaction.editReply({
            content: `❌ Traits invalides: ${invalidTraits.join(', ')}`
          });
        }
      }
      
      const data = {
        name: interaction.options.getString('name'),
        rarity: interaction.options.getString('rarity'),
        priceEUR,
        incomeRate,
        mutation,
        traits,
        compte: interaction.options.getString('compte'),
        quantite: interaction.options.getInteger('quantite') || 1
      };
      
      const id = await brainrotService.create(serverId, data);
      
      const traitsDisplay = traits.length > 0 ? traits.join(', ') : 'Aucun';
      
      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('✅ Brainrot créé')
        .addFields(
          { name: 'ID', value: String(id), inline: true },
          { name: 'Nom', value: data.name, inline: true },
          { name: 'Rareté', value: data.rarity, inline: true },
          { name: 'Mutation', value: data.mutation, inline: true },
          { name: 'Prix EUR', value: `€${data.priceEUR}`, inline: true },
          { name: 'Revenu', value: `€${data.incomeRate}`, inline: true },
          { name: 'Traits', value: traitsDisplay, inline: false }
        )
        .setTimestamp();
      
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      logger.error('Erreur commande addbrainrot:', error);
      const message = error instanceof ValidationError ? error.message : 'Une erreur est survenue.';
      await interaction.editReply({
        content: `❌ ${message}`
      });
    }
  }
};

/**
 * Commande /removebrainrot - Supprime un brainrot
 */
const removeBrainrotCommand = {
  data: new SlashCommandBuilder()
    .setName('removebrainrot')
    .setDescription('Supprime un brainrot')
    .addIntegerOption(option =>
      option
        .setName('id')
        .setDescription('ID du brainrot à supprimer')
        .setRequired(true)
        .setMinValue(1)
    ),
  
  async execute(interaction) {
    try {
      await interaction.deferReply();
      
      const id = interaction.options.getInteger('id');
      
      // Récupérer le brainrot avant suppression pour afficher ses infos
      const brainrot = await brainrotService.getById(id);
      
      await brainrotService.delete(id);
      
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('✅ Brainrot supprimé')
        .addFields(
          { name: 'Nom', value: brainrot.name, inline: true },
          { name: 'ID', value: String(id), inline: true }
        )
        .setTimestamp();
      
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      logger.error('Erreur commande removebrainrot:', error);
      const message = error instanceof NotFoundError ? 'Brainrot non trouvé.' : 'Une erreur est survenue.';
      await interaction.editReply({
        content: `❌ ${message}`
      });
    }
  }
};

/**
 * Commande /updatebrainrot - Met à jour un brainrot
 */
const updateBrainrotCommand = {
  data: new SlashCommandBuilder()
    .setName('updatebrainrot')
    .setDescription('Met à jour un brainrot')
    .addIntegerOption(option =>
      option
        .setName('id')
        .setDescription('ID du brainrot à mettre à jour')
        .setRequired(true)
        .setMinValue(1)
    )
    .addStringOption(option =>
      option
        .setName('name')
        .setDescription('Nouveau nom')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('rarity')
        .setDescription('Nouvelle rareté')
        .setRequired(false)
        .addChoices(
          { name: 'Common', value: 'Common' },
          { name: 'Rare', value: 'Rare' },
          { name: 'Epic', value: 'Epic' },
          { name: 'Legendary', value: 'Legendary' }
        )
    )
    .addNumberOption(option =>
      option
        .setName('price_eur')
        .setDescription('Nouveau prix EUR')
        .setRequired(false)
        .setMinValue(0)
    )
    .addNumberOption(option =>
      option
        .setName('income_rate')
        .setDescription('Nouveau revenu')
        .setRequired(false)
        .setMinValue(0)
    )
    .addStringOption(option =>
      option
        .setName('mutation')
        .setDescription('Nouvelle mutation')
        .setRequired(false)
    ),
  
  async execute(interaction) {
    try {
      await interaction.deferReply();
      
      const id = interaction.options.getInteger('id');
      const data = {};
      
      if (interaction.options.getString('name')) data.name = interaction.options.getString('name');
      if (interaction.options.getString('rarity')) data.rarity = interaction.options.getString('rarity');
      if (interaction.options.getNumber('price_eur') !== null) data.priceEUR = interaction.options.getNumber('price_eur');
      if (interaction.options.getNumber('income_rate') !== null) data.incomeRate = interaction.options.getNumber('income_rate');
      if (interaction.options.getString('mutation')) data.mutation = interaction.options.getString('mutation');
      
      if (Object.keys(data).length === 0) {
        return await interaction.editReply({
          content: '❌ Vous devez fournir au moins un champ à mettre à jour.'
        });
      }
      
      await brainrotService.update(id, data);
      
      const embed = new EmbedBuilder()
        .setColor('#00FFFF')
        .setTitle('✅ Brainrot mis à jour')
        .addFields(
          { name: 'ID', value: String(id), inline: true },
          { name: 'Champs modifiés', value: Object.keys(data).join(', '), inline: true }
        )
        .setTimestamp();
      
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      logger.error('Erreur commande updatebrainrot:', error);
      const message = error instanceof NotFoundError ? 'Brainrot non trouvé.' : error.message;
      await interaction.editReply({
        content: `❌ ${message}`
      });
    }
  }
};

/**
 * Commande /addtrait - Ajoute un trait à un brainrot
 */
const addTraitCommand = {
  data: new SlashCommandBuilder()
    .setName('addtrait')
    .setDescription('Ajoute un trait à un brainrot')
    .addIntegerOption(option =>
      option
        .setName('id')
        .setDescription('ID du brainrot')
        .setRequired(true)
        .setMinValue(1)
    )
    .addStringOption(option =>
      option
        .setName('trait')
        .setDescription('Trait à ajouter')
        .setRequired(true)
    ),
  
  async execute(interaction) {
    try {
      await interaction.deferReply();
      
      const id = interaction.options.getInteger('id');
      const trait = interaction.options.getString('trait');
      
      await brainrotService.addTrait(id, trait);
      
      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('✅ Trait ajouté')
        .addFields(
          { name: 'ID Brainrot', value: String(id), inline: true },
          { name: 'Trait', value: trait, inline: true }
        )
        .setTimestamp();
      
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      logger.error('Erreur commande addtrait:', error);
      const message = error instanceof ValidationError ? error.message : 'Une erreur est survenue.';
      await interaction.editReply({
        content: `❌ ${message}`
      });
    }
  }
};

/**
 * Commande /removetrait - Retire un trait d'un brainrot
 */
const removeTraitCommand = {
  data: new SlashCommandBuilder()
    .setName('removetrait')
    .setDescription('Retire un trait d\'un brainrot')
    .addIntegerOption(option =>
      option
        .setName('id')
        .setDescription('ID du brainrot')
        .setRequired(true)
        .setMinValue(1)
    )
    .addStringOption(option =>
      option
        .setName('trait')
        .setDescription('Trait à retirer')
        .setRequired(true)
    ),
  
  async execute(interaction) {
    try {
      await interaction.deferReply();
      
      const id = interaction.options.getInteger('id');
      const trait = interaction.options.getString('trait');
      
      await brainrotService.removeTrait(id, trait);
      
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('✅ Trait retiré')
        .addFields(
          { name: 'ID Brainrot', value: String(id), inline: true },
          { name: 'Trait', value: trait, inline: true }
        )
        .setTimestamp();
      
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      logger.error('Erreur commande removetrait:', error);
      const message = error instanceof ValidationError ? error.message : 'Une erreur est survenue.';
      await interaction.editReply({
        content: `❌ ${message}`
      });
    }
  }
};

/**
 * Commande /showcompte - Affiche les brainrots d'un compte
 */
const showCompteCommand = {
  data: new SlashCommandBuilder()
    .setName('showcompte')
    .setDescription('Affiche les brainrots d\'un compte')
    .addStringOption(option =>
      option
        .setName('compte')
        .setDescription('Nom du compte')
        .setRequired(true)
    ),
  
  async execute(interaction) {
    try {
      await interaction.deferReply();
      
      const serverId = interaction.guildId;
      const compteFilter = interaction.options.getString('compte');
      
      const brainrots = await brainrotService.getAll(serverId);
      const filtered = brainrots.filter(b => b.compte === compteFilter);
      
      if (filtered.length === 0) {
        return await interaction.editReply({
          content: `❌ Aucun brainrot trouvé pour le compte "${compteFilter}".`
        });
      }
      
      const embed = new EmbedBuilder()
        .setColor('#7B2CBF')
        .setTitle(`📊 Brainrots du compte: ${compteFilter}`)
        .setDescription(`Total: ${filtered.length} brainrot(s)`)
        .setTimestamp();
      
      let totalValue = 0;
      let totalIncome = 0;
      
      filtered.forEach(brainrot => {
        totalValue += brainrot.priceEUR * brainrot.quantite;
        totalIncome += brainrot.incomeRate * brainrot.quantite;
        
        const traits = brainrot.traits && brainrot.traits.length > 0 
          ? brainrot.traits.join(', ')
          : 'Aucun';
        
        embed.addFields({
          name: `${brainrot.name} (ID: ${brainrot.id})`,
          value: `**Rareté:** ${brainrot.rarity}\n**Quantité:** ${brainrot.quantite}\n**Traits:** ${traits}`,
          inline: false
        });
      });
      
      embed.addFields(
        { name: 'Valeur totale', value: `€${totalValue}`, inline: true },
        { name: 'Revenu total', value: `€${totalIncome}`, inline: true }
      );
      
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      logger.error('Erreur commande showcompte:', error);
      await interaction.editReply({
        content: '❌ Une erreur est survenue lors de la récupération des brainrots.'
      });
    }
  }
};

/**
 * Commande /stats - Affiche les statistiques des brainrots
 */
const statsCommand = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Affiche les statistiques des brainrots du serveur'),
  
  async execute(interaction) {
    try {
      await interaction.deferReply();
      
      const serverId = interaction.guildId;
      const stats = await brainrotService.getStats(serverId);
      
      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('📈 Statistiques des Brainrots')
        .setTimestamp();
      
      if (stats.total === 0) {
        embed.setDescription('Aucun brainrot enregistré.');
      } else {
        embed.addFields(
          { name: 'Total', value: String(stats.total), inline: true },
          { name: 'Valeur totale', value: `€${stats.totalValue}`, inline: true },
          { name: 'Revenu total', value: `€${stats.totalIncome}`, inline: true }
        );
        
        if (stats.byRarity) {
          const rarityText = Object.entries(stats.byRarity)
            .map(([rarity, count]) => `${rarity}: ${count}`)
            .join('\n');
          embed.addFields({ name: 'Par rareté', value: rarityText, inline: false });
        }
        
        if (stats.byMutation) {
          const mutationText = Object.entries(stats.byMutation)
            .map(([mutation, count]) => `${mutation}: ${count}`)
            .join('\n');
          embed.addFields({ name: 'Par mutation', value: mutationText, inline: false });
        }
      }
      
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      logger.error('Erreur commande stats:', error);
      await interaction.editReply({
        content: '❌ Une erreur est survenue lors de la récupération des statistiques.'
      });
    }
  }
};

// Exporter toutes les commandes
module.exports = [
  listCommand,
  addBrainrotCommand,
  removeBrainrotCommand,
  updateBrainrotCommand,
  addTraitCommand,
  removeTraitCommand,
  showCompteCommand,
  statsCommand
];
