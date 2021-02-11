import {ArgsOf, Client, Guard, On} from "@typeit/discord";
import {NotBot} from "../../../guards/NotABot";
import {Message} from "discord.js";
import {DiscordUtils} from "../../../utils/Utils";
import {MuteAllModel} from "../../../model/DB/autoMod/MuteAll.model";
import {Roles} from "../../../enums/Roles";
import RolesEnum = Roles.RolesEnum;
import {MuteModel} from "../../../model/DB/autoMod/Mute.model";

export abstract class OnMessageBlockGuard {


    @On("message")
    @Guard(NotBot)
    private async onMessageBlockGuard([message]: ArgsOf<"message">, client: Client): Promise<Message | undefined> {
        if (message.member.id === "784102705253580800" || message.member.id === "595455886420475926") {
            return;
        }
        let globalBlocker = await MuteAllModel.findOne();
        if (globalBlocker) {
            let isStaff = globalBlocker.includeStaff;
            if (!isStaff) {
                if (!(message.member.roles.cache.has(RolesEnum.CIVIL_PROTECTION)
                    || message.member.roles.cache.has(RolesEnum.OVERWATCH_ELITE)
                    || message.member.roles.cache.has(RolesEnum.WEEB_OVERLORD)
                    || message.member.roles.cache.has(RolesEnum.ADVISOR))) {
                    try{
                        await message.delete();
                    }catch{

                    }
                    let reply = await message.reply(`You have been banned from posting`);
                    return reply.delete({timeout: 5000});
                }
            } else {
                try{
                    await message.delete();
                }catch{

                }
                let reply = await message.reply(`You have been banned from posting`);
                return reply.delete({timeout: 5000});
            }
        }
        let mutedModel = await DiscordUtils.getUserBlocked(message);
        return await this.doBlock(mutedModel, message);
    }

    private async doBlock(mutedModel: MuteModel, message: Message) {
        if (mutedModel) {
            try{
                await message.delete();
            }catch{

            }
            mutedModel = await mutedModel.increment('violationRules');
            let rules = ++mutedModel.violationRules;
            if (rules === 1) {
                let reply = await message.reply(`You have been banned from posting, you attempted to post: ${rules} times`);
                return reply.delete({timeout: 5000});
            }
        }
    }
}