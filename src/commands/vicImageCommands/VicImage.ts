import {Command, CommandMessage, Description, Guard} from "@typeit/discord";
import {secureCommand} from "../../guards/RoleConstraint";
import {VicDropbox} from "../../model/dropbox/VicDropbox";
import {WeebBot} from "../../discord/WeebBot";
import {NotBot} from "../../guards/NotABot";
import {AbstractCommand} from "../AbstractCommand";

export abstract class VicImage extends AbstractCommand<any> {

    constructor() {
        super({
            module:{
                name:"VicImage",
                description: "Commands to obtain images of <@697417252320051291>"
            },
            commands: [
                {
                    name: "vicImage",
                    description: {
                        text: `Get a random image of <@697417252320051291>`
                    }
                },
                {
                    name: "vicReIndex",
                    description: {
                        text: "Re-index image metadata from dropbox"
                    }
                }
            ]
        });
    }

    @Command("vicImage")
    @Description(VicImage.getVicImageDescription())
    @Guard(NotBot, secureCommand)
    private async vicImage(command: CommandMessage): Promise<void> {
        const findingMessage = await command.channel.send("Finding image...");
        const randomImageMetadata = VicDropbox.instance.randomImage;
        const randomImage = (await WeebBot.dropBox.filesDownload({"path": randomImageMetadata.path_lower})).result;
        const buffer: Buffer = (randomImage as any).fileBinary;
        try {
            await command.channel.send("Found one!", {
                files: [{
                    attachment: buffer,
                    name: `${randomImage.name}`
                }]
            });
        } catch (e) {
            command.channel.send("Failed to send, maybe image is too large?");
            console.error(e);
            console.log(`Failed to send ${randomImage.name}`);
        }
        findingMessage.delete();
    }

    @Command("vicReIndex")
    @Description(VicImage.getIndexDescription())
    @Guard(NotBot, secureCommand)
    private async vicReIndex(command: CommandMessage): Promise<void> {
        await VicDropbox.instance.index();
        command.channel.send(`Re-indexed ${VicDropbox.instance.allImages.length} images from Dropbox`);
    }

    private static getIndexDescription() {
        return "Reindex the bot to add new images";
    }

    public static getVicImageDescription(): string {
        return "Get random vic image";
    }
}