const { SlashCommandBuilder } = require('discord.js');
const wait = require('node:timers/promises').setTimeout;

module.exports = {
    data : new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Play PingPong.'),
    async execute(interaction) {
        await interaction.reply({ content: 'Secret Pong!', ephemeral: true });
    }
}