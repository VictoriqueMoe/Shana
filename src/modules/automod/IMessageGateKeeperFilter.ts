import {ACTION} from "../../enums/ACTION";
import {Message} from "discord.js";

/**
 * all values hard coded for now, but will be persisted in the future
 */
export interface IMessageGateKeeperFilter {
    /**
     * Is this filter active
     */
    readonly isActive: boolean;

    /**
     * Get the actions that are done when this filter is violated
     */
    readonly actions: ACTION[];

    /**
     * filter ID
     */
    readonly id: string;

    /**
     * Message used to warn when action includes ACTION.WARN
     */
    readonly warnMessage:string

    /**
     * Do the actual filter and return true if it passes or false otherwise
     * @param content
     */
    doFilter(content: Message): boolean;
}