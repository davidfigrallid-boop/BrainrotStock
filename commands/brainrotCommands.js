const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getSupportedCryptos } = require('../cryptoConverter');
const { MUTATIONS } = require('../utils/constants');

const brainrotCommands = [
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
];

module.exports = brainrotCommands;
