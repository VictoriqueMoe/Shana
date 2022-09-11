import ACTION from "../../../../../enums/ACTION.js";
import {EmbedBuilder, Message} from "discord.js";
import {ObjectUtil} from "../../../../../utils/Utils.js";
import {LogChannelManager} from "../../../../framework/manager/LogChannelManager.js";
import {container, delay} from "tsyringe";
import {FilterModuleManager} from "../../../../framework/manager/FilterModuleManager.js";
import type {IAutoModFilter} from "./IAutoModFilter.js";

export abstract class AbstractFilter implements IAutoModFilter {

    public abstract readonly id: string;
    protected readonly _filterManager: FilterModuleManager;
    private readonly _logManager: LogChannelManager;

    public constructor() {
        this._logManager = container.resolve(LogChannelManager);
        this._filterManager = container.resolve(delay(() => FilterModuleManager));
    }

    public get parentModuleId(): string {
        return "AutoMod";
    }

    public actions(guildId: string): Promise<ACTION[]> {
        return this._filterManager.getSetting(guildId, this).then(setting => setting.actions.map(action => Number.parseInt(action as unknown as string)));
    }

    public warnMessage(guildId: string): Promise<string> {
        return this._filterManager.getSetting(guildId, this).then(setting => setting.warnMessage);
    }

    public priority(guildId: string): Promise<number> {
        return this._filterManager.getSetting(guildId, this).then(setting => setting.priority);
    }

    public terminalViolationTimeout(guildId: string): Promise<number> {
        return this._filterManager.getSetting(guildId, this).then(setting => setting.terminalViolationTimeout);
    }

    public autoTerminalViolationCount(guildId: string): Promise<number> {
        return this._filterManager.getSetting(guildId, this).then(setting => setting.autoTerminalViolationCount);
    }

    public autoMuteTimeout(guildId: string): Promise<number> {
        return this._filterManager.getSetting(guildId, this).then(setting => setting.autoMuteTimeout);
    }

    public isActive(guildId: string): Promise<boolean> {
        return this._filterManager.getSetting(guildId, this).then(setting => setting.isActive);
    }

    public abstract postProcess(member: Message): Promise<void>;

    public abstract doFilter(content: Message): Promise<boolean>;

    protected async postToLog(reason: string, message: Message): Promise<Message | null> {
        const guildId = message.guild.id;
        if (!(await this.actions(guildId)).includes(ACTION.DELETE) || !message.member.user) {
            return null;
        }
        const {member} = message;
        const avatarUrl = member.user.displayAvatarURL({size: 1024});
        const embed = new EmbedBuilder()
            .setColor(member.roles.highest.hexColor)
            .setAuthor({
                url: avatarUrl,
                name: member.user.tag
            })
            .setThumbnail(avatarUrl)
            .setTimestamp()
            .setDescription(`**Message sent by <@${member.id}> deleted in <#${message.channel.id}>** \n ${message.content}`)
            .addFields(ObjectUtil.singleFieldBuilder("Reason", reason))
            .setFooter({
                text: `${member.user.id}`
            });
        return this._logManager.postToLog([embed], guildId, false);
    }
}