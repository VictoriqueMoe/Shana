import {DefaultPermissionResolver, Discord, Guard, Permission, Slash, SlashGroup, SlashOption} from "discordx";
import {Category} from "@discordx/utilities";
import {AbstractCommandModule} from "../AbstractCommandModule";
import {injectable} from "tsyringe";
import {NotBotInteraction} from "../../guards/NotABot";
import {CommandEnabled} from "../../guards/CommandEnabled";
import {CommandInteraction} from "discord.js";
import {KonachanApi} from "../../model/anime/Moebooru/KonachanApi";
import {Typeings} from "../../model/types/Typeings";
import {DiscordUtils} from "../../utils/Utils";
import EXPLICIT_RATING = Typeings.MoebooruTypes.EXPLICIT_RATING;
import InteractionUtils = DiscordUtils.InteractionUtils;

@Discord()
@Category("moebooru", "Commands to get waifus\nAll images are SFW")
@Category("moebooru", [
    {
        "name": "Konachan",
        "type": "SLASH",
        "description": "Get random image from Konachan.net",
        options: [{
            name: "tags",
            description: "space sperated values of tags (words have _ aka `gothic lolita` is `gothic_lolita`)",
            type: "STRING",
            optional: false
        }],
        examples: ["`/Konachan gosick gothic_lolita` will result in the tags `gosick` AND `gothic lolita`"]
    }
])
@SlashGroup("moebooru", "Commands to get waifus")
@Permission(new DefaultPermissionResolver(AbstractCommandModule.getDefaultPermissionAllow))
@Permission(AbstractCommandModule.getPermissions)
@injectable()
export class MoebooruCommands extends AbstractCommandModule {

    public constructor(private _konachanApi: KonachanApi) {
        super();
    }

    @Slash("konachan", {
        description: "Get random image from Konachan.net"
    })
    @Guard(NotBotInteraction, CommandEnabled)
    private async getbookmark(
        @SlashOption("tags", {
            description: "space sperated values of tags (words have _ aka `gothic lolita` is `gothic_lolita`)",
            required: true,
        })
            tags: string,
        interaction: CommandInteraction
    ): Promise<void> {
        await interaction.deferReply();
        const tagArray = tags.split(" ");
        const result = await this._konachanApi.getPost(tagArray, [EXPLICIT_RATING.safe, EXPLICIT_RATING.questionable]);
        InteractionUtils.replyOrFollowUp(interaction, "foo");
    }
}