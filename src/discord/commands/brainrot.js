/**
 * Commandes Discord pour la gestion des Brainrots
 * Commandes: list, addbrainrot, removebrainrot, updatebrainrot, addtrait, removetrait, showcompte, stats
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const brainrotService = require('../../services/brainrotService');
const logger = require('../../core/logger');
const { ValidationError, NotFoundError } = require('../../core/errors');

/**
 * Commande /list - Affiche tous les brainrots
 */
const listCommand = {
  data: new SlashCommandBuilder()
    .setName('list')
    .setDescription('Affiche tous les brainrots du serveur')
    .addStringOption(option =>
      option
        .setName('rarity')
        .setDescription('Filtrer par rareté')
        .setRequired(false)
        .addChoices(
          { name: 'Common', value: 'Common' },
          { name: 'Rare', value: 'Rare' },
          { name: 'Epic', value: 'Epic' },
          { name: 'Legendary', value: 'Legendary' }
        )
    )
    .addStringOption(option =>
      option
        .setName('mutation')
        .setDescription('Filtrer par mutation')
        .setRequired(false)
    ),
  
  async execute(interaction) {
    try {
      await interaction.deferReply();
      
      const serverId = interaction.guildId;
      const rarityFilter = interaction.options.getString('rarity');
      const mutationFilter = interaction.options.getString('mutation');
      
      const brainrots = await brainrotService.getAll(serverId);
      
      // Appliquer les filtres
      let filtered = brainrots;
      if (rarityFilter) {
        filtered = filtered.filter(b => b.rarity === rarityFilter);
      }
      if (mutationFilter) {
        filtered = filtered.filter(b => b.mutation === mutationFilter);
      }
      
      if (filtered.length === 0) {
        return await interaction.editReply({
          content: '❌ Aucun brainrot trouvé avec ces critères.'
        });
      }
      
      // Créer les embeds
      const embeds = [];
      for (let i = 0; i < filtered.length; i += 10) {
        const chunk = filtered.slice(i, i + 10);
        const embed = new EmbedBuilder()
          .setColor('#7B2CBF')
          .setTitle(`🧠 Brainrots (${filtered.length} total)`)
          .setDescription(`Page ${Math.floor(i / 10) + 1}/${Math.ceil(filtered.length / 10)}`)
          .setTimestamp();
        
        chunk.forEach(brainrot => {
          const traits = brainrot.traits && brainrot.traits.length > 0 
            ? brainrot.traits.join(', ')
            : 'Aucun';
          
          embed.addFields({
            name: `${brainrot.name} (ID: ${brainrot.id})`,
            value: `**Rareté:** ${brainrot.rarity}\n**Mutation:** ${brainrot.mutation}\n**Prix EUR:** €${brainrot.priceEUR}\n**Revenu:** €${brainrot.incomeRate}\n**Traits:** ${traits}\n**Quantité:** ${brainrot.quantite}`,
            inline: false
          });
        });
        
        embeds.push(embed);
      }
      
      await interaction.editReply({ embeds: [embeds[0]] });
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
          { name: 'Rare', value: 'Rare' },
          { name: 'Epic', value: 'Epic' },
          { name: 'Legendary', value: 'Legendary' }
        )
    )
    .addNumberOption(option =>
      option
        .setName('price_eur')
        .setDescription('Prix en EUR')
        .setRequired(true)
        .setMinValue(0)
    )
    .addNumberOption(option =>
      option
        .setName('income_rate')
        .setDescription('Revenu en EUR')
        .setRequired(true)
        .setMinValue(0)
    )
    .addStringOption(option =>
      option
        .setName('mutation')
        .setDescription('Mutation (Default, Shiny, etc.)')
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
      const data = {
        name: interaction.options.getString('name'),
        rarity: interaction.options.getString('rarity'),
        priceEUR: interaction.options.getNumber('price_eur'),
        incomeRate: interaction.options.getNumber('income_rate'),
        mutation: interaction.options.getString('mutation') || 'Default',
        compte: interaction.options.getString('compte'),
        quantite: interaction.options.getInteger('quantite') || 1
      };
      
      const id = await brainrotService.create(serverId, data);
      
      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('✅ Brainrot créé')
        .addFields(
          { name: 'ID', value: String(id), inline: true },
          { name: 'Nom', value: data.name, inline: true },
          { name: 'Rareté', value: data.rarity, inline: true },
          { name: 'Mutation', value: data.mutation, inline: true },
          { name: 'Prix EUR', value: `€${data.priceEUR}`, inline: true },
          { name: 'Revenu', value: `€${data.incomeRate}`, inline: true }
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
