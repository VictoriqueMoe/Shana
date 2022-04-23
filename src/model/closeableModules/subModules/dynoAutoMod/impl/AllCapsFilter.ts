import {AbstractFilter} from "../AbstractFilter";
import type {ACTION} from "../../../../../enums/ACTION";
import type {Message} from "discord.js";
import {PRIORITY} from "../../../../../enums/PRIORITY";
import {ObjectUtil} from "../../../../../utils/Utils";
import {singleton} from "tsyringe";

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