import {AbstractFilter} from "../AbstractFilter.js";
import {ACTION} from "../../../../../enums/ACTION.js";
import {Message} from "discord.js";
import {PRIORITY} from "../../../../../enums/PRIORITY.js";
import {singleton} from "tsyringe";

@singleton()
export class DiscordInviteFilter extends AbstractFilter {

    public get actions(): ACTION[] {
        return [ACTION.DELETE, ACTION.WARN];
    }

    public get id(): string {
        return "Discord Invite Filter";
    }

    public get isActive(): boolean {
        return true;
    }

    public get priority(): number {
        return PRIORITY.LAST;
    }

    public get warnMessage(): string {
        return "Your message can not contain discord invites";
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