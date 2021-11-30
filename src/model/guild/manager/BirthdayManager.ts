import {BaseDAO} from "../../../DAO/BaseDAO";
import {BirthdaysModel} from "../../DB/guild/Birthdays.model";
import {singleton} from "tsyringe";
import {GuildMember} from "discord.js";
import {DateTime} from "luxon";
import {getRepository} from "typeorm";

@singleton()
export class BirthdayManager extends BaseDAO<BirthdaysModel> {

    public async addBirthday(member: GuildMember, discordFormat: string): Promise<BirthdaysModel> {
        const dateWithoutYear = DateTime.fromFormat(discordFormat, "dd-MM");
        const dateWithYear = DateTime.fromFormat(discordFormat, "YYYY-MM-dd");
        if (!dateWithoutYear.isValid && !dateWithYear.isValid) {
            throw new Error("Invalid date format, please use MM-dd (03-12 third of december) OR YYYY-MM-dd (1995-07-03 (3rd of July 1995) ♥");
        }
        const userId = member.id;
        const guildId = member.guild.id;
        const includeYear = dateWithYear.isValid;
        const birthday = (includeYear ? dateWithYear : dateWithoutYear).toSeconds();
        const obj = BaseDAO.build(BirthdaysModel, {
            birthday,
            includeYear,
            guildId,
            userId
        });
        return super.commitToDatabase(getRepository(BirthdaysModel), [obj]).then(values => values[0]);
    }

    public async removeBirthday(member: GuildMember): Promise<boolean> {
        const userId = member.id;
        const guildId = member.guild.id;
        const repo = getRepository(BirthdaysModel);
        const deleteResult = await repo.delete({
            userId,
            guildId
        });
        return deleteResult.affected === 1;
    }
}