import {AbstractFilter} from "../AbstractFilter.js";
import {Message} from "discord.js";
import {ObjectUtil} from "../../../../../utils/Utils.js";
import {singleton} from "tsyringe";

@singleton()
export class AllCapsFilter extends AbstractFilter {

    public get id(): string {
        return "All Caps Filter";
    }

    public doFilter(content: Message): Promise<boolean> {
        return Promise.resolve(ObjectUtil.getAmountOfCapsAsPercentage(content.content) < 70);
    }

    public async postProcess(message: Message): Promise<void> {
        await super.postToLog("Too many caps", message);
    }
}
