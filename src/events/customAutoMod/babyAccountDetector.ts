import type {ArgsOf, Client} from "discordx";
import {Discord, On} from "discordx";
import {DiscordUtils, ObjectUtil} from "../../utils/Utils";

@Discord()
export abstract class BabyAccountDetector {

    @On("guildMemberAdd")
    private async babyAccountDetector([member]: ArgsOf<"guildMemberAdd">, client: Client): Promise<void> {
        const user = member.user;
        const memberCreated = user.createdAt.getTime();
        const now = Date.now();
        const oneWeek = 604800000;
        const accountAge = now - memberCreated;
        if (accountAge <= oneWeek) {
            DiscordUtils.postToLog(`Account joined <@${member.id}> is ${ObjectUtil.timeToHuman(accountAge)} old`, member.guild.id);
        }
    }
}
