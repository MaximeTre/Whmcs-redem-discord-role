const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('email')
        .setDescription('Envoie un bouton pour demander un email'),
    async execute(interaction) {

        if (!interaction.member.roles.cache.has(process.env.STAFF_ROLE_ID)) {
            return interaction.reply({
                content: 'Désolé, vous n\'avez pas les permissions nécessaires pour utiliser cette commande.',
                ephemeral: true
            });
        }

        const button = new ButtonBuilder()
            .setCustomId('openModal')
            .setLabel('Entrez votre email client')
            .setStyle(ButtonStyle.Primary);


        const row = new ActionRowBuilder().addComponents(button);

        await interaction.reply({
            content: 'Cliquez sur le bouton ci-dessous afin de réclamer votre rôle client :',
            components: [row],
            ephemeral: false
        });
    },
};
