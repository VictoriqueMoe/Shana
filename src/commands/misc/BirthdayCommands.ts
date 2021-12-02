import {Category} from "@discordx/utilities";
import {AbstractCommandModule} from "../AbstractCommandModule";
import {injectable} from "tsyringe";
import {DefaultPermissionResolver, Discord, Guard, Permission, Slash, SlashGroup, SlashOption} from "discordx";
import {BirthdayManager} from "../../model/guild/manager/BirthdayManager";
import {NotBotInteraction} from "../../guards/NotABot";
import {CommandEnabled} from "../../guards/CommandEnabled";
import {CommandInteraction, MessageEmbed} from "discord.js";
import {DiscordUtils} from "../../utils/Utils";
import {UniqueViolationError} from "../../DAO/BaseDAO";
import {BirthdaysModel} from "../../model/DB/guild/Birthdays.model";
import {DateTime} from "luxon";
import {Channels} from "../../enums/Channels";
import {ChannelManager} from "../../model/guild/manager/ChannelManager";
import InteractionUtils = DiscordUtils.InteractionUtils;


type NextBirthday = {
    age?: number,
    daysUntil: number,
    date: string
};

@Discord()
@Category("Birthday", "Commands to manage your personal notes\n**NOTE:** All dates are stored and parsed as UTC!")
@Category("Birthday", [
    {
        "name": "Add birthday",
        "type": "SLASH",
        "examples": ["/birthday addbirthday 10-07 = set birthday for 10th of July", "/birthday addbirthday 1995-07-03 = set Birthday for 3rd of July and include your age"],
        "options": [
            {
                "name": "date",
                "description": "The date to your birthday, can be `dd-MM` OR `YYYY-MM-dd` if you supply the year, your age will be public",
                "optional": false,
                "type": "STRING"
            }
        ],
        "description": "Add your birthday"
    },
    {
        "name": "Next Birthdays",
        "type": "SLASH",
        "options": [],
        "description": "Get the next 10 birthdays"
    },
    {
        "name": "Remove Birthday",
        "type": "SLASH",
        "options": [],
        "description": "Remove your birthday (if set)"
    }
])
@SlashGroup("birthday", "Commands to add your Birthday!")
@Permission(new DefaultPermissionResolver(AbstractCommandModule.getDefaultPermissionAllow))
@Permission(AbstractCommandModule.getPermissions)
@injectable()
export class BirthdayCommands extends AbstractCommandModule {
    public constructor(private _birthdayManager: BirthdayManager, private _channelManager: ChannelManager) {
        super();
    }

    @Slash("removebirthday", {
        description: "Remove your birthday (if set)"
    })
    @Guard(NotBotInteraction, CommandEnabled)
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

    @Slash("nextbirthdays", {
        description: "Get the next 10 birthdays"
    })
    @Guard(NotBotInteraction, CommandEnabled)
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
        const embed = new MessageEmbed()
            .setTitle(`Upcoming birthdays`)
            .setTimestamp();
        let str = ``;
        for (const [dateStr, birthdayModels] of birthdayMap) {
            for (const birthdayModel of birthdayModels) {
                const {userId, includeYear} = birthdayModel;
                const member = await interaction.guild.members.fetch(userId);
                str += `**${dateStr}**\n<@${member.id}>`;
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

    @Slash("addbirthday", {
        description: "Add your birthday"
    })
    @Guard(NotBotInteraction, CommandEnabled)
    private async addBirthday(
        @SlashOption("date", {
            description: "your birthday (ex: YYYY-MM-dd) 1995-07-05 OR (dd-MM) 03-12)",
            required: true,
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
            if (e instanceof UniqueViolationError) {
                return InteractionUtils.replyOrFollowUp(interaction, "Birthday already exists, please remove it first if you wish to change it");
            }
            return InteractionUtils.replyOrFollowUp(interaction, e.message);
        }
        const {age, daysUntil, date} = this.getNextBirthdayAndDays(model);
        const avatarUrl = caller.displayAvatarURL({dynamic: true});
        const channel = await this._channelManager.getChannel(interaction.guildId, Channels.BIRTHDAY_CHANNEL);
        const embed = new MessageEmbed()
            .setTitle(`Birthday added`)
            .setColor(caller.displayHexColor)
            .setAuthor(caller.user.tag, avatarUrl)
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
            embed.addField("Age", ageStr);
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
        if (birthday.millisecond - currentDate.millisecond < 0) {
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