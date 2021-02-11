import {Command, CommandMessage, Description, Guard} from "@typeit/discord";
import {NotBot} from "../../../guards/NotABot";
import {MuteAllModel} from "../../../model/DB/autoMod/MuteAll.model";
import {BaseDAO} from "../../../DAO/BaseDAO";
import {OwnerOnly} from "../../../guards/OwnerOnly";
import {ObjectUtil, StringUtils} from "../../../utils/Utils";

export abstract class MuteAll extends BaseDAO<MuteAllModel> {

    @Command("muteAll")
    @Description(MuteAll.getDescription())
    @Guard(NotBot, OwnerOnly)
    private async muteAll(command: CommandMessage): Promise<MuteAllModel> {
        await MuteAllModel.destroy({
            where: {},
            truncate: true
        });
        let argumentArray = StringUtils.splitCommandLine(command.content);
        let includeStaffStr = argumentArray[0];
        let includeStaff = false;
        if (ObjectUtil.validString(includeStaffStr)) {
            includeStaff = Boolean(includeStaffStr);
        }
        let model = new MuteAllModel({
            includeStaff,
            enabled: true
        });

        return await super.commitToDatabase(model).then(r => {
            command.reply("done");
            return r;
        });
    }

    private static getDescription() {
        return `\n Block everyone in the server from posting \n usage: ~muteAll ["true/false"] \n example: ~muteAll "true"`;
    }
}