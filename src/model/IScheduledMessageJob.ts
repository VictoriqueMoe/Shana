import {IScheduledJob} from "./IScheduledJob";
import {GuildChannel} from "discord.js";

export interface IScheduledMessageJob extends IScheduledJob{
    readonly channel: GuildChannel;
}