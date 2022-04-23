import type {Message} from "discord.js";
import type {ISubModule} from "../ISubModule";
import type {ACTION} from "../../../../enums/ACTION";

/**
 * all values hard coded for now, but will be persisted in the future
 */
export interface IDynoAutoModFilter extends ISubModule {
    /**
     * Get the actions that are done when this filter is violated
     */
    readonly actions: ACTION[];

    /**
     * Message used to warn when action includes ACTION.WARN
     */
    readonly warnMessage: string;

    /**
     * The priority of this filter, this will determine if this filter is applied before or after others
     */
    readonly priority: number;

    /**
     * this sets the amount of filters that define "terminal operation (mute, kick and ban)" as punishment that needs to fail before the action is automatically taken
     */
    autoTerminalViolationCount: number;

    /**
     * How long (in seconds) are members muted for if they violate "mute" filters according to the autoMuteViolationCount
     */
    autoMuteTimeout: number;

    /**
     * Do the actual filter and return true if it passes or false otherwise
     * @param content
     */
    doFilter(content: Message): Promise<boolean>;

    /**
     * Do any additional processing like posting to logs
     * @param member
     */
    postProcess(member: Message): Promise<void>;

}