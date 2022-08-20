import {DataSourceAware} from "../../DB/DAO/DataSourceAware.js";
import schedule, {Job, RecurrenceSpecObjLit} from "node-schedule";
import {singleton} from "tsyringe";
import {EmbedBuilder, Guild, GuildMember} from "discord.js";
import {DbUtils, DiscordUtils, ObjectUtil} from "../../../utils/Utils.js";
import Channels from "../../../enums/Channels.js";
import {DateTime} from "luxon";
import {BirthdaysModel} from "../../DB/entities/guild/Birthdays.model.js";
import {PostConstruct} from "../decorators/PostConstruct.js";
import {ChannelManager} from "./ChannelManager.js";
import logger from "../../../utils/LoggerFactory.js";

@singleton()
export class BirthdayManager extends DataSourceAware {

    private _birthdayJobs: Job[] = [];

    public constructor(private _channelManager: ChannelManager) {
        super();
    }

    public getNumberWithOrdinal(n: number): string {
        return ["st", "nd", "rd"][((n + 90) % 100 - 10) % 10 - 1] || "th";
    }

    public async getNext10Birthdays(guildId: string): Promise<BirthdaysModel[]> {
        const model = this.ds.getRepository(BirthdaysModel);
        const currentDayOfYear = DateTime.now().ordinal;
        // sort by day of year
        // get next 10 records where day of the year is >= current day of year
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

    public async addBirthday(member: GuildMember, discordFormat: string): Promise<BirthdaysModel> {
        if (!await this.isEnabled(member.guild.id)) {
            throw new Error("Birthday is not enabled on this server");
        }
        const dateWithoutYear = DateTime.fromFormat(discordFormat, "dd-MM");
        const dateWithYear = DateTime.fromFormat(discordFormat, "yyyy-MM-dd");
        if (!dateWithoutYear.isValid && !dateWithYear.isValid) {
            throw new Error("Invalid date format, please use MM-dd ( (03-12) third of december) OR YYYY-MM-dd ((1995-07-03 3rd) of July 1995)");
        }
        const userId = member.id;
        const guildId = member.guild.id;
        const includeYear = dateWithYear.isValid;
        if (includeYear) {
            const yearSelected = dateWithYear.year;
            if (yearSelected > DateTime.now().year) {
                throw new Error("Your birthday can't be in the future!");
            }
        }
        const luxonBirthday = (includeYear ? dateWithYear : dateWithoutYear);
        const dayOfYear = luxonBirthday.ordinal;
        const seconds = luxonBirthday.toSeconds();
        const repo = this.ds.getRepository(BirthdaysModel);
        const existingBirthday = await repo.findOne({
            where: {
                guildId,
                userId
            }
        });
        let obj: BirthdaysModel;
        if (existingBirthday) {
            existingBirthday.birthday = seconds;
            existingBirthday.dayOfYear = dayOfYear;
            existingBirthday.includeYear = includeYear;
            obj = existingBirthday;
        } else {
            obj = DbUtils.build(BirthdaysModel, {
                birthday: seconds,
                dayOfYear,
                includeYear,
                guildId,
                userId
            });
        }

        const model = await repo.save(obj);
        await this.registerBirthdayListener(model);
        return model;
    }

    public async removeBirthday(userId: string, guild: Guild): Promise<boolean> {
        const guildId = guild.id;
        const repo = this.ds.getRepository(BirthdaysModel);
        const deleteResult = await repo.delete({
            userId,
            guildId
        });
        if (deleteResult.affected !== 1) {
            return false;
        }
        const key = `${userId}${guildId}`;
        const job = this._birthdayJobs.find(job => job.name === key);
        if (!job) {
            return true;
        }
        ObjectUtil.removeObjectFromArray(job, this._birthdayJobs);
        job.cancel(false);
        return true;
    }

    private async isEnabled(guildId: string): Promise<boolean> {
        const channel = await this._channelManager.getChannel(guildId, Channels.BIRTHDAY_CHANNEL);
        return ObjectUtil.isValidObject(channel);
    }

    @PostConstruct
    private async initBirthdays(): Promise<void> {
        const model = this.ds.getRepository(BirthdaysModel);
        const allBirthdays = await model.find();
        for (const birthday of allBirthdays) {
            await this.registerBirthdayListener(birthday);
        }
    }

    private async registerBirthdayListener(model: BirthdaysModel): Promise<void> {
        const {guildId, userId, includeYear, birthday} = model;
        const guild = await DiscordUtils.getGuild(guildId);
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
            date: date.day,
            hour: 0,
            minute: 0,
            tz: "Etc/UTC"
        };
        const channel = await this._channelManager.getChannel(guildId, Channels.BIRTHDAY_CHANNEL);
        logger.info(`Registering ${member.user.tag}'s birthday on guild ${guild.name}`);
        const job = schedule.scheduleJob(`${member.id}${guildId}`, rule, () => {
            const displayHexColor = member.displayHexColor;
            const avatar = member.displayAvatarURL();
            const embed = new EmbedBuilder()
                .setAuthor({
                    name: member.displayName,
                    iconURL: avatar
                })
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
}
