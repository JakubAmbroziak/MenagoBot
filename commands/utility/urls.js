const { SlashCommandBuilder } = require('@discordjs/builders');
const sqlite3 = require('sqlite3').verbose();

// Initialize your database
let db = new sqlite3.Database('./botData.db');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('toggleurlfilter')
		.setDescription('Toggle URL filtering on/off'),

	async execute(interaction) {
		// Fetch the current state from the database
		db.get('SELECT url_filter_enabled FROM config WHERE guild_id = ?', [interaction.guild.id], (err, row) => {
			if (err) {
				console.error(err.message);
				return;
			}

			// Toggle the state and update the database
			const newState = row ? !row.url_filter_enabled : true;
			db.run('INSERT OR REPLACE INTO config (guild_id, url_filter_enabled) VALUES (?, ?)', [interaction.guild.id, newState], (err) => {
				if (err) {
					console.error(err.message);
					return;
				}

				// Send a response based on the new state
				const response = newState ? 'URL filtering is now enabled.' : 'URL filtering is now disabled.';
				interaction.reply({ content: response, ephemeral: true });
			});
		});
	},
};
