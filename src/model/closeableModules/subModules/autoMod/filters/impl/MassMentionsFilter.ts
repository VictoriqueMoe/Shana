import {Message} from "discord.js";
import {AbstractValueBackedAutoModFilter} from "../AbstractValueBackedAutoModFilter.js";

export class MassMentionsFilter extends AbstractValueBackedAutoModFilter<number> {

    public get defaultValue(): number {
        return 6;
    }

    public get id(): string {
        return "Mass Mentions Filter";
    }

    /**
     * How many mentions per message fail this filter
     */
    public unMarshalData(data: string): number {
        return Number.parseInt(data);
    }

    public async doFilter(content: Message): Promise<boolean> {
        const mentions = content.mentions;
        const value = await this.value(content.guildId);
        return mentions.members.size < value;
    }
}
