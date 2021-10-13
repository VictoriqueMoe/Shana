import {Client, Discord, Guard, Slash, SlashGroup, SlashOption} from "discordx";
import {NotBotInteraction} from "../../guards/NotABot";
import {secureCommandInteraction} from "../../guards/RoleConstraint";
import {
    ButtonInteraction,
    CommandInteraction,
    GuildMember,
    Message,
    MessageActionRow,
    MessageButton,
    MessageEmbed,
    Util
} from "discord.js";
import {AbstractCommandModule} from "../AbstractCommandModule";
import {Player, Playlist, Queue, Song} from "discord-music-player";
import {DiscordUtils} from "../../utils/Utils";
import {injectable} from "tsyringe";
import InteractionUtils = DiscordUtils.InteractionUtils;

@Discord()
@SlashGroup("music", "Commands to play music from Youtube")
@injectable()
export class Music extends AbstractCommandModule<any> {
    constructor(private _player: Player, private _client: Client) {
        super({
            module: {
                name: "Music",
                description: "Commands to play music from Youtube"
            },
            commands: [
                {
                    name: "play",
                    type: "slash",
                    description: {
                        text: "Plays or Queues a song ",
                        args: [
                            {
                                name: "search",
                                description: "The song name or URL",
                                type: "text",
                                optional: false
                            }
                        ]
                    }
                },
                {
                    name: "playerControls",
                    type: "slash",
                    description: {
                        text: "Player controls to skip, pause, skip, stop, resume, etc... "
                    }
                },
                {
                    name: "nowPlaying",
                    type: "slash",
                    description: {
                        text: "View the current playlist"
                    }
                }
            ]
        });
    }

    private getGuildQueue(interaction: CommandInteraction | ButtonInteraction): Queue {
        return this._player.getQueue(interaction.guildId);
    }

    @Slash("playercontrols", {
        description: "Player controls to skip, pause, skip, stop, resume, etc..."
    })
    @Guard(NotBotInteraction, secureCommandInteraction)
    private async playerControls(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply();
        const guildQueue = this.getGuildQueue(interaction);
        if (!guildQueue) {
            return InteractionUtils.replyWithText(interaction, "No songs are currently queued");
        }
        const nextButton = new MessageButton()
            .setLabel("Next")
            .setEmoji("⏭")
            .setStyle("PRIMARY")
            .setDisabled(!guildQueue.isPlaying)
            .setCustomId("btn-next");
        const pauseButton = new MessageButton()
            .setLabel("Play/Pause")
            .setEmoji("⏯")
            .setStyle("PRIMARY")
            .setDisabled(!guildQueue.isPlaying)
            .setCustomId("btn-pause");
        const stopButton = new MessageButton()
            .setLabel("Stop")
            .setStyle("DANGER")
            .setDisabled(!guildQueue.isPlaying)
            .setCustomId("btn-stop");
        const row = new MessageActionRow().addComponents(stopButton, pauseButton, nextButton);
        const message = await interaction.followUp({
            content: "Music controls",
            embeds: [this.getNowPlayingEmbed(guildQueue)],
            fetchReply: true,
            components: [row]
        });
        if (!(message instanceof Message)) {
            throw Error("InvalidMessage instance");
        }
        const collector = message.createMessageComponentCollector();
        collector.on("collect", async (collectInteraction: ButtonInteraction) => {
            await collectInteraction.deferUpdate();
            const guildQueue = this.getGuildQueue(interaction);
            const buttonId = collectInteraction.customId;
            switch (buttonId) {
                case "btn-next": {
                    guildQueue.skip();
                    await Util.delayFor(900);
                    break;
                }
                case "btn-pause":
                    guildQueue.setPaused(!guildQueue.paused);
                    break;
                case "btn-stop":
                    guildQueue.stop();
                    await interaction.deleteReply();
                    return;
                case "btn-play":
                    guildQueue.setPaused(false);
                    break;
            }
            await collectInteraction.editReply({
                embeds: [this.getNowPlayingEmbed(guildQueue)],
                components: [row]
            });
        });
        collector.on("end", async () => {
            if (!message.editable || message.deleted) {
                return;
            }
            await message.edit({components: []});
        });
    }

    private getNowPlayingEmbed(queue: Queue): MessageEmbed {
        const currentlyPlaying = queue.nowPlaying;
        const nextSong = queue.songs[1]?.name ?? "None";
        const status = queue.isPlaying;
        return new MessageEmbed()
            .setTitle(`Controls`)
            .addField("Status", queue.paused ? "Paused" : "Playing", true)
            .addField("Song", currentlyPlaying.name, true)
            .addField("Next Song", nextSong, false)
            .setTimestamp();
    }

    private replaceButton(row: MessageActionRow, button: MessageButton): void {
        const buttonIdToSearch = button.customId;
        const {components} = row;
        for (let i = 0; i < components.length; i++) {
            const component = components[i];
            if (component.customId === buttonIdToSearch) {
                components[i] = button;
                break;
            }
        }
    }

    @Slash("nowplaying", {
        description: "View the current playlist"
    })
    @Guard(NotBotInteraction, secureCommandInteraction)
    private async nowPlaying(interaction: CommandInteraction): Promise<void> {
        const guildQueue = this.getGuildQueue(interaction);
        if (!guildQueue || !guildQueue.isPlaying) {
            return InteractionUtils.replyWithText(interaction, "No songs are currently playing");
        }
        const embed = this.displayPlaylist(guildQueue);
        await interaction.reply({
            embeds: [embed]
        });
    }

    @Slash("play", {
        description: "Plays or Queues a song"
    })
    private async play(
        @SlashOption("song", {
            description: "The song name or URL",
            required: true
        })
            search: string,
        @SlashOption("isplaylist", {
            description: "is this url a playlist",
            required: false
        })
            isPlaylist: boolean,
        @SlashOption("timestamp", {
            description: "if url contains a timestamp, it will start there",
            required: false
        })
            timestamp: boolean,
        interaction: CommandInteraction
    ): Promise<void> {
        await interaction.deferReply();
        const player = this._player;
        const {guildId} = interaction;
        const guildQueue = this.getGuildQueue(interaction);
        const queue = player.createQueue(guildId);
        const member = InteractionUtils.getInteractionCaller(interaction);
        if (!(member instanceof GuildMember)) {
            return InteractionUtils.replyWithText(interaction, "Internal Error", false);
        }
        const vc = member.voice.channel;
        if (!vc) {
            return InteractionUtils.replyWithText(interaction, "You must first join the voice channel you want me to connect to");
        }
        if (!queue.isPlaying) {
            await queue.join(member.voice.channel);
        }
        let newSong: Song | Playlist = null;
        try {
            if (isPlaylist) {
                newSong = await queue.playlist(search, {
                    requestedBy: interaction.user
                });
            } else {
                newSong = await queue.play(search, {
                    timecode: timestamp,
                    requestedBy: interaction.user
                });
            }

        } catch (e) {
            if (!guildQueue) {
                queue.stop();
            }
            console.error(e);
            return InteractionUtils.replyWithText(interaction, `Unable to play ${search}`);
        }
        const embed = this.displayPlaylist(queue, newSong, member);
        await interaction.editReply({
            embeds: [embed]
        });
    }

    private displayPlaylist(queue: Queue, newSong?: Song | Playlist, memberWhoAddedSong?: GuildMember): MessageEmbed {
        const songs = queue.songs;
        const embed = new MessageEmbed().setColor('#FF470F').setTimestamp();
        for (let i = 0; i < songs.length; i++) {
            const song = songs[i];
            embed.addField(`#${i + 1}`, song.name);
        }
        if (newSong) {
            embed.setDescription(`New song ${newSong.name} added to the queue`);
        } else {
            embed.setDescription(`Current Playlist`);
        }
        if (memberWhoAddedSong) {
            const avatar = memberWhoAddedSong.user.displayAvatarURL({dynamic: true});
            embed.setAuthor(`${memberWhoAddedSong.displayName}`, avatar);
        } else {
            const botImage = this._client.user.displayAvatarURL({dynamic: true});
            embed.setAuthor(`${this._client.user.username}`, botImage);
        }
        return embed;
    }
}