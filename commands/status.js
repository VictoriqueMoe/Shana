const {loveSenseToken, uid, toyId} = require('../config.json');
const fetch = require("node-fetch");
const isEnabled = false;
module.exports = {
    name: 'status',
    description: 'Get the status of the toy!',
    async execute(message, args) {
        console.log(`user: ${message.author.username} Enquired about the toy status`);
        message.channel.send(isEnabled ? "My vibrator is enabled!" : "My vibrator is disabled!");
        /*try{
            let resp = await fetch(`https://api.lovense.com/api/lan/command?token=${loveSenseToken}&uid=${uid}&command=Battery&t=${toyId}`, {
                method: 'post'
            });
            message.channel.send('Slut toy is enabled!');
        }catch(e){
            message.channel.send('Slut toy is disabled!');
        }*/
    },
};