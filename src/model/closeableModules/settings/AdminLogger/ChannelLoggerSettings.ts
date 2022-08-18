import type {LoggerSettings} from "./LoggerSettings.js";

export interface ChannelLoggerSettings extends LoggerSettings {
    channelCreated: boolean,
    channelDelete: boolean,
    channelUpdate: boolean,
    threadCreate: boolean,
    threadDelete: boolean,
    threadUpdate: boolean
}
