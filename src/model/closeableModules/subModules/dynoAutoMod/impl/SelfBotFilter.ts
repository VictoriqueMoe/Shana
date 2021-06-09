import {AbstractFilter} from "../AbstractFilter";
import {ACTION} from "../../../../../enums/ACTION";
import {Message} from "discord.js";
import {InjectDynoSubModule} from "../../../../decorators/InjectDynoSubModule";
import {PRIORITY} from "../../../../../enums/PRIORITY";
import {DynoAutoMod} from "../../../../../events/closeableModules/DynoAutoMod";

@InjectDynoSubModule(DynoAutoMod)
export class SelfBotFilter extends AbstractFilter {

    public get actions(): ACTION[] {
        return [ACTION.DELETE, ACTION.WARN, ACTION.MUTE];
    }

    public get isActive(): boolean {
        return false;
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
        return `Rich embeds are only allowed from bots, This smells like a self embed, please stop`;
    }

    public get priority(): number {
        return PRIORITY.LAST;
    }

    public async postProcess(message: Message): Promise<void> {
        await super.postToLog("Self bot detection", message);
    }
}