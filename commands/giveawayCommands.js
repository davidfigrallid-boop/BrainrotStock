const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

const giveawayCommands = [
    new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Crée un giveaway trucké')
        .addStringOption(option =>
            option.setName('prize')
                .setDescription('Prix du giveaway')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('Durée en minutes')
                .setRequired(true)
                .setMinValue(1))
        .addIntegerOption(option =>
            option.setName('winners')
                .setDescription('Nombre de gagnants (défaut: 1)')
                .setRequired(false)
                .setMinValue(1))
        .addUserOption(option =>
            option.setName('forced_winner')
                .setDescription('Forcer un gagnant (trucage)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder()
        .setName('gend')
        .setDescription('Termine un giveaway immédiatement')
        .addStringOption(option =>
            option.setName('message_id')
                .setDescription('ID du message du giveaway')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder()
        .setName('greroll')
        .setDescription('Reroll un giveaway terminé')
        .addStringOption(option =>
            option.setName('message_id')
                .setDescription('ID du message du giveaway')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder()
        .setName('glist')
        .setDescription('Liste tous les giveaways')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
];

module.exports = giveawayCommands;
