import {AbstractFilter} from "../AbstractFilter.js";
import {Message} from "discord.js";
import {singleton} from "tsyringe";

@singleton()
export class DiscordInviteFilter extends AbstractFilter {

    public get id(): string {
        return "Discord Invite Filter";
    }

    public async doFilter(content: Message): Promise<boolean> {
        const messageContent = content.content;
        const regex = /(discord\.gg|discordapp\.com\/invite\/|discord\.com\/invite)/gmi;
        return !regex.test(messageContent);
    }

    public async postProcess(message: Message): Promise<void> {
        await super.postToLog("Invite link", message);
    }
}
