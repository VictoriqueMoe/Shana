import {AbstractFilter} from "../AbstractFilter.js";
import {Message} from "discord.js";
import {ObjectUtil} from "../../../../../utils/Utils.js";
import {singleton} from "tsyringe";
import type ACTION from "../../../../../enums/ACTION.js";
import PRIORITY from "../../../../../enums/PRIORITY.js";

@singleton()
export class AllCapsFilter extends AbstractFilter {

    public get actions(): ACTION[] {
        return [];
    }

    public get id(): string {
        return "All Caps Filter";
    }

    public get isActive(): boolean {
        return false;
    }

    public get priority(): number {
        return PRIORITY.LAST;
    }

    public get warnMessage(): string {
        return "Your message contains too many caps";
    }

    public async doFilter(content: Message): Promise<boolean> {
        return ObjectUtil.getAmountOfCapsAsPercentage(content.content) < 70;
    }

    public async postProcess(message: Message): Promise<void> {
        await super.postToLog("Too many caps", message);
    }
}
