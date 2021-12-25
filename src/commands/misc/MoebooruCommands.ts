import {
    Client,
    DApplicationCommand,
    DefaultPermissionResolver,
    Discord,
    Guard,
    Permission,
    Slash,
    SlashGroup,
    SlashOption
} from "discordx";
import {Category} from "@discordx/utilities";
import {AbstractCommandModule} from "../AbstractCommandModule";
import {container, injectable} from "tsyringe";
import {NotBotInteraction} from "../../guards/NotABot";
import {CommandEnabled} from "../../guards/CommandEnabled";
import {AutocompleteInteraction, CommandInteraction, MessageEmbed, TextChannel} from "discord.js";
import {Typeings} from "../../model/types/Typeings";
import {ArrayUtils, DiscordUtils, ObjectUtil, StringUtils} from "../../utils/Utils";
import {KonachanApi} from "../../model/anime/Moebooru/impl/KonachanApi";
import {LolibooruApi} from "../../model/anime/Moebooru/impl/LolibooruApi";
import {MoebooruApi, RandomImageResponse} from "../../model/anime/Moebooru/MoebooruApi";
import InteractionUtils = DiscordUtils.InteractionUtils;
import EXPLICIT_RATING = Typeings.MoebooruTypes.EXPLICIT_RATING;
import MoebooruTag = Typeings.MoebooruTypes.MoebooruTag;

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
    },
    {
        "name": "Lolibooru",
        "type": "SLASH",
        "description": "Get random image from lolibooru.moe",
        options: [{
            name: "tags",
            description: "space sperated values of tags (words have _ aka `gothic lolita` is `gothic_lolita`)",
            type: "STRING",
            optional: false
        }],
        examples: ["`/lolibooru gosick gothic_lolita` will result in the tags `gosick` AND `gothic lolita`"]
    }
])
@SlashGroup("moebooru", "Commands to get waifus")
@Permission(new DefaultPermissionResolver(AbstractCommandModule.getDefaultPermissionAllow))
@Permission(AbstractCommandModule.getPermissions)
@injectable()
export class MoebooruCommands extends AbstractCommandModule {

    public constructor(private _konachanApi: KonachanApi,
                       private _lolibooruApi: LolibooruApi,
                       private _client: Client) {
        super();
    }

    @Slash("lolibooru", {
        description: "Get random image from lolibooru.moe"
    })
    @Guard(NotBotInteraction, CommandEnabled)
    private async lolibooru(
        @SlashOption("tags", {
            description: "space sperated values of tags (words have _ aka `gothic lolita` is `gothic_lolita`)",
            type: 'STRING',
            autocomplete: (interaction: AutocompleteInteraction, command: DApplicationCommand) => ObjectUtil.search(interaction, command, container.resolve(LolibooruApi))
        })
            tags: string,
        interaction: CommandInteraction
    ): Promise<void> {
        await interaction.deferReply();
        return this.executeInteraction(interaction, tags, this._lolibooruApi);
    }


    @Slash("konachan", {
        description: "Get random image from Konachan.net"
    })
    @Guard(NotBotInteraction, CommandEnabled)
    private async konachan(
        @SlashOption("tags", {
            description: "space sperated values of tags (words have _ aka `gothic lolita` is `gothic_lolita`)",
            type: 'STRING',
            autocomplete: (interaction: AutocompleteInteraction, command: DApplicationCommand) => ObjectUtil.search(interaction, command, container.resolve(KonachanApi))
        })
            tags: string,
        interaction: CommandInteraction
    ): Promise<void> {
        await interaction.deferReply();
        return this.executeInteraction(interaction, tags, this._konachanApi);
    }

    private async executeInteraction<T extends MoebooruTag>(interaction: CommandInteraction, tags: string, manager: MoebooruApi<T>): Promise<void> {
        if (!await manager.enabled) {
            return InteractionUtils.replyOrFollowUp(interaction, "Command is not enabled");
        }
        const tagArray = tags.split(" ");
        const explicitRating = [EXPLICIT_RATING.safe];
        const channel = interaction.channel as TextChannel;
        if (channel.nsfw) {
            explicitRating.push(EXPLICIT_RATING.questionable);
        }
        let results: RandomImageResponse;
        try {
            results = await manager.getRandomPosts(tagArray, explicitRating);
        } catch (e) {
            return InteractionUtils.replyOrFollowUp(interaction, e.message);
        }
        if (!ArrayUtils.isValidArray(results)) {
            return InteractionUtils.replyOrFollowUp(interaction, `No results found for tags: "\`${tags}\`"`);
        }
        const {of, maxPossible} = results[0];
        const embed = this.buildEmbed(results, tags);
        interaction.editReply({
            content: `picked image ${of} out of a possible ${maxPossible}`,
            embeds: [embed]
        });
    }

    private buildEmbed(images: RandomImageResponse, tags: string): MessageEmbed {
        const randomImage = images[0].image;
        const botAvatar = this._client.user.displayAvatarURL({dynamic: true});
        const embed = new MessageEmbed()
            .setTitle(tags)
            .setAuthor(`${this._client.user.username}`, botAvatar)
            .setColor(this._client.user.hexAccentColor)
            .setImage(encodeURI(randomImage.file_url))
            .setTimestamp();
        if (ObjectUtil.validString(randomImage.preview_url)) {
            embed.setThumbnail(encodeURI(randomImage.preview_url));
        }
        if (ObjectUtil.validString(randomImage.author)) {
            embed.addField("Author", randomImage.author);
        }
        if (ObjectUtil.validString(randomImage.source)) {
            embed.addField("Source", encodeURI(randomImage.source));
        }
        if (ObjectUtil.validString(randomImage.rating)) {
            embed.addField("Explicit rating", this.parseExplicitRating(randomImage.rating));
        }
        if (ObjectUtil.validString(randomImage.tags)) {
            let tags = randomImage.tags.split(" ").join(", ");
            tags = StringUtils.truncate(tags, 1024);
            embed.addField("Tags", tags);
        }
        if (typeof randomImage.created_at === "number") {
            embed.addField("Image created", new Date(randomImage.created_at * 1000).toISOString());
        }
        return embed;
    }

    private parseExplicitRating(rating: "s" | "q" | "e"): "explicit" | "questionable" | "safe" {
        switch (rating) {
            case "e":
                return "explicit";
            case "q":
                return "questionable";
            case "s":
                return "safe";
            default:
                return "explicit";
        }
    }
}