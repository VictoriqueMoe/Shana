import {AbstractCommand} from "../AbstractCommand";
import {DefaultPermissionResolver, Discord, Guard, Permission, Slash, SlashGroup, SlashOption} from "discordx";
import {injectable} from "tsyringe";
import {NotesManager} from "../../model/framework/manager/NotesManager";
import {NotBot} from "@discordx/utilities";
import {CommandEnabled} from "../../guards/CommandEnabled";
import type {AutocompleteInteraction, CommandInteraction} from "discord.js";
import {MessageEmbed} from "discord.js";
import {Category} from "../../modules/category";
import {ArrayUtils, DiscordUtils, ObjectUtil} from "../../utils/Utils";
import InteractionUtils = DiscordUtils.InteractionUtils;

@Discord()
@Category("Notes", "Commands to manage your personal notes")
@Category("Notes", [
    {
        "name": "add Note",
        "type": "SLASH",
        "options": [
            {
                "name": "title",
                "description": "Unique title for this note",
                "optional": false,
                "type": "STRING"
            },
            {
                "name": "value",
                "description": "The text for this note",
                "optional": false,
                "type": "STRING"
            }
        ],
        "description": "Add a private note"
    },
    {
        "name": "edit Note",
        "type": "SLASH",
        "options": [
            {
                "name": "title",
                "description": "The note to modify",
                "optional": false,
                "type": "STRING"
            },
            {
                "name": "value",
                "description": "the new text",
                "optional": false,
                "type": "STRING"
            }
        ],
        "description": "modify a note"
    },
    {
        "name": "delete Note",
        "type": "SLASH",
        "options": [
            {
                "name": "title",
                "description": "title of the note to delete",
                "optional": false,
                "type": "STRING"
            }
        ],
        "description": "Delete a note"
    },
    {
        "name": "get Notes",
        "type": "SLASH",
        "options": [
            {
                "name": "title",
                "description": "title of the note to delete",
                "optional": false,
                "type": "STRING"
            }
        ],
        "description": "Get all of your private notes"
    },
])
@SlashGroup({
    name: "notes",
    description: "Commands to manage your personal notes",
})
@SlashGroup("notes")
@Permission(new DefaultPermissionResolver(AbstractCommand.getDefaultPermissionAllow))
@Permission(AbstractCommand.getPermissions)
@injectable()
export class Notes extends AbstractCommand {
    public constructor(private _notesManager: NotesManager) {
        super();
    }

    @Slash("addnote", {
        description: "Add a private note"
    })
    @Guard(NotBot, CommandEnabled())
    private async addNote(
        @SlashOption("title", {
            description: "Unique title for this note",
        })
            title: string,
        @SlashOption("value", {
            description: "The text for this note",
        })
            value: string,
        interaction: CommandInteraction
    ): Promise<void> {
        await interaction.deferReply({
            ephemeral: true
        });
        const member = InteractionUtils.getInteractionCaller(interaction);
        try {
            await this._notesManager.addOrUpdateNote(member, title, value);
        } catch {
            return InteractionUtils.replyOrFollowUp(interaction, `Note: "${title}" already exists`);
        }
        return InteractionUtils.replyOrFollowUp(interaction, `Note: "${title}" has been created`);
    }

    @Slash("editnote", {
        description: "modify a note"
    })
    @Guard(NotBot, CommandEnabled())
    private async editNote(
        @SlashOption("title", {
            description: "The note to modify",
            type: "STRING",
            autocomplete: (interaction: AutocompleteInteraction) => ObjectUtil.search(interaction, NotesManager),
        })
            title: string,
        @SlashOption("value", {
            description: "the new text",
        })
            value: string,
        interaction: CommandInteraction
    ): Promise<void> {
        await interaction.deferReply({
            ephemeral: true
        });
        const member = InteractionUtils.getInteractionCaller(interaction);
        try {
            await this._notesManager.addOrUpdateNote(member, title, value, true);
        } catch (e) {
            return InteractionUtils.replyOrFollowUp(interaction, e.message);
        }
        return InteractionUtils.replyOrFollowUp(interaction, `Note: "${title}" has been modified`);
    }

    @Slash("getnotes", {
        description: "Get all of your private notes"
    })
    @Guard(NotBot, CommandEnabled())
    private async getNotes(
        @SlashOption("title", {
            description: "title of the note to get",
            type: "STRING",
            autocomplete: (interaction: AutocompleteInteraction) => ObjectUtil.search(interaction, NotesManager),
            required: false,
        })
            title: string,
        interaction: CommandInteraction
    ): Promise<void> {
        await interaction.deferReply({
            ephemeral: true
        });
        const member = InteractionUtils.getInteractionCaller(interaction);
        const notes = await this._notesManager.getNotes(member, title);
        const embed = new MessageEmbed()
            .setAuthor(member.displayName, member.avatarURL({dynamic: true}))
            .setTitle(`Your note(s)`)
            .setTimestamp();
        if (!ArrayUtils.isValidArray(notes)) {
            embed.setDescription("You do not have any notes");
        } else {
            for (const note of notes) {
                const {name, text, createdAt} = note;
                embed.addFields([
                    {
                        name,
                        value: text
                    },
                    {
                        name: "Created",
                        value: `<t:${Math.round(createdAt.getTime() / 1000)}:F>`
                    }
                ]);
            }
        }
        interaction.editReply({
            embeds: [embed]
        });
    }

    @Slash("deletenote", {
        description: "Delete a note"
    })
    @Guard(NotBot, CommandEnabled())
    private async deleteNote(
        @SlashOption("title", {
            description: "title of the note to delete",
            type: "STRING",
            autocomplete: (interaction: AutocompleteInteraction) => ObjectUtil.search(interaction, NotesManager),
            required: false,
        })
            title: string,
        interaction: CommandInteraction
    ): Promise<void> {
        await interaction.deferReply({
            ephemeral: true
        });
        const member = InteractionUtils.getInteractionCaller(interaction);
        const didRemove = await this._notesManager.removeNote(member, title);
        if (!didRemove) {
            return InteractionUtils.replyOrFollowUp(interaction, `Could not delete note with title: "${title}"`);
        }
        return InteractionUtils.replyOrFollowUp(interaction, `Note: "${title}" has been deleted`);
    }
}
