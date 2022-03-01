import {Client, DefaultPermissionResolver, Discord, Guard, Permission, Slash, SlashGroup, SlashOption} from "discordx";
import {NotBotInteraction} from "../../guards/NotABot";
import {CommandEnabled} from "../../guards/CommandEnabled";
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
import {DiscordUtils, ObjectUtil} from "../../utils/Utils";
import {injectable} from "tsyringe";
import {Category} from "@discordx/utilities";
import InteractionUtils = DiscordUtils.InteractionUtils;

@Discord()
@Category("Music", "Commands to play music from Youtube")
@Category("Music", [
    {
        "name": "play",
        "type": "SLASH",
        "options": [
            {
                "name": "search",
                "description": "The song name or URL",
                "optional": false,
                "type": "STRING"
            }
        ],
        "description": "Plays or Queues a song "
    },
    {
        "name": "playerControls",
        "type": "SLASH",
        "options": [],
        "description": "Player controls to skip, pause, skip, stop, resume, etc... "
    },
    {
        "name": "nowPlaying",
        "type": "SLASH",
        "options": [],
        "description": "View the current playlist"
    }
])
@SlashGroup({
    name: "music",
    description: "Commands to play music from Youtube",
})
@SlashGroup("music")
@Permission(new DefaultPermissionResolver(AbstractCommandModule.getDefaultPermissionAllow))
@Permission(AbstractCommandModule.getPermissions)
@injectable()
export class Music extends AbstractCommandModule {
    constructor(private _player: Player, private _client: Client) {
        super();
    }

    private getGuildQueue(interaction: CommandInteraction | ButtonInteraction): Queue {
        return this._player.getQueue(interaction.guildId);
    }

    @Slash("playercontrols", {
        description: "Player controls to skip, pause, skip, stop, resume, etc..."
    })
    @Guard(NotBotInteraction, CommandEnabled())
    private async playerControls(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply();
        const guildQueue = this.getGuildQueue(interaction);
        if (!guildQueue) {
            return InteractionUtils.replyOrFollowUp(interaction, "No songs are currently queued");
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
                    await ObjectUtil.delayFor(900);
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
    @Guard(NotBotInteraction, CommandEnabled())
    private async nowPlaying(interaction: CommandInteraction): Promise<void> {
        const guildQueue = this.getGuildQueue(interaction);
        if (!guildQueue || !guildQueue.isPlaying) {
            return InteractionUtils.replyOrFollowUp(interaction, "No songs are currently playing");
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
            return InteractionUtils.replyOrFollowUp(interaction, "Internal Error", false);
        }
        const vc = member.voice.channel;
        if (!vc) {
            return InteractionUtils.replyOrFollowUp(interaction, "You must first join the voice channel you want me to connect to");
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
            return InteractionUtils.replyOrFollowUp(interaction, `Unable to play ${search}`);
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
