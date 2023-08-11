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

        const collector = await interaction.channel.createMessageComponentCollector();

        collector.on('collect', async i => {
            
            const unverifiedRole = i.guild.roles.cache.find(r => r.name === "Unverified");
            if (unverifiedRole && i.member.roles.cache.has(unverifiedRole.id)) {
                await i.member.roles.remove(unverifiedRole);
            }

            let verifiedRole = i.guild.roles.cache.find(r => r.name === "Verified");
            if (!verifiedRole) {
                try {
                    verifiedRole = await i.guild.roles.create({
                        name: 'Verified',
                        color: '90ee90',
                        permissions: [],  // you can specify permissions here, or leave it empty for default
                        reason: 'Verified role did not exist, so it was created.'
                    });
                    console.log('Verified role created.');
                } catch (error) {
                    console.error('Error creating the Verified role:', error);
                }
            }

            if (verifiedRole) {
                await i.member.roles.add(verifiedRole);
                i.user.send(`You are now verified within ${i.guild.name}`).catch(err => {
                    console.error('Failed to send DM', err);
                });

            }
            await i.deferUpdate();

        });
    }    
};
