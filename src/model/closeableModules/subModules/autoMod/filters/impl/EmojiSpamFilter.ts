import {Message} from "discord.js";
import {EmojiManager} from "../../../../../framework/manager/EmojiManager.js";
import {AbstractValueBackedAutoModFilter} from "../AbstractValueBackedAutoModFilter.js";
import {injectable} from "tsyringe";

@injectable()
export class EmojiSpamFilter extends AbstractValueBackedAutoModFilter<number> {

    public constructor(private _emojiManager: EmojiManager) {
        super();
    }

    public get id(): string {
        return "Emoji Spam Filter";
    }

    public get defaultValue(): number {
        return 6;
    }

    public override async warnMessage(guildId: string): Promise<string> {
        const message = await super.warnMessage(guildId);
        const limit = await this.value(guildId);
        return `${message}, the limit is: ${limit}`;
    }

    public async doFilter(content: Message): Promise<boolean> {
        const value = await this.value(content.guildId);
        return this._emojiManager.getEmojiFromMessage(content).length <= value;
    }

    /**
     * Limit of the emoji allowed in a single message
     */
    public unMarshalData(data: string): number {
        return Number.parseInt(data);
    }

}
