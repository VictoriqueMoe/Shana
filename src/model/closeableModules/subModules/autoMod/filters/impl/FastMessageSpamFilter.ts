import {Message} from "discord.js";
import {ObjectUtil} from "../../../../../../utils/Utils.js";
import {AbstractValueBackedBulkDeleteAwareFilter} from "../AbstractValueBackedBulkDeleteAwareFilter.js";

export class FastMessageSpamFilter extends AbstractValueBackedBulkDeleteAwareFilter<number> {

    public constructor() {
        super(5000);
    }

    public get defaultValue(): number {
        return 5;
    }

    public get id(): string {
        return "Fast Message Spam Filter";
    }

    /**
     * How many messages they are allowed to send in 5 seconds
     */
    public unMarshalData(data: string): number {
        return Number.parseInt(data);
    }

    public override doFilter(content: Message): Promise<boolean> {
        if (!ObjectUtil.validString(content.content)) {
            return Promise.resolve(true);
        }
        return super.doFilter(content);
    }

    public override async postProcess(message: Message): Promise<void> {
        await super.postProcess(message);
        await super.postToLog("Message spam", message);
    }
}
