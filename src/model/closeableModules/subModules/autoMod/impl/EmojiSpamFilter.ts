import {AbstractFilter} from "../AbstractFilter.js";
import {Message} from "discord.js";
import {singleton} from "tsyringe";
import ACTION from "../../../../../enums/ACTION.js";
import PRIORITY from "../../../../../enums/PRIORITY.js";
import {IValueBackedAutoModFilter} from "../IValueBackedAutoModFilter.js";
import {EmojiManager} from "../../../../framework/manager/EmojiManager.js";

@singleton()
export class EmojiSpamFilter extends AbstractFilter implements IValueBackedAutoModFilter<number> {

    public constructor(private _emojiManager: EmojiManager) {
        super();
    }

    public get actions(): ACTION[] {
        return [ACTION.DELETE, ACTION.WARN, ACTION.MUTE];
    }

    public get isActive(): boolean {
        return true;
    }

    /**
     * Limit of the emoji allowed in a single message
     */
    public get value(): number {
        return 6;
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
        return this._emojiManager.getEmojiFromMessage(content).length <= this.value;
    }

    public async postProcess(message: Message): Promise<void> {
        await super.postToLog("Too many emojis", message);
    }
}
