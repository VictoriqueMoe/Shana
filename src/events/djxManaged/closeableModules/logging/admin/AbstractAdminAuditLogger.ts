import {EmbedBuilder, Message} from "discord.js";
import {CloseableModule} from "../../../../../model/closeableModules/impl/CloseableModule.js";
import {LogChannelManager} from "../../../../../model/framework/manager/LogChannelManager.js";
import {container} from "tsyringe";
import type {AdminAuditLogSettings} from "../../../../../model/closeableModules/settings/AdminAuditLogSettings.js";
import {AuditManager} from "../../../../../model/framework/manager/AuditManager.js";
import {Client} from "discordx";
import {GuildInfoChangeManager} from "../../../../../model/framework/manager/GuildInfoChangeManager.js";

export abstract class AbstractAdminAuditLogger extends CloseableModule<AdminAuditLogSettings> {
    protected readonly _auditManager: AuditManager;
    protected readonly _guildInfoChangeManager: GuildInfoChangeManager;
    private readonly _logManager: LogChannelManager;

    public constructor() {
        super();
        this._logManager = container.resolve(LogChannelManager);
        this._auditManager = container.resolve(AuditManager);
        this._guildInfoChangeManager = container.resolve(GuildInfoChangeManager);
    }

    public get moduleId(): string {
        return "AdminLog";
    }

    protected postToLog(content: EmbedBuilder | string, guildId: string): Promise<Message> {
        if (content instanceof EmbedBuilder) {
            return this._logManager.postToLog([content], guildId, true);
        }
        return this._logManager.postToLog(content, guildId, true);
    }

    protected getGuildIconUrl(guildId: string): string {
        const client = container.resolve(Client);
        const guild = client.guilds.cache.get(guildId);
        return guild.iconURL();
    }

    protected getGuildName(guildId: string): string {
        const client = container.resolve(Client);
        const guild = client.guilds.cache.get(guildId);
        return guild.name;
    }
}
