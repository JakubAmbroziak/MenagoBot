const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

const sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database('./botData.db', (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to the SQLite database.');
});

// Create the "reminders" table with the "channel_id" column
db.run(`
  CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY,
    message TEXT,
    duration INTEGER,
    timestamp TEXT,
    role_id TEXT,
    reminder_time INTEGER,
    user_id TEXT,
    channel_id TEXT
  );
`, (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Table "reminders" has been created.');
});

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
		  .setRequired(false))
	  .addStringOption(option =>
		option.setName('timestamp')
		  .setDescription('Specific time for the reminder (format: DD/MM/YYYY HH:mm)')
		  .setRequired(false))
	  .addRoleOption(option =>
		option.setName('role')
		  .setDescription('Role to be reminded')
		  .setRequired(false)),
  
	async execute(interaction) {
	  const reminderMessage = interaction.options.getString('message');
	  const duration = interaction.options.getInteger('duration');
	  const timestamp = interaction.options.getString('timestamp');
	  const role = interaction.options.getRole('role');
  
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
  
	  // Save the reminder to the database
	  db.run('INSERT INTO reminders (message, duration, timestamp, role_id, reminder_time, user_id, channel_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
		[reminderMessage, duration, timestamp, role?.id || null, Date.now() + reminderTime, interaction.user.id, interaction.channel.id],
		(err) => {
		  if (err) {
			console.error('Error saving reminder to database:', err.message);
		  }
		}
	  );
  
	  setTimeout(async () => {
		try {
		  if (role) {
			// If a role was selected, send a message in the channel mentioning the role
			await interaction.channel.send(`${role.toString()}, Reminder: ${reminderMessage}`);
		  } else {
			// If no role was selected, send the reminder as a DM
			await interaction.user.send(`Reminder: ${reminderMessage}`);
		  }
		} catch (error) {
		  console.warn(`Could not send a DM to the user. They might have DMs disabled.`, error);
		  // If we cannot send a DM, send the message normally
		  await interaction.followUp({ content: `Reminder: ${reminderMessage}`, ephemeral: true });
		}
	  }, reminderTime);
	},
  };
