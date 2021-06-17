import {Command, CommandMessage, Guard} from "@typeit/discord";
import {secureCommand} from "../guards/RoleConstraint";

const Discord = require('discord.js');
const Canvas = require('canvas');
const {MessageButton} = require('discord-buttons');

export class Test {

    @Command("button")
    @Guard(secureCommand)
    private async button(command: CommandMessage): Promise<void> {
        require('discord-buttons')(command.client);
        const button = new MessageButton()
            .setLabel("Vote")
            .setStyle("url")
            .setEmoji("🍔")
            .setURL("https://discord-buttons.js.org");
        await command.channel.send(`Ayo`, button);
    }

    @Command("test")
    @Guard(secureCommand)
    private async test(command: CommandMessage): Promise<void> {
        const applyText = (canvas, text) => {
            const ctx = canvas.getContext('2d');
            let fontSize = 70;
            do {
                ctx.font = `${fontSize -= 10}px sans-serif`;
            } while (ctx.measureText(text).width > canvas.width - 300);
            return ctx.font;
        };
        const member = command.member;
        const canvas = Canvas.createCanvas(700, 250);
        const ctx = canvas.getContext('2d');

        const background = await Canvas.loadImage(`${__dirname}/index.jpg`);
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = '#74037b';
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
        ctx.font = '28px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('Welcome to hell,', canvas.width / 2.5, canvas.height / 3.5);

        // Add an exclamation point here and below
        ctx.font = applyText(canvas, `${member.displayName}!`);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`${member.displayName}!`, canvas.width / 2.5, canvas.height / 1.8);

        ctx.beginPath();
        ctx.arc(125, 125, 100, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();

        const avatar = await Canvas.loadImage(member.user.displayAvatarURL({format: 'jpg'}));
        ctx.drawImage(avatar, 25, 25, 200, 200);

        const attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'welcome-image.png');

        command.channel.send(`Welcome to Hell, ${member}!`, attachment);
    }
}