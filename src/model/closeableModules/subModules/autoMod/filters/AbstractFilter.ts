import ACTION from "../../../../../enums/ACTION.js";
import {Message} from "discord.js";
import {LogChannelManager} from "../../../../framework/manager/LogChannelManager.js";
import {container, delay} from "tsyringe";
import {FilterModuleManager} from "../../../../framework/manager/FilterModuleManager.js";
import type {IAutoModFilter} from "./IAutoModFilter.js";
import {Awaitable} from "discordx/build/esm/index.js";

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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public postProcess(member: Message): Promise<void> {
        return Promise.resolve();
    }

    public abstract doFilter(content: Message): Awaitable<boolean>;
}
