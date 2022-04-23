import {singleton} from "tsyringe";
import {BaseDAO, UniqueViolationError} from "../../../DAO/BaseDAO";
import {MessageScheduleModel} from "../../DB/entities/guild/MessageSchedule.model";
import type {BaseGuildTextChannel, GuildMember} from "discord.js";
import {PostConstruct} from "../../decorators/PostConstruct";
import type {GuildManager} from "./GuildManager";
import type {MessageScheduler} from "../../scheduler/impl/MessageScheduler";
import type {IScheduledMessageJob} from "../../scheduler/impl/ScheduledJob/IScheduledMessageJob";
import {ObjectUtil} from "../../../utils/Utils";
import type {Repository} from "typeorm";
import {getRepository, Transaction, TransactionRepository} from "typeorm";

@singleton()
export class MessageScheduleManager extends BaseDAO<MessageScheduleModel> {

    public constructor(private _guildManager: GuildManager, private _messageScheduler: MessageScheduler) {
        super();
    }

    @Transaction()
    public async deleteMessageSchedule(guildId: string, name: string, @TransactionRepository(MessageScheduleModel) messageScheduleModelRepository?: Repository<MessageScheduleModel>): Promise<boolean> {
        const destroyResult = await messageScheduleModelRepository.delete({
            guildId,
            name
        });
        const didDestroy = destroyResult.affected == 1;
        const engineResponse = this._messageScheduler.cancelJob(name);
        return didDestroy && engineResponse;
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
        const guild = await this._guildManager.getGuild(guildId);
        const model = await getRepository(MessageScheduleModel).findOne({
            where: {
                guildId,
            }
        });
        return guild.members.fetch(model.userId);
    }

    public async addMessageSchedule(guildId: string, channel: BaseGuildTextChannel, cron: string, message: string, user: GuildMember, name: string): Promise<IScheduledMessageJob> {
        const newMessageSchedule = BaseDAO.build(MessageScheduleModel, {
            guildId,
            cron,
            message,
            name,
            channel,
            userId: user.id
        });
        return getRepository(MessageScheduleModel).manager.transaction(async entityManager => {
            try {
                await super.commitToDatabase(entityManager, [newMessageSchedule], MessageScheduleModel);
            } catch (e) {
                if (e instanceof UniqueViolationError) {
                    throw new Error("Message Schedule already exists in this server with this name");
                }
            }
            return this._messageScheduler.register(name, cron, null, null, channel, message);
        });
    }

    @PostConstruct
    private async initAllMessageSchedules(): Promise<void> {
        const allGuilds = await this._guildManager.getGuilds();
        const repo = getRepository(MessageScheduleModel);
        for (const guild of allGuilds) {
            const allMessageSchedules = await repo.find({
                where: {
                    guildId: guild.id
                }
            });
            for (const model of allMessageSchedules) {
                console.log(`Re-registering scheduled message "${model.name}" for guild "${model.guildId}" to post on channel #${model.channel.id}`);
                this._messageScheduler.register(model.name, model.cron, null, null, model.channel, model.message);
            }
        }
    }
}
