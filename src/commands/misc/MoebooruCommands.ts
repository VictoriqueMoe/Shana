import {Client, DefaultPermissionResolver, Discord, Guard, Permission, Slash, SlashGroup, SlashOption} from "discordx";
import {Category} from "@discordx/utilities";
import {AbstractCommandModule} from "../AbstractCommandModule";
import {injectable} from "tsyringe";
import {NotBotInteraction} from "../../guards/NotABot";
import {CommandEnabled} from "../../guards/CommandEnabled";
import {CommandInteraction, MessageEmbed, TextChannel} from "discord.js";
import {KonachanApi} from "../../model/anime/Moebooru/KonachanApi";
import {Typeings} from "../../model/types/Typeings";
import {ArrayUtils, DiscordUtils, ObjectUtil} from "../../utils/Utils";
import InteractionUtils = DiscordUtils.InteractionUtils;
import KonachanResponse = Typeings.MoebooruTypes.KonachanResponse;
import EXPLICIT_RATING = Typeings.MoebooruTypes.EXPLICIT_RATING;

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

    public constructor(private _konachanApi: KonachanApi, private _client: Client) {
        super();
    }

    @Slash("konachan", {
        description: "Get random image from Konachan.net"
    })
    @Guard(NotBotInteraction, CommandEnabled)
    private async konachan(
        @SlashOption("tags", {
            description: "space sperated values of tags (words have _ aka `gothic lolita` is `gothic_lolita`)",
            required: true,
        })
            tags: string,
        interaction: CommandInteraction
    ): Promise<void> {
        await interaction.deferReply();
        const tagArray = tags.split(" ");
        const explicitRating = [EXPLICIT_RATING.safe];
        const channel = interaction.channel as TextChannel;
        if (channel.nsfw) {
            explicitRating.push(EXPLICIT_RATING.questionable);
        }
        let results: KonachanResponse;
        try {
            results = await this._konachanApi.getRandomPosts(tagArray, explicitRating);
        } catch (e) {
            return InteractionUtils.replyOrFollowUp(interaction, e.message);
        }

        if (!ArrayUtils.isValidArray(results)) {
            return InteractionUtils.replyOrFollowUp(interaction, `No results found for tags: "${tags}"`);
        }
        const embed = this.buildEmbed(results, tags);
        interaction.editReply({
            embeds: [embed]
        });
    }

    private buildEmbed(images: KonachanResponse, tags: string): MessageEmbed {
        const randomImage = images[0];
        const botAvatar = this._client.user.displayAvatarURL({dynamic: true});
        const embed = new MessageEmbed()
            .setTitle(tags)
            .setAuthor(`${this._client.user.username}`, botAvatar)
            .setColor(this._client.user.hexAccentColor)
            .setImage(randomImage.file_url)
            .setTimestamp();
        if (ObjectUtil.validString(randomImage.preview_url)) {
            embed.setThumbnail(randomImage.preview_url);
        }
        if (ObjectUtil.validString(randomImage.author)) {
            embed.addField("Author", randomImage.author);
        }
        if (ObjectUtil.validString(randomImage.source)) {
            embed.addField("Source", randomImage.source);
        }
        if (ObjectUtil.validString(randomImage.rating)) {
            embed.addField("Explicit rating", this.parseExplicitRating(randomImage.rating));
        }
        if (ObjectUtil.validString(randomImage.tags)) {
            embed.addField("Tags", randomImage.tags.split(" ").join(", "));
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