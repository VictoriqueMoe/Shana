import {ModuleSettings} from "./ModuleSettings.js";

export interface AutoRoleSettings extends ModuleSettings {

    /**
     * The IDs of the role to apply after the `autoRoleTimeout`
     */
    role?: string[]

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

    /**
     * How long to wait before the autoRole is applied (ignored for unverfied and auto-jail/ato-mute)
     */
    autoRoleTimeout?: number;
}