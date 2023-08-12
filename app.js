const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, Permissions, PermissionsBitField, BitField } = require('discord.js');
const { token } = require('./config.json');




const sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database('./botData.db', (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to the SQlite database.');
});

const createTable = (query, tableName) => {
    db.run(query, (err) => {
        if (err) {
            console.error(`Error creating table '${tableName}':`, err.message);
        } else {
            console.log(`Table '${tableName}' created or already exists.`);
        }
    });
};

const tables = [
    {
        query: `CREATE TABLE IF NOT EXISTS banned_words (word TEXT PRIMARY KEY)`,
        name: 'banned_words'
    },
    {
        query: `CREATE TABLE IF NOT EXISTS user_count (
            user_id TEXT PRIMARY KEY,
            count INTEGER NOT NULL DEFAULT 0
        )`,
        name: 'user_count'
    },
    {
        query: `CREATE TABLE IF NOT EXISTS auto_roles (guild_id TEXT, role_id TEXT)`,
        name: 'auto_roles'
    },
    {
        query: `CREATE TABLE IF NOT EXISTS role_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            message_id TEXT NOT NULL,
            guild_id TEXT NOT NULL
        )`,
        name: 'role_messages'
    },
    {
        query: `CREATE TABLE IF NOT EXISTS config (
            guild_id TEXT PRIMARY KEY,
            url_filter_enabled INTEGER DEFAULT 0,
            verification_status INTEGER DEFAULT 0,
            filter_status INTEGER DEFAULT 0
        )`,
        name: 'config'
    },
    {
        query: `CREATE TABLE IF NOT EXISTS verification (
            guild_id TEXT PRIMARY KEY,
            message_id TEXT NOT NULL
        )`,
        name: 'verification'
    }
];

tables.forEach(table => createTable(table.query, table.name));




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

client.on('messageCreate', async message => { //filter
    if (message.author.bot) return;

    db.get('SELECT filter_status FROM config WHERE guild_id = ?', [message.guild.id], (err, row) => {
        if (err) return console.error(err);

        // If the filter is off, or if there's no entry for this guild (defaults to off), return
        if (!row || row.filter_status === 0) return;
    
    // Fetch all banned words from the database
    db.all('SELECT word FROM banned_words', [], async (err, rows) => {
        if (err) {
            throw err;
        }
        
        const bannedWords = rows.map(row => row.word.replace(/\r/g, '').toLowerCase()); // Convert to lowercase for case-insensitive matching
        console.log("Current Banned Words:", bannedWords);

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


client.once(Events.ClientReady, async () => {
	console.log('Ready!');
    scheduleReminders();
    for (const guild of client.guilds.cache.values()) {
        const row = await new Promise((resolve, reject) => {
            db.get('SELECT guild_id FROM config WHERE guild_id = ?', [guild.id], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });

        if (!row) {
            await new Promise((resolve, reject) => {
                db.run('INSERT INTO config (guild_id) VALUES (?)', [guild.id], (err) => {
                    if (err) reject(err);
                    resolve();
                });
            });
        }
    }
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
    if (!message.guild) return;

    // Ignore messages from bots
    if (message.author.bot) return;

    // Fetch member for checking permissions
    if (message.member && message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;


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

client.on('interactionCreate', async interaction => {
    // Check if it's a button interaction
    if (interaction.isButton()) {
        // Check if the button's custom ID matches
        if (interaction.customId === 'button') {
            const member = interaction.member;

            // Remove 'Unverified' role
            const unverifiedRole = member.guild.roles.cache.find(r => r.name === "Unverified");
            if (unverifiedRole) {
                await member.roles.remove(unverifiedRole).catch(console.error);
            }

            // Add 'Verified' role
            let verifiedRole = member.guild.roles.cache.find(r => r.name === "Verified");
            if (!verifiedRole) {
                verifiedRole = await member.guild.roles.create({
                    name: 'Verified',
                    reason: 'Role needed for verified members',
                    permissions: [
                        PermissionsBitField.Default
                    ]
                }).catch(console.error);
            }
            await member.roles.add(verifiedRole).catch(console.error);

            await interaction.user.send(`You are now verified within ${interaction.guild.name}`).catch(err => {
                console.error('Failed to send DM', err);
            });

            // Acknowledge the interaction
            await interaction.deferUpdate();
        }
    }
});



client.login(token);
