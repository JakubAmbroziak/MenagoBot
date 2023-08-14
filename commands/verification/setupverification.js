    const { SlashCommandBuilder } = require('@discordjs/builders');
    const { ChannelType, PermissionsBitField, ActionRowBuilder, ButtonBuilder, EmbedBuilder, ButtonStyle } = require('discord.js');
    
    module.exports = {
        data: new SlashCommandBuilder()
            .setName('setupverification')
            .setDescription("Sets up verification message in a new channel."),
    
        async execute(interaction) {
            // Check for Administrator permission
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {

                return await interaction.reply({ content: "You need to be an admin", ephemeral: true });
            }
            await interaction.deferReply({ ephemeral: true });

            // Create the verification channel with specific permissions
            const verificationChannel = await interaction.guild.channels.create({
                name: 'verification',
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    {
                        id: interaction.guild.roles.everyone.id,
                        deny: [PermissionsBitField.Flags.SendMessages],
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.UseEmbeddedActivities]
                    }
                ]
            });
            
    
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

        await verificationChannel.send({embeds: [embed], components: [button]});
        await interaction.editReply({content: '🎉 The Verification Channel is set up! 🎉',  ephemeral: true });

        }
    };
    
