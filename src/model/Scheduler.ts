import * as schedule from 'node-schedule';
import {isValidCron} from 'cron-validator';
import {ChronException, ObjectUtil} from '../utils/Utils';
import {IScheduledJob} from "./IScheduledJob";
import {ScheduledMessage} from "./Impl/ScheduledMessage";

//TODO: possibly make this abstract or refactor using generics
export class Scheduler {

    protected static instance: Scheduler;

    public constructor() {
    }

    protected _jobs: IScheduledJob[] = [];

    public static getInstance(): Scheduler {
        if (!Scheduler.instance) {
            Scheduler.instance = new this();
        }

        return Scheduler.instance;
    }

    public register(name: string, chron: string, callBack: () => void): schedule.Job {
        if (this._jobs.find(j => j.name === name) != null) {
            this.cancelJob(name);
        }
        if (!isValidCron(chron, {
            seconds: true,
            allowBlankDay: true
        })) {
            throw new ChronException("Chron is not valid");
        }
        console.log(`Register function ${name}`);
        let job = schedule.scheduleJob(name, chron, callBack);
        this._jobs.push(this.registerJob(name, job));
        return job;
    }

    protected registerJob(name: string, job: schedule.Job): IScheduledJob {
        return new ScheduledMessage(name, job);
    }

    public getJob(name: string): schedule.Job {
        return this._jobs.find(j => j.name === name)?.job;
    }

    public get jobs(): IScheduledJob[] {
        return this._jobs;
    }

    public cancelJob(name: string): boolean {
        let j = this._jobs.find(j => j.name === name);
        if (j == null) {
            return false;
        }
        console.log(`job ${name} has been cancelled`);
        let jobObj = j.job;
        let b = jobObj.cancel();
        ObjectUtil.removeObjectFromArray(j, this._jobs);
        return b;
    }

    public cancelAllJobs(): void {
        this._jobs.forEach(scheduledMessage => scheduledMessage.job.cancel());
        this._jobs = [];
    }
}


