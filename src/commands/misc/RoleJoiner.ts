import {AbstractCommandModule} from "../AbstractCommandModule";
import {RoleJoinerModel} from "../../model/DB/RoleJoiner.model";
import {Discord, SelectMenuComponent, Slash, SlashGroup} from "discordx";
import {
    CommandInteraction,
    GuildMember,
    MessageActionRow,
    MessageSelectMenu,
    MessageSelectOptionData,
    SelectMenuInteraction
} from "discord.js";
import {ArrayUtils, DiscordUtils, ObjectUtil} from "../../utils/Utils";
import InteractionUtils = DiscordUtils.InteractionUtils;

@Discord()
@SlashGroup("RoleJoiner", "Commands to allow users to join vanity roles")
export class RoleJoiner extends AbstractCommandModule<RoleJoinerModel> {

    public constructor() {
        super({
            module: {
                name: "RoleJoiner",
                description: "Commands to allow users to join vanity roles"
            },
            commands: [
                {
                    name: "displayJoinUi",
                    description: {
                        text: "Initialise the role join dropdown and buttons"
                    },
                    isSlash: true,
                }
            ]
        });
    }

    @Slash("displayJoinUi", {
        description: "Initialise the role join dropdown and buttons"
    })
    private async displayJoinUi(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply();
        const {guildId} = interaction;
        const rolesToDisplay = await RoleJoinerModel.findAll({
            where: {
                guildId
            }
        });
        if (!ArrayUtils.isValidArray(rolesToDisplay)) {
            return InteractionUtils.replyWithText(interaction, "Command not configured");
        }
        const roles: MessageSelectOptionData[] = rolesToDisplay.flatMap(roleToDisplay => {
            return roleToDisplay.rolesToJoin.map(roleId => {
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
        });
        const dropDown = new MessageSelectMenu().addOptions(roles).setCustomId("role-menu");
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
        const {member} = interaction;
        const {guild} = interaction;
        if (!(member instanceof GuildMember)) {
            await InteractionUtils.followupWithText(interaction, "Unable to find role");
            return;
        }
        const roleIdToAssign = interaction.values?.[0];
        const role = guild.roles.cache.get(roleIdToAssign);
        const remove = member.roles.cache.has(role.id);
        try {
            if (remove) {
                await member.roles.remove(role);
            } else {
                await member.roles.add(role);
            }
        } catch (e) {
            await InteractionUtils.followupWithText(interaction, e.message);
            return;
        }
        await InteractionUtils.followupWithText(interaction, `Role ${role.name} has been ${remove ? "removed" : "applied"}`);
    }
}