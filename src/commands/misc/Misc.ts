import {
    Client,
    ContextMenu,
    DefaultPermissionResolver,
    Discord,
    Guard,
    Permission,
    SimpleCommand,
    SimpleCommandMessage,
    Slash,
    SlashGroup,
    SlashOption
} from "discordx";
import {NotBotInteraction} from "../../guards/NotABot";
import {ArrayUtils, DiscordUtils, ObjectUtil, StringUtils} from "../../utils/Utils";
import {
    ColorResolvable,
    CommandInteraction,
    ContextMenuInteraction,
    ImageURLOptions,
    MessageAttachment,
    MessageEmbed
} from "discord.js";
import {TimedSet} from "../../model/Impl/TimedSet";
import {AnimeTractApi} from "../../model/anime/AnimeTractApi";
import {Response} from "../../model/anime/AnimeTypings";
import {secureCommandInteraction} from "../../guards/RoleConstraint";
import {AbstractCommandModule} from "../AbstractCommandModule";
import {DeepAPI} from "../../model/DeepAPI";
import {container, injectable} from "tsyringe";
import * as locale from 'locale-codes';
import {Category} from "@discordx/utilities";
import InteractionUtils = DiscordUtils.InteractionUtils;

const translate = require("deepl");
const Anilist = require('anilist-node');
const reverseImageSearch = require("node-reverse-image-search");
const getUrls = require('get-urls');
const isImageFast = require('is-image-fast');

@Discord()
@Category("Miscellaneous", "Miscellaneous commands")
@Category("Miscellaneous", [
    {
        "name": "findSource",
        "type": "SIMPLECOMMAND",
        "options": [],
        "attachments": [
            {
                "name": "image",
                "description": "The image to search",
                "optional": false,
                "type": "ATTACHMENT",
                "extensions": [
                    "jpg",
                    "png"
                ]
            }
        ],
        "description": "Perform a reverse image search"
    },
    {
        "name": "findAnime",
        "type": "SIMPLECOMMAND",
        "options": [],
        "attachments": [
            {
                "name": "Source",
                "description": "The source of the anime to look for, can be attachment or a reply to a message with ONE attachment\nPlease note: ONLY screenshots are allowed, please make sure there is NO border",
                "optional": false,
                "type": "ATTACHMENT",
                "extensions": [
                    "jpg",
                    "png"
                ]
            }
        ],
        "description": "Find anime source, including episode and preview"
    },
    {
        "name": "avatar",
        "type": "CONTEXT USER",
        "description": "Display a users avatar"
    },
    {
        "name": "translate",
        "type": "CONTEXT MESSAGE",
        "description": "Translate a message (to EN-GB)"
    },
    {
        "name": "banner",
        "type": "CONTEXT USER",
        "description": "Display a users profile banner"
    },
    {
        "name": "posOrNeg",
        "type": "SIMPLECOMMAND",
        "options": [
            {
                "name": "text",
                "description": "the text to analyse",
                "optional": false,
                "type": "STRING"
            }
        ],
        "description": "This algorithm classifies each sentence in the input as very negative, negative, neutral, positive, or very positive"
    },
    {
        "name": "generateText",
        "type": "SLASH",
        "options": [
            {
                "name": "text",
                "description": "the text to include",
                "optional": false,
                "type": "STRING"
            }
        ],
        "description": "The text generation API is backed by a large-scale unsupervised language model that can generate paragraphs of text."
    }
])
@SlashGroup("miscellaneous", "Miscellaneous commands")
@Permission(new DefaultPermissionResolver(AbstractCommandModule.getDefaultPermissionAllow))
@Permission(AbstractCommandModule.getPermissions)
@injectable()
export class Misc extends AbstractCommandModule {
    private static readonly coolDown = new TimedSet<AnimeQuery>(60000);
    private readonly animeTractApi = new AnimeTractApi();
    private readonly anilist = new Anilist();

    constructor(private _client: Client) {
        super();
    }

    @Slash("generatetext", {
        description: "The text generation is a large unsupervised language model that can generate paragraphs of text"
    })
    @Guard(NotBotInteraction, secureCommandInteraction)
    private async generateText(
        @SlashOption("value", {
            description: "the text to include in the generation",
            required: true
        })
            value: string,
        interaction: CommandInteraction
    ): Promise<void> {
        await interaction.deferReply();
        const deepAPI = container.resolve(DeepAPI);
        const resp = await deepAPI.textGeneration(value);
        await InteractionUtils.replyOrFollowUp(interaction, resp);
    }

    @SimpleCommand("posOrNeg")
    @Guard(NotBotInteraction, secureCommandInteraction)
    private async posOrNeg({message}: SimpleCommandMessage): Promise<void> {
        const reference = message.reference;
        let text = "";
        if (reference) {
            const repliedMessageObj = await message.channel.messages.fetch(reference.messageId);
            if (ObjectUtil.validString(repliedMessageObj.content)) {
                text = repliedMessageObj.content;
            }
        } else {
            const argumentArray = StringUtils.splitCommandLine(message.content);
            text = argumentArray[0];
        }
        if (!ObjectUtil.validString(text)) {
            message.reply(`Command arguments wrong, usage: ~posOrNeg "text" or reference a message with text`);
            return;
        }
        const deepAPI = container.resolve(DeepAPI);
        const resp = await deepAPI.sentimentAnalysis(text);
        message.reply(`This message is ${resp}`);
    }

    @ContextMenu("USER", "avatar")
    @Guard(NotBotInteraction, secureCommandInteraction)
    private async avatar(interaction: ContextMenuInteraction): Promise<void> {
        const ops: ImageURLOptions = {
            dynamic: true,
            size: 1024
        };
        const user = InteractionUtils.getUserFromUserContextInteraction(interaction);
        const avatarUrl = user.displayAvatarURL(ops);
        return interaction.reply({
            files: [avatarUrl]
        });
    }

    @ContextMenu("MESSAGE", "translate")
    @Guard(NotBotInteraction, secureCommandInteraction)
    private async translate(interaction: ContextMenuInteraction): Promise<void> {
        await interaction.deferReply({
            ephemeral: true
        });
        const message = await InteractionUtils.getMessageFromContextInteraction(interaction);
        const text = DiscordUtils.sanitiseTextForApiConsumption(message.content.trim());
        if (!ObjectUtil.validString(text)) {
            return InteractionUtils.replyOrFollowUp(interaction, "No text found");
        }
        const auth_key = process.env.deepl;
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
        const embed = new MessageEmbed()
            .setColor(displayHexColor)
            .addField("Result", result)
            .addField("Translated from", parsedLanguage)
            .setTimestamp();
        interaction.editReply({
            embeds: [embed]
        });
    }

    @ContextMenu("USER", "banner")
    @Guard(NotBotInteraction, secureCommandInteraction)
    private async banner(interaction: ContextMenuInteraction): Promise<void> {
        await interaction.deferReply();
        const ops: ImageURLOptions = {
            dynamic: true,
            size: 1024
        };
        const user = await InteractionUtils.getUserFromUserContextInteraction(interaction).fetch(true);
        const bannerUrl = (await user.user.fetch(true)).bannerURL(ops);
        if (!ObjectUtil.validString(bannerUrl)) {
            return InteractionUtils.replyOrFollowUp(interaction, "User has no banner", true);
        }
        await interaction.editReply({
            files: [bannerUrl]
        });
    }


    @SimpleCommand("findAnime")
    @Guard(NotBotInteraction, secureCommandInteraction)
    private async findAnime({message}: SimpleCommandMessage): Promise<void> {
        const freshHold = 0.86;
        const messaheUrls = await DiscordUtils.getImageUrlsFromMessageOrReference(message);
        if (messaheUrls.size > 1) {
            message.reply("Please only supply ONE image");
            return;
        }
        if (Misc.coolDown.isEmpty()) {
            const entry = new AnimeQuery();
            Misc.coolDown.add(entry);
        } else {
            const entry = Misc.coolDown.values().next().value as AnimeQuery;
            entry.increment();
            if (entry.timesQueries >= 10) {
                message.reply("Please wait 1 min before using this command again");
                return;
            }
        }
        const replyMessage = await message.reply("Finding anime, please wait...");
        let resp: Response = null;
        const url: string = messaheUrls.values().next().value;
        try {
            resp = await this.animeTractApi.fetchAnime(url);
        } catch (e) {
            console.error(e);
        }

        if (!ObjectUtil.isValidObject(resp) || ObjectUtil.validString(resp.error)) {
            replyMessage.delete();
            if (ObjectUtil.isValidObject(resp)) {
                message.reply(resp.error);
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
        const aniDbRes = await this.anilist.media.anime(anilist);
        const {
            isAdult,
            title
        } = aniDbRes;
        const botAvatar = this._client.user.displayAvatarURL({dynamic: true});
        const humanAt = new Date(from * 1000).toISOString().substr(11, 8);
        if (isAdult || similarity < freshHold) {
            replyMessage.delete();
            message.reply("No results found...");
            return;
        }
        let mainTitle = title.romaji;
        const embed = new MessageEmbed()
            .setTitle(`${title.romaji}`)
            .setAuthor(`${this._client.user.username}`, botAvatar)
            .setThumbnail(url)
            .setColor('#0099ff')
            .addField("Episode and timestamp this scene is from", `Episode: ${episode} at: ${humanAt}`)
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
            if (ArrayUtils.isValidArray(airingDates)) {
                const nextEp = airingDates[0];
                embed.addField("Next episode airing date", `${new Date(nextEp.airingAt)}\nNext episode: ${nextEp.episode}`);
            }
        }
        try {
            const previewBuffer = await this.animeTractApi.fetchPreview(video);
            await replyMessage.delete();
            const file = new MessageAttachment(previewBuffer, `${mainTitle}.mp4`);
            await message.reply({
                embeds: [embed],
                files: [file]
            });
        } catch {
        }
    }

    private toYMD({day, month, year}: { year: number, month: number, day: number }): string {
        return `${year}/${month}/${day}`;
    }


    @SimpleCommand("findSource")
    @Guard(NotBotInteraction, secureCommandInteraction)
    private async imageSearch({message}: SimpleCommandMessage): Promise<void> {
        type GoogleImageResult = {
            url?: string,
            title: string
        }[];
        const promiseWrapper = async (url: string): Promise<GoogleImageResult> => {
            return new Promise((resolve, reject) => reverseImageSearch(url, resolve));
        };

        const messageReference = message.reference;
        let messageAttachments = null;
        let imageUrl: string = null;

        if (messageReference) {
            const repliedMessageObj = await message.channel.messages.fetch(messageReference.messageId);
            const repliedMessageContent = repliedMessageObj.content;
            const repliedMessageAttachments = repliedMessageObj.attachments;

            const repliedMessageUrls = getUrls(repliedMessageContent);
            if (repliedMessageUrls && repliedMessageUrls.size === 1) {
                imageUrl = repliedMessageUrls.values().next().value;
            } else if (repliedMessageAttachments && repliedMessageAttachments.size === 1) {
                messageAttachments = repliedMessageAttachments;
            }
        }
        if (message.attachments && message.attachments.size === 1) {
            messageAttachments = message.attachments;
        }
        if (messageAttachments && messageAttachments.size === 1) {
            const firstAttach = messageAttachments.array()[0];
            imageUrl = firstAttach.attachment as string;
        } else if (ObjectUtil.validString(message.content)) {
            const messageContentUrl = getUrls(message.content);
            if (messageContentUrl && messageContentUrl.size === 1) {
                imageUrl = messageContentUrl.values().next().value;
            }
        }

        if (!ObjectUtil.validString(imageUrl)) {
            message.reply("Please make sure you supply ONE image, if you are replying to a message, please make sure that message only has a single image");
            return;
        }
        const isImage: boolean = await isImageFast(imageUrl);
        if (!isImage) {
            message.reply("Attachment was not an image");
            return;
        }
        const result = await promiseWrapper(imageUrl);
        if (result.length === 0 || result.length === 1) {
            message.reply("No results found for this image");
            return;
        }
        const title = result[0].title;
        const botAvarar = this._client.user.displayAvatarURL({dynamic: true});
        const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle(`top ${result.length - 1} ${title}`)
            .setAuthor(`${this._client.user.username}`, botAvarar)
            .setThumbnail(imageUrl)
            .setTimestamp();
        for (let i = 1; i < result.length; i++) {
            const entry = result[i];
            embed.addField(entry.title, entry.url);
        }
        message.reply({
            embeds: [embed]
        });
    }
}

class AnimeQuery {
    public constructor(public timesQueries: number = 1) {
    }

    public increment(): void {
        this.timesQueries++;
    }
}