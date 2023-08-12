const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./botData.db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('toggleverification')
        .setDescription('Toggle the verification feature on or off'),

    async execute(interaction) {
        // Fetch current verification status from DB
        const row = await new Promise((resolve, reject) => {
            db.get('SELECT verification_status FROM config WHERE guild_id = ?', [interaction.guild.id], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });

        let updatedValue;
        if (row) {
            updatedValue = row.verification_status === 1 ? 0 : 1;
        } else {
            updatedValue = 1;  // If no value found, default to enabling it
        }

        // Update everyone role's permissions based on the new status
        const everyoneRole = interaction.guild.roles.everyone;

        if (updatedValue === 1) {
            await everyoneRole.setPermissions([PermissionsBitField.Flags.UseEmbeddedActivities]);
        } else {
            await everyoneRole.setPermissions([PermissionsBitField.Default]);
        }

        // Update DB
        await new Promise((resolve, reject) => {
            db.run('UPDATE config SET verification_status = ? WHERE guild_id = ?', 
            [updatedValue, interaction.guild.id], 
            function(err) {``
                if (err) reject(err);
                resolve(this.lastID);
            }
            );
        });

        await interaction.reply({content: `Verification feature has been ${updatedValue === 1 ? 'enabled. Set up verification' : 'disabled. @Everyone role\'s has been set to default'}.`,  ephemeral: true });
    },
};