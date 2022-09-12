import {AbstractFilter} from "../AbstractFilter.js";
import {Message} from "discord.js";
import {ObjectUtil} from "../../../../../../utils/Utils.js";

export class AllCapsFilter extends AbstractFilter {

    public get id(): string {
        return "All Caps Filter";
    }

    public doFilter(content: Message): boolean {
        return ObjectUtil.getAmountOfCapsAsPercentage(content.content) < 70;
    }

    public async postProcess(message: Message): Promise<void> {
        await super.postToLog("Too many caps", message);
    }
}
