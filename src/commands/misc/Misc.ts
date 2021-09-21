import {Discord, Guard, SimpleCommand, SimpleCommandMessage, Slash, SlashGroup, SlashOption} from "discordx";
import {NotBotInteraction} from "../../guards/NotABot";
import {ArrayUtils, DiscordUtils, ObjectUtil, StringUtils} from "../../utils/Utils";
import {CommandInteraction, GuildMember, ImageURLOptions, MessageEmbed, User} from "discord.js";
import {Main} from "../../Main";
import {TimedSet} from "../../model/Impl/TimedSet";
import {AnimeTractApi} from "../../model/anime/AnimeTractApi";
import {Response} from "../../model/anime/AnimeTypings";
import {secureCommandInteraction} from "../../guards/RoleConstraint";
import {AbstractCommandModule} from "../AbstractCommandModule";
import {DeepAPI} from "../../model/DeepAPI";
import InteractionUtils = DiscordUtils.InteractionUtils;

const Anilist = require('anilist-node');
const reverseImageSearch = require("node-reverse-image-search");
const getUrls = require('get-urls');
const isImageFast = require('is-image-fast');

@Discord()
@SlashGroup("Miscellaneous", "Miscellaneous commands")
export class Misc extends AbstractCommandModule<any> {
    private static readonly coolDown = new TimedSet<AnimeQuery>(60000);
    private readonly animeTractApi = new AnimeTractApi();
    private readonly anilist = new Anilist();

    constructor() {
        super({
            module: {
                name: "Miscellaneous",
                description: "Miscellaneous commands"
            },
            commands: [
                {
                    name: "findSource",
                    isSlash: false,
                    description: {
                        text: "Perform a reverse image search",
                        args: [
                            {
                                type: "attachment",
                                optional: false,
                                name: "image",
                                description: "The image to search"
                            }
                        ]
                    }
                },
                {
                    name: "findAnime",
                    isSlash: false,
                    description: {
                        text: "Find anime source, including episode and preview",
                        args: [
                            {
                                name: "Source",
                                type: "attachment",
                                description: "The source of the anime to look for, can be attachment or a reply to a message with ONE attachment\nPlease note: ONLY screenshots are allowed, please make sure there is NO border",
                                optional: false
                            }
                        ]
                    }
                },
                {
                    name: "avatar",
                    isSlash: true,
                    description: {
                        text: "Display a users avatar",
                        args: [
                            {
                                name: "user",
                                type: "mention",
                                description: "The user to get",
                                optional: false
                            }
                        ]
                    }
                },
                {
                    name: "posOrNeg",
                    isSlash: false,
                    description: {
                        text: "This algorithm classifies each sentence in the input as very negative, negative, neutral, positive, or very positive",
                        args: [
                            {
                                name: "text",
                                type: "text",
                                description: "the text to analyse",
                                optional: false
                            }
                        ]
                    }
                },
                {
                    name: "generateText",
                    isSlash: true,
                    description: {
                        text: "The text generation API is backed by a large-scale unsupervised language model that can generate paragraphs of text.",
                        args: [
                            {
                                name: "text",
                                type: "text",
                                description: "the text to include",
                                optional: false
                            }
                        ]
                    }
                }
            ]
        });
    }

    @Slash("generateText", {
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
        const resp = await DeepAPI.instance.textGeneration(value);
        await InteractionUtils.editWithText(interaction, resp);
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
        const resp = await DeepAPI.instance.sentimentAnalysis(text);
        message.reply(`This message is ${resp}`);
    }

    @Slash("avatar", {
        description: "Display a users avatar"
    })
    @Guard(NotBotInteraction, secureCommandInteraction)
    private async avatar(
        @SlashOption("user", {
            description: "The user to get",
            required: true
        })
            user: User,
        interaction: CommandInteraction
    ): Promise<void> {
        let avatarUrl = "";
        const ops: ImageURLOptions = {
            dynamic: true,
            size: 1024
        };
        if (user instanceof GuildMember) {
            avatarUrl = user.user.displayAvatarURL(ops);
        } else {
            avatarUrl = user.displayAvatarURL(ops);
        }
        return interaction.reply({
            files: [avatarUrl]
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
        const botAvatar = Main.client.user.displayAvatarURL({dynamic: true});
        const humanAt = new Date(from * 1000).toISOString().substr(11, 8);
        if (isAdult || similarity < freshHold) {
            replyMessage.delete();
            message.reply("No results found...");
            return;
        }
        const embed = new MessageEmbed()
            .setTitle(`${title.romaji}`)
            .setAuthor(`${Main.client.user.username}`, botAvatar)
            .setThumbnail(url)
            .setColor('#0099ff')
            .addField("Episode and timestamp this scene is from", `Episode: ${episode} at: ${humanAt}`)
            .setTimestamp();
        if (ObjectUtil.validString(title.english)) {
            embed.setTitle(`${title.english} [${title.romaji}]`);
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
                    value: aniDbRes.episodes
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
            await message.reply({
                embeds: [embed],
                files: [previewBuffer]
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
        const botAvarar = Main.client.user.displayAvatarURL({dynamic: true});
        const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle(`top ${result.length - 1} ${title}`)
            .setAuthor(`${Main.client.user.username}`, botAvarar)
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