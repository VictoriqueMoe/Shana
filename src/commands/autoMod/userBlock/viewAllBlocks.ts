import {Command, CommandMessage, Description, Guard} from "@typeit/discord";
import {NotBot} from "../../../guards/NotABot";
import {roleConstraints} from "../../../guards/RoleConstraint";
import {BlockGuard} from "../../../guards/BlockGuard";
import {MuteModel} from "../../../model/DB/autoMod/Mute.model";
import {Roles} from "../../../enums/Roles";
import {AddMuteLock} from "./AddMuteLock";
import RolesEnum = Roles.RolesEnum;
import {ObjectUtil} from "../../../utils/Utils";

export abstract class ViewAllBlocks {
    @Command("viewAllMutes")
    @Description(ViewAllBlocks.getDescription())
    @Guard(NotBot, roleConstraints(RolesEnum.CIVIL_PROTECTION, RolesEnum.OVERWATCH_ELITE), BlockGuard)
    private async viewAllMutes(command: CommandMessage): Promise<MuteModel[]> {
        let currentBlocks = await MuteModel.findAll();
        if (currentBlocks.length === 0) {
            command.reply("No members are muted");
            return;
        }
        let replyStr = `\n`;
        for (let block of currentBlocks) {
            let timeout: number = -1;
            let id = block.userId;
            let userObject = (await command.guild.members.fetch(id)).user;
            let creator = (await command.guild.members.fetch(block.creatorID)).user;
            let hasTimeoutMap = AddMuteLock.timeOutMap;
            for (let [user, timeOutMap] of hasTimeoutMap) {
                let _timeOut = timeOutMap.keys().next().value;
                if (user.id === id) {
                    timeout = _timeOut;
                    break;
                }
            }
            replyStr += `\n "${userObject.username}" has been muted by "${creator.username}" for the reason "${block.reason}"`;
            if (timeout > -1) {
                let now = Date.now();
                let dateCreated = (block.createdAt as Date).getTime();
                let timeLeft = timeout - (now - dateCreated);
                replyStr += `, for ${ObjectUtil.secondsToHuman(Math.round(timeout / 1000))} and has ${ObjectUtil.secondsToHuman(Math.round(timeLeft / 1000))} left`;
            }
            if (block.violationRules > 0) {
                replyStr += `, This user has also attempted to post ${block.violationRules} times while blocked`;
            }
        }
        command.reply(replyStr);
        return currentBlocks;
    }

    private static getDescription() {
        return "View all the currently active mutes";
    }
}
