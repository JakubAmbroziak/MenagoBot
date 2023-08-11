// commands/utility/toggleautorole.js
const { SlashCommandBuilder } = require('@discordjs/builders');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./botData.db');  // replace with your database name/path if it's different

module.exports = {
    data: new SlashCommandBuilder()
        .setName('toggleautorole')
        .setDescription('Toggle the auto role feature on or off'),

    async execute(interaction) {
        // Fetch current value from DB
        const row = await new Promise((resolve, reject) => {
            db.get('SELECT auto_role_enabled FROM config WHERE guild_id = ?', [interaction.guild.id], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });

        if (row) {
            const updatedValue = row.auto_role_enabled === 1 ? 0 : 1;

            // Update the existing row
            await new Promise((resolve, reject) => {
                db.run('UPDATE config SET auto_role_enabled = ? WHERE guild_id = ?', [updatedValue, interaction.guild.id], function(err) {
                    if (err) reject(err);
                    resolve(this.lastID);
                });
            });

            await interaction.reply(`Auto role feature has been ${updatedValue === 1 ? 'enabled' : 'disabled'}`);
        } else {
            // If no existing row for the guild, insert a new one with auto_role_enabled set to 1 by default
            await new Promise((resolve, reject) => {
                db.run('INSERT INTO config (guild_id, auto_role_enabled) VALUES (?, 1)', [interaction.guild.id], function(err) {
                    if (err) reject(err);
                    resolve(this.lastID);
                });
            });

            await interaction.reply(`Auto role feature has been enabled`);
        }
    },
};
