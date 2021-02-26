import {ArgsOf, Client, Guard, On} from "@typeit/discord";
import {NotBot} from "../../guards/NotABot";
import {Collection, Message, MessageAttachment} from "discord.js";
import {Main} from "../../Main";
import {DiscordUtils} from "../../utils/Utils";
import * as fs from "fs";


export abstract class MoeStuff {

    @On("message")
    @Guard(NotBot)
    private async moeLoliDestroyer([message]: ArgsOf<"message">, client: Client): Promise<void> {
        let allow = false;
        if (Main.testMode) {
            if (message.member.id === "697417252320051291") {
                allow = true;
            }
        }
        if (message.member.id === "270632394137010177" || allow) {
            const banned = ["ì", "|", "lol", "loli"];
            let messageContent = message.content.replace(/\s/g, '').toLocaleLowerCase();
            messageContent = messageContent.replace(/[ ,.-]/g, "");
            let shouldBlock = false;
            const hasAttachments = message.attachments.size > 0;
            let attachments: Collection<string, MessageAttachment> = null;
            if (hasAttachments) {
                attachments = message.attachments;
            }
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
            if (hasAttachments) {
                for (const [, attatchmentObject] of attachments) {
                    const urlToImage = attatchmentObject.attachment as string;
                    const image = await DiscordUtils.loadResourceFromURL(urlToImage);
                    const dir = `${__dirname}/../../bannedImages`;
                    const files = await fs.promises.readdir(`${__dirname}/../../bannedImages`);
                    for (const file of files) {
                        const localImage = await fs.promises.readFile(`${dir}/${file}`);
                        if (image.equals(localImage)) {
                            this.doPoser(message);
                            break;
                        }
                    }
                }
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