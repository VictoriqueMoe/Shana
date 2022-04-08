import {AbstractCommand} from "../AbstractCommand";
import {RoleJoinerModel} from "../../model/DB/guild/RoleJoiner.model";
import {DefaultPermissionResolver, Discord, Permission, SelectMenuComponent, Slash, SlashGroup} from "discordx";
import {
    CommandInteraction,
    GuildMember,
    MessageActionRow,
    MessageEmbed,
    MessageSelectMenu,
    MessageSelectOptionData,
    SelectMenuInteraction
} from "discord.js";
import {ArrayUtils, DiscordUtils, ObjectUtil} from "../../utils/Utils";
import {Category} from "../../modules/category";
import {getRepository} from "typeorm";
import InteractionUtils = DiscordUtils.InteractionUtils;

@Discord()
@Category("RoleJoiner", "Commands to allow users to join vanity roles")
@Category("RoleJoiner", [
    {
        "name": "displayJoinUi",
        "type": "SLASH",
        "options": [],
        "description": "Initialise the role join dropdown and buttons"
    }
])
@Permission(new DefaultPermissionResolver(AbstractCommand.getDefaultPermissionAllow))
@Permission(AbstractCommand.getPermissions)
@SlashGroup({
    name: "rolejoiner",
    description: "Commands to allow users to join vanity roles",
})
@SlashGroup("rolejoiner")
export class RoleJoiner extends AbstractCommand {


    @Slash("displayjoinui", {
        description: "Initialise the role join dropdown and buttons"
    })
    private async displayJoinUi(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply();
        const {guildId} = interaction;
        const roleJoinerSettings = await getRepository(RoleJoinerModel).findOne({
            where: {
                guildId
            }
        });
        if (!ObjectUtil.isValidObject(roleJoinerSettings)) {
            return InteractionUtils.replyOrFollowUp(interaction, "Command not configured");
        }
        const roles = roleJoinerSettings.rolesToJoin.map(roleId => {
            const roleObj = interaction.guild.roles.cache.get(roleId);
            if (!ObjectUtil.isValidObject(roleObj)) {
                throw new Error(`Unable to find role with id: ${roleId}`);
            }
            const label = roleObj.name;
            const value = roleId;
            const retObj: MessageSelectOptionData = {
                label,
                value
            };
            return retObj;
        });
        const dropDown = new MessageSelectMenu().addOptions(roles).setCustomId("role-menu");
        dropDown.minValues = 0;
        dropDown.maxValues = roles.length;
        const menuRow = new MessageActionRow().addComponents(dropDown);
        await interaction.editReply({
            content: "Select a role to apply or remove",
            components: [menuRow],
        });
    }

    @SelectMenuComponent("role-menu")
    private async roleDropdownListener(interaction: SelectMenuInteraction): Promise<void> {
        await interaction.deferReply({
            ephemeral: true
        });
        const {member, guild, guildId} = interaction;

        if (!(member instanceof GuildMember)) {
            return await InteractionUtils.replyOrFollowUp(interaction, "Unable to find role");
        }
        const roleIdsToAssign = interaction.values;
        const added: string[] = [];
        const removed: string[] = [];
        if (!ArrayUtils.isValidArray(roleIdsToAssign)) {
            const roleJoinerSettings = await getRepository(RoleJoinerModel).findOne({
                where: {
                    guildId
                }
            });
            for (const roleId of roleJoinerSettings.rolesToJoin) {
                const role = guild.roles.cache.get(roleId);
                try {
                    if (member.roles.cache.has(role.id)) {
                        await member.roles.remove(role);
                        removed.push(role.name);
                    }
                } catch (e) {
                    await InteractionUtils.replyOrFollowUp(interaction, e.message);
                    return;
                }
            }
        } else {
            for (const roleIdToAssign of roleIdsToAssign) {
                const role = guild.roles.cache.get(roleIdToAssign);
                const remove = member.roles.cache.has(role.id);
                try {
                    if (remove) {
                        await member.roles.remove(role);
                        removed.push(role.name);
                    } else {
                        await member.roles.add(role);
                        added.push(role.name);
                    }
                } catch (e) {
                    await InteractionUtils.replyOrFollowUp(interaction, e.message);
                    return;
                }
            }
        }
        const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle(`Roles modified`)
            .setTimestamp();
        if (ArrayUtils.isValidArray(added)) {
            embed.addField("Roles added", added.join(", "));
        }
        if (ArrayUtils.isValidArray(removed)) {
            embed.addField("Roles removed", removed.join(", "));
        }
        await interaction.editReply({
            embeds: [embed]
        });
    }
}
