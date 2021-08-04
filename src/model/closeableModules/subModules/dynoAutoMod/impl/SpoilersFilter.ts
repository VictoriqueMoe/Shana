import {AbstractFilter} from "../AbstractFilter";
import {ACTION} from "../../../../../enums/ACTION";
import {Message} from "discord.js";
import {InjectDynoSubModule} from "../../../../decorators/InjectDynoSubModule";
import {PRIORITY} from "../../../../../enums/PRIORITY";
import {DynoAutoMod} from "../../../../../managedEvents/messageEvents/closeableModules/DynoAutoMod";

@InjectDynoSubModule(DynoAutoMod)
export class SpoilersFilter extends AbstractFilter {

    public get actions(): ACTION[] {
        return [ACTION.DELETE, ACTION.WARN];
    }

    public get isActive(): boolean {
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

    public async doFilter(content: Message): Promise<boolean> {
        const regex = /\|{2}(.*)\|{2}/gm;
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

    public async postProcess(message: Message): Promise<void> {
        await super.postToLog("Spoilers", message);
    }
}