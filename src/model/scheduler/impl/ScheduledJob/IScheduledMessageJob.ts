import {IScheduledJob} from "./IScheduledJob";
import {GuildChannel} from "discord.js";

export interface IScheduledMessageJob extends IScheduledJob {
    readonly channel: GuildChannel;
    readonly message: string;
    readonly guildId: string;
}