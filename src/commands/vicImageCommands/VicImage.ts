import {DefaultPermissionResolver, Discord, Guard, Permission, Slash, SlashGroup, SlashOption} from "discordx";
import {VicDropbox} from "../../model/dropbox/VicDropbox";
import {NotBot} from "@discordx/utilities";
import {AbstractCommand} from "../AbstractCommand";
import {AutocompleteInteraction, CommandInteraction} from "discord.js";
import {CommandEnabled} from "../../guards/CommandEnabled";
import {container, injectable} from "tsyringe";
import {DiscordUtils, ObjectUtil} from "../../utils/Utils";
import {Category} from "../../modules/category";
import InteractionUtils = DiscordUtils.InteractionUtils;


@Discord()
@Category("VicImage", "Commands to obtain images of <@697417252320051291>")
@Category("VicImage", [
    {
        name: "vicImage",
        description: "Get a random image of <@697417252320051291>",
        type: "SLASH",
        options: [
            {
                name: "file_name",
                type: "STRING",
                description: "Know the filename? put it here",
                optional: true
            }
        ]
    },
    {
        name: "vicReIndex",
        description: "Re-index image metadata from dropbox",
        type: "SLASH",
        options: []
    }
])
@Permission(new DefaultPermissionResolver(AbstractCommand.getDefaultPermissionAllow))
@Permission(AbstractCommand.getPermissions)
@SlashGroup({
    name: "vicimage",
    description: "Obtain images of Victorique#0002",
})
@SlashGroup("vicimage")
@injectable()
export class VicImage extends AbstractCommand {

    constructor(private _vicDropbox: VicDropbox) {
        super();
    }

    @Slash("vicimage", {
        description: "Get a random image of Victorique#0002"
    })
    @Guard(NotBot, CommandEnabled(container.resolve(VicDropbox)))
    private async vicImage(
        @SlashOption("file_name", {
            description: "Know the filename? put it here",
            autocomplete: (interaction: AutocompleteInteraction) => ObjectUtil.search(interaction, container.resolve(VicDropbox)),
            type: "STRING",
            required: false,
        })
            fileName: string,
        interaction: CommandInteraction
    ): Promise<void> {
        await interaction.deferReply();
        const image = ObjectUtil.validString(fileName) ? this._vicDropbox.getImageFromFileName(fileName) : this._vicDropbox.randomImage;
        if (!image) {
            return InteractionUtils.replyOrFollowUp(interaction, "no image found");
        }
        const loadedImage = (await this._vicDropbox.filesDownload({"path": image.path_lower})).result;
        const buffer: Buffer = (loadedImage as any).fileBinary;
        try {
            await interaction.editReply({
                content: `${loadedImage.name}`,
                files: [{
                    attachment: buffer,
                    name: `${loadedImage.name}`
                }]
            });
        } catch (e) {
            InteractionUtils.replyOrFollowUp(interaction, "Failed to send, maybe image is too large?");
            console.error(e);
            console.log(`Failed to send ${loadedImage.name}`);
        }
    }


    @Slash("vicreindex", {
        description: "Re-index image metadata from dropbox"
    })
    @Guard(NotBot, CommandEnabled(container.resolve(VicDropbox)))
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
