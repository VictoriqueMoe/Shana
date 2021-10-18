import {IScheduledMessageJob} from "./ScheduledJob/IScheduledMessageJob";
import * as schedule from 'node-schedule';
import {BaseGuildTextChannel} from "discord.js";
import {ScheduledMessageJob} from "./ScheduledJob/impl/ScheduledMessageJob";
import {singleton} from "tsyringe";
import {IMessageScheduler} from "../MessageScheduler";
import {Scheduler} from "./Scheduler";
import {ObjectUtil} from "../../../utils/Utils";

@singleton()
export class MessageScheduler extends Scheduler implements IMessageScheduler {

    protected override _jobs: IScheduledMessageJob[] = [];

    public override get jobs(): IScheduledMessageJob[] {
        return this._jobs;
    }

    protected override set jobs(jobs: IScheduledMessageJob[]) {
        this._jobs = jobs;
    }


    public override register(name: string, cron: string, proxy?: () => void, channel?: BaseGuildTextChannel, message?: string): IScheduledMessageJob {
        if (!ObjectUtil.isValidObject(channel)) {
            throw new Error("Message Scheduler requires a channel to send on");
        }
        if (typeof proxy !== "function") {
            proxy = (): void => {
                channel.send({
                    content: message
                }).catch(error => {
                    console.error(error);
                });
            };
        }
        if (!ObjectUtil.validString(message)) {
            throw new Error("Message Scheduler requires a message to send");
        }
        return super.register(name, cron, proxy, {
            channel,
            message
        }) as IScheduledMessageJob;
    }

    protected override registerJob(name: string, job: schedule.Job, cron: string | Date, {
        channel,
        message
    }: { channel: BaseGuildTextChannel, message: string }): IScheduledMessageJob {
        return new ScheduledMessageJob(name, job, cron, channel, message);
    }

}