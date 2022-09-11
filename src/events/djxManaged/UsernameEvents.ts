import {ArgsOf, Client, Discord, On} from "discordx";
import {injectable} from "tsyringe";
import {UsernameManager} from "../../model/framework/manager/UsernameManager.js";
import {AuditManager} from "../../model/framework/manager/AuditManager.js";
import {AuditLogEvent, PermissionFlagsBits} from "discord-api-types/v10";
import {LogChannelManager} from "../../model/framework/manager/LogChannelManager.js";
import {User} from "discord.js";

@Discord()
@injectable()
export class UsernameEvents {

    public constructor(private _usernameManager: UsernameManager,
                       private _auditManager: AuditManager,
                       private _logManager: LogChannelManager) {
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
        if (model.usernameToPersist !== newUser.nickname) {
            if (isMemberStaff || (executor.id === newUser.id && model.force === false)) {
                const newNick = newUser.nickname;
                if (newNick === null) {
                    await this._usernameManager.removeNickname(newUser);
                } else {
                    await this._usernameManager.setUsername(newUser, newNick, model.force);
                }
                if (newNick === null) {
                    let msg = `User "${newUser.user.tag}" has had their username remove from persistence`;
                    const {id} = newUser;
                    const auditEntry = await this._auditManager.getAuditLogEntry(AuditLogEvent.MemberUpdate, newUser.guild);
                    if (auditEntry) {
                        if (auditEntry.target instanceof User && auditEntry.target.id === id) {
                            const changedBy = auditEntry.executor.tag;
                            msg += ` by ${changedBy}`;
                        }
                    }
                    this._logManager.postToLog(msg, guildId);
                } else {
                    this._logManager.postToLog(`User "${newUser.user.tag}" has a persisted nickname of "${model.usernameToPersist}", however, this has been updated to "${(newNick)}"`, guildId);
                }
                return;
            }
        }
        newUser.setNickname(model.usernameToPersist);
    }

    @On()
    private async guildMemberAdd([member]: ArgsOf<"guildMemberAdd">): Promise<void> {
        const model = await this._usernameManager.getUsername(member);
        if (model) {
            member.setNickname(model.usernameToPersist);
        }
    }
}
