# Discord Bot Project

This is my first GitHub bot project, developed as a part of my bachelor's thesis. The Discord bot is designed to enhance user interactions and offer robust chat moderation features. Built using JavaScript, it embodies a set of capabilities such as user verification, chat filtering, and other additional utilities.

## Table of Contents

- [Features](#features)
- [Setup and Installation](#setup-and-installation)
- [Usage](#usage)
- [Dependencies](#Dependencies)


## Features

- **Verification System:** Assures that users are genuine and helps in reducing spam.
- **Chat Filtering:** Removes messages containing banned words(optionally loads list of swear words).
- **Url Filtering:** Simply deletes messages contain urls.
- **Polls:** A poll system that utilizes emojis.
- **Reminder(announcement) system** Set reminders for specific tasks or event to user or @role
...[add other features here]

## Setup and Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/JakubAmbroziak/MenagoBot.git
2. Navigate to the directory:
   ```bash
   cd MenagoBot
3. Install the required dependencies:
   ```bash
   npm install
3. Create a .env file and input the necessary environment variables, such as your Discord bot token.
4. Deploy Commands
   ```bash
   node deploy-commands
5. Launch
   ```bash
   node app
## Usage
 Important Notes
The following features are turned off by default:
Verification
Chat Filtering
URL Filtering

You can enable them as needed using the appropriate commands below.
### Verification
Activate the verification feature with */toggleverification*. Next, establish a verification channel using */setupverification.* Unverified members will only have access to the #Verification channel.

### Chat filtering
Enable the chat filter with */togglefilter.* Initially, no words are restricted. Manage the list of banned words using /addbannedword and */removebannedword.* To add common swear words to the list, use /banswearwords. Clear the list entirely with /clearbannedwords. Utilize */toggleurlfilter* to manage permissions for sending URLs.

### Polls
Initiate a poll with */poll*. Define your answers separated by commas. Without specified answers, the bot defaults to a Yes/No format.

### Reminder
Stay organized with */reminder*. Specify your reminder message and decide between a countdown or a set time. Including a role will notify members with that role when the timer goes off. Without specifying a role, reminders are sent to you directly via DMs.
## Dependencies

The bot relies heavily on two main libraries:

- [Discord.js](https://discord.js.org/): A powerful library that allows for easy interactions with the Discord API.
- [Sqlite](https://www.sqlite.org/index.html): Useful for storing and retrieving data, making the bot's features more dynamic.
