import {Message} from "discord.js";
import {ObjectUtil} from "../../../../../../utils/Utils.js";
import {AbstractValueBackedBulkDeleteAwareFilter} from "../AbstractValueBackedBulkDeleteAwareFilter.js";

export class LinkCooldownFilter extends AbstractValueBackedBulkDeleteAwareFilter<number> {

    public constructor() {
        super(5000);
    }

    public get defaultValue(): number {
        return 3;
    }

    public get id(): string {
        return "Link Cooldown Filter";
    }

    /**
     * how many links in 5 seconds
     */
    public unMarshalData(data: string): number {
        return Number.parseInt(data);
    }

    public override doFilter(content: Message): Promise<boolean> {
        const messageContent = content.content;
        if (!ObjectUtil.validString(messageContent)) {
            return Promise.resolve(true);
        }
        const urls = ObjectUtil.getUrls(messageContent);
        if (urls && urls.size > 0) {
            return super.doFilter(content);
        }
        return Promise.resolve(true);
    }

    public override async postProcess(message: Message): Promise<void> {
        await super.postProcess(message);
    }
}
