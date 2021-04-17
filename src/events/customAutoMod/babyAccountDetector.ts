import {ArgsOf, Client, On} from "@typeit/discord";
import {DiscordUtils, ObjectUtil} from "../../utils/Utils";

export abstract class BabyAccountDetector {

    @On("guildMemberAdd")
    private async babyAccountDetector([member]: ArgsOf<"guildMemberAdd">, client: Client): Promise<void> {
        const user = member.user;
        const memberCreated = user.createdAt.getTime();
        const now = Date.now();
        const oneWeek = 604800000;
        const accountAge = now - memberCreated;
        if (accountAge <= oneWeek) {
            DiscordUtils.postToLog(`Account joined <@${member.id}> is ${ObjectUtil.secondsToHuman(Math.round(accountAge / 1000))} old`, member.guild.id);
        }
    }
}