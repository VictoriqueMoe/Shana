import {AbstractFilter} from "../AbstractFilter";
import {ACTION} from "../../../../../enums/ACTION";
import type {Message} from "discord.js";
import {PRIORITY} from "../../../../../enums/PRIORITY";
import type {IValueBackedDynoAutoModFilter} from "../IValueBackedDynoAutoModFilter";
import {singleton} from "tsyringe";

@singleton()
export class MassMentionsFilter extends AbstractFilter implements IValueBackedDynoAutoModFilter<number> {

    public get actions(): ACTION[] {
        return [ACTION.DELETE, ACTION.WARN];
    }

    public get isActive(): boolean {
        return true;
    }

    /**
     * How many mentions per message fail this filter
     */
    public get value(): number {
        return 6;
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
        return mentions.members.size < this.value;
    }

    public async postProcess(message: Message): Promise<void> {
        await super.postToLog("Mass Mentions", message);
    }
}
