import {Discord, Guard, Slash, SlashGroup, SlashOption} from "discordx";
import {Category, NotBot} from "@discordx/utilities";
import {DiscordUtils, ObjectUtil} from "../../utils/Utils.js";
import {ApplicationCommandOptionType, AutocompleteInteraction, CommandInteraction, EmbedBuilder} from "discord.js";
import {injectable} from "tsyringe";
import {NotesManager} from "../../model/framework/manager/NotesManager.js";
import InteractionUtils = DiscordUtils.InteractionUtils;

@Discord()
@Category("Members")
@SlashGroup({
    name: "notes",
    description: "Commands to manage your personal notes",
})
@SlashGroup("notes")
@injectable()
export class Notes {
    public constructor(private _notesManager: NotesManager) {
    }

    @Slash({
        name: "add_note",
        description: "Add a private note"
    })
    @Guard(NotBot)
    private async addNote(
        @SlashOption({
            name: "title",
            type: ApplicationCommandOptionType.String,
            description: "Unique title for this note",
        })
            title: string,
        @SlashOption({
            type: ApplicationCommandOptionType.String,
            name: "value",
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

    @Slash({
        name: "edit_note",
        description: "modify a note"
    })
    @Guard(NotBot)
    private async editNote(
        @SlashOption({
            name: "title",
            description: "The note to modify",
            type: ApplicationCommandOptionType.String,
            autocomplete: (interaction: AutocompleteInteraction) => ObjectUtil.search(interaction, NotesManager),
        })
            title: string,
        @SlashOption({
            name: "value",
            type: ApplicationCommandOptionType.String,
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

    @Slash({
        name: "get_notes",
        description: "Get all of your private notes"
    })
    @Guard(NotBot)
    private async getNotes(
        @SlashOption({
            name: "title",
            description: "title of the note to get",
            type: ApplicationCommandOptionType.String,
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
        const embed = new EmbedBuilder()
            .setAuthor({
                name: member.displayName,
                iconURL: member.avatarURL()
            })
            .setTitle(`Your note(s)`)
            .setTimestamp();
        if (!ObjectUtil.isValidArray(notes)) {
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

    @Slash({
        name: "dele_tenote",
        description: "Delete a note"
    })
    @Guard(NotBot)
    private async deleteNote(
        @SlashOption({
            name: "title",
            description: "title of the note to delete",
            type: ApplicationCommandOptionType.String,
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
