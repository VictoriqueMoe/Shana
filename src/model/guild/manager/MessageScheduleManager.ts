import {singleton} from "tsyringe";
import {BaseDAO, UniqueViolationError} from "../../../DAO/BaseDAO";
import {MessageScheduleModel} from "../../DB/guild/MessageSchedule.model";
import {BaseGuildTextChannel, GuildMember} from "discord.js";
import {PostConstruct} from "../../decorators/PostConstruct";
import {GuildManager} from "./GuildManager";
import {MessageScheduler} from "../../scheduler/impl/MessageScheduler";
import {IScheduledMessageJob} from "../../scheduler/impl/ScheduledJob/IScheduledMessageJob";
import {ObjectUtil} from "../../../utils/Utils";
import {Sequelize} from "sequelize-typescript";

@singleton()
export class MessageScheduleManager extends BaseDAO<MessageScheduleModel> {

    public constructor(private _guildManager: GuildManager, private _messageScheduler: MessageScheduler, private _dao: Sequelize) {
        super();
    }

    public async deleteMessageSchedule(guildId: string, name: string): Promise<boolean> {
        return this._dao.transaction(async transaction => {
            const destroyResult = await MessageScheduleModel.destroy({
                transaction,
                where: {
                    guildId,
                    name
                }
            });
            const didDestroy = destroyResult == 1;
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
        const guild = await this._guildManager.getGuild(guildId);
        const model = await MessageScheduleModel.findOne({
            where: {
                guildId,
            }
        });
        return guild.members.fetch(model.userId);
    }

    public async addMessageSchedule(guildId: string, channel: BaseGuildTextChannel, cron: string, message: string, user: GuildMember, name: string): Promise<IScheduledMessageJob> {
        const newMessageSchedule = new MessageScheduleModel({
            guildId,
            cron,
            message,
            name,
            channel,
            userId: user.id
        });
        return this._dao.transaction(async t => {
            try {
                await super.commitToDatabase(newMessageSchedule, {}, false, t);
            } catch (e) {
                if (e instanceof UniqueViolationError) {
                    throw new Error("Message Schedule already exists in this server with this name");
                }
            }
            return this._messageScheduler.register(name, cron, null, channel, message);
        });
    }

    @PostConstruct
    private async initAllMessageSchedules(): Promise<void> {
        const allGuilds = await this._guildManager.getGuilds();
        for (const guild of allGuilds) {
            const allMessageSchedules = await MessageScheduleModel.findAll({
                where: {
                    guildId: guild.id
                }
            });
            for (const model of allMessageSchedules) {
                this._messageScheduler.register(model.name, model.cron, null, model.channel, model.message);
            }
        }
    }
}