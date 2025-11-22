/**
 * Button handlers for the /list command
 * Handles category selection and pagination
 */

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const EmbedFormatter = require('../../core/formatters/EmbedFormatter');
const BrainrotFormatter = require('../../core/formatters/BrainrotFormatter');
const { RARITIES } = require('../../core/enums');
const logger = require('../../core/logger');

const ITEMS_PER_PAGE = 10;
const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

// Rarity order for consistent display
const RARITY_ORDER = ['OG', 'Secret', 'Brainrot God', 'Mythical', 'Legendary', 'Epic', 'Rare', 'Uncommon', 'Common'];

// Rarity emojis
const RARITY_EMOJIS = {
  'Common': '⬜',
  'Uncommon': '🟦',
  'Rare': '🔵',
  'Epic': '🟪',
  'Legendary': '🟨',
  'Mythical': '🟠',
  'Brainrot God': '🌈',
  'Secret': '⬛',
  'OG': '⭐',
};

/**
 * Aggregate identical brainrots and add quantity counter
 * @param {Array} brainrots - Array of brainrot objects
 * @returns {Array} Aggregated brainrots with quantity
 */
function aggregateBrainrots(brainrots) {
  const aggregated = {};
  
  brainrots.forEach(brainrot => {
    // Create a unique key based on name, rarity, mutations, traits, and compte
    const traitsKey = (brainrot.traits || []).sort().join('|');
    const key = `${brainrot.name}|${brainrot.rarity}|${brainrot.mutation}|${traitsKey}|${brainrot.compte || ''}`;
    
    if (!aggregated[key]) {
      aggregated[key] = {
        ...brainrot,
        quantite: 1
      };
    } else {
      aggregated[key].quantite += (brainrot.quantite || 1);
    }
  });
  
  return Object.values(aggregated);
}

/**
 * Group brainrots by rarity
 * @param {Array} brainrots - Array of brainrot objects
 * @returns {Object} Brainrots grouped by rarity
 */
function groupByRarity(brainrots) {
  const grouped = {};
  
  RARITY_ORDER.forEach(rarity => {
    grouped[rarity] = [];
  });
  
  brainrots.forEach(brainrot => {
    const rarity = brainrot.rarity || 'Common';
    if (!grouped[rarity]) {
      grouped[rarity] = [];
    }
    grouped[rarity].push(brainrot);
  });
  
  // Sort each rarity group alphabetically by name
  Object.keys(grouped).forEach(rarity => {
    grouped[rarity].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  });
  
  return grouped;
}

/**
 * Format a single brainrot line for display
 * @param {Object} brainrot - Brainrot object
 * @returns {string} Formatted brainrot line
 */
function formatBrainrotLine(brainrot) {
  let line = brainrot.name;
  
  // Add quantity if greater than 1
  if (brainrot.quantite && brainrot.quantite > 1) {
    line += ` x${brainrot.quantite}`;
  }
  
  // Add mutation if not Default
  if (brainrot.mutation && brainrot.mutation !== 'Default') {
    line += ` [${brainrot.mutation}]`;
  }
  
  // Add traits if present
  if (brainrot.traits && brainrot.traits.length > 0) {
    line += ` {${brainrot.traits.join(', ')}}`;
  }
  
  // Add income and price info
  line += '\n├ Income: ' + BrainrotFormatter.formatIncomeRate(brainrot.incomeRate || 0);
  line += '\n├ Prix: ' + BrainrotFormatter.formatPrice(brainrot.priceEUR || 0);
  
  return line;
}

/**
 * Build the list embed with all brainrots
 * @param {Array} brainrots - Array of brainrot objects
 * @returns {EmbedBuilder} Discord embed builder
 */
function buildListEmbed(brainrots) {
  const embed = new EmbedBuilder()
    .setColor('#f5e000')
    .setFooter({ text: 'Brainrot Market [FR] | Refreshing in 5 min' })
    .setTimestamp();
  
  if (!brainrots || brainrots.length === 0) {
    embed.setTitle('🧠 Brainrot List');
    embed.setDescription('Aucun brainrot enregistré');
    return embed;
  }
  
  // Aggregate identical brainrots
  const aggregated = aggregateBrainrots(brainrots);
  
  // Group by rarity
  const grouped = groupByRarity(aggregated);
  
  // Build description with all rarities
  let description = '';
  
  RARITY_ORDER.forEach(rarity => {
    const items = grouped[rarity];
    if (!items || items.length === 0) return;
    
    const emoji = RARITY_EMOJIS[rarity] || '❓';
    description += `\n# ${emoji} ${rarity}\n\n\`\`\`\n`;
    
    items.forEach(brainrot => {
      description += formatBrainrotLine(brainrot) + '\n\n';
    });
    
    description += '```\n';
  });
  
  embed.setTitle('🧠 Brainrot List');
  embed.setDescription(description || 'Aucun brainrot enregistré');
  
  return embed;
}

/**
 * Create pagination buttons
 * @param {number} currentPage - Current page number
 * @param {number} totalPages - Total number of pages
 * @returns {ActionRowBuilder} Row with pagination buttons
 */
function createPaginationRow(currentPage, totalPages) {
  const row = new ActionRowBuilder();
  
  if (currentPage > 0) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId('list_prev')
        .setLabel('⬅️ Précédent')
        .setStyle(ButtonStyle.Secondary)
    );
  }
  
  row.addComponents(
    new ButtonBuilder()
      .setCustomId('list_page_info')
      .setLabel(`Page ${currentPage + 1}/${totalPages}`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true)
  );
  
  if (currentPage < totalPages - 1) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId('list_next')
        .setLabel('Suivant ➡️')
        .setStyle(ButtonStyle.Secondary)
    );
  }
  
  return row;
}

/**
 * Get paginated items from an array
 * @param {Array} items - Items to paginate
 * @param {number} page - Page number (0-indexed)
 * @returns {Array} Items for the current page
 */
function getPaginatedItems(items, page) {
  const start = page * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  return items.slice(start, end);
}

/**
 * Sort brainrots by price (descending)
 * @param {Array} brainrots - Brainrots to sort
 * @returns {Array} Sorted brainrots
 */
function sortByPrice(brainrots) {
  return [...brainrots].sort((a, b) => (b.priceEUR || 0) - (a.priceEUR || 0));
}

/**
 * Sort brainrots by revenue/income rate (descending)
 * @param {Array} brainrots - Brainrots to sort
 * @returns {Array} Sorted brainrots
 */
function sortByRevenue(brainrots) {
  return [...brainrots].sort((a, b) => (b.incomeRate || 0) - (a.incomeRate || 0));
}

/**
 * Sort brainrots alphabetically
 * @param {Array} brainrots - Brainrots to sort
 * @returns {Array} Sorted brainrots
 */
function sortAlphabetically(brainrots) {
  return [...brainrots].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
}

/**
 * Display a category with pagination
 * @param {Object} interaction - Discord interaction
 * @param {string} category - Category name (rarity, mutation, traits, price, revenue, alphabetic)
 * @param {number} page - Page number (0-indexed)
 */
async function displayCategory(interaction, category, page = 0) {
  try {
    const cache = interaction.client.listCache[interaction.message.interaction.id];
    
    if (!cache) {
      return await interaction.reply({
        content: '❌ Session expirée. Veuillez utiliser `/list` à nouveau.',
        ephemeral: true
      });
    }
    
    const { brainrots } = cache;
    let embed;
    let sortedBrainrots;
    
    // Create embed based on category
    switch (category) {
      case 'rarity':
        embed = EmbedFormatter.createRarityEmbed(brainrots);
        break;
      case 'mutation':
        embed = EmbedFormatter.createMutationEmbed(brainrots);
        break;
      case 'traits':
        embed = EmbedFormatter.createTraitsEmbed(brainrots);
        break;
      case 'price':
        sortedBrainrots = sortByPrice(brainrots);
        embed = EmbedFormatter.createPriceEmbed(sortedBrainrots);
        break;
      case 'revenue':
        sortedBrainrots = sortByRevenue(brainrots);
        embed = EmbedFormatter.createRevenueEmbed(sortedBrainrots);
        break;
      case 'alphabetic':
        sortedBrainrots = sortAlphabetically(brainrots);
        embed = EmbedFormatter.createAlphabeticalEmbed(sortedBrainrots);
        break;
      default:
        return await interaction.reply({
          content: '❌ Catégorie invalide.',
          ephemeral: true
        });
    }
    
    // Convert embed to plain object if it's a Discord.js EmbedBuilder
    const embedData = embed.toJSON ? embed.toJSON() : embed;
    
    // Calculate pagination
    const totalPages = Math.ceil(brainrots.length / ITEMS_PER_PAGE);
    const paginationRow = createPaginationRow(page, totalPages);
    
    // Update cache
    cache.currentCategory = category;
    cache.currentPage = page;
    
    // Update message
    await interaction.update({
      embeds: [embedData],
      components: [paginationRow]
    });
    
  } catch (error) {
    logger.error('Erreur lors de l\'affichage de la catégorie:', error);
    
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: '❌ Une erreur est survenue.',
        ephemeral: true
      });
    } else {
      await interaction.followUp({
        content: '❌ Une erreur est survenue.',
        ephemeral: true
      });
    }
  }
}

/**
 * Handler for rarity category button
 */
async function handleRarityButton(interaction) {
  await displayCategory(interaction, 'rarity', 0);
}

/**
 * Handler for mutation category button
 */
async function handleMutationButton(interaction) {
  await displayCategory(interaction, 'mutation', 0);
}

/**
 * Handler for traits category button
 */
async function handleTraitsButton(interaction) {
  await displayCategory(interaction, 'traits', 0);
}

/**
 * Handler for price category button
 */
async function handlePriceButton(interaction) {
  await displayCategory(interaction, 'price', 0);
}

/**
 * Handler for revenue category button
 */
async function handleRevenueButton(interaction) {
  await displayCategory(interaction, 'revenue', 0);
}

/**
 * Handler for alphabetic category button
 */
async function handleAlphabeticButton(interaction) {
  await displayCategory(interaction, 'alphabetic', 0);
}

/**
 * Handler for next page button
 */
async function handleNextButton(interaction) {
  try {
    const cache = interaction.client.listCache[interaction.message.interaction.id];
    
    if (!cache) {
      return await interaction.reply({
        content: '❌ Session expirée.',
        ephemeral: true
      });
    }
    
    const { currentCategory, currentPage, brainrots } = cache;
    const totalPages = Math.ceil(brainrots.length / ITEMS_PER_PAGE);
    
    if (currentPage < totalPages - 1) {
      await displayCategory(interaction, currentCategory, currentPage + 1);
    }
  } catch (error) {
    logger.error('Erreur lors du passage à la page suivante:', error);
    await interaction.reply({
      content: '❌ Une erreur est survenue.',
      ephemeral: true
    });
  }
}

/**
 * Handler for previous page button
 */
async function handlePrevButton(interaction) {
  try {
    const cache = interaction.client.listCache[interaction.message.interaction.id];
    
    if (!cache) {
      return await interaction.reply({
        content: '❌ Session expirée.',
        ephemeral: true
      });
    }
    
    const { currentCategory, currentPage } = cache;
    
    if (currentPage > 0) {
      await displayCategory(interaction, currentCategory, currentPage - 1);
    }
  } catch (error) {
    logger.error('Erreur lors du passage à la page précédente:', error);
    await interaction.reply({
      content: '❌ Une erreur est survenue.',
      ephemeral: true
    });
  }
}

module.exports = {
  aggregateBrainrots,
  groupByRarity,
  formatBrainrotLine,
  buildListEmbed,
  handleRarityButton,
  handleMutationButton,
  handleTraitsButton,
  handlePriceButton,
  handleRevenueButton,
  handleAlphabeticButton,
  handleNextButton,
  handlePrevButton
};
