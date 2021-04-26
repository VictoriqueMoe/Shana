import {AbstractCommand} from "./AbstractCommand";
import {Command, CommandMessage, Guard} from "@typeit/discord";
import {NotBot} from "../guards/NotABot";
import {ArrayUtils, DiscordUtils, ObjectUtil} from "../utils/Utils";
import {MessageEmbed} from "discord.js";
import {Main} from "../Main";
import {TimedSet} from "../model/Impl/TimedSet";
import {Typeings} from "../model/types/Typeings";
import {AnimeTractApi} from "../model/anime/AnimeTractApi";
import {Response} from "../model/anime/AnimeTypings";
import {secureCommand} from "../guards/RoleConstraint";
import AnimeEntry = Typeings.AnimeEntry;

const Anilist = require('anilist-node');
const reverseImageSearch = require("node-reverse-image-search");
const getUrls = require('get-urls');
const isImageFast = require('is-image-fast');

export class Misc extends AbstractCommand<any> {
    private readonly animeTractApi = new AnimeTractApi();
    private readonly anilist = new Anilist();
    private static readonly coolDown = new TimedSet<AnimeQuery>(60000);

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
                }
            ]
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

        if (!ObjectUtil.isValidObject(resp) || !ArrayUtils.isValidArray(resp.docs)) {
            replyMessage.delete();
            command.reply("No results found...");
            return;
        }
        const {
            episode,
            anilist_id,
            title,
            tokenthumb,
            similarity,
            is_adult,
            at,
            filename,
            title_english
        } = resp.docs[0];
        if (is_adult || similarity < freshHold) {
            replyMessage.delete();
            command.reply("No results found...");
            return;
        }
        const aniDbRes = await this.anilist.media.anime(anilist_id) as AnimeEntry;
        const botAvarar = Main.client.user.displayAvatarURL({dynamic: true});
        const humanAt = new Date(at * 1000).toISOString().substr(11, 8);
        const embed = new MessageEmbed()
            .setTitle(`${title}`)
            .setAuthor(`${Main.client.user.username}`, botAvarar)
            .setThumbnail(url)
            .setColor('#0099ff')
            .addField("Episode and timestamp this scene is from", `Episode: ${episode} at: ${humanAt}`)
            .setTimestamp();
        if (ObjectUtil.validString(title_english)) {
            embed.setTitle(`${title_english} [${title}]`);
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
            const previewBuffer = await this.animeTractApi.fetchPreview(anilist_id, at, filename, tokenthumb);
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
        if(command.attachments && command.attachments.size === 1){
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