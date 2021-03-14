import {ArgsOf, Client, Guard, On} from "@typeit/discord";
import {NotBot} from "../../guards/NotABot";

const getUrls = require('get-urls');

export abstract class AnitRickrole {

    @On("message")
    @Guard(NotBot)
    private async antiRickrole([message]: ArgsOf<"message">, client: Client): Promise<void> {
        const messageContent = message.content;
        const urls = getUrls(messageContent);
        if (urls.size === 0) {
            return;
        }
        let shouldBlock = false;
        for (const url of urls) {
            if (url.includes("discordgift.site")) {
                shouldBlock = true;
                break;
            }
        }
        if(shouldBlock){
            message.delete({
                reason: "rockrole"
            });
        }
    }
}