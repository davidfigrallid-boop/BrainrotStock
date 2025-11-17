const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

const adminCommands = [
    new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Supprime des messages')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Nombre de messages à supprimer')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder()
        .setName('announce')
        .setDescription('Envoie une annonce avec embed')
        .addStringOption(option =>
            option.setName('title')
                .setDescription('Titre de l\'annonce')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Message de l\'annonce')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('color')
                .setDescription('Couleur hex (ex: #FF0000)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('image')
                .setDescription('URL de l\'image')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Affiche les statistiques du market')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
];

module.exports = adminCommands;
