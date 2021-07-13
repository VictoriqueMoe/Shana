import {Command, CommandMessage, Guard} from "@typeit/discord";
import {NotBot} from "../guards/NotABot";
import {ArrayUtils, DiscordUtils, ObjectUtil, StringUtils} from "../utils/Utils";
import {MessageEmbed} from "discord.js";
import {Main} from "../Main";
import {TimedSet} from "../model/Impl/TimedSet";
import {AnimeTractApi} from "../model/anime/AnimeTractApi";
import {Response} from "../model/anime/AnimeTypings";
import {secureCommand} from "../guards/RoleConstraint";
import {AbstractCommandModule} from "./AbstractCommandModule";
import {DeepAPI} from "../model/DeepAPI";

const Anilist = require('anilist-node');
const reverseImageSearch = require("node-reverse-image-search");
const getUrls = require('get-urls');
const isImageFast = require('is-image-fast');

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

    @Command("generateText")
    @Guard(NotBot, secureCommand)
    private async generateText(command: CommandMessage): Promise<void> {
        const argumentArray = StringUtils.splitCommandLine(command.content);
        if (argumentArray.length !== 1) {
            command.reply(`Command arguments wrong, usage: ~generateText "text"`);
            return;
        }
        const text = argumentArray[0];
        if (!ObjectUtil.validString(text)) {
            command.reply(`Command arguments wrong, usage: ~generateText "text"`);
            return;
        }
        const message = await command.channel.send("Generating...");
        const resp = await DeepAPI.instance.textGeneration(text);
        message.edit(resp);
    }

    @Command("posOrNeg")
    @Guard(NotBot, secureCommand)
    private async posOrNeg(command: CommandMessage): Promise<void> {
        const reference = command.reference;
        let text = "";
        if (reference) {
            const repliedMessageObj = await command.channel.messages.fetch(reference.messageID);
            if (ObjectUtil.validString(repliedMessageObj.content)) {
                text = repliedMessageObj.content;
            }
        } else {
            const argumentArray = StringUtils.splitCommandLine(command.content);
            text = argumentArray[0];
        }
        if (!ObjectUtil.validString(text)) {
            command.reply(`Command arguments wrong, usage: ~posOrNeg "text" or reference a message with text`);
            return;
        }
        const resp = await DeepAPI.instance.sentimentAnalysis(text);
        command.reply(`This message is ${resp}`);
    }

    @Command("avatar")
    @Guard(NotBot, secureCommand)
    private async avatar(command: CommandMessage): Promise<void> {
        const {mentions} = command;
        if (mentions.members.size !== 1) {
            command.reply("Please mention a user");
            return;
        }
        const mentionUser = mentions.members.array()[0];
        const avatarUrl = mentionUser.user.displayAvatarURL({
            dynamic: true,
            size: 1024
        });
        command.channel.send({
            files: [avatarUrl]
        });
    }


    @Command("findAnime")
    @Guard(NotBot, secureCommand)
    private async findAnime(command: CommandMessage): Promise<void> {
        const freshHold = 0.86;
        const messaheUrls = await DiscordUtils.getImageUrlsFromMessageOrReference(command);
        if (messaheUrls.size > 1) {
            command.reply("Please only supply ONE image");
            return;
        }
        if (Misc.coolDown.isEmpty()) {
            const entry = new AnimeQuery();
            Misc.coolDown.add(entry);
        } else {
            const entry = Misc.coolDown.values().next().value as AnimeQuery;
            entry.increment();
            if (entry.timesQueries >= 10) {
                command.reply("Please wait 1 min before using this command again");
                return;
            }
        }
        const replyMessage = await command.reply("Finding anime, please wait...");
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
                command.reply(resp.error);
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
        const botAvarar = Main.client.user.displayAvatarURL({dynamic: true});
        const humanAt = new Date(from * 1000).toISOString().substr(11, 8);
        if (isAdult || similarity < freshHold) {
            replyMessage.delete();
            command.reply("No results found...");
            return;
        }
        const embed = new MessageEmbed()
            .setTitle(`${title.romaji}`)
            .setAuthor(`${Main.client.user.username}`, botAvarar)
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
            embed.attachFiles([{
                attachment: previewBuffer,
                name: `${ObjectUtil.guid()}.mp4`
            }]);
        } catch {
        }
        await replyMessage.delete();
        command.reply(embed);
    }

    private toYMD({day, month, year}: { year: number, month: number, day: number }): string {
        return `${year}/${month}/${day}`;
    }


    @Command("findSource")
    @Guard(NotBot, secureCommand)
    private async imageSearch(command: CommandMessage): Promise<void> {
        type GoogleImageResult = {
            url?: string,
            title: string
        }[];
        const promiseWrapper = async (url: string): Promise<GoogleImageResult> => {
            return new Promise((resolve, reject) => reverseImageSearch(url, resolve));
        };

        const messageReference = command.reference;
        let messageAttachments = null;
        let imageUrl: string = null;

        if (messageReference) {
            const repliedMessageObj = await command.channel.messages.fetch(messageReference.messageID);
            const repliedMessageContent = repliedMessageObj.content;
            const repliedMessageAttachments = repliedMessageObj.attachments;

            const repliedMessageUrls = getUrls(repliedMessageContent);
            if (repliedMessageUrls && repliedMessageUrls.size === 1) {
                imageUrl = repliedMessageUrls.values().next().value;
            } else if (repliedMessageAttachments && repliedMessageAttachments.size === 1) {
                messageAttachments = repliedMessageAttachments;
            }
        }
        if (command.attachments && command.attachments.size === 1) {
            messageAttachments = command.attachments;
        }
        if (messageAttachments && messageAttachments.size === 1) {
            const firstAttach = messageAttachments.array()[0];
            imageUrl = firstAttach.attachment as string;
        } else if (ObjectUtil.validString(command.content)) {
            const messageContentUrl = getUrls(command.content);
            if (messageContentUrl && messageContentUrl.size === 1) {
                imageUrl = messageContentUrl.values().next().value;
            }
        }

        if (!ObjectUtil.validString(imageUrl)) {
            command.reply("Please make sure you supply ONE image, if you are replying to a message, please make sure that message only has a single image");
            return;
        }
        const isImage: boolean = await isImageFast(imageUrl);
        if (!isImage) {
            command.reply("Attachment was not an image");
            return;
        }
        const result = await promiseWrapper(imageUrl);
        if (result.length === 0 || result.length === 1) {
            command.reply("No results found for this image");
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
        command.reply(embed);
    }
}

class AnimeQuery {
    public constructor(public timesQueries = 1) {
    }

    public increment(): void {
        this.timesQueries++;
    }
}