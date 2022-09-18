import {Category} from "@discordx/utilities";
import {CommandInteraction, EmbedBuilder, GuildMember, PermissionsBitField, Status} from "discord.js";
import {Client, Discord, Slash} from "discordx";

@Discord()
@Category("Misc")
export class Ping {

    @Slash({
        description: "Checks the ping to the Discord server",
        defaultMemberPermissions: PermissionsBitField.Flags.Administrator,
        dmPermission: false
    })
    public async ping(interaction: CommandInteraction, client: Client): Promise<void> {
        const msg = await interaction.reply({content: "Pinging...", fetchReply: true});

        const messageTime = `${msg.createdTimestamp - interaction.createdTimestamp}ms`;
        const heartBeat = `${Math.round(client.ws.ping)}ms`;
        const websocketStatus = Status[client.ws.status];

        const me = interaction?.guild?.members?.me ?? interaction.user;
        const colour = me instanceof GuildMember ? me.displayHexColor : "#0099ff";
        const embed = new EmbedBuilder()
            .setTitle(`Ping information`)
            .setColor(colour)
            .setAuthor({
                name: client.user.username,
                iconURL: me.displayAvatarURL()
            })
            .setDescription(`Ping info from this bot and current status`)
            .setTimestamp();

        embed.addFields([
            {
                name: "message round-trip",
                value: messageTime
            },
            {
                name: "heartbeat ping",
                value: heartBeat
            },
            {
                name: "Websocket status",
                value: websocketStatus
            }
        ]);
        await msg.edit({
            embeds: [embed],
            content: `Pong!`
        });
    }
}
