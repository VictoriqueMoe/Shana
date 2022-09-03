import {ArgsOf, ContextMenu, Discord, Guard, On, Slash, SlashGroup, SlashOption} from "discordx";
import {Category, NotBot} from "@discordx/utilities";
import {
    ApplicationCommandOptionType,
    ApplicationCommandType,
    CommandInteraction,
    EmbedBuilder,
    MessageContextMenuCommandInteraction
} from "discord.js";
import {BookmarkManager} from "../../model/framework/manager/BookmarkManager.js";
import {injectable} from "tsyringe";
import {DiscordUtils, ObjectUtil} from "../../utils/Utils.js";
import InteractionUtils = DiscordUtils.InteractionUtils;

@Discord()
@Category("Members")
@SlashGroup({
    name: "bookmarks",
    description: "Commands to manage bookmarks",
    dmPermission: false
})
@SlashGroup("bookmarks")
@injectable()
export class Bookmark {
    public constructor(private _bookmarkManager: BookmarkManager) {
    }

    @On()
    private messageDelete([message]: ArgsOf<"messageDelete">): void {
        this._bookmarkManager.deleteBookmark(message.member, message);
    }


    @ContextMenu({
        type: ApplicationCommandType.Message,
        name: "bookmark"
    })
    @Guard(NotBot)
    private async addBookmark(interaction: MessageContextMenuCommandInteraction): Promise<void> {
        await interaction.deferReply({
            ephemeral: true
        });
        const message = await InteractionUtils.getMessageFromContextInteraction(interaction);
        if (!message) {
            return InteractionUtils.replyOrFollowUp(interaction, "Unable to find message");
        }
        const caller = InteractionUtils.getInteractionCaller(interaction);
        if (!caller) {
            return InteractionUtils.replyOrFollowUp(interaction, "Unable to add bookmark");
        }
        await this._bookmarkManager.addBookmark(caller, message);
        InteractionUtils.replyOrFollowUp(interaction, "Bookmark added");
    }

    @Slash({
        description: "Gets all of your saved bookmarks"
    })
    @Guard(NotBot)
    private async getbookmark(
        @SlashOption({
            name: "public",
            type: ApplicationCommandOptionType.Boolean,
            description: "make message public",
            required: false,
        })
            ephemeral: boolean,
        interaction: CommandInteraction
    ): Promise<void> {
        await interaction.deferReply({
            ephemeral: !ephemeral
        });
        const caller = InteractionUtils.getInteractionCaller(interaction);
        if (!caller) {
            return InteractionUtils.replyOrFollowUp(interaction, "Unable to get bookmarks");
        }
        const bookMarks = await this._bookmarkManager.getBookmarksFromMember(caller);
        const displayHexColor = caller.displayHexColor;
        const avatarUrl = caller.user.displayAvatarURL();
        const embed = new EmbedBuilder()
            .setColor(displayHexColor)
            .setTitle(`Your bookmarks`)
            .setAuthor({
                name: caller.user.tag,
                iconURL: avatarUrl
            })
            .setTimestamp();
        if (!ObjectUtil.isValidArray(bookMarks)) {
            embed.setDescription("No bookmarks saved");
        }
        for (let i = 0; i < bookMarks.length; i++) {
            const bookmark = bookMarks[i];
            const first20 = `${bookmark.content.substring(0, 20)} ...`;
            const messageDate = bookmark.createdAt;
            const month = messageDate.getUTCMonth() + 1;
            const day = messageDate.getUTCDate();
            const year = messageDate.getUTCFullYear();
            const date = year + "/" + month + "/" + day;
            embed.addFields(ObjectUtil.singleFieldBuilder(`**#${i + 1}:**`, `**Message preview:** ${first20}\n**By:** <@${bookmark.author.id}> on ${date} in <#${bookmark.channel.id}> \n[Jump to Message](${bookmark.url})\n**ID:** ${bookmark.id}`));
        }
        interaction.editReply({
            embeds: [embed]
        });
    }

    @Slash({
        description: "Delete a bookmark"
    })
    @Guard(NotBot)
    private async deletebookmarks(
        @SlashOption({
            name: "id",
            type: ApplicationCommandOptionType.String,
            description: "ID of the bookmark"
        })
            bookmarkId: string,
        interaction: CommandInteraction
    ): Promise<void> {
        await interaction.deferReply({
            ephemeral: true
        });
        const caller = InteractionUtils.getInteractionCaller(interaction);
        if (!caller) {
            return InteractionUtils.replyOrFollowUp(interaction, "Unable to delete bookmark");
        }
        const deleteResult = await this._bookmarkManager.deleteBookmark(caller, bookmarkId);
        if (deleteResult) {
            return InteractionUtils.replyOrFollowUp(interaction, `Bookmark ${bookmarkId} has been deleted`);
        }
        return InteractionUtils.replyOrFollowUp(interaction, `Bookmark ${bookmarkId} not found, please run /getbookmark for a list of ids`);
    }
}
