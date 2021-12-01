import {Category} from "@discordx/utilities";
import {AbstractCommandModule} from "../AbstractCommandModule";
import {injectable} from "tsyringe";
import {DefaultPermissionResolver, Discord, Guard, Permission, Slash, SlashGroup, SlashOption} from "discordx";
import {BirthdayManager} from "../../model/guild/manager/BirthdayManager";
import {NotBotInteraction} from "../../guards/NotABot";
import {CommandEnabled} from "../../guards/CommandEnabled";
import {CommandInteraction} from "discord.js";
import {DiscordUtils} from "../../utils/Utils";
import InteractionUtils = DiscordUtils.InteractionUtils;

@Discord()
@Category("Birthday", "Commands to manage your personal notes")
@Category("Birthday", [
    {
        "name": "add Birthday",
        "type": "SLASH",
        "options": [
            {
                "name": "date",
                "description": "The date to your birthday, can be `dd-MM` OR `YYYY-MM-dd` if you supply the year, your age will be public",
                "optional": false,
                "type": "STRING"
            }
        ],
        "description": "Add you birthday"
    }
])
@SlashGroup("birthday", "Commands to add your Birthday!")
@Permission(new DefaultPermissionResolver(AbstractCommandModule.getDefaultPermissionAllow))
@Permission(AbstractCommandModule.getPermissions)
@injectable()
export class BirthdayCommands extends AbstractCommandModule {
    public constructor(private _birthdayManager: BirthdayManager) {
        super();
    }

    @Slash("addbirthday", {
        description: "Add you birthday"
    })
    @Guard(NotBotInteraction, CommandEnabled)
    private async getNotes(
        @SlashOption("date", {
            description: "your birthday (ex: YYYY-MM-dd) 1995-07-05 OR (dd-MM) 03-12)",
            required: true,
        })
            date: string,
        interaction: CommandInteraction
    ): Promise<void> {
        await interaction.deferReply();
        const caller = InteractionUtils.getInteractionCaller(interaction);
        try {
            await this._birthdayManager.addBirthday(caller, date);
        } catch (e) {

        }
    }
}