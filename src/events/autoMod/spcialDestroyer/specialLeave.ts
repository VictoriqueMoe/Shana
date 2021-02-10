import {ArgsOf, Client, On} from "@typeit/discord";
import {User} from "discord.js";
import {Roles} from "../../../enums/Roles";
import {BaseDAO} from "../../../DAO/BaseDAO";
import {SpecialKickModel} from "../../../model/DB/autoMod/specialDestoryer/specialKick.model";
import RolesEnum = Roles.RolesEnum;

export abstract class SpecialLeave extends BaseDAO<SpecialKickModel> {


    //TODO possible bug if someone is kicked THEN banned. this method will treat the ban as a kick
    @On("guildMemberRemove")
    private async specialLeave([member]: ArgsOf<"guildMemberRemove">, client: Client): Promise<void> {
        let isSpecial = member.roles.cache.has(RolesEnum.SPECIAL);
        if (!isSpecial) {
            return;
        }

        // at this point we KNOW the member is special AND they left, but we do not know if they left voluntary or was kicked
        // we need to look at the audit logs
        const fetchedLogs = await member.guild.fetchAuditLogs({
            limit: 1,
            type: 'MEMBER_KICK',
        });

        const kickLog = fetchedLogs.entries.first();
        let wasKicked: boolean;
        if (!kickLog) {
            console.log(`${member.user.tag} left the guild, most likely of their own will.`);
            wasKicked = false;
        } else {
            if (kickLog.createdAt < member.joinedAt) {
                console.log(`${member.user.tag} left the guild, most likely of their own will or they where banned .`);
                wasKicked = false;
            } else {
                const {executor, target} = kickLog;
                if ((target as User).id === member.id) {
                    console.log(`${member.user.tag} left the guild; kicked by ${executor.tag}?`);
                    wasKicked = true;
                } else {
                    wasKicked = false;
                }
            }
        }


        if (!wasKicked) {
            // they where in special, but left on choice, this is now logged into the DB if they return
            let specialK = new SpecialKickModel({
                "userId": member.user.id
            });
            await super.commitToDatabase(specialK);
        }
    }
}