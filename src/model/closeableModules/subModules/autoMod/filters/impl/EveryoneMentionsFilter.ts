import {AbstractFilter} from "../AbstractFilter.js";
import {Message} from "discord.js";
import {PermissionFlagsBits} from "discord-api-types/v10";

export class EveryoneMentionsFilter extends AbstractFilter {

    public get id(): string {
        return "Discord everyone filter";
    }

    public doFilter(content: Message): boolean {
        const hasPerms = content?.member?.permissions.has(PermissionFlagsBits.MentionEveryone);
        if (hasPerms) {
            return true;
        }
        return !content.content.includes("@everyone");

    }
}
