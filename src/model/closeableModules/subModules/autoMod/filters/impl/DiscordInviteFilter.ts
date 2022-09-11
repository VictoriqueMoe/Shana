import {AbstractFilter} from "../AbstractFilter.js";
import {Message} from "discord.js";

export class DiscordInviteFilter extends AbstractFilter {

    public get id(): string {
        return "Discord Invite Filter";
    }

    public doFilter(content: Message): Promise<boolean> {
        const messageContent = content.content;
        const regex = /(discord\.gg|discordapp\.com\/invite\/|discord\.com\/invite)/gmi;
        return Promise.resolve(!regex.test(messageContent));
    }

    public async postProcess(message: Message): Promise<void> {
        await super.postToLog("Invite link", message);
    }
}
