import {singleton} from "tsyringe";
import {AbstractFilter} from "../AbstractFilter.js";
import {Message} from "discord.js";
import {PermissionFlagsBits} from "discord-api-types/v10";

@singleton()
export class EveryoneMentionsFilter extends AbstractFilter {

    public get id(): string {
        return "Discord everyone filter";
    }

    public async doFilter(content: Message): Promise<boolean> {
        const hasPerms = content?.member?.permissions.has(PermissionFlagsBits.MentionEveryone);
        if (hasPerms) {
            return true;
        }
        return !content.content.includes("@everyone");

    }

    public async postProcess(message: Message): Promise<void> {
        await super.postToLog("everyone ping", message);
    }
}
