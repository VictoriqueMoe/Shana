import {Category, NotBot, RateLimit, TIME_UNIT} from "@discordx/utilities";
import {
    ApplicationCommandOptionType,
    ApplicationCommandType,
    Attachment,
    AttachmentBuilder,
    ColorResolvable,
    CommandInteraction,
    EmbedBuilder,
    GuildMember,
    InteractionResponse,
    MessageContextMenuCommandInteraction,
    UserContextMenuCommandInteraction
} from "discord.js";
import {Client, ContextMenu, Discord, Guard, Slash, SlashGroup, SlashOption} from "discordx";
import {ImageURLOptions} from "@discordjs/rest";
import translate from "deepl";
import {DiscordUtils, ObjectUtil} from "../../utils/Utils.js";
import {Property} from "../../model/framework/decorators/Property.js";
import {injectable} from "tsyringe";
import Anilist from "anilist-node";
import {AnimeTractApi} from "../../model/anime/AnimeTractApi.js";
import * as locale from 'locale-codes';
import reverseImageSearch from "node-reverse-image-search";
import isImageFast from "is-image-fast";
import {Response} from "../../model/anime/AnimeTypings";
import {AttachmentAllowedFileTypes} from "../../guards/AttachmentAllowedFileTypes.js";
import logger from "../../utils/LoggerFactory.js";
import InteractionUtils = DiscordUtils.InteractionUtils;

@Discord()
@Category("Fun")
@SlashGroup({
    name: "miscellaneous",
    description: "Miscellaneous commands",
    dmPermission: false
})
@SlashGroup("miscellaneous")
@injectable()
export class Misc {

    @Property("DEEPL")
    private readonly deepl: string;

    public constructor(
        private _client: Client,
        private _animeTractApi: AnimeTractApi,
        private _anilist: Anilist
    ) {
    }


    @ContextMenu({
        name: "translate",
        type: ApplicationCommandType.Message
    })
    @Guard(NotBot)
    private async translate(interaction: MessageContextMenuCommandInteraction): Promise<void> {
        await interaction.deferReply({
            ephemeral: true
        });
        const message = await InteractionUtils.getMessageFromContextInteraction(interaction);
        const text = DiscordUtils.sanitiseTextForApiConsumption(message.content.trim());
        if (!ObjectUtil.validString(text)) {
            return InteractionUtils.replyOrFollowUp(interaction, "No text found");
        }
        const auth_key = this.deepl;
        const response = await translate({
            free_api: true,
            text,
            target_lang: 'EN-GB',
            auth_key
        });
        const {data, status, statusText} = response;
        if (status !== 200) {
            return InteractionUtils.replyOrFollowUp(interaction, statusText);
        }
        const translation = data.translations[0];
        const sourceLanguage = translation.detected_source_language;
        const result = translation.text;
        const caller = InteractionUtils.getInteractionCaller(interaction);
        let parsedLanguage = sourceLanguage;
        try {
            const parsedLocale = locale.getByTag(sourceLanguage);
            const {location, name} = parsedLocale;
            parsedLanguage = name;
            if (ObjectUtil.validString(location)) {
                parsedLanguage += ` (${location})`;
            }
        } catch {

        }
        let displayHexColor: ColorResolvable = '#337FD5';
        if (caller) {
            displayHexColor = caller.displayHexColor;
        }
        const embed = new EmbedBuilder()
            .setColor(displayHexColor)
            .addFields([
                {
                    name: "Result",
                    value: result,
                },
                {
                    name: "Translated from",
                    value: parsedLanguage
                }
            ])
            .setTimestamp();
        interaction.editReply({
            embeds: [embed]
        });
    }

    @ContextMenu({
        type: ApplicationCommandType.User
    })
    @Guard(NotBot)
    private avatar(interaction: UserContextMenuCommandInteraction): Promise<InteractionResponse> {
        const ops: ImageURLOptions = {
            size: 1024
        };
        let userAvatarUrl: string;
        const member = interaction.targetMember;
        if (member instanceof GuildMember) {
            userAvatarUrl = member.displayAvatarURL(ops);
        } else {
            userAvatarUrl = interaction.targetUser.avatarURL(ops);
        }
        return interaction.reply({
            files: [userAvatarUrl]
        });
    }

    @ContextMenu({
        type: ApplicationCommandType.User
    })
    @Guard(NotBot)
    private async banner(interaction: UserContextMenuCommandInteraction): Promise<void> {
        await interaction.deferReply();
        const ops: ImageURLOptions = {
            size: 1024
        };
        const bannerUrl = (await interaction.targetUser.fetch(true)).bannerURL(ops);
        if (!ObjectUtil.validString(bannerUrl)) {
            return InteractionUtils.replyOrFollowUp(interaction, {
                content: "User has no banner",
                ephemeral: true
            });
        }
        await interaction.editReply({
            files: [bannerUrl]
        });
    }


    @Slash({
        description: "Find an anime from an anime screenshot",
        name: "find_anime"
    })
    @Guard(NotBot,
        AttachmentAllowedFileTypes(["jpg", "png"], "screenshot"),
        RateLimit(TIME_UNIT.minutes, 1, {
            message: "Please wait 1 min before using this command again"
        }))
    private async findAnime(
        @SlashOption({
            name: "screenshot",
            type: ApplicationCommandOptionType.Attachment,
            description: "The user to display the banner",
            required: true
        })
            attachment: Attachment,
        interaction: CommandInteraction
    ): Promise<void> {
        await interaction.deferReply();
        const freshHold = 0.86;
        let resp: Response = null;
        const url = attachment.url;
        try {
            resp = await this._animeTractApi.fetchAnime(url);
        } catch (e) {
            logger.error(e);
        }

        if (!ObjectUtil.isValidObject(resp) || ObjectUtil.validString(resp.error)) {
            if (ObjectUtil.isValidObject(resp)) {
                InteractionUtils.replyOrFollowUp(interaction, resp.error);
            }
            return;
        }
        const {
            anilist,
            video,
            episode,
            similarity,
            from
        } = resp.result[0];
        const aniDbRes = await this._anilist.media.anime(anilist);
        const {
            isAdult,
            title
        } = aniDbRes;
        const botAvatar = this._client.user.displayAvatarURL();
        const humanAt = new Date(from * 1000).toISOString().substr(11, 8);
        if (isAdult || similarity < freshHold) {
            return InteractionUtils.replyOrFollowUp(interaction, "No results found...");
        }
        let mainTitle = title.romaji;
        const embed = new EmbedBuilder()
            .setTitle(`${title.romaji}`)
            .setAuthor({
                name: `${this._client.user.username}`,
                iconURL: botAvatar
            })
            .setThumbnail(url)
            .setColor('#0099ff')
            .addFields(ObjectUtil.singleFieldBuilder("Episode and timestamp this scene is from", `Episode: ${episode} at: ${humanAt}`))
            .setTimestamp();
        if (ObjectUtil.validString(title.english)) {
            embed.setTitle(`${title.english} [${title.romaji}]`);
            mainTitle = `${title.english} [${title.romaji}]`;
        }
        if (ObjectUtil.isValidObject(aniDbRes)) {
            const coverImage = aniDbRes.coverImage;
            embed.setURL(aniDbRes.siteUrl);
            embed.setDescription(aniDbRes.description.replace(/\s?(<br\s?\/?>)\s?/g, "\n"));
            embed.setImage(coverImage.medium);
            embed.addFields([
                {
                    name: "Genre",
                    value: aniDbRes.genres.join(", ")
                },
                {
                    name: "Episodes",
                    value: String(aniDbRes.episodes)
                },
                {
                    name: "Start date",
                    value: this.toYMD(aniDbRes.startDate),
                    inline: true
                },
                {
                    name: "End date",
                    value: this.toYMD(aniDbRes.endDate),
                    inline: true
                }
            ]);
            const airingDates = aniDbRes.nextAiringEpisode;
            if (ObjectUtil.isValidArray(airingDates)) {
                const nextEp = airingDates[0];
                embed.addFields(ObjectUtil.singleFieldBuilder("Next episode airing date", `${new Date(nextEp.airingAt)}\nNext episode: ${nextEp.episode}`));
            }
        }
        try {
            const previewBuffer = await this._animeTractApi.fetchPreview(video);
            const file = new AttachmentBuilder(previewBuffer, {
                name: `${mainTitle}.mp4`
            });
            return InteractionUtils.replyOrFollowUp(interaction, {
                embeds: [embed],
                files: [file]
            });
        } catch {
        }
    }

    private toYMD({day, month, year}: { year: number, month: number, day: number }): string {
        return `${year}/${month}/${day}`;
    }


    @Slash({
        description: "Reverse image search",
        name: "find_source"
    })
    @Guard(NotBot)
    private async findSource(
        @SlashOption({
            name: "image",
            type: ApplicationCommandOptionType.Attachment,
            description: "Image you want to reverse search",
            required: true
        })
            attatchment: Attachment,
        interaction: CommandInteraction
    ): Promise<void> {
        await interaction.deferReply();
        type GoogleImageResult = {
            url?: string,
            title: string
        }[];
        const promiseWrapper = (url: string): Promise<GoogleImageResult> => {
            return new Promise(resolve => reverseImageSearch(url, resolve));
        };

        const imageUrl = attatchment.url;

        const isImage: boolean = await isImageFast(imageUrl);
        if (!isImage) {
            return InteractionUtils.replyOrFollowUp(interaction, "Attachment was not an image");
        }
        const result = await promiseWrapper(imageUrl);
        if (result.length === 0 || result.length === 1) {
            return InteractionUtils.replyOrFollowUp(interaction, "No results found for this image");
        }
        const title = result[0].title;
        const botAvatar = this._client.user.displayAvatarURL();
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`top ${result.length - 1} ${title}`)
            .setAuthor({
                name: `${this._client.user.username}`,
                iconURL: botAvatar
            })
            .setThumbnail(imageUrl)
            .setTimestamp();
        for (let i = 1; i < result.length; i++) {
            const entry = result[i];
            embed.addFields(ObjectUtil.singleFieldBuilder(entry.title, entry.url));
        }
        InteractionUtils.replyOrFollowUp(interaction, {
            embeds: [embed]
        });
    }
}
