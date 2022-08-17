import {ArgsOf, Client, Discord, Guard, On, Slash, SlashGroup, SlashOption} from "discordx";
import {Category, NotBot} from "@discordx/utilities";
import {ApplicationCommandOptionType, CommandInteraction, EmbedBuilder, PermissionsBitField} from "discord.js";
import {DateTime} from "luxon";
import Channels from "../../enums/Channels.js";
import {injectable} from "tsyringe";
import {BirthdaysModel} from "../../model/DB/entities/guild/Birthdays.model.js";
import {DiscordUtils, ObjectUtil} from "../../utils/Utils.js";
import {ChannelManager} from "../../model/framework/manager/ChannelManager.js";
import {BirthdayManager} from "../../model/framework/manager/BirthdayManager.js";
import InteractionUtils = DiscordUtils.InteractionUtils;

type NextBirthday = {
    age?: number,
    daysUntil: number,
    date: string
};

@Discord()
@Category("Members")
@SlashGroup({
    name: "birthday",
    description: "Commands to add your Birthday!",
    defaultMemberPermissions: PermissionsBitField.Flags.UseApplicationCommands
})
@SlashGroup("birthday")
@injectable()
export class BirthdayCommands {

    public constructor(private _birthdayManager: BirthdayManager, private _channelManager: ChannelManager) {
    }

    @On()
    private async guildMemberRemove([member]: ArgsOf<"guildMemberRemove">, client: Client): Promise<void> {
        const memberId = member.id;
        const {guild} = member;
        this._birthdayManager.removeBirthday(memberId, guild);
    }

    @Slash({
        name: "remove_birthday",
        description: "Remove your birthday (if set)"
    })
    @Guard(NotBot)
    private async removeBirthday(
        interaction: CommandInteraction
    ): Promise<void> {
        await interaction.deferReply();
        const caller = InteractionUtils.getInteractionCaller(interaction);
        const result = await this._birthdayManager.removeBirthday(caller.id, interaction.guild);
        if (!result) {
            return InteractionUtils.replyOrFollowUp(interaction, "You have not set a Birthday!");
        }
        return InteractionUtils.replyOrFollowUp(interaction, "Your birthday reminder has been removed and cancelled");
    }

    @Slash({
        name: "next_birthdays",
        description: "Get the next 10 birthdays"
    })
    @Guard(NotBot)
    private async nextBirthday(
        interaction: CommandInteraction
    ): Promise<void> {
        await interaction.deferReply();
        const {guildId} = interaction;
        const birthdays = await this._birthdayManager.getNext10Birthdays(guildId);
        const birthdayMap: Map<string, BirthdaysModel[]> = new Map();
        for (const birthdayObj of birthdays) {
            const {birthday} = birthdayObj;
            const date = this.getNextBirthdayObject(birthday);
            const formattedDate = date.toFormat("dd MMM yyyy");
            if (birthdayMap.has(formattedDate)) {
                birthdayMap.get(formattedDate).push(birthdayObj);
            } else {
                birthdayMap.set(formattedDate, [birthdayObj]);
            }
        }
        const embed = new EmbedBuilder()
            .setTitle(`Upcoming birthdays`)
            .setTimestamp();
        let str = ``;
        for (const [dateStr, birthdayModels] of birthdayMap) {
            for (const birthdayModel of birthdayModels) {
                const {userId, includeYear} = birthdayModel;
                const member = await interaction.guild.members.fetch(userId);
                str += `\n\n**${dateStr}**\n<@${member.id}>`;
                if (includeYear) {
                    const age = (-Math.ceil(DateTime.fromSeconds(birthdayModel.birthday).diffNow().as('years'))) + 1;
                    str += ` (${age})`;
                }
            }
        }
        embed.setDescription(str);
        interaction.editReply({
            embeds: [embed]
        });
    }

    @Slash({
        name: "add_birthday",
        description: "Add your birthday"
    })
    @Guard(NotBot)
    private async addBirthday(
        @SlashOption({
            name: "date",
            type: ApplicationCommandOptionType.String,
            description: "your birthday (ex: YYYY-MM-dd) 1995-07-05 OR (dd-MM) 03-12)"
        })
            dateStr: string,
        interaction: CommandInteraction
    ): Promise<void> {
        await interaction.deferReply();
        const caller = InteractionUtils.getInteractionCaller(interaction);
        let model: BirthdaysModel;
        try {
            model = await this._birthdayManager.addBirthday(caller, dateStr);
        } catch (e) {
            return InteractionUtils.replyOrFollowUp(interaction, e.message);
        }
        const {age, daysUntil, date} = this.getNextBirthdayAndDays(model);
        const avatarUrl = caller.displayAvatarURL();
        const channel = await this._channelManager.getChannel(interaction.guildId, Channels.BIRTHDAY_CHANNEL);
        const embed = new EmbedBuilder()
            .setTitle(`Birthday added`)
            .setColor(caller.displayHexColor)
            .setAuthor({
                name: caller.user.tag,
                iconURL: avatarUrl
            })
            .setDescription(`No problem, I will wish <@${caller.id}> a happy Birthday!`)
            .setTimestamp();
        embed.addFields([
            {
                name: "Days until",
                value: `${daysUntil}`
            },
            {
                name: "Date",
                value: date
            },
            {
                name: "On channel",
                value: `<#${channel.id}>`
            }
        ]);
        if (model.includeYear) {
            const ageStr = `${age}${this._birthdayManager.getNumberWithOrdinal(age)}`;
            embed.addFields(ObjectUtil.singleFieldBuilder("Age", ageStr));
        }
        interaction.editReply({
            embeds: [embed]
        });
    }

    private getNextBirthdayObject(date: number): DateTime {
        const currentDate = DateTime.now();
        let birthday = DateTime.fromSeconds(date).set({
            year: currentDate.year
        });
        if (birthday.toMillis() - currentDate.toMillis() < 0) {
            birthday = birthday.plus({
                year: 1
            });
        }
        return birthday;
    }

    private getNextBirthdayAndDays(birthday: BirthdaysModel): NextBirthday {
        const nextBirthday = this.getNextBirthdayObject(birthday.birthday);
        const now = DateTime.now();
        const diff = nextBirthday.diff(now);
        const daysUntil = Math.ceil(diff.as("days"));
        const date = nextBirthday.toFormat("dd MMM yyyy");
        const retObj: NextBirthday = {
            daysUntil,
            date
        };
        if (birthday.includeYear) {
            retObj["age"] = (-Math.ceil(DateTime.fromSeconds(birthday.birthday).diffNow().as('years'))) + 1;
        }
        return retObj;
    }
}
