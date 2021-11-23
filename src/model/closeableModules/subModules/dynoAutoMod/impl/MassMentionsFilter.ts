import {AbstractFilter} from "../AbstractFilter.js";
import {ACTION} from "../../../../../enums/ACTION.js";
import {Message} from "discord.js";
import {PRIORITY} from "../../../../../enums/PRIORITY.js";
import {IValueBackedDynoAutoModFilter} from "../IValueBackedDynoAutoModFilter.js";
import {singleton} from "tsyringe";

@singleton()
export class MassMentionsFilter extends AbstractFilter implements IValueBackedDynoAutoModFilter {

    public get actions(): ACTION[] {
        return [ACTION.DELETE, ACTION.WARN];
    }

    public get isActive(): boolean {
        return true;
    }

    /**
     * How many mentions per message fail this filter
     */
    public get value(): string {
        return "6";
    }

    public get id(): string {
        return "Mass Mentions Filter";
    }

    public get warnMessage(): string {
        return `Your message mentions too many members, the limit is: ${this.value}`;
    }

    public get priority(): number {
        return PRIORITY.LAST;
    }

    public async doFilter(content: Message): Promise<boolean> {
        const mentions = content.mentions;
        return mentions.members.size < Number.parseInt(this.value);
    }

    public async postProcess(message: Message): Promise<void> {
        await super.postToLog("Mass Mentions", message);
    }
}