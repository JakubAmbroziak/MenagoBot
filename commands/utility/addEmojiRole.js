const { SlashCommandBuilder } = require('@discordjs/builders');
const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database('./rolesData.db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addemojirolepair')
        .setDescription('Add a new emoji-role pair')
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The role to be added')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('emoji')
                .setDescription('The emoji to be added')
                .setRequired(true)),
    async execute(interaction) {
        const role = interaction.options.getRole('role');
        const emoji = interaction.options.getString('emoji');

        db.run('INSERT INTO emoji_roles(emoji, role_id) VALUES(?, ?)', [emoji, role.id], function(err) {
            if (err) {
                console.log(err.message);
                return interaction.reply('Failed to add the emoji-role pair.');
            }

            interaction.reply('Emoji-role pair added successfully!');
        });
    },
};
