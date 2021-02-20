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
        const now = Date.now();
        const seventySeconds = 70000;
        const toAddRole = now + seventySeconds;
        const d = new Date(toAddRole);
        //TODO use scheduler
        schedule.scheduleJob(`enable ${member.user.username}`, d, () => {
            try{
                member.roles.add(RolesEnum.HEADCRABS, "added via VicBot");
            }catch{

            }
        });
    }


    public get moduleId(): string {
        return "AutoRole";
    }

}