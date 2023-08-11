// commands/admin/clearswearwords.js
const sqlite3 = require('sqlite3').verbose();
const { SlashCommandBuilder } = require('@discordjs/builders');

const db = new sqlite3.Database('./botData.db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clearbannedwords')
        .setDescription('Clear all swear words from the database'),

    async execute(interaction) {
        // Ensure the user has ADMINISTRATOR permission
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            return interaction.reply({ content: 'You are not authorized to use this command.', ephemeral: true });
        }

        db.run('DELETE FROM banned_words', function(err) {
            if (err) {
                console.error(err.message);
                return interaction.reply({ content: 'Failed to clear the swear words from the database.', ephemeral: true });
            }

            interaction.reply(`Cleared ${this.changes} words from the database.`);
        });
    },
};
