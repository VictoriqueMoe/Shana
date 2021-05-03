import {InjectDynoSubModule} from "../../../../decorators/InjectDynoSubModule";
import {DynoAutoMod} from "../../../../../events/closeableModules/DynoAutoMod";
import {AbstractFilter} from "../AbstractFilter";
import {ACTION} from "../../../../../enums/ACTION";
import {PRIORITY} from "../../../../../enums/PRIORITY";
import {Message} from "discord.js";
import {ObjectUtil} from "../../../../../utils/Utils";

@InjectDynoSubModule(DynoAutoMod)
export class ZalgoTextFilter extends AbstractFilter {

    public get actions(): ACTION[] {
        return [];
    }

    public get id(): string {
        return "Zalgo Text Filter";
    }

    public get isActive(): boolean {
        return false;
    }

    public get priority(): number {
        return PRIORITY.LAST;
    }

    public get warnMessage(): string {
        return "Zalgo is not allowed on this server";
    }

    public doFilter(content: Message): boolean {
        const message = content.content;
        if (!ObjectUtil.validString(message)) {
            return true;
        }
        return !this.hasZalgo(message);
    }

    private hasZalgo(txt: string): boolean {
        const re = /%CC%/g;
        return re.test(encodeURIComponent(txt));
    }
}