import type {IScheduledJob} from "../IScheduledJob";
import type * as schedule from "node-schedule";

export class ScheduledJob implements IScheduledJob {
    constructor(private _name: string, private _job: schedule.Job, private _cron: string | Date, private _guildId: string) {
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