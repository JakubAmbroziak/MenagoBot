const { SlashCommandBuilder } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database('./botData.db');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('removebannedword')
		.setDescription('Remove a word from the banned words list')
        .addStringOption(option =>
            option.setName('word')
                .setDescription('The word to be removed')
                .setRequired(true)),

	async execute(interaction) {
        const word = interaction.options.getString('word');

        db.run(`DELETE FROM banned_words WHERE word = ?`, [word], function(err) {
            if (err) {
                return console.log(err.message);
            }
            console.log(`Row(s) deleted ${this.changes}`);
        });

		await interaction.reply({ content: `Word "${word}" removed from banned words list.`, ephemeral: true });
	},
};
