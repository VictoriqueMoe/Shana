import {Discord, Guard, Slash, SlashGroup, SlashOption} from "discordx";
import {Category, NotBot} from "@discordx/utilities";
import {injectable} from "tsyringe";
import {DiscordUtils, ObjectUtil} from "../../utils/Utils.js";
import {ApplicationCommandOptionType, AutocompleteInteraction, CommandInteraction, GuildMember} from "discord.js";
import {VicDropbox} from "../../model/framework/manager/VicDropbox.js";
import {VicImageTokenManager} from "../../model/framework/manager/VicImageTokenManager.js";
import {BotOwnerOnly} from "../../guards/BotOwnerOnly.js";
import InteractionUtils = DiscordUtils.InteractionUtils;

@Discord()
@Category("Misc")
@SlashGroup({
    name: "vicimage",
    description: "Obtain images of Victorique#0001",
    dmPermission: false
})
@SlashGroup("vicimage")
@injectable()
export class Vicimage {

    public constructor(private _vicDropbox: VicDropbox, private _vicImageTokenManager: VicImageTokenManager) {
    }

    @Slash({
        name: "register_user",
        description: "Register user to use this command"
    })
    @Guard(NotBot, BotOwnerOnly)
    private async registerUser(
        @SlashOption({
            name: "user",
            description: "The user you want to register",
            type: ApplicationCommandOptionType.User
        })
            user: GuildMember,
        interaction: CommandInteraction
    ): Promise<void> {
        await interaction.deferReply({
            ephemeral: true
        });
        await this._vicImageTokenManager.registerUser(user.id);
        return InteractionUtils.replyOrFollowUp(interaction, `${user.user.tag} has been registered`);
    }

    @Slash({
        name: "revoke_user",
        description: "Register user to use this command"
    })
    @Guard(NotBot, BotOwnerOnly)
    private async revokeUser(
        @SlashOption({
            name: "user",
            description: "The user you want to register",
            type: ApplicationCommandOptionType.User
        })
            user: GuildMember,
        interaction: CommandInteraction
    ): Promise<void> {
        await interaction.deferReply({
            ephemeral: true
        });
        const didRemove = await this._vicImageTokenManager.revokeUser(user.id);
        const msg = didRemove ? `revoked user "${user.user.tag}"` : `user ${user.user.tag} is not authorised in the first place`;
        return InteractionUtils.replyOrFollowUp(interaction, msg);
    }


    @Slash({
        name: "vicimage",
        description: "Get a random image of Victorique#0002"
    })
    @Guard(NotBot)
    private async vicImage(
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
        const validToken = await this._vicImageTokenManager.validateUser(interaction.user.id);
        if (!validToken) {
            return InteractionUtils.replyOrFollowUp(interaction, "unauthorised");
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

    @Slash({
        description: "Re-index image metadata from dropbox"
    })
    @Guard(NotBot)
    private async reindex(
        interaction: CommandInteraction
    ): Promise<void> {
        await interaction.deferReply({
            ephemeral: true
        });
        const authorised = await this._vicImageTokenManager.validateUser(interaction.user.id);
        if (!authorised) {
            return InteractionUtils.replyOrFollowUp(interaction, "unauthorised");
        }
        await this._vicDropbox.index();
        await interaction.editReply({
            content: `Re-indexed ${this._vicDropbox.allImages.length} images from Dropbox`
        });
    }
}
