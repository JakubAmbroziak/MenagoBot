const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField, ButtonStyle, MessageEmbed, ActionRowBuilder, ButtonBuilder, EmbededBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription("This is verification message"),

    async execute(interaction) {
        // Check for Administrator permission
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return await interaction.reply({ content: "You need to be an admin", ephemeral: true });
        }

        // Define the embed
        const button = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
            .setCustomId('button')
            .setEmoji('✅')
            .setLabel('Verify')
            .setStyle(ButtonStyle.Success)
        )

        const embed = new EmbedBuilder()
        .setColor('Green')
        .setTitle("Verification Process")
        .setDescription('To gain access to the rest of the server, please react with ✅ below!')
        .setFooter({text: 'This verification process helps us in maintaining a secure community'})

        await interaction.reply({embeds: [embed], components: [button]});


    }    
};
