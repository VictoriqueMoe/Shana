import type {LoggerSettings} from "./LoggerSettings.js";

export interface MessageLoggerSettings extends LoggerSettings {
    messageEdited: boolean,
    messageDeleted: boolean,
    bulkDelete: boolean
}
