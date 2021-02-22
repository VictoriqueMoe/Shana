import {CloseOptionModel} from "../../model/DB/autoMod/impl/CloseOption.model";
import {ArgsOf, Client, Guard, On} from "@typeit/discord";
import {EnabledGuard} from "../../guards/EnabledGuard";
import {CloseableModule} from "../../model/CloseableModule";
import {DiscordUtils} from "../../utils/Utils";

export class AuditLogger extends CloseableModule{
    constructor() {
        super(CloseOptionModel);
    }

    @On("guildMemberAdd")
    @Guard(EnabledGuard("userLog"))
    private async memberJoins([member]: ArgsOf<"guildMemberAdd">, client: Client): Promise<void> {
        const memberJoined = member.id;
        DiscordUtils.postToLog(`<@${memberJoined}> has joined the server`);
    }

    @On("guildMemberRemove")
    @Guard(EnabledGuard("userLog"))
    private async memberLeaves([member]: ArgsOf<"guildMemberAdd">, client: Client): Promise<void> {
        const memberLeft = member.id;
        DiscordUtils.postToLog(`<@${memberLeft}> has left the server`);
    }

    @On("guildBanAdd")
    @Guard(EnabledGuard("userLog"))
    private async memberBanned([guild, user]: ArgsOf<"guildBanAdd">, client: Client): Promise<void> {
        const memberBanned = user.id;
        DiscordUtils.postToLog(`<@${memberBanned}> has been banned!!`);
    }


    public get moduleId(): string {
        return "userLog";
    }

    public get isDynoReplacement(): boolean {
        return true;
    }
}