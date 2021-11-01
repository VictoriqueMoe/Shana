import {AbstractFilter} from "../AbstractFilter";
import {ACTION} from "../../../../../enums/ACTION";
import {Message} from "discord.js";
import {PRIORITY} from "../../../../../enums/PRIORITY";
import {DiscordUtils} from "../../../../../utils/Utils";
import {IValueBackedDynoAutoModFilter} from "../IValueBackedDynoAutoModFilter";
import {singleton} from "tsyringe";

@singleton()
export class EmojiSpamFilter extends AbstractFilter implements IValueBackedDynoAutoModFilter {

    public get actions(): ACTION[] {
        return [ACTION.DELETE, ACTION.WARN, ACTION.MUTE];
    }

    public get isActive(): boolean {
        return true;
    }

    /**
     * Limit of the emoji allowed in a single message
     */
    public get value(): string {
        return "6";
    }

    public get id(): string {
        return "Emoji Spam Filter";
    }

    public get warnMessage(): string {
        return `Your message mentions too many emojis, the limit is: ${this.value}`;
    }

    public get priority(): number {
        return PRIORITY.LAST;
    }

    public async doFilter(content: Message): Promise<boolean> {
        return DiscordUtils.getEmojiFromMessage(content).length <= Number.parseInt(this.value);
    }

    public async postProcess(message: Message): Promise<void> {
        await super.postToLog("Too many emojis", message);
    }
}