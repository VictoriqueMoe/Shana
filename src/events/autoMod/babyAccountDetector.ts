import {ArgsOf, Client, On} from "@typeit/discord";
import {Channels} from "../../enums/Channels";
import {TextChannel} from "discord.js";
import {ObjectUtil} from "../../utils/Utils";

export abstract class BabyAccountDetector {
    @On("guildMemberAdd")
    private async babyAccountDetector([member]: ArgsOf<"guildMemberAdd">, client: Client): Promise<void> {
        let user = member.user;
        let memberCreated = user.createdAt.getTime();
        let now = Date.now();
        let oneWeek = 604800000;
        let accountAge = now - memberCreated;
        if (accountAge <= oneWeek) {
            let logChannel = member.guild.channels.cache.get(Channels.LOG_CHANNEL) as TextChannel;
            logChannel.send(`Account joined <@${member.id}> is less than 1 week old at ${ObjectUtil.secondsToHuman(Math.round(accountAge / 1000))}`);
        }
    }
}