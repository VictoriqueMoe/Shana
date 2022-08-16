import {ArgsOf, Client, Discord, On} from "discordx";
import {injectable} from "tsyringe";
import {UsernameManager} from "../../model/framework/manager/UsernameManager.js";
import {AuditManager} from "../../model/framework/manager/AuditManager.js";
import {AuditLogEvent, PermissionFlagsBits} from "discord-api-types/v10.js";

@Discord()
@injectable()
export class UsernameEvents {

    public constructor(private _usernameManager: UsernameManager,
                       private _auditManager: AuditManager) {
    }

    @On()
    public async guildMemberUpdate([oldUser, newUser]: ArgsOf<"guildMemberUpdate">, client: Client): Promise<void> {
        const isNickChange = oldUser.nickname !== newUser.nickname;
        if (!isNickChange) {
            return;
        }
        const model = await this._usernameManager.getUsername(newUser);
        if (!model) {
            return;
        }
        const guildId = newUser.guild.id;
        const roleLog = await this._auditManager.getAuditLogEntry(AuditLogEvent.MemberUpdate, newUser.guild);
        const executor = roleLog.executor;
        const guild = await client.guilds.fetch(guildId);
        const member = await guild.members.fetch(executor.id);
        const isMemberStaff = member.permissions.has(PermissionFlagsBits.ManageNicknames);
        if (isMemberStaff || (executor.id === newUser.id && model.force === false)) {

        }
    }

    @On()
    private async guildMemberAdd([member]: ArgsOf<"guildMemberAdd">, client: Client): Promise<void> {

    }
}
