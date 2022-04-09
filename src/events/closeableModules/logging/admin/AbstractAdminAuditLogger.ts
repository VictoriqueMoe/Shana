import {CloseableModule} from "../../../../model/closeableModules/impl/CloseableModule";
import {CloseOptionModel} from "../../../../model/DB/entities/autoMod/impl/CloseOption.model";
import {Message, MessageEmbed} from "discord.js";
import {DiscordUtils} from "../../../../utils/Utils";

export abstract class AbstractAdminAuditLogger extends CloseableModule<null> {

    public constructor() {
        super(CloseOptionModel);
    }

    public get moduleId(): string {
        return "AdminLog";
    }

    protected postToLog(content: MessageEmbed | string, guildId: string): Promise<Message> {
        if (content instanceof MessageEmbed) {
            return DiscordUtils.postToLog([content], guildId, true);
        }
        return DiscordUtils.postToLog(content, guildId, true);
    }
}
