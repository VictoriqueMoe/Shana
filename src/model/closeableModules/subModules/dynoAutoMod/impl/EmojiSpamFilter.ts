import {AbstractFilter} from "../AbstractFilter";
import {ACTION} from "../../../../../enums/ACTION";
import {Message} from "discord.js";
import {InjectDynoSubModule} from "../../../../decorators/InjectDynoSubModule";
import {PRIORITY} from "../../../../../enums/PRIORITY";
import {DynoAutoMod} from "../../../../../managedEvents/messageEvents/closeableModules/DynoAutoMod";
import {DiscordUtils} from "../../../../../utils/Utils";
import {IValueBackedDynoAutoModFilter} from "../IValueBackedDynoAutoModFilter";

@InjectDynoSubModule(DynoAutoMod)
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

    public async postProcess(message: Message): Promise<void> {
        await super.postToLog("Too many emojis", message);
    }
}