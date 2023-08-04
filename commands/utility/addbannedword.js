const { SlashCommandBuilder } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database('./botData.db');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('addbannedword')
		.setDescription('Add a word to the banned words list')
        .addStringOption(option =>
            option.setName('word')
                .setDescription('The word to be banned')
                .setRequired(true)),

	async execute(interaction) {
        const word = interaction.options.getString('word').toLowerCase();

        // check if the word already exists in the database
        db.get('SELECT word FROM banned_words WHERE word = ?', [word], (err, row) => {
            if (err) {
                return console.error(err.message);
            }
            // if the word does not exist in the database, add it
            if (!row) {
                db.run('INSERT INTO banned_words(word) VALUES(?)', [word], function(err) {
                    if (err) {
                        return console.error(err.message);
                    }
                    console.log(`A row has been inserted with rowid ${this.lastID}`);
                });
                interaction.reply({ content: `Word "${word}" added to banned words list.`, ephemeral: true });
            } else {
                // if the word already exists in the database, let the user know
                interaction.reply({ content: `Word "${word}" is already in the banned words list.`, ephemeral: true });
            }
        });
	},
};
