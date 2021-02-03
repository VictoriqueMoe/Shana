// require the discord.js module
const Discord = require('discord.js');
const fetch = require("node-fetch");
const {prefix, token} = require('./config.json');
// create a new Discord client
const client = new Discord.Client();

// when the client is ready, run this code
// this event will only trigger one time after logging in
client.once('ready', () => {
    console.log('Ready!');
});

client.on('message', async message => {
    let hasPingedRole = message.mentions.roles.has("765298257915936798");
    let didBotSend = message.author.bot;
    if (hasPingedRole && !didBotSend) {
        console.log(`user: ${message.author.username} pinged your role`);
        await fetch("https://192-168-50-58.lovense.club:34568/AVibrate?v=20&t=e75537563257&sec=1", {
            method: 'post'
        });
    }
});

// login to Discord with your app's token
client.login(token);