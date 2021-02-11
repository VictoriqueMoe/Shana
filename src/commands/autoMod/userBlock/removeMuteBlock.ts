import {Command, CommandMessage, Description, Guard} from "@typeit/discord";
import {NotBot} from "../../../guards/NotABot";
import {roleConstraints} from "../../../guards/RoleConstraint";
import {MuteModel} from "../../../model/DB/autoMod/Mute.model";
import {Roles} from "../../../enums/Roles";
import {StringUtils} from "../../../utils/Utils";
import {BlockGuard} from "../../../guards/BlockGuard";
import {AddMuteLock} from "./AddMuteLock";
import {User} from "discord.js";
import RolesEnum = Roles.RolesEnum;

export abstract class RemoveMuteBlock {

    @Command("unMute")
    @Description(RemoveMuteBlock.getDescription())
    @Guard(NotBot, roleConstraints(RolesEnum.CIVIL_PROTECTION, RolesEnum.OVERWATCH_ELITE), BlockGuard)
    private async unMute(command: CommandMessage): Promise<MuteModel> {
        let argumentArray = StringUtils.splitCommandLine(command.content);
        if (argumentArray.length !== 1) {
            command.reply("Invalid arguments, please supply username");
            return;
        }
        let mentionedUserCollection = command.mentions.users;
        if (mentionedUserCollection.size !== 1) {
            command.reply("You must specify ONE user in your arguments");
            return;
        }
        let userId = mentionedUserCollection.keys().next().value;
        let rowCount = await MuteModel.destroy({
            where: {
                userId
            }
        });
        if (rowCount != 1) {
            command.reply('That user is not currently muted.');
            return;
        }
        let timeoutMap = AddMuteLock.timeOutMap;
        let userToDelete:User = null;
        for (let [user, timeOutMap] of timeoutMap) {
            if (user.id === userId) {
                let timeOutFunction = timeOutMap.values().next().value;
                console.log(`cleared timeout for ${user.id}`);
                clearTimeout(timeOutFunction);
                userToDelete = user;
            }
        }
        if(userToDelete){
            AddMuteLock.timeOutMap.delete(userToDelete);
        }

        command.reply("User has been un-Muted");
    }

    private static getDescription() {
        return `Remove a blocked user from the database and allow them to post again \n usage: ~unMute <"username"> \n example: ~unMute "@SomeUser" \n make sure that the @ is blue before sending `;
    }
}