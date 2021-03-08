import {ArgsOf, Client, Guard, On} from "@typeit/discord";
import {NotBot} from "../../guards/NotABot";
import {Message} from "discord.js";
import {Main} from "../../Main";


export abstract class MoeStuff {

    @On("message")
    @Guard(NotBot)
    private async moeLoliDestroyer([message]: ArgsOf<"message">, client: Client): Promise<void> {
        if (!message.member) {
            return;
        }
        if (message.member.id === "270632394137010177") {
            const banned = ["ì", "|", "lol", "loli", "l0l"];
            let messageContent = message.content.replace(/\s/g, '').toLocaleLowerCase();
            messageContent = messageContent.replace(/[ ,.-]/g, "");
            let shouldBlock = false;
            for (const ban of banned) {
                if (messageContent.includes(ban.toLocaleLowerCase())) {
                    shouldBlock = true;
                    break;
                }
            }
            if (shouldBlock) {
                this.doPoser(message);
                return;
            }
        }
    }

    private doPoser(message: Message): void {
        message.reply("Poser").then(value => {
            setTimeout(() => {
                value.delete();
            }, 3000);
        });
        message.delete();
    }
}