import {CloseableModule} from "../../../../model/closeableModules/impl/CloseableModule";
import {CloseOptionModel} from "../../../../model/DB/autoMod/impl/CloseOption.model";
import {Message, MessageEmbed} from "discord.js";
import {DiscordUtils} from "../../../../utils/Utils";

export abstract class AbstractAdminAuditLogger extends CloseableModule {

    protected constructor(uid: string) {
        super(CloseOptionModel, uid);
    }

    public get isDynoReplacement(): boolean {
        return true;
    }

    public get moduleId(): string {
        return "AdminLog";
    }

    protected postToLog(content: MessageEmbed | string): Promise<Message> {
        return DiscordUtils.postToLog(content, true);
    }
}