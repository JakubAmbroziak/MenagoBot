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
				return interaction.reply({ content: 'An error occurred while fetching the URL filter status.', ephemeral: true });
			}

			let newState;

			if (row) {
				// Toggle the state and update the database
				newState = row.url_filter_enabled === 1 ? 0 : 1;

				// Update the row for the guild
				db.run('UPDATE config SET url_filter_enabled = ? WHERE guild_id = ?', [newState, interaction.guild.id], function(err) {
					if (err) {
						console.error(err);
						return interaction.reply({ content: 'An error occurred while updating the URL filter status.', ephemeral: true });
					}

					// Send a response based on the new state
					const response = newState === 1 ? 'URL filtering is now enabled.' : 'URL filtering is now disabled.';
					interaction.reply({ content: response, ephemeral: true });
				});
			} else {
				// If no existing entry, insert a new row with URL filter enabled by default
				newState = 0;
				
				db.run('INSERT INTO config (guild_id, url_filter_enabled) VALUES (?, ?)', [interaction.guild.id, newState], function(err) {
					if (err) {
						console.error(err);
						return interaction.reply({ content: 'An error occurred while setting the URL filter status.', ephemeral: true });
					}

					interaction.reply({ content: 'URL filtering is now enabled.', ephemeral: true });
				});
			}
		});
	},
};
