import {ModuleSettings} from "./ModuleSettings.js";

export interface ModAuditLogSettings extends ModuleSettings {

    /**
     * Log a member when they joins
     */
    memberJoined?: boolean,

    /**
     * Log when the member is muted*
     */
    memberMuted?: boolean,

    /**
     * Log a member when they leave
     */
    memberLeaves?: boolean,

    /**
     * Log a member when they are banned
     */
    memberBanned?: boolean,


    /**
     * Log a member when they are kicked
     */
    memberKicked?: boolean,
}
