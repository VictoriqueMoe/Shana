import {ModuleSettings} from "./ModuleSettings";

export interface AutoRoleSettings extends ModuleSettings {

    /**
     * Minimum account age required in order to be allowed into this server, anyone under this account age will have the `YOUNG_ACCOUNT_ROLE` role applied
     */
    minAccountAge?: number,

    /**
     * Automatically jail members who had previously left the server while in jail and rejoined
     */
    autoJail?: boolean,

    /**
     * Automatically mute members who had previously left the server while muted  and rejoined
     */
    autoMute?: boolean,

    /**
     * If enabled, all members who join will automatically be allowed the 'YOUNG_ACCOUNT_ROLE'
     */
    panicMode?: boolean,

    /**
     * defines the threshold for members joining in 10 seconds before automatically enabling panicMode
     */
    massJoinProtection?: number
}