import {ScheduledJob} from "./ScheduledJob";
import * as schedule from "node-schedule";
import {GuildChannel} from "discord.js";
import {IScheduledMessageJob} from "../IScheduledMessageJob";

export class ScheduledMessageJob extends ScheduledJob implements IScheduledMessageJob {
    constructor(_name: string, _job: schedule.Job, private _channel: GuildChannel, private _message: string) {
        super(_name, _job);
    }

    public get channel(): GuildChannel {
        return this._channel;
    }

    public get guildId(): string {
        return this.channel.guildId;
    }

    public get message(): string {
        return this._message;
    }
}