import {ArgsOf, Client, Guard, On} from "@typeit/discord";
import {NotBot} from "../guards/NotABot";
import fetch from "node-fetch";
import {PremiumChannelOnlyCommand} from "../guards/PremiumChannelOnlyCommand";
import {BlockGuard} from "../guards/BlockGuard";
import {Roles} from "../enums/Roles";
import RolesEnum = Roles.RolesEnum;

const {loveSenseToken, uid, toyId} = require('../../config.json');

export abstract class MessageListener {

    @On("message")
    @Guard(NotBot, PremiumChannelOnlyCommand, BlockGuard)
    private activateVibrator([message]: ArgsOf<"message">, client: Client): void {
        let hasPingedRole = message.mentions.roles.has(RolesEnum.WEEB_OVERLORD); // whore role
        if (hasPingedRole) {
            console.log(`user: ${message.author.username} pinged your role`);
            let command = "AVibrate";
            let v = 20;
            let sec = 1;
            fetch(`https://api.lovense.com/api/lan/command?token=${loveSenseToken}&uid=${uid}&command=${command}&v=${v}&t=${toyId}&sec=${sec}`, {
                method: 'post'
            });
        }
    }

    @On("message")
    @Guard(NotBot)
    private moeLoliDestroyer([message]: ArgsOf<"message">, client: Client): void {
        if (message.member.id === "270632394137010177") {
            let banned = ["ì", "|", "lol"];
            let messageContent = message.content;
            let shouldBlock = false;
            for (let ban of banned) {
                if (messageContent.toLowerCase().includes(ban)) {
                    shouldBlock = true;
                    break;
                }
            }
            if (shouldBlock) {
                message.reply("Poser").then(value => {
                    setTimeout(args => {
                        value.delete();
                    }, 3000);
                });
                message.delete();
            }
        }
    }
}