// Ce fichier contient les handlers pour les commandes giveaway et admin
// À copier dans index.js après handleShowCompte

async function handleGiveaway(interaction) {
    const prize = interaction.options.getString('prize');
    const duration = interaction.options.getInteger('duration');
    const winners = interaction.options.getInteger('winners') || 1;
    const forcedWinner = interaction.options.getUser('forced_winner');
    
    await interaction.deferReply({ flags: 64 });
    
    const endTime = Date.now() + (duration * 60 * 1000);
    
    const giveaway = {
        prize,
        endTime,
        winners,
        participants: [],
        channelId: interaction.channelId,
        messageId: null,
        ended: false,
        forcedWinner: forcedWinner ? forcedWinner.id : null
    };
    
    const embed = buildGiveawayEmbed(giveaway);
    const button = createGiveawayButton();
    
    const robuxPath = path.join(__dirname, 'Robux.jpg');
    let files = [];
    
    try {
        await fs.access(robuxPath);
        files = [robuxPath];
    } catch (error) {
        console.log('⚠️ Robux.jpg introuvable');
    }
    
    const message = await interaction.channel.send({ 
        embeds: [embed], 
        components: [button],
        files
    });
    
    giveaway.messageId = message.id;
    giveaways.push(giveaway);
    await saveGiveaways();
    
    await interaction.editReply(`✅ Giveaway créé ! ${forcedWinner ? `Gagnant forcé: ${forcedWinner}` : ''}`);
}

async function handleGiveawayEnd(interaction) {
    const messageId = interaction.options.getString('message_id');
    
    const giveaway = giveaways.find(g => g.messageId === messageId);
    
    if (!giveaway) {
        return interaction.reply({ content: '❌ Giveaway introuvable !', flags: 64 });
    }
    
    if (giveaway.ended) {
        return interaction.reply({ content: '❌ Ce giveaway est déjà terminé !', flags: 64 });
    }
    
    await interaction.deferReply({ flags: 64 });
    await endGiveaway(client, giveaway);
    await interaction.editReply('✅ Giveaway terminé !');
}

async function handleGiveawayReroll(interaction) {
    const messageId = interaction.options.getString('message_id');
    
    const giveaway = giveaways.find(g => g.messageId === messageId);
    
    if (!giveaway) {
        return interaction.reply({ content: '❌ Giveaway introuvable !', flags: 64 });
    }
    
    if (!giveaway.ended) {
        return interaction.reply({ content: '❌ Ce giveaway n\'est pas encore terminé !', flags: 64 });
    }
    
    if (giveaway.participants.length === 0) {
        return interaction.reply({ content: '❌ Aucun participant !', flags: 64 });
    }
    
    await interaction.deferReply({ flags: 64 });
    
    const winnersList = [];
    const participants = [...giveaway.participants];
    for (let i = 0; i < Math.min(giveaway.winners, participants.length); i++) {
        const randomIndex = Math.floor(Math.random() * participants.length);
        winnersList.push(participants[randomIndex]);
        participants.splice(randomIndex, 1);
    }
    
    const winnersText = winnersList.map(id => `<@${id}>`).join(', ');
    
    await interaction.channel.send(`🎉 Nouveau(x) gagnant(s) : ${winnersText} ! Vous avez gagné **${giveaway.prize}** !`);
    await interaction.editReply('✅ Giveaway reroll effectué !');
}

async function handleGiveawayList(interaction) {
    if (giveaways.length === 0) {
        return interaction.reply({ content: '📊 Aucun giveaway actif.', flags: 64 });
    }
    
    const embed = new EmbedBuilder()
        .setTitle('📊 Liste des Giveaways')
        .setColor(0xFF0000)
        .setTimestamp();
    
    const active = giveaways.filter(g => !g.ended);
    const ended = giveaways.filter(g => g.ended);
    
    if (active.length > 0) {
        const activeList = active.map(g => 
            `**${g.prize}**\n` +
            `├ ID: \`${g.messageId}\`\n` +
            `├ Fin: <t:${Math.floor(g.endTime / 1000)}:R>\n` +
            `└ Participants: ${g.participants.length}`
        ).join('\n\n');
        
        embed.addFields({ name: '🟢 Actifs', value: activeList, inline: false });
    }
    
    if (ended.length > 0) {
        const endedList = ended.slice(0, 5).map(g => 
            `**${g.prize}** - ${g.participants.length} participants`
        ).join('\n');
        
        embed.addFields({ name: '🔴 Terminés (5 derniers)', value: endedList, inline: false });
    }
    
    await interaction.reply({ embeds: [embed], flags: 64 });
}

async function handleClear(interaction) {
    const amount = interaction.options.getInteger('amount');
    
    await interaction.deferReply({ flags: 64 });
    
    try {
        const messages = await interaction.channel.messages.fetch({ limit: amount });
        await interaction.channel.bulkDelete(messages, true);
        await interaction.editReply(`✅ ${messages.size} messages supprimés !`);
    } catch (error) {
        await interaction.editReply('❌ Erreur lors de la suppression des messages.');
    }
}

async function handleAnnounce(interaction) {
    const title = interaction.options.getString('title');
    const message = interaction.options.getString('message');
    const color = interaction.options.getString('color') || '#00D9FF';
    const image = interaction.options.getString('image');
    
    const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(message)
        .setColor(parseInt(color.replace('#', ''), 16))
        .setTimestamp();
    
    if (image) {
        embed.setImage(image);
    }
    
    await interaction.channel.send({ embeds: [embed] });
    await interaction.reply({ content: '✅ Annonce envoyée !', flags: 64 });
}

async function handleStats(interaction) {
    const aggregated = aggregateBrainrots(brainrots);
    
    const totalBrainrots = aggregated.reduce((sum, br) => sum + (br.quantite || 1), 0);
    const totalValue = brainrots.reduce((sum, br) => sum + parsePrice(br.priceEUR), 0);
    
    const byRarity = {};
    aggregated.forEach(br => {
        byRarity[br.rarity] = (byRarity[br.rarity] || 0) + (br.quantite || 1);
    });
    
    const embed = new EmbedBuilder()
        .setTitle('📊 Statistiques du Market')
        .setColor(0xFFE600)
        .addFields(
            { name: '🧠 Total Brainrots', value: `${totalBrainrots}`, inline: true },
            { name: '💰 Valeur Totale', value: `€${formatPrice(totalValue)}`, inline: true },
            { name: '📦 Types Uniques', value: `${aggregated.length}`, inline: true }
        )
        .setTimestamp();
    
    const rarityStats = Object.entries(byRarity)
        .map(([rarity, count]) => `${rarityColors[rarity] || '📦'} ${rarity}: ${count}`)
        .join('\n');
    
    embed.addFields({ name: '🎨 Par Rareté', value: rarityStats, inline: false });
    
    if (giveaways.length > 0) {
        const activeGiveaways = giveaways.filter(g => !g.ended).length;
        embed.addFields({ name: '🎉 Giveaways Actifs', value: `${activeGiveaways}`, inline: true });
    }
    
    await interaction.reply({ embeds: [embed], flags: 64 });
}

async function handleAddTrait(interaction) {
    const name = interaction.options.getString('name');
    const trait = interaction.options.getString('trait');
    const mutationFilter = interaction.options.getString('mutation_filter');
    
    const brainrot = brainrots.find(br => {
        const nameMatch = br.name.toLowerCase() === name.toLowerCase();
        const mutMatch = mutationFilter ? br.mutation === mutationFilter : true;
        return nameMatch && mutMatch;
    });
    
    if (!brainrot) {
        return interaction.reply({ content: '❌ Ce brainrot n\'existe pas !', flags: 64 });
    }
    
    if (!TRAITS.includes(trait)) {
        return interaction.reply({ content: `❌ Trait invalide ! Traits disponibles: ${TRAITS.join(', ')}`, flags: 64 });
    }
    
    if (!brainrot.traits) brainrot.traits = [];
    
    if (brainrot.traits.includes(trait)) {
        return interaction.reply({ content: '❌ Ce brainrot a déjà ce trait !', flags: 64 });
    }
    
    brainrot.traits.push(trait);
    await saveBrainrots();
    await updateEmbed(client);
    
    await interaction.reply({ content: `✅ Trait **${trait}** ajouté à **${name}** !`, flags: 64 });
}

async function handleRemoveTrait(interaction) {
    const name = interaction.options.getString('name');
    const trait = interaction.options.getString('trait');
    const mutationFilter = interaction.options.getString('mutation_filter');
    
    const brainrot = brainrots.find(br => {
        const nameMatch = br.name.toLowerCase() === name.toLowerCase();
        const mutMatch = mutationFilter ? br.mutation === mutationFilter : true;
        return nameMatch && mutMatch;
    });
    
    if (!brainrot) {
        return interaction.reply({ content: '❌ Ce brainrot n\'existe pas !', flags: 64 });
    }
    
    if (!brainrot.traits || !brainrot.traits.includes(trait)) {
        return interaction.reply({ content: '❌ Ce brainrot n\'a pas ce trait !', flags: 64 });
    }
    
    brainrot.traits = brainrot.traits.filter(t => t !== trait);
    await saveBrainrots();
    await updateEmbed(client);
    
    await interaction.reply({ content: `✅ Trait **${trait}** retiré de **${name}** !`, flags: 64 });
}
