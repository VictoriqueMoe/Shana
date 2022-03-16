import {DefaultPermissionResolver, Discord, Guard, Permission, Slash, SlashGroup, SlashOption} from "discordx";
import {Category} from "@discordx/utilities";
import {NotBotInteraction} from "../../guards/NotABot";
import {CommandEnabled} from "../../guards/CommandEnabled";
import {CommandInteraction} from "discord.js";
import {container, injectable} from "tsyringe";
import {AbstractCommand} from "../AbstractCommand";
import {D7SMSManager} from "../../model/rapidApi/D7SMSManager";
import {DiscordUtils} from "../../utils/Utils";
import InteractionUtils = DiscordUtils.InteractionUtils;

@Discord()
@Category("rapid_api", "Commands to interact with various endpoints")
@Category("rapid_api", [])
@SlashGroup({
    name: "rapid_api",
    description: "Commands to interact with various endpoints",
})
@SlashGroup("rapid_api")
@Permission(new DefaultPermissionResolver(AbstractCommand.getDefaultPermissionAllow))
@Permission(AbstractCommand.getPermissions)
@injectable()
export class RapidAPI extends AbstractCommand {

    public constructor(private _d7SMSManager: D7SMSManager) {
        super();
    }

    @Slash("sms", {
        description: "Send an sms to any number from any name"
    })
    @Guard(NotBotInteraction, CommandEnabled(container.resolve(D7SMSManager)))
    private async sms(
        @SlashOption("to", {
            description: "The number (with extension) to send to",
            type: 'STRING',
        })
            to: string,
        @SlashOption("from", {
            description: "The name that will appear as the sender",
            type: 'STRING',
        })
            from: string,
        @SlashOption("content", {
            description: "the sms content",
            type: 'STRING',
        })
            content: string,
        interaction: CommandInteraction
    ): Promise<void> {
        await interaction.deferReply({
            ephemeral: true
        });
        const response = await this._d7SMSManager.sendSms({
            content,
            to,
            from
        });
        const responseData = response.data;
        if (!responseData.includes("Success")) {
            console.error(response.data);
            return InteractionUtils.replyOrFollowUp(interaction, "Unable to send SMS");
        }
        return InteractionUtils.replyOrFollowUp(interaction, responseData);
    }
}
