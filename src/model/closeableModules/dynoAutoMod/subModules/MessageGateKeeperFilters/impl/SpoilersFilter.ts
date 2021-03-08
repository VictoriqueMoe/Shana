import {InjectDynoSubModule} from "../../../../../decorators/InjectDynoSubModule";
import {MessageGateKeeper} from "../../../../../../events/closeableModules/MessageGateKeeper";
import {AbstractFilter} from "../AbstractFilter";
import {ACTION} from "../../../../../../enums/ACTION";
import {Message} from "discord.js";
import {PRIORITY} from "../../../../../../enums/PRIORITY";

@InjectDynoSubModule(MessageGateKeeper)
export class SpoilersFilter extends AbstractFilter {

    public get actions(): ACTION[] {
        return [ACTION.DELETE, ACTION.WARN];
    }

    public get isActive(): boolean {
        return true;
    }

    public doFilter(content: Message): boolean {
        const regex = new RegExp(/\|\|/, "g");
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


    public get id(): string {
        return "Spoilers Filter";
    }

    public get warnMessage(): string {
        return `No Spoilers allowed`;
    }

    public get priority(): number {
        return PRIORITY.LAST;
    }
}