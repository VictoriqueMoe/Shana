import {IScheduledJob} from "../IScheduledJob";
import * as schedule from "node-schedule";

export class ScheduledJob implements IScheduledJob {
    constructor(private _name: string, private _job: schedule.Job) {
    }

    get name(): string {
        return this._name;
    }

    get job(): schedule.Job {
        return this._job;
    }
}