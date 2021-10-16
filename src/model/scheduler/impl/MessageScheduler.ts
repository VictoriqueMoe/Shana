import {IScheduledMessageJob} from "./ScheduledJob/IScheduledMessageJob";
import * as schedule from 'node-schedule';
import {BaseGuildTextChannel} from "discord.js";
import {ScheduledMessageJob} from "./ScheduledJob/impl/ScheduledMessageJob";
import {singleton} from "tsyringe";
import {IMessageScheduler} from "../MessageScheduler";
import {Scheduler} from "./Scheduler";

@singleton()
export class MessageScheduler extends Scheduler implements IMessageScheduler {

    private _channel: BaseGuildTextChannel = null;

    public get channel(): BaseGuildTextChannel {
        return this._channel;
    }

    protected override _jobs: IScheduledMessageJob[] = [];

    public override get jobs(): IScheduledMessageJob[] {
        return this._jobs;
    }

    protected override set jobs(jobs: IScheduledMessageJob[]) {
        this._jobs = jobs;
    }

    public override register(name: string, cron: string, callBack: () => void, channel?: BaseGuildTextChannel): IScheduledMessageJob {
        this._channel = channel;
        return super.register(name, cron, callBack) as IScheduledMessageJob;
    }

    protected override registerJob(name: string, job: schedule.Job): IScheduledMessageJob {
        return new ScheduledMessageJob(name, job, this.channel);
    }

}