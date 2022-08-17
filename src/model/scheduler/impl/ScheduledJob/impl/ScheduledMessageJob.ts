import schedule from "node-schedule";
import type {GuildChannel} from "discord.js";
import {ScheduledJob} from "./ScheduledJob.js";
import type {IScheduledMessageJob} from "../IScheduledMessageJob.js";

export class ScheduledMessageJob extends ScheduledJob implements IScheduledMessageJob {
    public constructor(_name: string, _job: schedule.Job, _cron: string | Date, private _channel: GuildChannel, private _message: string) {
        super(_name, _job, _cron, _channel.guildId);
    }

    public get channel(): GuildChannel {
        return this._channel;
    }

    public get message(): string {
        return this._message;
    }
}
