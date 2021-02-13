import {Command, CommandMessage, Description, Guard} from "@typeit/discord";
import {Roles} from "../../enums/Roles";
import {roleConstraints} from "../../guards/RoleConstraint";
import {VicDropbox} from "../../model/dropbox/VicDropbox";
import {WeebBot} from "../../discord/WeebBot";
import {NotBot} from "../../guards/NotABot";
import {BlockGuard} from "../../guards/BlockGuard";
import RolesEnum = Roles.RolesEnum;

export abstract class VicImage {

    @Command("vicImage")
    @Description(VicImage.getDescription())
    @Guard(NotBot, roleConstraints(RolesEnum.ZOMBIES, RolesEnum.CIVIL_PROTECTION, RolesEnum.OVERWATCH_ELITE), BlockGuard)
    private async vicImage(command: CommandMessage): Promise<void> {
        let findingMessage = await command.channel.send("Finding image...");
        let randomImageMetadata = VicDropbox.instance.randomImage;
        let randomImage = (await WeebBot.dropBox.filesDownload({"path": randomImageMetadata.path_lower})).result;
        let buffer: Buffer = (randomImage as any).fileBinary;
        try {
            await command.channel.send("Found one!", {
                files: [{
                    attachment: buffer,
                    name: `${randomImage.name}`
                }]
            });
        } catch(e) {
            command.channel.send("Failed to send, maybe image is too large?");
            console.error(e);
            console.log(`Failed to send ${randomImage.name}`);
        }
        findingMessage.delete();
    }

    public static getDescription(): string {
        return "Get random vic image";
    }
}