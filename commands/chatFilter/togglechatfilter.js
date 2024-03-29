const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database('./botData.db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('togglefilter')
        .setDescription('Toggle the chat filter on or off'),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: 'You are not authorized to use this command.', ephemeral: true });
        }
        // Fetch the current status
        db.get('SELECT filter_status FROM config WHERE guild_id = ?', [interaction.guild.id], (err, row) => {
            if (err) {
                console.error(err);
                return interaction.reply('An error occurred while fetching the filter status.');
            }

            let newStatus;
            
            if (row) {
                // If there's already a configuration for this guild
                newStatus = row.filter_status === 1 ? 0 : 1;

                // Update the row for the guild
                db.run('UPDATE config SET filter_status = ? WHERE guild_id = ?', [newStatus, interaction.guild.id], function(err) {
                    if (err) {
                        console.error(err);
                        return interaction.reply('An error occurred while updating the filter status.');
                    }

                    const statusMessage = newStatus === 1 ? "on" : "off";
                    interaction.reply({content: `Chat filter has been turned ${statusMessage}.`, ephemeral: true});
                });
            } else {
                // If there's no entry for the guild, insert a new row with the default status as on (0)
                newStatus = 0;
                
                db.run('INSERT INTO config (guild_id, filter_status) VALUES (?, ?)', [interaction.guild.id, newStatus], function(err) {
                    if (err) {
                        console.error(err);
                        return interaction.reply('An error occurred while setting the filter status.');
                    }

                    interaction.reply('Chat filter has been turned on.');
                });
            }
        });
    }
};
