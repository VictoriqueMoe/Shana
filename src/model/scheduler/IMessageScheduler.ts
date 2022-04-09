import {BaseGuildTextChannel} from "discord.js";
import {IScheduledMessageJob} from "./impl/ScheduledJob/IScheduledMessageJob";
import {JobCallback} from "node-schedule";
import {IScheduler} from "./IScheduler";

export interface IMessageScheduler extends IScheduler {

    /**
     * Register a message to be posted on a channel
     * @param name - name of this Schedule
     * @param cron - the cron used to define when this should be posted
     * @param proxy - the method called when the cron is triggered, leave null to default this to simply post on a channel
     * @param guildId - will be derived from the channel id unless stated otherwise
     * @param channel - the channel to post to
     * @param message - the message to post
     */
    register(name: string, cron: string, proxy?: JobCallback, guildId?: string, channel?: BaseGuildTextChannel, message?: string): IScheduledMessageJob;
}
