import {singleton} from "tsyringe";
import {AbstractFilter} from "../AbstractFilter";
import {ACTION} from "../../../../../enums/ACTION";
import {PRIORITY} from "../../../../../enums/PRIORITY";
import {Message, Permissions} from "discord.js";

@singleton()
export class EveryoneMentionsFilter extends AbstractFilter {
    public get actions(): ACTION[] {
        return [ACTION.MUTE, ACTION.DELETE, ACTION.WARN];
    }

    public get id(): string {
        return "Discord everyone filter";
    }

    public get isActive(): boolean {
        return true;
    }

    public get priority(): number {
        return PRIORITY.LAST;
    }

    public get warnMessage(): string {
        return "Your message can not contain everyone pings";
    }

    public async doFilter(content: Message): Promise<boolean> {
        const hasPerms = content?.member?.permissions.has(Permissions.FLAGS.MENTION_EVERYONE);
        if (hasPerms) {
            return true;
        }
        return !content.content.includes("@everyone");

    }

    public async postProcess(message: Message): Promise<void> {
        await super.postToLog("everyone ping", message);
    }
}