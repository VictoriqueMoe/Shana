import {Discord, Guard, Slash} from "discordx";
import {VicDropbox} from "../../model/dropbox/VicDropbox";
import {NotBotInteraction} from "../../guards/NotABot";
import {AbstractCommandModule} from "../AbstractCommandModule";
import {Main} from "../../Main";
import {CommandInteraction} from "discord.js";
import {secureCommandInteraction} from "../../guards/RoleConstraint";

@Discord()
export abstract class VicImage extends AbstractCommandModule<any> {

    constructor() {
        super({
            module: {
                name: "VicImage",
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

    @Slash("vicImage")
    @Guard(NotBotInteraction, secureCommandInteraction)
    private async vicImage(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply();
        const channel = interaction.channel;
        const randomImageMetadata = VicDropbox.instance.randomImage;
        const randomImage = (await Main.dropBox.filesDownload({"path": randomImageMetadata.path_lower})).result;
        const buffer: Buffer = (randomImage as any).fileBinary;
        try {
            await interaction.editReply({
                content: "Found one!",
                files: [{
                    attachment: buffer,
                    name: `${randomImage.name}`
                }]
            });
        } catch (e) {
            channel.send("Failed to send, maybe image is too large?");
            console.error(e);
            console.log(`Failed to send ${randomImage.name}`);
        }
    }


    @Slash("vicReIndex")
    @Guard(NotBotInteraction, secureCommandInteraction)
    private async vicReIndex(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply();
        await VicDropbox.instance.index();
        interaction.editReply({
            content: `Re-indexed ${VicDropbox.instance.allImages.length} images from Dropbox`
        });
    }
}