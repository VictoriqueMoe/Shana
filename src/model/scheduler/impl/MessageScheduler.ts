import type {IScheduledMessageJob} from "./ScheduledJob/IScheduledMessageJob";
import type * as schedule from 'node-schedule';
import type {JobCallback} from 'node-schedule';
import type {BaseGuildTextChannel} from "discord.js";
import {ScheduledMessageJob} from "./ScheduledJob/impl/ScheduledMessageJob";
import {singleton} from "tsyringe";
import {Scheduler} from "./Scheduler";
import {ObjectUtil} from "../../../utils/Utils";
import type {IMessageScheduler} from "../IMessageScheduler";

@singleton()
export class MessageScheduler extends Scheduler implements IMessageScheduler {

    protected override _jobs: IScheduledMessageJob[] = [];

    public override get jobs(): IScheduledMessageJob[] {
        return this._jobs;
    }

    protected override set jobs(jobs: IScheduledMessageJob[]) {
        this._jobs = jobs;
    }


    public override register(name: string, cron: string, proxy?: JobCallback, guildId?: string, channel?: BaseGuildTextChannel, message?: string): IScheduledMessageJob {
        if (!ObjectUtil.isValidObject(channel)) {
            throw new Error("Message Scheduler requires a channel to send on");
        }
        if (!ObjectUtil.validString(guildId)) {
            guildId = channel.guildId;
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
        return super.register(name, cron, proxy, guildId, {
            channel,
            message
        }) as IScheduledMessageJob;
    }

    protected override registerJob(name: string, job: schedule.Job, cron: string | Date, guildId: string, {
        channel,
        message
    }: { channel: BaseGuildTextChannel, message: string }): IScheduledMessageJob {
        return new ScheduledMessageJob(name, job, cron, channel, message);
    }

}
