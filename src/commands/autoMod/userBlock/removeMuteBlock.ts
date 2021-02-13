import {MuteModel} from "../../../model/DB/autoMod/Mute.model";
import {Roles} from "../../../enums/Roles";
import {AddMuteLock} from "./AddMuteLock";
import {User} from "discord.js";
import {RolePersistenceModel} from "../../../model/DB/autoMod/RolePersistence.model";
import {GuildUtils} from "../../../utils/Utils";
import {Main} from "../../../Main";
import RolesEnum = Roles.RolesEnum;

export abstract class RemoveMuteBlock {

    public static async doRemove(userId: string, skipPersistence = false): Promise<void> {
        let whereClaus = {
            where: {
                userId
            }
        };
        let muteModel = await MuteModel.findOne(whereClaus);
        if(!muteModel){
            throw new Error('That user is not currently muted.');
        }
        let prevRoles = muteModel.getPrevRoles();
        let rowCount = await MuteModel.destroy(whereClaus);
        if (rowCount != 1) {
            throw new Error('That user is not currently muted.');
        }
        if(!skipPersistence){
            let persistenceModelRowCount = await RolePersistenceModel.destroy(whereClaus);
            if (persistenceModelRowCount != 1) {
                //the application has SHIT itself, if one table has an entry but the other not, fuck knows what to do here...
                throw new Error("Unknown error occurred, error is a synchronisation issue between the Persistence model and the Mute Model ");
            }
        }
        let timeoutMap = AddMuteLock.timeOutMap;
        let userToDelete: User = null;
        for (let [user, timeOutFunction] of timeoutMap) {
            if (user.id === userId) {
                console.log(`cleared timeout for ${user.id}`);
                clearTimeout(timeOutFunction);
                userToDelete = user;
            }
        }
        if (userToDelete) {
            AddMuteLock.timeOutMap.delete(userToDelete);
        }
        let guild = await Main.client.guilds.fetch(GuildUtils.getGuildID());
        let member = await guild.members.fetch(userId);
        await member.roles.remove(RolesEnum.MUTED);
        for(let roleEnum of prevRoles){
            let role = await Roles.getRole(roleEnum);
            console.log(`re-applying role ${role.name} to ${member.user.username}`);
            await member.roles.add(role.id);
        }
    }

    private static getDescription() {
        return `Remove a blocked user from the database and allow them to post again \n usage: ~unMute <"username"> \n example: ~unMute "@SomeUser" \n make sure that the @ is blue before sending `;
    }
}