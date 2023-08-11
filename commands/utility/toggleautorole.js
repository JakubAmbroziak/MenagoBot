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

        let updatedValue;
        if (row) {
            updatedValue = row.auto_role_enabled === 1 ? 0 : 1;
        } else {
            updatedValue = 1;  // If no value found, default to enabling it
        }

        // Update DB
        await new Promise((resolve, reject) => {
            db.run('INSERT OR REPLACE INTO config (guild_id, auto_role_enabled) VALUES (?, ?)', 
                [interaction.guild.id, updatedValue], 
                function(err) {
                    if (err) reject(err);
                    resolve(this.lastID);
                }
            );
        });

        await interaction.reply(`Auto role feature has been ${updatedValue === 1 ? 'enabled' : 'disabled'}`);
    },
};
