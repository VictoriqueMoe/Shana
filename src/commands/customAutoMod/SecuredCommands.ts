import {Client, DefaultPermissionResolver, Discord, Guard, Permission, Slash, SlashGroup} from "discordx";
import {AbstractCommandModule} from "../AbstractCommandModule";
import {NotBotInteraction} from "../../guards/NotABot";
import {CommandEnabled} from "../../guards/CommandEnabled";
import {CommandInteraction, MessageActionRow, MessageButton, MessageEmbed} from "discord.js";
import {delay, inject, injectable} from "tsyringe";
import {MuteManager} from "../../model/guild/manager/MuteManager";
import {ArrayUtils, DiscordUtils, ObjectUtil} from "../../utils/Utils";
import {Category} from "@discordx/utilities";
import {CommandSecurityManager} from "../../model/guild/manager/CommandSecurityManager";
import {ApplicationInfoManager} from "../../model/guild/manager/ApplicationInfoManager";
import InteractionUtils = DiscordUtils.InteractionUtils;

@Discord()
@Category("Secure", "secured commands used as moderation utilities")
@Category("Secure", [
    {
        "name": "mutes",
        "type": "SLASH",
        "description": "Get a list of all mutes",
        options: []
    }
])
@Permission(new DefaultPermissionResolver(AbstractCommandModule.getDefaultPermissionAllow))
@Permission(AbstractCommandModule.getPermissions)
@SlashGroup("secure", "secured commands used as moderation utilities")
@injectable()
export class SecuredCommands extends AbstractCommandModule {

    constructor(
        private _muteManager: MuteManager,
        @inject(delay(() => CommandSecurityManager)) private _commandSecurityManager: CommandSecurityManager,
        private _applicationInfoManager: ApplicationInfoManager,
        private _client: Client
    ) {
        super();
    }

    @Slash("mutes", {
        description: "Get a list of all mutes"
    })
    @Guard(NotBotInteraction, CommandEnabled)
    private async mutes(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply({
            ephemeral: true
        });
        const allMutes = await this._muteManager.getAllMutedMembers(interaction.guildId);
        let retStr = "";
        if (!ArrayUtils.isValidArray(allMutes)) {
            retStr = "No members are currently muted";
        }
        for (const mutedMember of allMutes) {
            const {communicationDisabledUntilTimestamp} = mutedMember;
            const timeLeft = Math.abs(Date.now() - communicationDisabledUntilTimestamp);
            const timeLeftHuman = ObjectUtil.timeToHuman(timeLeft);
            retStr += `<@${mutedMember.id}> (${mutedMember.user.tag}) mute expires on: <t:${communicationDisabledUntilTimestamp}:F> (in ${timeLeftHuman})\n`;
        }
        InteractionUtils.replyOrFollowUp(interaction, retStr);
    }

    @Slash("initservercommandpermissions", {
        description: "Re-init all command permissions for this server"
    })
    @Guard(NotBotInteraction, CommandEnabled)
    private async initServerCommandPermissions(
        interaction: CommandInteraction
    ): Promise<void> {
        await interaction.deferReply({
            ephemeral: true
        });
        await this._commandSecurityManager.initGuildApplicationPermissions(interaction.guild);
        InteractionUtils.replyOrFollowUp(interaction, "Permissions synchronised");
    }


    @Slash("bot_info", {
        description: "Get bot info"
    })
    @Guard(NotBotInteraction, CommandEnabled)
    private async getBotInfo(
        interaction: CommandInteraction
    ): Promise<void> {
        await interaction.deferReply();
        const devInfo = this._applicationInfoManager.devInfo;
        const guildInfo = await this._applicationInfoManager.getGuildInfo(interaction.guildId);
        const bot = this._client.user;
        const botAvatar = bot.displayAvatarURL({dynamic: true});
        const embed = new MessageEmbed()
            .setTitle(`${bot.tag} info`)
            .setAuthor({
                name: this._client.user.username,
                iconURL: botAvatar,
                url: devInfo.repoUrl
            })
            .setColor(interaction.guild.me.displayHexColor)
            .setTimestamp();
        embed.addField('Guild Info', '\u200B');
        const {name, id, memberCount, createdDate} = guildInfo;
        embed.addFields([
            {
                name: "Guild Name",
                inline: true,
                value: name
            },
            {
                name: "Guild Id",
                inline: true,
                value: id
            },
            {
                name: "Guild Member count",
                inline: true,
                value: memberCount.toString()
            },
            {
                name: "created",
                inline: true,
                value: `<t:${createdDate}:F>`
            }
        ]);
        embed.addField('Global Info:', '\u200B');
        embed.addField('total guild count', this._applicationInfoManager.guildsJoined.toString(), true);
        embed.addField('total memebrs, sum of all guilds', this._applicationInfoManager.sumOfAllGuilds.toString(), true);

        embed.addField('Support details:', '\u200B');
        embed.addField("email", devInfo.email, true);
        const devDiscord = devInfo.discordHandle;
        const devAsMember = interaction.guild.members.cache.find((value) => value.user.tag === devDiscord);
        embed.addField("discord", devAsMember ? `<@${devAsMember.id}>` : devInfo.discordHandle, true);
        if (devInfo.name) {
            embed.addField("dev name", devInfo.name, true);
        }
        const gitUrl = new MessageButton()
            .setLabel("Github")
            .setEmoji("🚀")
            .setStyle("LINK")
            .setURL(devInfo.repoUrl);

        const inviteUrl = new MessageButton()
            .setLabel("Add bot to server")
            .setEmoji("➕")
            .setStyle("LINK")
            .setURL(this._applicationInfoManager.inviteUrl);

        const row = new MessageActionRow().addComponents(gitUrl, inviteUrl);
        interaction.followUp({
            components: [row],
            embeds: [embed]
        });
    }


}