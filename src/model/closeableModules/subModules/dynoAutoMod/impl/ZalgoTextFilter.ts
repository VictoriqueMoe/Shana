import {AbstractFilter} from "../AbstractFilter.js";
import {ACTION} from "../../../../../enums/ACTION.js";
import {PRIORITY} from "../../../../../enums/PRIORITY.js";
import {Message} from "discord.js";
import {ObjectUtil} from "../../../../../utils/Utils.js";
import {singleton} from "tsyringe";

@singleton()
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

    public async doFilter(content: Message): Promise<boolean> {
        const message = content.content;
        if (!ObjectUtil.validString(message)) {
            return true;
        }
        return !this.hasZalgo(message);
    }

    public async postProcess(message: Message): Promise<void> {
        await super.postToLog("Zalgo", message);
    }

    private hasZalgo(txt: string): boolean {
        const re = /%CC%/g;
        return re.test(encodeURIComponent(txt));
    }
}