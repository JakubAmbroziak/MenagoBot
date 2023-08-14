const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('menagohelp')
        .setDescription('Provides instructions and FAQ for potential admins wanting to use the bot.'),

    async execute(interaction) {
    const helpEmbed = new EmbedBuilder()
	.setColor(0x00ff00)
	.setTitle('MenagoBot Help')
	.setDescription('Here is a brief overview of the available commands and their functionalities:')
    .addFields(
        { 
            name: '🔔 Important Notes', 
            value: 'The following features are **turned off by default**:\n- Verification\n- Chat Filtering\n- URL Filtering\n\nYou can enable them as needed using the appropriate commands below.' 
        },
        {
            name: '`Verification`', 
            value: 'Activate the verification feature with `/toggleverification`. Next, establish a verification channel using `/setupverification`. Unverified members will only have access to the `#Verification` channel.'
        },
        {
            name: '`Chat filtering`', 
            value: 'Enable the chat filter with `/togglefilter`. Initially, no words are restricted. Manage the list of banned words using `/addbannedword` and `/removebannedword`. To add common swear words to the list, use `/banswearwords`. Clear the list entirely with `/clearbannedwords`. Utilize `/toggleurlfilter` to manage permissions for sending URLs.'
        },
        {
            name: '`Polls`', 
            value: 'Initiate a poll with `/poll`. Define your answers separated by commas. Without specified answers, the bot defaults to a Yes/No format.'
        },
        {
            name: '`Reminder`', 
            value: 'Stay organized with `/reminder`. Specify your reminder message and decide between a countdown or a set time. Including a role will notify members with that role when the timer goes off. Without specifying a role, reminders are sent to you directly via DMs.'
        }
    
    )
    
	.setFooter({ text: 'Feel free to conact developer @ https://github.com/JakubAmbroziak', iconURL: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'});
    

        await interaction.reply({ embeds: [helpEmbed], ephemeral: true });
    },
};
