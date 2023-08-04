const { SlashCommandBuilder } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database('./botData.db');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('removebannedword')
		.setDescription('Remove words from the banned words list')
        .addStringOption(option =>
            option.setName('words')
                .setDescription('The words to be removed, separated by spaces or commas')
                .setRequired(true)),

	async execute(interaction) {
        const wordsInput = interaction.options.getString('words');
        // Create an array of words, trim and convert to lowercase
        const words = wordsInput.split(/[ ,]+/).map(word => word.trim().toLowerCase());

        words.forEach(word => {
            db.run(`DELETE FROM banned_words WHERE word = ?`, [word], function(err) {
                if (err) {
                    return console.log(err.message);
                }
                console.log(`Row(s) deleted ${this.changes}`);
            });
        });

		await interaction.reply({ content: `Words removed from the banned words list. Check the console for details.`, ephemeral: true });
	},
};
