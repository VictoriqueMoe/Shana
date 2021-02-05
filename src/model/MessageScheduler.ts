import {Scheduler} from "./Scheduler";
import {IScheduledMessageJob} from "./IScheduledMessageJob";
import * as schedule from 'node-schedule';
import {GuildChannel} from "discord.js";
import {ScheduledMessageJob} from "./Impl/ScheduledMessageJob";

export class MessageScheduler extends Scheduler {

    constructor() {
        super();
    }

    private channel: GuildChannel = null;

    public static getInstance(): MessageScheduler {
        return super.getInstance() as MessageScheduler;
    }

    public get jobs(): IScheduledMessageJob[] {
        return this._jobs as IScheduledMessageJob[];
    }

    public register(name: string, chron: string, callBack: () => void, channel?: GuildChannel): schedule.Job {
        this.channel = channel;
        return super.register(name, chron, callBack);
    }

    protected registerJob(name: string, job: schedule.Job): IScheduledMessageJob {
        return new ScheduledMessageJob(name, job, this.channel);
    }
}