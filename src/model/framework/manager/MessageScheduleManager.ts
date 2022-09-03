import {MessageScheduleModel} from "../../DB/entities/guild/MessageSchedule.model.js";
import {singleton} from "tsyringe";
import {DbUtils, DiscordUtils, ObjectUtil} from "../../../utils/Utils.js";
import {BaseGuildTextChannel, GuildMember} from "discord.js";
import {PostConstruct} from "../decorators/PostConstruct.js";
import {DataSourceAware} from "../../DB/DAO/DataSourceAware.js";
import {MessageScheduler} from "../../scheduler/impl/MessageScheduler.js";
import type {IScheduledMessageJob} from "../../scheduler/impl/ScheduledJob/IScheduledMessageJob.js";
import {Client} from "discordx";
import logger from "../../../utils/LoggerFactory.js";

@singleton()
export class MessageScheduleManager extends DataSourceAware {

    public constructor(private _messageScheduler: MessageScheduler) {
        super();
    }

    public deleteMessageSchedule(guildId: string, name: string): Promise<boolean> {
        return this.ds.transaction(async entityManager => {
            const destroyResult = await entityManager.delete(MessageScheduleModel, {
                guildId,
                name
            });
            const didDestroy = destroyResult.affected == 1;
            const engineResponse = this._messageScheduler.cancelJob(name);
            return didDestroy && engineResponse;
        });

    }

    public getAllActiveMessageSchedules(guildId: string, channel?: BaseGuildTextChannel): IScheduledMessageJob[] {
        return this._messageScheduler.jobs.filter(job => {
            if (job.guildId !== guildId) {
                return false;
            }
            if (ObjectUtil.isValidObject(channel)) {
                return channel.id === job.channel.id;
            }
            return true;
        });
    }

    public async getOwner(schedule: IScheduledMessageJob): Promise<GuildMember> {
        const {guildId} = schedule;
        const guild = await DiscordUtils.getGuild(guildId);
        const model = await this.ds.getRepository(MessageScheduleModel).findOne({
            where: {
                guildId,
            }
        });
        return guild.members.fetch(model.userId);
    }

    public addMessageSchedule(guildId: string, channel: BaseGuildTextChannel, cron: string, message: string, user: GuildMember, name: string): Promise<IScheduledMessageJob> {
        const newMessageSchedule = DbUtils.build(MessageScheduleModel, {
            guildId,
            cron,
            message,
            name,
            channel,
            userId: user.id
        });
        return this.ds.getRepository(MessageScheduleModel).manager.transaction(async entityManager => {
            try {
                await entityManager.save(newMessageSchedule);
            } catch (e) {
                throw new Error("Message Schedule already exists in this server with this name");
            }
            return this._messageScheduler.register(name, cron, null, null, channel, message);
        });
    }

    @PostConstruct
    private async initAllMessageSchedules(client: Client): Promise<void> {
        const allGuilds = [...client.guilds.cache.values()];
        const repo = this.ds.getRepository(MessageScheduleModel);
        for (const guild of allGuilds) {
            const allMessageSchedules = await repo.find({
                where: {
                    guildId: guild.id
                }
            });
            for (const model of allMessageSchedules) {
                logger.info(`Re-registering scheduled message "${model.name}" for guild "${model.guildId}" to post on channel #${model.channel.id}`);
                this._messageScheduler.register(model.name, model.cron, null, null, model.channel, model.message);
            }
        }
    }
}
