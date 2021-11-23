import {IScheduledJob} from "./IScheduledJob.js";
import {GuildChannel} from "discord.js";

export interface IScheduledMessageJob extends IScheduledJob {
    readonly channel: GuildChannel;
    readonly message: string;
}