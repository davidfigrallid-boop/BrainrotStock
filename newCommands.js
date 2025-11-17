// Commandes à ajouter dans le tableau commands[] dans index.js

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
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

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
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
