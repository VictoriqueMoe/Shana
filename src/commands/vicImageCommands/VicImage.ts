import {Discord, Guard, Slash, SlashGroup} from "discordx";
import {VicDropbox} from "../../model/dropbox/VicDropbox";
import {NotBotInteraction} from "../../guards/NotABot";
import {AbstractCommandModule} from "../AbstractCommandModule";
import {CommandInteraction} from "discord.js";
import {secureCommandInteraction} from "../../guards/RoleConstraint";
import {container, injectable} from "tsyringe";
import {Dropbox} from "dropbox";
import {DiscordUtils} from "../../utils/Utils";
import InteractionUtils = DiscordUtils.InteractionUtils;

@Discord()
@SlashGroup("vicimage", "Obtain images of Victorique#0002")
@injectable()
export class VicImage extends AbstractCommandModule<any> {

    constructor(private _dropbox: Dropbox) {
        super({
            module: {
                name: "VicImage",
                description: "Commands to obtain images of <@697417252320051291>"
            },
            commands: [
                {
                    name: "vicImage",
                    type: "slash",
                    description: {
                        text: `Get a random image of <@697417252320051291>`
                    }
                },
                {
                    name: "vicReIndex",
                    type: "slash",
                    description: {
                        text: "Re-index image metadata from dropbox"
                    }
                }
            ]
        });
    }

    @Slash("vicimage", {
        description: "Get a random image of Victorique#0002"
    })
    @Guard(NotBotInteraction, secureCommandInteraction)
    private async vicImage(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply();
        const vicDropbox = container.resolve(VicDropbox);
        const randomImageMetadata = vicDropbox.randomImage;
        const randomImage = (await this._dropbox.filesDownload({"path": randomImageMetadata.path_lower})).result;
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
            InteractionUtils.replyOrFollowUp(interaction, "Failed to send, maybe image is too large?");
            console.error(e);
            console.log(`Failed to send ${randomImage.name}`);
        }
    }


    @Slash("vicreindex", {
        description: "Get a random image of Victorique#0002"
    })
    @Guard(NotBotInteraction, secureCommandInteraction)
    private async vicReIndex(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply();
        const vicDropbox = container.resolve(VicDropbox);
        await vicDropbox.index();
        await interaction.editReply({
            content: `Re-indexed ${vicDropbox.allImages.length} images from Dropbox`
        });
    }
}