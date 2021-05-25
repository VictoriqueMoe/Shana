import {AbstractFilter} from "../AbstractFilter";
import {ACTION} from "../../../../../enums/ACTION";
import {Message} from "discord.js";
import {InjectDynoSubModule} from "../../../../decorators/InjectDynoSubModule";
import {PRIORITY} from "../../../../../enums/PRIORITY";
import {DynoAutoMod} from "../../../../../events/closeableModules/DynoAutoMod";
import {IValueBackedDynoAutoModFilter} from "../IValueBackedDynoAutoModFilter";

@InjectDynoSubModule(DynoAutoMod)
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

    public doFilter(content: Message): boolean {
        const mentions = content.mentions;
        return mentions.members.size < Number.parseInt(this.value);
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

    public async postProcess(message: Message): Promise<void> {
        await super.postToLog("Mass Mentions", message);
    }
}