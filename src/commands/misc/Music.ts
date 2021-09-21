import {ButtonComponent, Discord, Guard, Slash, SlashGroup, SlashOption} from "discordx";
import {NotBotInteraction} from "../../guards/NotABot";
import {secureCommandInteraction} from "../../guards/RoleConstraint";
import {
    ButtonInteraction,
    CommandInteraction,
    GuildMember,
    MessageActionRow,
    MessageButton,
    MessageEmbed
} from "discord.js";
import {AbstractCommandModule} from "../AbstractCommandModule";
import {Main} from "../../Main";
import {Playlist, Queue, Song} from "discord-music-player";
import {DiscordUtils} from "../../utils/Utils";
import InteractionUtils = DiscordUtils.InteractionUtils;

@Discord()
@SlashGroup("Music", "Commands to play music from Youtube")
export class Music extends AbstractCommandModule<any> {
    constructor() {
        super({
            module: {
                name: "Music",
                description: "Commands to play music from Youtube"
            },
            commands: [
                {
                    name: "play",
                    isSlash: true,
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
                    isSlash: true,
                    description: {
                        text: "Player controls to skip, pause, skip, stop, resume, etc... "
                    }
                },
                {
                    name: "nowPlaying",
                    isSlash: true,
                    description: {
                        text: "View the current playlist"
                    }
                }
            ]
        });
    }

    private static getGuildQueue(interaction: CommandInteraction | ButtonInteraction): Queue {
        return Main.player.getQueue(interaction.guildId);
    }

    @Slash("playerControls", {
        description: "Player controls to skip, pause, skip, stop, resume, etc..."
    })
    @Guard(NotBotInteraction, secureCommandInteraction)
    private async playerControls(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply();
        const nextButton = new MessageButton()
            .setLabel("Next")
            .setEmoji("⏭")
            .setStyle("PRIMARY")
            .setCustomId("btn-next");
        const row = new MessageActionRow().addComponents(nextButton);
        interaction.editReply({
            content: "Music controls",
            components: [row]
        });
    }

    @ButtonComponent("btn-next")
    private async next(interaction: ButtonInteraction): Promise<void> {
        await interaction.deferReply();
        const {guildId} = interaction;
        const guildQueue = Music.getGuildQueue(interaction);
        if (!guildQueue) {
            return InteractionUtils.replyWithText(interaction, "No songs are currently playing");
        } else {
            if (!guildQueue.isPlaying) {
                return InteractionUtils.replyWithText(interaction, "No songs are currently playing");
            }
        }
        const {member} = interaction;
        if (!(member instanceof GuildMember)) {
            return InteractionUtils.replyWithText(interaction, "Internal Error", false);
        }
        const vc = member.voice.channel;
        if (!vc) {
            return InteractionUtils.replyWithText(interaction, "You must first join the voice channel before you can use this");
        }
        guildQueue.skip();
    }

    @Slash("nowPlaying", {
        description: "View the current playlist"
    })
    @Guard(NotBotInteraction, secureCommandInteraction)
    private async nowPlaying(interaction: CommandInteraction): Promise<void> {
        const guildQueue = Music.getGuildQueue(interaction);
        if (!guildQueue || !guildQueue.isPlaying) {
            return InteractionUtils.replyWithText(interaction, "No songs are currently playing");
        }
        const embed = Music.displayPlaylist(guildQueue);
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
        @SlashOption("isPlaylist", {
            description: "is this url a playlist",
            required: true
        })
            isPlaylist: boolean,
        interaction: CommandInteraction
    ): Promise<void> {
        await interaction.deferReply();
        const {channel} = interaction;
        const player = Main.player;
        const {guildId} = interaction;
        const guildQueue = Music.getGuildQueue(interaction);
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
                newSong = await queue.playlist(search);
            } else {
                newSong = await queue.play(search);
            }

        } catch (e) {
            if (!guildQueue) {
                queue.stop();
            }
            return InteractionUtils.replyWithText(interaction, `Unable to play ${search}`);
        }
        const embed = Music.displayPlaylist(queue, newSong, member);
        await interaction.editReply({
            embeds: [embed]
        });
    }

    private static displayPlaylist(queue: Queue, newSong?: Song | Playlist, memberWhoAddedSong?: GuildMember): MessageEmbed {
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
            const avatar = memberWhoAddedSong.user.displayAvatarURL({format: 'jpg'});
            embed.setAuthor(`${memberWhoAddedSong.displayName}`, avatar);
        } else {
            const botImage = Main.client.user.displayAvatarURL({dynamic: true});
            embed.setAuthor(`${Main.client.user.username}`, botImage);
        }
        return embed;
    }
}