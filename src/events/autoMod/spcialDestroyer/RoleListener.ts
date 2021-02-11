import {ArgsOf, Client, On} from "@typeit/discord";
import {Roles} from "../../../enums/Roles";
import {SpecialKickModel} from "../../../model/DB/autoMod/specialDestoryer/specialKick.model";
import RolesEnum = Roles.RolesEnum;

export abstract class roleListener {

    @On("guildMemberUpdate")
    public async roleListener([oldUser, newUser]: ArgsOf<"guildMemberUpdate">, client: Client): Promise<void> {
        // if special is removed, we need to remove that entry from the DB
        // if a member joins, and dyno adds "headcrab AND they are in the DB as a special who left, then revoke it (this will be hard)

        let specialRemoved = oldUser.roles.cache.get(RolesEnum.SPECIAL) != null && newUser.roles.cache.get(RolesEnum.SPECIAL) == null;
        let userId = newUser.id;
        if (specialRemoved) {
            await SpecialKickModel.destroy({
                where: {
                    userId
                }
            });
            return;
        }

        //DYNO
        let dbEntry = await SpecialKickModel.findOne({
            where: {
                userId
            }
        });
        if (dbEntry) {
            // step 1 get the last role edit
            let fetchedLogs = null;
            try {
                fetchedLogs = await oldUser.guild.fetchAuditLogs({
                    limit: 1,
                    type: 'MEMBER_ROLE_UPDATE'
                });
            } catch (e) {
                //   console.error(e);
            }
            if (!fetchedLogs) {
                return;
            }
            let roleLog = fetchedLogs.entries.first();
            // get the executor of the role edit
            let executor = roleLog.executor;

            // is the executor dyno AND was it headcrab?
            let wasDyno = executor.id === "155149108183695360";
            if (wasDyno) {
                let wasHeadCrab = newUser.roles.cache.has(RolesEnum.HEADCRABS);
                if (wasHeadCrab) {
                    // remove it
                    try {
                        await newUser.roles.remove(RolesEnum.HEADCRABS);
                    } catch (e) {
                        console.error(e);
                    }

                }
            }
        }
    }
}