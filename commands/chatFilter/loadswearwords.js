const sqlite3 = require('sqlite3').verbose();
const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');

const db = new sqlite3.Database('./botData.db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('banswearwords')
        .setDescription('Ban swear words'),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: 'You are not authorized to use this command.', ephemeral: true });
        }
        await interaction.reply({ content: 'Swear words banned succesfully', ephemeral: true });
        fs.readFile('SwearWords.csv', 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading the file:', err);
                return;
            }
            
            const words = data.trim().split(/\r?\n/);  // Split by newline to get each word
        
            words.forEach(word => {
                const cleanedWord = word.trim().toLowerCase();
                // Insert each word into the database
                db.run('INSERT OR IGNORE INTO banned_words (word) VALUES (?)', [cleanedWord], function(err) {
                    if (err) {
                        return console.error(err.message);
                    }
                });
            });
        });
    },
};
