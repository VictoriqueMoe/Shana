import {CloseableModule} from "../../../../model/closeableModules/impl/CloseableModule";
import {CloseOptionModel} from "../../../../model/DB/autoMod/impl/CloseOption.model";
import {GuildMember, Message, MessageEmbed} from "discord.js";
import {DiscordUtils, GuildUtils} from "../../../../utils/Utils";

export abstract class AbstractAdminAuditLogger extends CloseableModule<null> {

    public constructor() {
        super(CloseOptionModel);
    }

    public get moduleId(): string {
        return "AdminLog";
    }

    protected postToLog(content: MessageEmbed | string, guildId: string, trigger?: GuildMember): Promise<Message> {
        return this.canRun(guildId, trigger, null).then(canRun => {
            if (!canRun) {
                return;
            }
            if (trigger) {
                if (GuildUtils.isMemberAdmin(trigger)) {
                    return;
                }
            }
            if (content instanceof MessageEmbed) {
                return DiscordUtils.postToLog([content], guildId, true);
            }
            return DiscordUtils.postToLog(content, guildId, true);
        });
    }
}