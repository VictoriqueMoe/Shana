import * as schedule from 'node-schedule';
import {isValidCron} from 'cron-validator';
import {CronException, ObjectUtil} from '../../../utils/Utils';
import {IScheduledJob} from "./ScheduledJob/IScheduledJob";
import {ScheduledJob} from "./ScheduledJob/impl/ScheduledJob";
import {singleton} from "tsyringe";
import {IScheduler} from "../Scheduler";

@singleton()
export class Scheduler implements IScheduler {

    protected _jobs: IScheduledJob[] = [];

    get jobs(): IScheduledJob[] {
        return this._jobs;
    }

    protected set jobs(jobs: IScheduledJob[]) {
        this._jobs = jobs;
    }

    /**
     * Execute this function at a given date or cron time
     * @param name
     * @param whenToExecute
     * @param callBack
     * @param guildId
     * @param additionalArgs
     */
    public register(name: string, whenToExecute: string | Date, callBack: () => void, guildId: string, additionalArgs: Record<string, any>): IScheduledJob {
        if (this.getJob(name)) {
            this.cancelJob(name);
        }
        if (typeof whenToExecute === "string" && !isValidCron(whenToExecute, {
            seconds: true,
            allowBlankDay: true
        })) {
            throw new CronException("cron is not valid");
        }

        console.log(`Register schedule "${name}"`);
        const job = schedule.scheduleJob(name, whenToExecute, callBack);
        const sJob = this.registerJob(name, job, whenToExecute, guildId, additionalArgs);
        this.jobs.push(sJob);
        return sJob;
    }

    public getJob(name: string): IScheduledJob {
        return this.jobs.find(j => j.name === name);
    }

    public cancelJob(name: string): boolean {
        const j = this.getJob(name);
        if (j == null) {
            return false;
        }
        console.log(`job "${name}" has been cancelled`);
        const jobObj = j.job;
        const b = jobObj.cancel();
        ObjectUtil.removeObjectFromArray(j, this.jobs);
        return b;
    }

    public cancelAllJobs(): void {
        this.jobs.forEach(scheduledMessage => this.cancelJob(scheduledMessage.name));
        this.jobs = [];
    }

    protected registerJob(name: string, job: schedule.Job, cron: string | Date, guildId: string, additionalArgs?: Record<string, any>): IScheduledJob {
        return new ScheduledJob(name, job, cron, guildId);
    }
}


