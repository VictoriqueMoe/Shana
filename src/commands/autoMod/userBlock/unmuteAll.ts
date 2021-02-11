import {Command, CommandMessage, Description, Guard} from "@typeit/discord";
import {NotBot} from "../../../guards/NotABot";
import {OwnerOnly} from "../../../guards/OwnerOnly";
import {MuteAllModel} from "../../../model/DB/autoMod/MuteAll.model";

export abstract class UnmuteAll {

    @Command("unMuteAll")
    @Description(UnmuteAll.getDescription())
    @Guard(NotBot, OwnerOnly)
    private async muteAll(command: CommandMessage): Promise<void> {
        await MuteAllModel.destroy({
            where: {},
            truncate: true
        });
        command.reply("done");
    }

    private static getDescription() {
        return `\n Unblock everyone in the server from posting \n usage: ~unMuteAll`;
    }
}