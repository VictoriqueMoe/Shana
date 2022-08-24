import {EmbedBuilder, Message} from "discord.js";
import {CloseableModule} from "../../../../../model/closeableModules/impl/CloseableModule.js";
import {LogChannelManager} from "../../../../../model/framework/manager/LogChannelManager.js";
import {container} from "tsyringe";
import {AuditManager} from "../../../../../model/framework/manager/AuditManager.js";
import {Client} from "discordx";
import {GuildInfoChangeManager} from "../../../../../model/framework/manager/GuildInfoChangeManager.js";
import type {LoggerSettings} from "../../../../../model/closeableModules/settings/AdminLogger/LoggerSettings.js";
import {Typeings} from "../../../../../model/Typeings.js";
import FileResolvable = Typeings.FileResolvable;

export abstract class AbstractAdminAuditLogger<T extends LoggerSettings> extends CloseableModule<T> {
    protected readonly _auditManager: AuditManager;
    protected readonly _guildInfoChangeManager: GuildInfoChangeManager;
    private readonly _logManager: LogChannelManager;

    public constructor() {
        super();
        this._logManager = container.resolve(LogChannelManager);
        this._auditManager = container.resolve(AuditManager);
        this._guildInfoChangeManager = container.resolve(GuildInfoChangeManager);
    }

    protected postToLog(content: EmbedBuilder | string, guildId: string, files: FileResolvable = []): Promise<Message> {
        if (content instanceof EmbedBuilder) {
            return this._logManager.postToLog([content], guildId, true, files);
        }
        return this._logManager.postToLog(content, guildId, true, files);
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

    protected async isEnabledInternal(guildId: string, logger: keyof T): Promise<boolean> {
        const moduleEnabled = await super.isEnabled(guildId);
        if (!moduleEnabled) {
            return false;
        }
        const settings = await this.getSettings(guildId, false);
        return settings[logger] as unknown as boolean ?? false;
    }
}
