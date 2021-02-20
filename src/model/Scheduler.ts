import * as schedule from 'node-schedule';
import {isValidCron} from 'cron-validator';
import {ChronException, ObjectUtil} from '../utils/Utils';
import {IScheduledJob} from "./IScheduledJob";
import {ScheduledMessage} from "./Impl/ScheduledMessage";

export class Scheduler {

    protected static instance: Scheduler;

    protected _jobs: IScheduledJob[] = [];

    public static getInstance(): Scheduler {
        if (!Scheduler.instance) {
            Scheduler.instance = new this();
        }

        return Scheduler.instance;
    }

    /**
     * Execute this function at a given date or chron time
     * @param name
     * @param whenToExecute
     * @param callBack
     */
    public register(name: string, whenToExecute: string | Date, callBack: () => void): IScheduledJob {
        if (this.jobs.find(j => j.name === name) != null) {
            this.cancelJob(name);
        }
        if (typeof whenToExecute === "string" && !isValidCron(whenToExecute, {
            seconds: true,
            allowBlankDay: true
        })) {
            throw new ChronException("Chron is not valid");
        }

        console.log(`Register function ${name}`);
        const job = schedule.scheduleJob(name, whenToExecute, callBack);
        const sJob = this.registerJob(name, job);
        this.jobs.push(sJob);
        return sJob;
    }

    protected registerJob(name: string, job: schedule.Job): IScheduledJob {
        return new ScheduledMessage(name, job);
    }

    public getJob(name: string): schedule.Job {
        return this.jobs.find(j => j.name === name)?.job;
    }

    // @ts-ignore
    public get jobs(): IScheduledJob[] {
        return this._jobs;
    }

    // @ts-ignore
    protected set jobs(jobs: IScheduledJob[]){
        this._jobs = jobs;
    }

    public cancelJob(name: string): boolean {
        const j = this.jobs.find(j => j.name === name);
        if (j == null) {
            return false;
        }
        console.log(`job ${name} has been cancelled`);
        const jobObj = j.job;
        const b = jobObj.cancel();
        ObjectUtil.removeObjectFromArray(j, this.jobs);
        return b;
    }

    public cancelAllJobs(): void {
        this.jobs.forEach(scheduledMessage => scheduledMessage.job.cancel());
        this.jobs = [];
    }
}


