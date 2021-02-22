import {Command, CommandMessage, Description, Guard} from "@typeit/discord";
import {NotBot} from "../../guards/NotABot";
import {roleConstraints} from "../../guards/RoleConstraint";
import {BlockGuard} from "../../guards/BlockGuard";
import {Roles} from "../../enums/Roles";
import RolesEnum = Roles.RolesEnum;
import {ObjectUtil} from "../../utils/Utils";

export abstract class AccountAge{
    @Command("age")
    @Description(AccountAge.viewDescriptionForSetUsernames())
    @Guard(NotBot, roleConstraints(RolesEnum.CIVIL_PROTECTION, RolesEnum.OVERWATCH_ELITE), BlockGuard)
    private async getAccountAge(command: CommandMessage): Promise<void> {
        const mentions = command.mentions;
        if(mentions.users.size != 1){
            command.reply("Please supply username");
            return;
        }
        const mention = mentions.users.array()[0];
        const createdDate = mention.createdAt.getTime();
        const accountAge = Date.now() - createdDate;
        command.reply(`Account age is is: ${ObjectUtil.secondsToHuman(Math.round(accountAge / 1000))}`);
    }

    private static viewDescriptionForSetUsernames() {
        return '\n Get the age of a discord account: \n usage ~age <"account">';
    }
}