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

/**
 * Set an array of permissions that this command is allowed to use, this is useful for global commands that can not use the `@Permission` decorator, until Permissions 2v is out
 * @param permissions - an array of Permissions or a function to resolve the permissions
 * @param messageIfNotAllowed - message to post when the member using this command does not have the correct permissions, defaults to "No permissions"
 */
export function PermissionGuard(permissions: PermissionString[] | (() => Promise<PermissionString[]>), messageIfNotAllowed: string = "No permissions"): GuardFunction<CommandInteraction | SimpleCommandMessage | ContextMenuInteraction> {

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

    return async function (arg: CommandInteraction | SimpleCommandMessage | ContextMenuInteraction, client: Client, next: Next) {
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
        let perms: PermissionString[];
        if (typeof permissions === "function") {
            perms = await permissions();
        } else {
            perms = permissions;
        }
        const isAllowed = callee.permissions.has(perms, true);
        if (isAllowed) {
            return next();
        }

        return post(arg, messageIfNotAllowed);
    };

}
