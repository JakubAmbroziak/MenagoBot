// commands/admin/clearswearwords.js
const sqlite3 = require('sqlite3').verbose();
const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');


const db = new sqlite3.Database('./botData.db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clearbannedwords')
        .setDescription('Clear all swear words from the database'),
    async execute(interaction) {
        // Ensure the user has ADMINISTRATOR permission
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: 'You are not authorized to use this command.', ephemeral: true });
        }
        await interaction.deferReply({ephemeral: true});

        db.run('DELETE FROM banned_words', async function(err) {
            if (err) {
                console.error(err.message);
                return interaction.editReply({ content: 'Failed to clear the swear words from the database.', ephemeral: true });
            }
            return interaction.editReply({ content: `Cleared ${this.changes} words from the database.`, ephemeral: true });
        });

    },
};
