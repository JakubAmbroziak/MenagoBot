const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const { token } = require('./config.json');




const sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database('./botData.db', (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to the SQlite database.');
});

db.run(`CREATE TABLE IF NOT EXISTS banned_words (
    word TEXT PRIMARY KEY
)`);

db.run(`CREATE TABLE IF NOT EXISTS user_count (
    user_id TEXT PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 0
)`);

db.serialize(function() {
    db.run("CREATE TABLE IF NOT EXISTS auto_roles (guild_id TEXT, role_id TEXT)", (err) => {
        if (err) {
            console.error("Failed to create 'auto_roles' table", err);
        } else {
            console.log("'auto_roles' table created or already exists");
        }
    });
});
db.run(`
  CREATE TABLE IF NOT EXISTS role_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id TEXT NOT NULL,
    guild_id TEXT NOT NULL
  );
`, (err) => {
  if (err) {
    console.log(err.message);
  }
});
db.run(`
      CREATE TABLE IF NOT EXISTS config (
        guild_id TEXT PRIMARY KEY,
        url_filter_enabled INTEGER DEFAULT 1,
        auto_role_enabled INTEGER DEFAULT 1
      )
`);
db.run(`
CREATE TABLE IF NOT EXISTS dynamic_commands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    command_name TEXT NOT NULL,
    response TEXT NOT NULL
)
`);


const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMembers], 
    partials: ['MESSAGE', 'CHANNEL', 'REACTION'] 
});

 // You need the MessageContent intent

client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    // Fetch all banned words from the database
    db.all('SELECT word FROM banned_words', [], async (err, rows) => {
        if (err) {
            throw err;
        }

        const bannedWords = rows.map(row => row.word.toLowerCase()); // Convert to lowercase for case-insensitive matching

        for (const word of bannedWords) {
            if (message.content.toLowerCase().includes(word)) {
                console.log(`A message contained a banned word! Deleting message.`);
                try {
                    await message.delete();
                    console.log(`Deleted message from ${message.author.username}`);
                } catch (deleteErr) {
                    console.error(`Failed to delete message:`, deleteErr);
                }

                // Insert or ignore a row for the user
                db.run('INSERT OR IGNORE INTO user_count (user_id, count) VALUES (?, 0)', [message.author.id], function(err) {
                    if (err) {
                        return console.error(err.message);
                    }

                    // Update the count for the user
                    db.run('UPDATE user_count SET count = count + 1 WHERE user_id = ?', [message.author.id], function(err) {
                        if (err) {
                            return console.error(err.message);
                        }
                        console.log(`User's counter has been updated.`);

                        if (this.changes > 0) {
                            // Check if user's counter exceeds 20 and kick if necessary
                            db.get('SELECT count FROM user_count WHERE user_id = ?', [message.author.id], async (err, row) => {
                                if (err) {
                                    return console.error(err.message);
                                }

                                if (row.count >= 20) {
                                    try {
                                        const member = await message.guild.members.fetch(message.author);
                                        await member.kick('You have had too many messages deleted.');
                                        console.log(`Kicked ${message.author.username} for having too many messages deleted.`);
                                        // Reset user's counter
                                        db.run(`UPDATE user_count SET count = 0 WHERE user_id = ?`, [message.author.id]);
                                    } catch (kickErr) {
                                        console.error(`Failed to kick user:`, kickErr);
                                    }
                                }
                            });
                        }
                    });
                });
                break; // exits the loop once a banned word has been found and the message is deleted
            }
        }
    });
});


function scheduleReminders() {
	db.all('SELECT * FROM reminders WHERE reminder_time > ?', [Date.now()], (err, rows) => {
		if (err) {
			console.error('Error fetching reminders from database:', err.message);
			return;
		}

		for (const row of rows) {
			const { user_id, channel_id, reminder_time, message, role_id } = row;
			const delay = reminder_time - Date.now();

			setTimeout(async () => {
				try {
					const user = await client.users.fetch(user_id);
					const channel = await client.channels.fetch(channel_id);
					if (!user || !channel) {
						return;
					}

					if (role_id) {
						const role = channel.guild.roles.cache.get(role_id);
						if (role) {
							channel.send(`${role.toString()}, Reminder: ${message}`);
						}
					} else {
						user.send(`Reminder: ${message}`);
					}

					// Delete the reminder from the database after sending it
					db.run('DELETE FROM reminders WHERE user_id = ? AND channel_id = ? AND reminder_time = ?', [user_id, channel_id, reminder_time], (err) => {
						if (err) {
							console.error('Error deleting reminder from database:', err.message);
						}
					});
				} catch (error) {
					console.warn('Could not send a reminder:', error);
				}
			}, delay);
		}
	});
}


client.once(Events.ClientReady, () => {
	console.log('Ready!');
    scheduleReminders();
});
// Schedule reminders every 10 minutes to handle cases where the bot was offline during a reminder time
setInterval(scheduleReminders, 10 * 60 * 1000);

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = client.commands.get(interaction.commandName);

	if (!command) return;

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
    

});

client.on('messageCreate', async (message) => {
	if (message.author.bot) return;
    // Ignore messages from bots
    if (message.author.bot) return;

    // Allow administrators and the bot to send URLs
    if (message.member.permissions.has('ADMINISTRATOR')) return;
	// Fetch the URL filtering state from the database
	db.get('SELECT url_filter_enabled FROM config WHERE guild_id = ?', [message.guild.id], (err, row) => {
		if (err) {
			console.error(err.message);
			return;
		}

		if (row && row.url_filter_enabled) {
			// Regular expression to match URLs
			const urlRegex = /(https?:\/\/[^\s]+)/g;

			// Check if the message contains URLs
			if (urlRegex.test(message.content)) {
				message.delete().catch(console.error);
			}
		}
	});
});




client.login(token);
