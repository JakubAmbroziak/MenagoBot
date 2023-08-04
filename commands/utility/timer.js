const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('reminder')
		.setDescription('Set a reminder')
		.addStringOption(option =>
			option.setName('message')
				.setDescription('The reminder message')
				.setRequired(true))
		.addIntegerOption(option =>
			option.setName('duration')
				.setDescription('Time until the reminder in minutes')
				.setRequired(false)) // Not required because we have two ways to set the time
		.addStringOption(option =>
			option.setName('timestamp')
				.setDescription('Specific time for the reminder (format: DD/MM/YYYY HH:mm)')
				.setRequired(false)), // Not required because we have two ways to set the time

	async execute(interaction) {
		const reminderMessage = interaction.options.getString('message');
		const duration = interaction.options.getInteger('duration');
		const timestamp = interaction.options.getString('timestamp');

		if (!duration && !timestamp) {
			await interaction.reply({ content: 'You must provide either a duration or a timestamp for the reminder.', ephemeral: true });
			return;
		}

		let reminderTime;
		if (duration) {
			reminderTime = duration * 60 * 1000; // Convert from minutes to milliseconds
			await interaction.reply({ content: `I will remind you about "${reminderMessage}" in ${duration} minute(s).`, ephemeral: true });
		} else {
			// Split the "DD/MM/YYYY HH:mm" string into parts
			const [date, time] = timestamp.split(' ');
			const [day, month, year] = date.split('/');
			const [hour, minute] = time.split(':');

			// Build a Date object from the parts
			const reminderDate = new Date(year, month - 1, day, hour, minute);

			reminderTime = reminderDate.getTime() - Date.now();
			if (reminderTime < 0) {
				await interaction.reply({ content: 'The specified time is in the past.', ephemeral: true });
				return;
			}
			await interaction.reply({ content: `I will remind you about "${reminderMessage}" at ${timestamp}.`, ephemeral: true });
		}

		setTimeout(async () => {
			try {
				await interaction.user.send(`Reminder: ${reminderMessage}`); // Send a DM
			} catch (error) {
				console.warn(`Could not send a DM to the user. They might have DMs disabled.`, error);
				// If we cannot send a DM, send the message normally
				await interaction.followUp({ content: `Reminder: ${reminderMessage}`, ephemeral: true });
			}
		}, reminderTime);
	},
};
