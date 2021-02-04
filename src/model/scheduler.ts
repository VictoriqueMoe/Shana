import * as schedule from 'node-schedule';
import * as cronValidator from 'cron-validator';
import { ChronException } from '../utils/ChronException';

export class Scheduler {
    private static instance: Scheduler;

    private constructor() {
    }

    private _map: Map<string, schedule.Job> = new Map();

    public static getInstance(): Scheduler {
        if (!Scheduler.instance) {
            Scheduler.instance = new Scheduler();
        }

        return Scheduler.instance;
    }

    public register(name: string, chron: string, callBack: () => void): schedule.Job {
        if (this._map.has(name)) {
            this.cancelJob(name);
        }
        if(!cronValidator.isValidCron(chron)){
            throw new ChronException("Chron is not valid");
        }
        console.log(`Register function ${name}`);
        let job = schedule.scheduleJob(name, chron, callBack);
        this._map.set(name, job);
        return job;
    }

    public getJob(name: string): schedule.Job {
        return this._map.get(name);
    }

    public get jobs(): schedule.Job[] {
        return [...this._map.values()];
    }

    public cancelJob(name: string): boolean {
        let j = this._map.get(name);
        if(j == null){
            return false;
        }
        let b = j.cancel();
        this._map.delete(name);
        return b;
    }

    public cancelAllJobs(): void {
        this.jobs.forEach(j => j.cancel());
        this._map.clear();
    }
}