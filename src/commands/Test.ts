import {Discord, Guard, SimpleCommand, SimpleCommandMessage, Slash} from "discordx";
import {CommandInteraction} from "discord.js";
import {Permission} from "../guards/Permission";
import {DiscordUtils} from "../utils/Utils";
import InteractionUtils = DiscordUtils.InteractionUtils;

@Discord()
class Example {

    @Slash("hello_interaction")
    @Guard(Permission(["CHANGE_NICKNAME"], "no permission"))
    private helloInteraction(interaction: CommandInteraction): void {
        InteractionUtils.replyOrFollowUp(interaction, "foo");
    }

    @SimpleCommand("hello_simple")
    @Guard(Permission(["CHANGE_NICKNAME"], "no permission"))
    private async helloSimple({message}: SimpleCommandMessage): Promise<void> {
        message.reply("foo");
    }
}
