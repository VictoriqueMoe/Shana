import {Command, CommandMessage, Description, Guard} from "@typeit/discord";
import {NotBot} from "../../guards/NotABot";
import {AdminOnlyTask} from "../../guards/AdminOnlyTask";
import {VicDropbox} from "../../model/dropbox/VicDropbox";

export abstract class VicReIndex{
    @Command("vicReIndex")
    @Description(VicReIndex.getDescription())
    @Guard(NotBot, AdminOnlyTask)
    private async vicReIndex(command: CommandMessage): Promise<void> {
        await VicDropbox.instance.index();
        command.channel.send(`Re-indexed ${VicDropbox.instance.allImages.length} images from Dropbox`);
    }

    private static getDescription() {
        return "Reindex the bot to add new images";
    }
}