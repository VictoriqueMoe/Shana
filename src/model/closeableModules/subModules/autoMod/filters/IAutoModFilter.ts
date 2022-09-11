import type {Message} from "discord.js";
import type {ISubModule, SubModuleSettings} from "../../ISubModule.js";
import type ACTION from "../../../../../enums/ACTION.js";


export type FilterSettings = SubModuleSettings & {
    actions?: ACTION[],
    warnMessage?: string,
    priority?: number,
    terminalViolationTimeout?: number,
    autoTerminalViolationCount?: number,
    autoMuteTimeout?: number
};

/**
 * A auto mod filter is a unit of code that a messages passes through and the message will pass or fail the filter depending on the unit of work that is applied to it
 */
export interface IAutoModFilter extends ISubModule {
    /**
     * Get the actions that are done when this filter is violated
     */
    actions(guildId: string): Promise<ACTION[]>;

    /**
     * Message used to warn when action includes ACTION.WARN
     */
    warnMessage(guildId: string): Promise<string>;

    /**
     * The priority of this filter, this will determine if this filter is applied before or after others
     */
    priority(guildId: string): Promise<number>;

    /**
     * How long to wait (in seconds) to cooldown the autoMuteViolationCount value
     * <br/><br/>
     * if autoTerminalViolationCount is set to 2 and this is set to 30 then each member will have 30 seconds to violate 2 terminal filters starting from the first violation. If a member violates ONE terminal filter and not another within 30 seconds, then the counter is reset to 0
     *
     */
    terminalViolationTimeout(guildId: string): Promise<number>;

    /**
     * this sets the amount of filters that define "terminal operation (mute, kick and ban)" as punishment that needs to fail before the action is automatically taken
     */
    autoTerminalViolationCount(guildId: string): Promise<number>;

    /**
     * How long (in seconds) are members muted for if they violate "mute" filters according to the autoMuteViolationCount
     */
    autoMuteTimeout(guildId: string): Promise<number>;

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
