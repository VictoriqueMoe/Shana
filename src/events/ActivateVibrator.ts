import {ArgsOf, Client, Guard, On} from "@typeit/discord";
import {NotBot} from "../guards/NotABot";

const {loveSenseToken, uid, toyId} = require('../../config.json');
import fetch from "node-fetch";
import {PremiumChannelOnlyCommand} from "../guards/PremiumChannelOnlyCommand";
import {BlockGuard} from "../guards/BlockGuard";

export abstract class ActivateVibrator {

    @On("message")
    @Guard(NotBot, PremiumChannelOnlyCommand, BlockGuard)
    private activateVibrator([message]: ArgsOf<"message">, client: Client): void {
        let hasPingedRole = message.mentions.roles.has("765298257915936798"); // whore role
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
}