import {BaseGuildTextChannel} from "discord.js";
import {IScheduledMessageJob} from "./impl/ScheduledJob/IScheduledMessageJob";
import {IScheduler} from "./Scheduler";

export interface IMessageScheduler extends IScheduler {

    /**
     * The channel for this schedule
     */
    channel: BaseGuildTextChannel;

    jobs: IScheduledMessageJob[];

    register(name: string, cron: string, callBack: () => void, channel?: BaseGuildTextChannel): IScheduledMessageJob;

}