import {
    ArgsOf,
    Client,
    ContextMenu,
    DefaultPermissionResolver,
    Discord,
    Guard,
    On,
    Permission,
    Slash,
    SlashGroup,
    SlashOption
} from "discordx";
import {AbstractCommand} from "../AbstractCommand";
import {NotBot} from "@discordx/utilities";
import {CommandEnabled} from "../../guards/CommandEnabled";
import {CommandInteraction, ContextMenuInteraction, Message, MessageEmbed} from "discord.js";
import {injectable} from "tsyringe";
import {BookmarkManager} from "../../model/guild/manager/BookmarkManager";
import {ArrayUtils, DiscordUtils} from "../../utils/Utils";
import {Category} from "../../modules/category";
import InteractionUtils = DiscordUtils.InteractionUtils;

@Discord()
@Category("Bookmarks", "Commands to manage bookmarks")
@Category("Bookmarks", [
    {
        "name": "bookmark",
        "type": "CONTEXT MESSAGE",
        "description": "Bookmark a message"
    },
    {
        "name": "getbookmark",
        "type": "SLASH",
        "options": [
            {
                "name": "public",
                "description": "Make this message public",
                "optional": false,
                "type": "BOOLEAN"
            }
        ],
        "description": "Get all of your bookmarks"
    },
    {
        "name": "deleteBookmarks",
        "type": "SLASH",
        "options": [
            {
                "name": "id",
                "description": "Id of the bookmark to delete",
                "optional": false,
                "type": "STRING"
            }
        ],
        "description": "Delete a bookmark"
    }
])
@SlashGroup({
    name: "bookmarks",
    description: "Commands to manage bookmarks",
})
@SlashGroup("bookmarks")
@Permission(new DefaultPermissionResolver(AbstractCommand.getDefaultPermissionAllow))
@Permission(AbstractCommand.getPermissions)
@injectable()
export class Bookmark extends AbstractCommand {
    constructor(private _bookmarkManager: BookmarkManager) {
        super();
    }

    @On("messageDelete")
    private async messageDeleted([message]: ArgsOf<"messageDelete">, client: Client): Promise<void> {
        if (!(message instanceof Message) || message.partial) {
            try {
                message = await message.fetch();
            } catch {
                return;
            }
        }
        this._bookmarkManager.deleteBookmark(message.member, message);
    }


    @ContextMenu("MESSAGE", "bookmark")
    @Guard(NotBot, CommandEnabled())
    private async addBookmark(interaction: ContextMenuInteraction): Promise<void> {
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

    @Slash("getbookmark", {
        description: "Gets all of your saved bookmarks"
    })
    @Guard(NotBot, CommandEnabled())
    private async getbookmark(
        @SlashOption("public", {
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
        const avatarUrl = caller.user.displayAvatarURL({dynamic: true});
        const embed = new MessageEmbed()
            .setColor(displayHexColor)
            .setTitle(`Your bookmarks`)
            .setAuthor(caller.user.tag, avatarUrl)
            .setTimestamp();
        if (!ArrayUtils.isValidArray(bookMarks)) {
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
            embed.addField(`**#${i + 1}:**`, `**Message preview:** ${first20}\n**By:** <@${bookmark.author.id}> on ${date} in <#${bookmark.channel.id}> \n[Jump to Message](${bookmark.url})\n**ID:** ${bookmark.id}`);
        }
        interaction.editReply({
            embeds: [embed]
        });
    }

    @Slash("deletebookmarks", {
        description: "Delete a bookmark"
    })
    @Guard(NotBot, CommandEnabled())
    private async deleteBookmarks(
        @SlashOption("id", {
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
