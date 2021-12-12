import {BaseDAO} from "../../../DAO/BaseDAO";
import {BirthdaysModel} from "../../DB/guild/Birthdays.model";
import {singleton} from "tsyringe";
import {Guild, GuildMember, MessageEmbed} from "discord.js";
import {DateTime} from "luxon";
import {getRepository} from "typeorm";
import {PostConstruct} from "../../decorators/PostConstruct";
import {GuildManager} from "./GuildManager";
import schedule, {Job, RecurrenceSpecObjLit} from "node-schedule";
import {ChannelManager} from "./ChannelManager";
import {Channels} from "../../../enums/Channels";
import {ObjectUtil} from "../../../utils/Utils";

@singleton()
export class BirthdayManager extends BaseDAO<BirthdaysModel> {

    private _birthdayJobs: Job[] = [];

    public constructor(private _guildManager: GuildManager, private _channelManager: ChannelManager) {
        super();
    }

    private async isEnabled(guildId: string): Promise<boolean> {
        const channel = await this._channelManager.getChannel(guildId, Channels.BIRTHDAY_CHANNEL);
        return ObjectUtil.isValidObject(channel);
    }

    @PostConstruct
    private async initBirthdays(): Promise<void> {
        const model = getRepository(BirthdaysModel);
        const allBirthdays = await model.find();
        for (const birthday of allBirthdays) {
            await this.registerBirthdayListener(birthday);
        }
    }

    public getNumberWithOrdinal(n: number): string {
        return ["st", "nd", "rd"][((n + 90) % 100 - 10) % 10 - 1] || "th";
    }

    public async getNext10Birthdays(guildId: string): Promise<BirthdaysModel[]> {
        const model = getRepository(BirthdaysModel);
        const currentDayOfYear = DateTime.now().ordinal;
        // sort by day of year
        //get next 10 records where day of the year is >= current day of year
        const first10 = await model.createQueryBuilder("BirthdaysModel")
            .where("BirthdaysModel.guildId = :guildId", {guildId})
            .andWhere("BirthdaysModel.dayOfYear >= :currentDayOfYear", {currentDayOfYear})
            .orderBy("BirthdaysModel.dayOfYear", "ASC")
            .limit(10)
            .getMany();

        if (first10.length < 10) {
            const next10 = await model.createQueryBuilder("BirthdaysModel")
                .where("BirthdaysModel.guildId = :guildId", {guildId})
                .andWhere("BirthdaysModel.dayOfYear < :currentDayOfYear", {currentDayOfYear})
                .orderBy("BirthdaysModel.dayOfYear", "ASC") // should this be DESC?
                .limit(10 - first10.length)
                .getMany();
            return [...first10, ...next10];
        }
        return first10;
    }

    private async registerBirthdayListener(model: BirthdaysModel): Promise<void> {
        const {guildId, userId, includeYear, birthday} = model;
        const guild = await this._guildManager.getGuild(guildId);
        let member: GuildMember = null;
        try {
            member = await guild.members.fetch(userId);
        } catch {
            await this.removeBirthday(userId, guild);
            return;
        }
        const date = DateTime.fromSeconds(birthday);
        const rule: RecurrenceSpecObjLit = {
            month: date.month - 1,
            date: date.day
        };
        const channel = await this._channelManager.getChannel(guildId, Channels.BIRTHDAY_CHANNEL);
        console.log(`Registering ${member.user.tag}'s birthday on guild ${guild.name}`);
        const job = schedule.scheduleJob(`${member.id}${guildId}`, rule, () => {
            const displayHexColor = member.displayHexColor;
            const avatar = member.displayAvatarURL({dynamic: true});
            const embed = new MessageEmbed()
                .setAuthor(member.displayName, avatar)
                .setColor(displayHexColor)
                .setTimestamp();
            let str = `It's <@${member.id}>'s `;
            if (includeYear) {
                const age = -Math.round(date.diffNow().as('years'));
                const suffix = this.getNumberWithOrdinal(age);
                str += `${age}${suffix} `;
            }
            str += "birthday, Happy Birthday! 🍰";
            embed.setDescription(str);
            channel.send({
                embeds: [embed]
            });
        });
        this._birthdayJobs.push(job);
    }

    public async addBirthday(member: GuildMember, discordFormat: string): Promise<BirthdaysModel> {
        if (!await this.isEnabled(member.guild.id)) {
            throw new Error("Birthday is not enabled on this server");
        }
        const dateWithoutYear = DateTime.fromFormat(discordFormat, "dd-MM");
        const dateWithYear = DateTime.fromFormat(discordFormat, "yyyy-MM-dd");
        if (!dateWithoutYear.isValid && !dateWithYear.isValid) {
            throw new Error("Invalid date format, please use MM-dd (03-12 third of december) OR YYYY-MM-dd 1995-07-03 (3rd of July 1995)");
        }
        const userId = member.id;
        const guildId = member.guild.id;
        const includeYear = dateWithYear.isValid;
        const luxonBirthday = (includeYear ? dateWithYear : dateWithoutYear);
        const dayOfYear = luxonBirthday.ordinal;
        const seconds = luxonBirthday.toSeconds();
        const obj = BaseDAO.build(BirthdaysModel, {
            birthday: seconds,
            dayOfYear,
            includeYear,
            guildId,
            userId
        });
        const model = await super.commitToDatabase(getRepository(BirthdaysModel), [obj]).then(values => values[0]);
        await this.registerBirthdayListener(model);
        return model;
    }

    public async removeBirthday(userId: string, guild: Guild): Promise<boolean> {
        const guildId = guild.id;
        const repo = getRepository(BirthdaysModel);
        const deleteResult = await repo.delete({
            userId,
            guildId
        });
        if (deleteResult.affected !== 1) {
            return false;
        }
        const key = `${userId}${guildId}`;
        const job = this._birthdayJobs.find(job => job.name === key);
        ObjectUtil.removeObjectFromArray(job, this._birthdayJobs);
        job.cancel(false);
        return true;
    }
}