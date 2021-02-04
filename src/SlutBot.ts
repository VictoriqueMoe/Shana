import {
    Discord,
    CommandMessage,
    Command,
    On,
    ArgsOf,
    Guard, CommandNotFound,
    Client
} from "@typeit/discord";
import * as Path from "path";
import {NotBot} from "./guards/NotABot";
import fetch from "node-fetch";
import {Main} from "./Main";
const {prefix, loveSenseToken, uid, toyId} = require('../config.json');

@Discord(prefix, {
    import: [
        Path.join(__dirname, "commands", "*.ts"),
    ]
})
export abstract class SlutBot {

    @On("message")
    @Guard(NotBot)
    onMessage(
        [message]: ArgsOf<"message">,
        client: Client
    ) {
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

    @On("guildMemberUpdate")
    onMemberUpdate(
        [oldUser, newUser]: ArgsOf<"guildMemberUpdate">,
        client: Client
    ){
        let isNickChange = oldUser.nickname !== newUser.nickname;
        if(isNickChange){
            if(newUser.id === "697417252320051291"){
                newUser.setNickname("Mistress Victorique").catch(() => {});
            }
        }
    }

    @CommandNotFound()
    notFoundA(command: CommandMessage) {
        command.reply("Command not found");
    }

    @On("ready")
    initialize(): void {
        console.log("Bot logged in.");
        Main.Client.user.setActivity('Anime', { type: 'WATCHING' });
    }

}