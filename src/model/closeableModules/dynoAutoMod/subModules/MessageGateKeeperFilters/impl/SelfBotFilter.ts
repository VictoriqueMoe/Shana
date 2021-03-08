import {InjectDynoSubModule} from "../../../../../decorators/InjectDynoSubModule";
import {MessageGateKeeper} from "../../../../../../events/closeableModules/MessageGateKeeper";
import {AbstractFilter} from "../AbstractFilter";
import {ACTION} from "../../../../../../enums/ACTION";
import {Message} from "discord.js";
import {PRIORITY} from "../../../../../../enums/PRIORITY";

@InjectDynoSubModule(MessageGateKeeper)
export class SelfBotFilter extends AbstractFilter {

    public get actions(): ACTION[] {
        return [ACTION.DELETE, ACTION.WARN, ACTION.MUTE];
    }

    public get isActive(): boolean {
        return true;
    }

    public doFilter(content: Message): boolean {
        const embeds = content.embeds;
        for (const embed of embeds) {
            if (embed.type === "rich") {
                return false;
            }
        }
        return true;
    }


    public get id(): string {
        return "Self Bot Detection";
    }

    public get warnMessage(): string {
        return `Ritch embeds are only allowed from bots, This smells like a self embed, please stop`;
    }

    public get priority(): number {
        return PRIORITY.LAST;
    }
}