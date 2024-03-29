import {AbstractFilter} from "../AbstractFilter.js";
import {Message} from "discord.js";

export class SpoilersFilter extends AbstractFilter {

    public get id(): string {
        return "Spoilers Filter";
    }

    public doFilter(content: Message): boolean {
        const regex = /\|{2}(.*)\|{2}/gmu;
        const messageContent = content.content;
        if (regex.test(messageContent)) {
            return false;
        }
        const attachmentsCollection = content.attachments;
        if (attachmentsCollection.size > 0) {
            for (const [, attachment] of attachmentsCollection) {
                if (attachment.spoiler) {
                    return false;
                }
            }
        }
        return true;
    }
}
