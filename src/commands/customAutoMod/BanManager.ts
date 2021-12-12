import {AbstractCommandModule} from "../AbstractCommandModule";
import {DefaultPermissionResolver, Discord, Guard, Permission, Slash, SlashGroup} from "discordx";
import {Category} from "@discordx/utilities";
import {NotBotInteraction} from "../../guards/NotABot";
import {CommandEnabled} from "../../guards/CommandEnabled";
import {CommandInteraction} from "discord.js";

@Discord()
@Category("bans", "commands to manage bans in this server")
@Category("bans", [
    {
        name: "Clean bans",
        description: "Remove all the deleted accounts from your bans",
        type: "SLASH",
        options: []
    }
])
@Permission(new DefaultPermissionResolver(AbstractCommandModule.getDefaultPermissionAllow))
@Permission(AbstractCommandModule.getPermissions)
@SlashGroup("bans", "commands to manage bans in this server")
export class BanManager extends AbstractCommandModule {


    @Slash("cleanbans", {
        description: "Get the age of this server"
    })
    @Guard(NotBotInteraction, CommandEnabled)
    private async serverAge(interaction: CommandInteraction): Promise<void> {
        const {guild} = interaction;
        const banManager = guild.bans;
        const banCache = banManager.cache;
        for (const [id, guildBan] of banCache) {
            const bannedUser = guildBan.user;
            console.log(bannedUser);
        }
    }
}