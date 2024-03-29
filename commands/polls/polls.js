const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('poll')
        .setDescription('Create a poll')
        .addStringOption(option =>
            option.setName('question')
                .setDescription('The poll question')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('answers')
                .setDescription('The poll answers, separated by a comma')
                .setRequired(false)
        ),
    async execute(interaction) {
        const question = interaction.options.getString('question');
        const options = interaction.options.getString('answers');

        let emojiList = ['👍', '👎'];  // Default emojis for Yes/No
        let optionsArray;
        let optionsText = '';

        if (!options) {
            // If no answers provided, use default 'Yes' and 'No'
            optionsArray = ['Yes', 'No'];
            optionsText = '👍 - Yes\n \n \n👎 - No';
        } else {
            optionsArray = options.split(',');

            if (optionsArray.length < 2) {
                return interaction.reply('You must provide at least 2 options for the poll!');
            }

            if (optionsArray.length > 10) {
                return interaction.reply('You cannot have more than 10 options for a poll!');
            }

            emojiList = ['🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬', '🇭', '🇮', '🇯'];
            for (let i = 0; i < optionsArray.length; i++) {
                optionsText += `${emojiList[i]} - ${optionsArray[i]}\n`;
            }
        }

        const pollEmbed = {
            color: 0x5865F2,
            title: question,
            description: optionsText,
        };

        let message;
        try {
            message = await interaction.reply({ embeds: [pollEmbed], fetchReply: true });
        } catch (e) {
            console.log('Failed to send poll embed: ', e);
            return;
        }
        
        for (let i = 0; i < optionsArray.length; i++) {
            try {
                await message.react(emojiList[i]);
            } catch (e) {
                console.log('Failed to react: ', e);
                return;
            }
        }
    },
};
