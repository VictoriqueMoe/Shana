import {Message} from "discord.js";
import {AbstractValueBackedBulkDeleteAwareFilter} from "../AbstractValueBackedBulkDeleteAwareFilter.js";

export class ImageSpamFilter extends AbstractValueBackedBulkDeleteAwareFilter {

    public constructor() {
        super(10000);
    }

    public get defaultValue(): number {
        return 4;
    }

    public get id(): string {
        return "Image Spam Filter";
    }

    /**
     * How many images are allowed at once in the space of 10 seconds
     */
    public unMarshalData(data: string): number {
        return Number.parseInt(data);
    }

    public override doFilter(content: Message): Promise<boolean> {
        const attachments = content.attachments;
        if (attachments.size === 0) {
            return Promise.resolve(true);
        }
        return super.doFilter(content);
    }
}
