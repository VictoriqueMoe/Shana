import type {LoggerSettings} from "./LoggerSettings.js";

export interface GuildLoggerSettings extends LoggerSettings {
    guildUpdate: boolean;
}
