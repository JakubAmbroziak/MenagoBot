const { SlashCommandBuilder,PermissionsBitField } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database('./botData.db');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('addbannedword')
		.setDescription('Add a word to the banned words list')
        .addStringOption(option =>
            option.setName('words')
                .setDescription('The words to be banned, separated by spaces or commas')
                .setRequired(true)),

	async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: 'You are not authorized to use this command.', ephemeral: true });
        }
        const wordsInput = interaction.options.getString('words');
        // Create an array of words, trim and convert to lowercase
        const words = wordsInput.split(/[ ,]+/).map(word => word.trim().toLowerCase());

        words.forEach(word => {
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
                } else {
                    // if the word already exists in the database, let the user know
                    console.log(`Word "${word}" is already in the banned words list.`);
                }
            });
        });
        
        interaction.reply({ content: `Words added to the banned words list.`, ephemeral: true });
	},
};
