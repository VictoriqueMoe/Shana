import {AbstractCommand} from "./AbstractCommand";
import {Command, CommandMessage, Guard} from "@typeit/discord";
import {NotBot} from "../guards/NotABot";
import {ObjectUtil} from "../utils/Utils";
import {MessageEmbed} from "discord.js";
import {Main} from "../Main";

const reverseImageSearch = require("node-reverse-image-search");
const getUrls = require('get-urls');
const isImageFast = require('is-image-fast');

export class Misc extends AbstractCommand<any> {
    constructor() {
        super({
            module: {
                name: "Miscellaneous",
                description: "Miscellaneous commands"
            },
            commands: [
                {
                    name: "findSource",
                    description: {
                        text: "Perform a reverse image search",
                        args: [
                            {
                                type: "attachment",
                                optional: true,
                                name: "image",
                                description: "The image to search"
                            }
                        ]
                    }
                }
            ]
        });
    }

    @Command("findSource")
    @Guard(NotBot)
    private async imageSearch(command: CommandMessage): Promise<void> {
        type GoogleImageResult = {
            url?: string,
            title: string
        }[];
        const promiseWrapper = async (url: string): Promise<GoogleImageResult> => {
            return new Promise((resolve, reject) => reverseImageSearch(url, resolve));
        };

        const messageReference = command.reference;
        let messageAttachments = null;
        let imageUrl: string = null;

        if (messageReference) {
            const repliedMessageObj = await command.channel.messages.fetch(messageReference.messageID);
            const repliedMessageContent = repliedMessageObj.content;
            const repliedMessageAttachments = repliedMessageObj.attachments;

            const repliedMessageUrls = getUrls(repliedMessageContent);
            if (repliedMessageUrls && repliedMessageUrls.size === 1) {
                imageUrl = repliedMessageUrls.values().next().value;
            } else if (repliedMessageAttachments && repliedMessageAttachments.size === 1) {
                messageAttachments = repliedMessageAttachments;
            }
        }
        if(command.attachments && command.attachments.size === 1){
            messageAttachments = command.attachments;
        }
        if (messageAttachments && messageAttachments.size === 1) {
            const firstAttach = messageAttachments.array()[0];
            imageUrl = firstAttach.attachment as string;
        } else if (ObjectUtil.validString(command.content)) {
            const messageContentUrl = getUrls(command.content);
            if (messageContentUrl && messageContentUrl.size === 1) {
                imageUrl = messageContentUrl.values().next().value;
            }
        }

        if (!ObjectUtil.validString(imageUrl)) {
            command.reply("Please make sure you supply ONE image, if you are replying to a message, please make sure that message only has a single image");
            return;
        }
        const isImage: boolean = await isImageFast(imageUrl);
        if (!isImage) {
            command.reply("Attachment was not an image");
            return;
        }
        const result = await promiseWrapper(imageUrl);
        if (result.length === 1) {
            command.reply("No results found for this image");
            return;
        }
        const title = result[0].title;
        const botAvarar = Main.client.user.displayAvatarURL({dynamic: true});
        const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle(`top ${result.length - 1} ${title}`)
            .setAuthor(`${Main.client.user.username}`, botAvarar)
            .setThumbnail(imageUrl)
            .setTimestamp();
        for (let i = 1; i < result.length; i++) {
            const entry = result[i];
            embed.addField(entry.title, entry.url);
        }
        command.reply(embed);
    }
}