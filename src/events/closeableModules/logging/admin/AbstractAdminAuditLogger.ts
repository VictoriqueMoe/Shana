import {CloseableModule} from "../../../../model/closeableModules/impl/CloseableModule";
import {CloseOptionModel} from "../../../../model/DB/autoMod/impl/CloseOption.model";
import {GuildMember, Message, MessageEmbed} from "discord.js";
import {DiscordUtils, GuildUtils} from "../../../../utils/Utils";

export abstract class AbstractAdminAuditLogger extends CloseableModule<null> {

    protected constructor(uid: string) {
        super(CloseOptionModel, uid);
    }

    public get isDynoReplacement(): boolean {
        return true;
    }

    public get moduleId(): string {
        return "AdminLog";
    }

    protected postToLog(content: MessageEmbed | string, guildId: string, trigger?: GuildMember): Promise<Message> {
        return this.isEnabled(guildId).then(isEnabled => {
            if (!isEnabled) {
                return;
            }
            if (trigger) {
                if (GuildUtils.isMemberAdmin(trigger)) {
                    return;
                }
            }
            return DiscordUtils.postToLog(content, guildId, true);
        });
    }
}