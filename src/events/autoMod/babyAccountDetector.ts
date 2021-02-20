import {ArgsOf, Client, On} from "@typeit/discord";
import {Channels} from "../../enums/Channels";
import {TextChannel} from "discord.js";
import {ObjectUtil} from "../../utils/Utils";

export abstract class BabyAccountDetector {

    @On("guildMemberAdd")
    private async babyAccountDetector([member]: ArgsOf<"guildMemberAdd">, client: Client): Promise<void> {
        const user = member.user;
        const memberCreated = user.createdAt.getTime();
        const now = Date.now();
        const oneWeek = 604800000;
        const accountAge = now - memberCreated;
        if (accountAge <= oneWeek) {
            const logChannel = member.guild.channels.cache.get(Channels.LOG_CHANNEL) as TextChannel;
            logChannel.send(`Account joined <@${member.id}> is less than 1 week old at ${ObjectUtil.secondsToHuman(Math.round(accountAge / 1000))}`);
        }
    }
}