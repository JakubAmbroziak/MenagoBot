const { SlashCommandBuilder } = require('@discordjs/builders');
const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database('./botData.db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setautorole')
        .setDescription('Set the role to automatically assign to new members')
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The role to assign')
                .setRequired(true)),

    async execute(interaction) {
        const role = interaction.options.getRole('role');
        db.run("INSERT INTO auto_roles(guild_id, role_id) VALUES(?, ?)", [interaction.guild.id, role.id], function(err) {
            if (err) {
                return console.error(err.message);
            }
            interaction.reply(`Auto role set to ${role.name}`);
        });
    }
};
