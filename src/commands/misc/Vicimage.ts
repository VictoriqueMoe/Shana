import {Discord, Guard, Slash, SlashGroup, SlashOption} from "discordx";
import {Category, NotBot} from "@discordx/utilities";
import {injectable} from "tsyringe";
import {DiscordUtils, ObjectUtil} from "../../utils/Utils.js";
import {ApplicationCommandOptionType, AutocompleteInteraction, CommandInteraction, User} from "discord.js";
import {VicDropbox} from "../../model/framework/manager/VicDropbox.js";
import {VicImageTokenManager} from "../../model/framework/manager/VicImageTokenManager.js";
import InteractionUtils = DiscordUtils.InteractionUtils;

@Discord()
@Category("Misc")
@SlashGroup({
    name: "vicimage",
    description: "Obtain images of Victorique#0001",
})
@SlashGroup("vicimage")
@injectable()
export class Vicimage {

    constructor(private _vicDropbox: VicDropbox, private _vicImageTokenManager: VicImageTokenManager) {
    }

    @Slash({
        name: "register_token",
        description: "Register user"
    })
    @Guard(NotBot)
    private async registerToken(
        @SlashOption({
            name: "user",
            description: "The user you want to register",
            type: ApplicationCommandOptionType.User
        })
            user: User,
        interaction: CommandInteraction
    ) {
        const executor = interaction?.user;
        if (executor?.id !== "697417252320051291") {
            return InteractionUtils.replyOrFollowUp(interaction, "Authorised");
        }
        await interaction.deferReply({
            ephemeral: true
        });
        const newToken = await this._vicImageTokenManager.registerToken(user.id);
        return InteractionUtils.replyOrFollowUp(interaction, newToken);
    }


    @Slash({
        name: "vicimage",
        description: "Get a random image of Victorique#0002"
    })
    @Guard(NotBot)
    private async vicImage(
        @SlashOption({
            name: "token",
            description: "the token to use",
            autocomplete: (interaction: AutocompleteInteraction) => ObjectUtil.search(interaction, VicImageTokenManager),
            type: ApplicationCommandOptionType.String,
            required: true,
        })
            token: string,
        @SlashOption({
            name: "file_name",
            description: "Know the filename? put it here",
            autocomplete: (interaction: AutocompleteInteraction) => ObjectUtil.search(interaction, VicDropbox),
            type: ApplicationCommandOptionType.String,
            required: false,
        })
            fileName: string,
        interaction: CommandInteraction
    ): Promise<void> {
        await interaction.deferReply();
        const validToken = await this._vicImageTokenManager.validateToken(token, interaction.user.id);
        if (!validToken) {
            return InteractionUtils.replyOrFollowUp(interaction, "Invalid token");
        }
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
}
