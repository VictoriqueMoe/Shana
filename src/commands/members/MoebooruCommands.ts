import {Category, NotBot} from "@discordx/utilities";
import {
    ApplicationCommandOptionType,
    AutocompleteInteraction,
    CommandInteraction,
    EmbedBuilder,
    TextChannel
} from "discord.js";
import {KonachanApi} from "../../model/anime/Moebooru/impl/KonachanApi.js";
import {LolibooruApi} from "../../model/anime/Moebooru/impl/LolibooruApi.js";
import {Client, Discord, Guard, Slash, SlashGroup, SlashOption} from "discordx";
import {DiscordUtils, ObjectUtil} from "../../utils/Utils.js";
import {MoebooruApi, RandomImageResponse} from "../../model/anime/Moebooru/MoebooruApi.js";
import {injectable} from "tsyringe";
import {Typeings} from "../../model/Typeings.js";
import InteractionUtils = DiscordUtils.InteractionUtils;
import EXPLICIT_RATING = Typeings.MoebooruTypes.EXPLICIT_RATING;
import MoebooruTag = Typeings.MoebooruTypes.MoebooruTag;

@Discord()
@Category("Fun")
@SlashGroup({
    name: "moebooru",
    description: "Commands to get waifus",
})
@SlashGroup("moebooru")
@injectable()
export class MoebooruCommands {

    public constructor(private _konachanApi: KonachanApi,
                       private _lolibooruApi: LolibooruApi,
                       private _client: Client) {
    }

    @Slash({
        description: "Get random image from lolibooru.moe"
    })
    @Guard(NotBot)
    private async lolibooru(
        @SlashOption({
            name: "tags",
            description: "space seperated values of tags (words have _ aka `gothic lolita` is `gothic_lolita`)",
            type: ApplicationCommandOptionType.String,
            autocomplete: (interaction: AutocompleteInteraction) => ObjectUtil.search(interaction, LolibooruApi)
        })
            tags: string,
        interaction: CommandInteraction
    ): Promise<void> {
        await interaction.deferReply();
        return this.executeInteraction(interaction, tags, this._lolibooruApi);
    }


    @Slash({
        description: "Get random image from Konachan.net"
    })
    @Guard(NotBot)
    private async konachan(
        @SlashOption({
            name: "tags",
            description: "space sperated values of tags (words have _ aka `gothic lolita` is `gothic_lolita`)",
            type: ApplicationCommandOptionType.String,
            autocomplete: (interaction: AutocompleteInteraction) => ObjectUtil.search(interaction, KonachanApi)
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
        if (!ObjectUtil.isValidArray(results)) {
            return InteractionUtils.replyOrFollowUp(interaction, `No results found for tags: "\`${tags}\`"`);
        }
        const {of, maxPossible} = results[0];
        const embed = this.buildEmbed(results, tags);
        interaction.editReply({
            content: `picked image ${of} out of a possible ${maxPossible}`,
            embeds: [embed]
        });
    }

    private buildEmbed(images: RandomImageResponse, tags: string): EmbedBuilder {
        const randomImage = images[0].image;
        const botAvatar = this._client.user.displayAvatarURL();
        const embed = new EmbedBuilder()
            .setTitle(tags)
            .setAuthor({
                name: `${this._client.user.username}`,
                iconURL: botAvatar
            })
            .setImage(encodeURI(randomImage.file_url))
            .setTimestamp();
        if (ObjectUtil.validString(randomImage.preview_url)) {
            embed.setThumbnail(encodeURI(randomImage.preview_url));
        }
        if (ObjectUtil.validString(randomImage.author)) {
            embed.addFields(ObjectUtil.singleFieldBuilder("Author", randomImage.author));
        }
        if (ObjectUtil.validString(randomImage.source)) {
            embed.addFields(ObjectUtil.singleFieldBuilder("Source", encodeURI(randomImage.source)));
        }
        if (ObjectUtil.validString(randomImage.rating)) {
            embed.addFields(ObjectUtil.singleFieldBuilder("Explicit rating", this.parseExplicitRating(randomImage.rating)));
        }
        if (ObjectUtil.validString(randomImage.tags)) {
            let tags = randomImage.tags.split(" ").join(", ");
            tags = ObjectUtil.truncate(tags, 1024);
            embed.addFields(ObjectUtil.singleFieldBuilder("Tags", tags));
        }
        if (typeof randomImage.created_at === "number") {
            embed.addFields(ObjectUtil.singleFieldBuilder("Image created", new Date(randomImage.created_at * 1000).toISOString()));
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
