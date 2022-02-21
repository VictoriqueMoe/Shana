import {DefaultPermissionResolver, Discord, Guard, Permission, Slash, SlashGroup} from "discordx";
import {VicDropbox} from "../../model/dropbox/VicDropbox";
import {NotBotInteraction} from "../../guards/NotABot";
import {AbstractCommandModule} from "../AbstractCommandModule";
import {CommandInteraction} from "discord.js";
import {CommandEnabled} from "../../guards/CommandEnabled";
import {container, injectable} from "tsyringe";
import {DiscordUtils} from "../../utils/Utils";
import {Category} from "@discordx/utilities";
import InteractionUtils = DiscordUtils.InteractionUtils;


@Discord()
@Category("VicImage", "Commands to obtain images of <@697417252320051291>")
@Category("VicImage", [
    {
        name: "vicImage",
        description: "Get a random image of <@697417252320051291>",
        type: "SLASH",
        options: []
    },
    {
        name: "vicReIndex",
        description: "Re-index image metadata from dropbox",
        type: "SLASH",
        options: []
    }
])
@Permission(new DefaultPermissionResolver(AbstractCommandModule.getDefaultPermissionAllow))
@Permission(AbstractCommandModule.getPermissions)
@SlashGroup("vicimage", "Obtain images of Victorique#0002")
@injectable()
export class VicImage extends AbstractCommandModule {

    constructor(private _vicDropbox: VicDropbox) {
        super();
    }

    @Slash("vicimage", {
        description: "Get a random image of Victorique#0002"
    })
    @Guard(NotBotInteraction, CommandEnabled(container.resolve(VicDropbox)))
    private async vicImage(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply();
        const randomImageMetadata = this._vicDropbox.randomImage;
        if (!randomImageMetadata) {
            return InteractionUtils.replyOrFollowUp(interaction, "no images found");
        }
        const randomImage = (await this._vicDropbox.filesDownload({"path": randomImageMetadata.path_lower})).result;
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
        description: "Re-index image metadata from dropbox"
    })
    @Guard(NotBotInteraction, CommandEnabled(container.resolve(VicDropbox)))
    private async vicReIndex(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply({
            ephemeral: true
        });
        await this._vicDropbox.index();
        await interaction.editReply({
            content: `Re-indexed ${this._vicDropbox.allImages.length} images from Dropbox`
        });
    }
}
