import type {GuildChannel} from "discord.js";
import type {IScheduledJob} from "./IScheduledJob.js";

export interface IScheduledMessageJob extends IScheduledJob {
    readonly channel: GuildChannel;
    readonly message: string;
}
