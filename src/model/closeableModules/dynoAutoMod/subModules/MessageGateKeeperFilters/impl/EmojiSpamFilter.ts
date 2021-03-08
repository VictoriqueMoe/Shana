import {InjectDynoSubModule} from "../../../../../decorators/InjectDynoSubModule";
import {MessageGateKeeper} from "../../../../../../events/closeableModules/MessageGateKeeper";
import {AbstractFilter} from "../AbstractFilter";
import {IValueBackedMessageGateKeeperFilter} from "../IValueBackedMessageGateKeeperFilter";
import {ACTION} from "../../../../../../enums/ACTION";
import {Message} from "discord.js";
import {PRIORITY} from "../../../../../../enums/PRIORITY";
import {DiscordUtils} from "../../../../../../utils/Utils";

const emojiRegex = require('emoji-regex/es2015/index.js');

@InjectDynoSubModule(MessageGateKeeper)
export class EmojiSpamFilter extends AbstractFilter implements IValueBackedMessageGateKeeperFilter {

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

    public doFilter(content: Message): boolean {
        return DiscordUtils.getEmojiFromMessage(content).length < Number.parseInt(this.value);
    }

    public get id(): string {
        return "Emoji Spam Filter";
    }

    public get warnMessage(): string {
        return `Your message mentions too many emoji, the limit is: ${this.value}`;
    }

    public get priority(): number {
        return PRIORITY.LAST;
    }
}