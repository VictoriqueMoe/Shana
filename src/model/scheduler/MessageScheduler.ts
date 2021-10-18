import {BaseGuildTextChannel} from "discord.js";
import {IScheduledMessageJob} from "./impl/ScheduledJob/IScheduledMessageJob";
import {IScheduler} from "./Scheduler";

export interface IMessageScheduler extends IScheduler {

    /**
     * Register a message to be posted on a channel
     * @param name - name of this Schedule
     * @param cron - the cron used to define when this should be posted
     * @param proxy - the method called when the cron is triggered, leave null to default this to simply post on a channel
     * @param channel - the channel to post to
     * @param message - the message to post
     */
    register(name: string, cron: string, proxy?: () => void, channel?: BaseGuildTextChannel, message?: string): IScheduledMessageJob;
}