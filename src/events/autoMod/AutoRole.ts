import {CloseableModule} from "../../model/CloseableModule";
import {ArgsOf, Client, Guard, On} from "@typeit/discord";
import {EnabledGuard} from "../../guards/EnabledGuard";
import {CloseOptionModel} from "../../model/DB/autoMod/impl/CloseOption.model";
import {Roles} from "../../enums/Roles";
import * as schedule from "node-schedule";
import RolesEnum = Roles.RolesEnum;

export class AutoRole extends CloseableModule {

    constructor() {
        super(CloseOptionModel);
    }

    @On("guildMemberAdd")
    @Guard(EnabledGuard("AutoRole"))
    private async memberJoins([member]: ArgsOf<"guildMemberAdd">, client: Client): Promise<void> {
        let now = Date.now();
        let seventySeconds = 70000;
        let toAddRole = now + seventySeconds;
        let d = new Date(toAddRole);
        //TODO use scheduler
        schedule.scheduleJob(`enable ${member.user.username}`, d, () => {
            member.roles.add(RolesEnum.HEADCRABS, "added via VicBot");
        });
    }


    public get moduleId(): string {
        return "AutoRole";
    }

}