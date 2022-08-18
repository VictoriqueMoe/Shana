import * as schedule from "node-schedule";
import {IScheduledJob} from "../IScheduledJob.js";

export class ScheduledJob implements IScheduledJob {
    public constructor(private _name: string, private _job: schedule.Job, private _cron: string | Date, private _guildId: string) {
    }

    public get name(): string {
        return this._name;
    }

    public get job(): schedule.Job {
        return this._job;
    }

    public get cron(): string | Date {
        return this._cron;
    }

    public get guildId(): string {
        return this._guildId;
    }
}
