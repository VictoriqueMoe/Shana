import {Scheduler} from "./Scheduler";
import {IScheduledMessageJob} from "../IScheduledMessageJob";
import * as schedule from 'node-schedule';
import {GuildChannel} from "discord.js";
import {ScheduledMessageJob} from "../../Impl/ScheduledMessageJob";

export class MessageScheduler extends Scheduler {

    private channel: GuildChannel = null;

    protected constructor() {
        super();
    }

    protected _jobs: IScheduledMessageJob[] = [];

    // @ts-ignore
    public get jobs(): IScheduledMessageJob[] {
        return this._jobs;
    }

    // @ts-ignore
    protected set jobs(jobs: IScheduledMessageJob[]) {
        this._jobs = jobs;
    }

    public static getInstance(): MessageScheduler {
        return super.getInstance() as MessageScheduler;
    }

    public register(name: string, chron: string, callBack: () => void, channel?: GuildChannel): IScheduledMessageJob {
        this.channel = channel;
        return super.register(name, chron, callBack) as IScheduledMessageJob;
    }

    protected registerJob(name: string, job: schedule.Job): IScheduledMessageJob {
        return new ScheduledMessageJob(name, job, this.channel);
    }

}