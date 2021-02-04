// require the discord.js module
const Discord = require('discord.js');
const { Client, Intents } = require('discord.js');
const fs = require('fs');
const fetch = require("node-fetch");
const {prefix, token, loveSenseToken, uid, toyId} = require('./config.json');
// create a new Discord client
const client = new Client({ ws: { intents: Intents.ALL } });

client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}
client.once('ready', () => {
    client.user.setActivity('Anime', { type: 'WATCHING' });
    console.log('Ready!');
});
client.on("guildMemberUpdate", (oldUser, newUser) => {
    let isNickChange = oldUser.nickname !== newUser.nickname;
    if(isNickChange){
        if(newUser.id === "697417252320051291"){
            newUser.setNickname("Mistress Victorique");
        }
    }
});
client.on('message', async message => {
    async function handleCommand(message) {
        let args = message.content.slice(prefix.length).trim().split(/ +/);
        let command = args.shift().toLowerCase();
        switch (command) {
            case "status":
                await client.commands.get('status').execute(message, args);
                break;
        }
    }

    if (message.author.bot) {
        return;
    }
    if (message.content.startsWith(prefix)) {
        await handleCommand(message);
        return;
    }
    let hasPingedRole = message.mentions.roles.has("765298257915936798");
    if (hasPingedRole) {
        console.log(`user: ${message.author.username} pinged your role`);
        let command = "AVibrate";
        let v = 20;
        let sec = 1;
        await fetch(`https://api.lovense.com/api/lan/command?token=${loveSenseToken}&uid=${uid}&command=${command}&v=${v}&t=${toyId}&sec=${sec}`, {
            method: 'post'
        });
    }
});

// login to Discord with your app's token
client.login(token);