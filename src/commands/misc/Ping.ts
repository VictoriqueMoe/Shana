import {Category} from "@discordx/utilities";
import {oneLine} from "common-tags";
import {CommandInteraction, PermissionsBitField} from "discord.js";
import {Client, Discord, Slash} from "discordx";

@Discord()
@Category("Misc")
export class Ping {

    @Slash({
        description: "Checks the ping to the Discord server",
        defaultMemberPermissions: PermissionsBitField.Flags.Administrator
    })
    public async ping(interaction: CommandInteraction, client: Client): Promise<void> {
        const msg = (await interaction.reply({content: "Pinging...", fetchReply: true}));
        const content = oneLine`
          ${msg.inGuild() ? `${interaction.member},` : ""}
          Pong! The message round-trip took
          ${msg.createdTimestamp - interaction.createdTimestamp}ms.
          ${client.ws.ping ? `The heartbeat ping is ${Math.round(client.ws.ping)}ms.` : ""}
        `;
        await msg.reply(content);
    }
}
