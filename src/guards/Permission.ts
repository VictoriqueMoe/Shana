import {Client, GuardFunction, Next, SimpleCommandMessage} from "discordx";
import {
    BaseCommandInteraction,
    CommandInteraction,
    ContextMenuInteraction,
    Guild,
    GuildMember,
    MessageComponentInteraction,
    PermissionString
} from "discord.js";

export function Permission(permissions: PermissionString[], messageIfNotAllowed: string = "No permissions"): GuardFunction<CommandInteraction | SimpleCommandMessage | ContextMenuInteraction> {

    async function replyOrFollowUp(
        interaction: BaseCommandInteraction | MessageComponentInteraction,
        content: string,
        ephemeral: boolean = false
    ): Promise<void> {
        if (interaction.replied) {
            await interaction.followUp({
                content,
                ephemeral,
            });
            return;
        }

        if (interaction.deferred) {
            await interaction.editReply(content);
            return;
        }

        await interaction.reply({
            content,
            ephemeral,
        });
    }

    async function post(
        arg: BaseCommandInteraction | SimpleCommandMessage,
        msg: string
    ): Promise<void> {
        if (arg instanceof SimpleCommandMessage) {
            await arg?.message.reply(msg);
        } else {
            return replyOrFollowUp(arg, msg);
        }
    }

    return function (arg: CommandInteraction | SimpleCommandMessage | ContextMenuInteraction, client: Client, next: Next) {
        let guild: Guild | null = null;
        let callee: GuildMember | null = null;
        if (arg instanceof SimpleCommandMessage) {
            if (arg.message.inGuild()) {
                guild = arg.message.guild;
                callee = arg.message.member;
            }
        } else {
            if (arg.inGuild() && (arg.isContextMenu() || arg.isCommand())) {
                guild = arg.guild;
                if (arg.member instanceof GuildMember) {
                    callee = arg.member;
                }
            }
        }

        if (!guild || !callee) {
            return next();
        }


        const isAllowed = callee.permissions.has(permissions, true);
        if (isAllowed) {
            return next();
        }

        return post(arg, messageIfNotAllowed);
    };

}
