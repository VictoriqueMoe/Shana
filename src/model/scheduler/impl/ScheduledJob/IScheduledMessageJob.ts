import type {IScheduledJob} from "./IScheduledJob";
import type {GuildChannel} from "discord.js";

export interface IScheduledMessageJob extends IScheduledJob {
    readonly channel: GuildChannel;
    readonly message: string;
}