import {AbstractFilter} from "../AbstractFilter";
import {Message} from "discord.js";
import {ACTION} from "../../../../../../enums/ACTION";
import {InjectDynoSubModule} from "../../../../../decorators/InjectDynoSubModule";
import {ObjectUtil} from "../../../../../../utils/Utils";
import {PRIORITY} from "../../../../../../enums/PRIORITY";
import {MessageGateKeeper} from "../../../../../../events/closeableModules/MessageGateKeeper";

@InjectDynoSubModule(MessageGateKeeper)
export class AllCapsFilter extends AbstractFilter {

    public get actions(): ACTION[] {
        return [ACTION.WARN];
    }

    public get id(): string {
        return "All Caps Filter";
    }

    public get isActive(): boolean {
        return true;
    }

    public get priority(): number {
        return PRIORITY.LAST;
    }

    public get warnMessage(): string {
        return "Your message contains too many caps";
    }

    public doFilter(content: Message): boolean {
         return ObjectUtil.getAmountOfCapsAsPercentage(content.content) <= 70;
    }
}