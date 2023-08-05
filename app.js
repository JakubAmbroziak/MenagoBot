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

db.run(`CREATE TABLE IF NOT EXISTS emoji_roles (
    emoji TEXT,
    role_id TEXT
)`, (err) => {
  if (err) {
      console.log(err.message);
  }
  console.log("emoji_roles table created successfully.");
});
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

client.on('messageCreate', message => {
    if (message.author.bot) return;

    // Fetch all banned words from the database
    db.all('SELECT word FROM banned_words', [], (err, rows) => {
        if (err) {
            throw err;
        }
        
        const bannedWords = rows.map(row => row.word);

        for (const word of bannedWords) {
            console.log(`Banned word: ${word}`);
            if (message.content.toLowerCase().includes(word)) {
                console.log(`A message contained a banned word! Deleting message.`);
                message.delete()
                    .then(msg => {
                        console.log(`Deleted message from ${msg.author.username}`);

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
                            });
                        });
						if (this.changes > 0 && this.lastID >= 20) {
							// Kick the user
							msg.member.kick('You have had too many messages deleted.')
								.then(() => {
									console.log(`Kicked ${msg.author.username} for having too many messages deleted.`);
									// Reset user's counter
									db.run(`UPDATE user_counters SET counter = 0 WHERE user_id = ?`, [msg.author.id]);
								})
								.catch(console.error);
						}
                    })
                    .catch(console.error);
                break; // exits the loop once a banned word has been found and the message is deleted
            }
        }
    });
});




client.once(Events.ClientReady, () => {
	console.log('Ready!');
});

client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return;

    db.get('SELECT role_id FROM emoji_roles WHERE emoji = ?', [reaction.emoji.name], (err, row) => {
        if (err) {
            console.log(err.message);
            return;
        }

        if (row) {
            const role = reaction.message.guild.roles.cache.get(row.role_id);
            const member = reaction.message.guild.members.cache.get(user.id);
            member.roles.add(role);
        }
    });
});

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
client.on('guildMemberAdd', member => {
    db.get("SELECT role_id FROM auto_roles WHERE guild_id = ?", [member.guild.id], function(err, row) {
        if (err) {
            return console.error(err.message);
        }
        if (row) {
            const role = member.guild.roles.cache.get(row.role_id);
            member.roles.add(role).catch(console.error);
        }
    });
});



client.login(token);
