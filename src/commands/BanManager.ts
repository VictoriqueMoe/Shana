import {Discord, Guard, Slash, SlashGroup} from "discordx";
import {NotBot} from "@discordx/utilities";
import {CommandInteraction, PermissionsBitField} from "discord.js";
import {DiscordUtils} from "../utils/Utils.js";
import InteractionUtils = DiscordUtils.InteractionUtils;

@Discord()
@SlashGroup({
    name: "bans",
    description: "commands to manage bans in this server",
    defaultMemberPermissions: PermissionsBitField.Flags.BanMembers
})
@SlashGroup("bans")
export class BanManager {

    @Slash({
        name: "clean_bans",
        description: "Remove all the deleted accounts from your bans"
    })
    @Guard(NotBot)
    private async cleanBans(interaction: CommandInteraction): Promise<void> {
        const {guild} = interaction;
        const banManager = guild.bans;
        const banCache = await banManager.fetch();
        let count = 0;
        for (const [id, guildBan] of banCache) {
            const bannedUser = guildBan.user;
            const {username, discriminator} = bannedUser;
            if (discriminator === "0000" || this.hasValidDeletedUser(username)) {
                await banManager.remove(id, "Deleted user");
                count++;
            }
        }
        return InteractionUtils.replyOrFollowUp(interaction, count === 0 ? "No accounts have been removed" : `${count} accounts have been unbanned because they are deleted`);
    }

    private hasValidDeletedUser(userName: string): boolean {
        const split = userName.split(" ");
        if (split.length !== 3) {
            return false;
        }
        const hash = split.pop();
        return hash.length === 8 && split.join(" ") === "Deleted User";
    }
}
