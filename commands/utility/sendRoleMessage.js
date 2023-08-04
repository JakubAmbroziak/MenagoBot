const { SlashCommandBuilder } = require('@discordjs/builders');
const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database('./rolesData.db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sendrolesmessage')
        .setDescription('Send a message with all the emoji-role pairs')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel where the message will be sent')
                .setRequired(true)),
    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');

        let rolesMessage = '';
        let emojis = [];
        db.each('SELECT * FROM emoji_roles', (err, row) => {
            if (err) {
                console.log(err.message);
                return;
            }

            const role = interaction.guild.roles.cache.get(row.role_id);
            rolesMessage += `${row.emoji} - ${role.name}\n`;
            emojis.push(row.emoji);
        }, async (err, numRows) => {
            if (err) {
                console.log(err.message);
                return interaction.reply('Failed to get the emoji-role pairs.');
            }

            const message = await channel.send(rolesMessage);
            for (const emoji of emojis) {
                await message.react(emoji);
            }

            interaction.reply('Message sent successfully!');
        });
    },
};
