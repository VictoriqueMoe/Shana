import type {LoggerSettings} from "./LoggerSettings.js";

export interface MemberLoggerSettings extends LoggerSettings {
    voiceChannelChanged: boolean,
    memberDetailsChanged: boolean,
    banRemoved: boolean,
    memberJoins: boolean,
    memberLeaves: boolean,
    memberBanned: boolean
}
