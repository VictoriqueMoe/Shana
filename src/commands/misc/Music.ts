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
    MessageEmbed
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
            .setLabel("Pause")
            .setEmoji("⏸")
            .setStyle("PRIMARY")
            .setDisabled(!guildQueue.isPlaying)
            .setCustomId("btn-pause");
        const stopButton = new MessageButton()
            .setLabel("Stop")
            .setStyle("DANGER")
            .setDisabled(!guildQueue.isPlaying)
            .setCustomId("btn-stop");
        const playButton = new MessageButton()
            .setLabel("Play")
            .setStyle("SUCCESS")
            .setDisabled(guildQueue.isPlaying)
            .setCustomId("btn-play");
        const row = new MessageActionRow().addComponents(nextButton, playButton, pauseButton, stopButton);
        const embed = new MessageEmbed()
            .setTitle(`test`)
            .setAuthor("test")
            .setTimestamp();
        const message = await interaction.followUp({
            content: "Music controls",
            embeds: [embed],
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
            this.replaceButton(row, playButton);
            switch (buttonId) {
                case "btn-next":
                    guildQueue.skip();
                    break;
                case "btn-pause":
                    guildQueue.setPaused(true);
                    break;
                case "btn-stop":
                    guildQueue.stop();
                    break;
                case "btn-play":
                    guildQueue.setPaused(false);
                    break;
            }
            await collectInteraction.editReply({
                embeds: [embed],
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

    /*@ButtonComponent("btn-next")
    private async next(interaction: ButtonInteraction): Promise<void> {
        await interaction.deferReply({
            ephemeral: true
        });
        const {guildId} = interaction;
        const guildQueue = this.getGuildQueue(interaction);
        if (!guildQueue) {
            return InteractionUtils.replyWithText(interaction, "No songs are currently playing");
        } else {
            if (!guildQueue.isPlaying) {
                return InteractionUtils.replyWithText(interaction, "No songs are currently playing");
            }
        }
        const {member} = interaction;
        if (!(member instanceof GuildMember)) {
            return InteractionUtils.replyWithText(interaction, "Internal Error");
        }
        const vc = member.voice.channel;
        if (!vc) {
            return InteractionUtils.replyWithText(interaction, "You must first join the voice channel before you can use this");
        }
        guildQueue.skip();
        const embed = this.displayPlaylist(guildQueue);
        await interaction.editReply({
            embeds: [embed]
        });
    }*/

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
    @Guard(NotBotInteraction, secureCommandInteraction)
    private async play(
        @SlashOption("search", {
            description: "The song name or URL",
            required: true
        })
            search: string,
        @SlashOption("isplaylist", {
            description: "is this url a playlist",
            required: true
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
        embed.addField("Currently playing", queue.nowPlaying.name);
        embed.addField('\u200b', '\u200b');
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