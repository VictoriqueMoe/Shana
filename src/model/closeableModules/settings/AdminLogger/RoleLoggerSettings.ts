import {LoggerSettings} from "./LoggerSettings.js";

export interface RoleLoggerSettings extends LoggerSettings {
    roleGiven: boolean,
    roleUpdated: boolean,
    roleCreated: boolean,
    roleDeleted: boolean
}
