import {Scheduler} from "./Scheduler";
import {GuildUtils, ObjectUtil} from "../utils/Utils";
import {Main} from "../Main";

export class DynoReplace {
    private static instance: DynoReplace;
    private readonly chron = "*/5 * * * * *";
    private readonly uid = ObjectUtil.guid();
    private moduleActivated = false;
    private innerJobs: InnerJob[];

    private constructor() {
        this.innerJobs = [];
    }

    public static getInstance(): DynoReplace {
        if (!DynoReplace.instance) {
            DynoReplace.instance = new DynoReplace();
        }
        return DynoReplace.instance;
    }

    public start(): void {
        Scheduler.getInstance().register(this.uid, this.chron, this.checkDynoStatus);
    }

    private async checkDynoStatus(): Promise<void> {
       /* let dyno = GuildUtils.getAutoBotIds();
        let guild = await Main.client.guilds.fetch(GuildUtils.getGuildID());
        let dynoObject = await guild.members.fetch(dyno);
        let isOffline = dynoObject.presence.status === "offline";
        if (isOffline) {
            if (!this.moduleActivated) {
                await this.activateModule();
            }
        } else {
            if (this.moduleActivated) {
                this.deactivateModule();
            }
        }*/
    }

    private async activateModule(): Promise<void> {
        this.moduleActivated = true;

        function startAutoRole(this: DynoReplace) {
            Main.client.on("guildMemberAdd", args => {

            });
        }

        // hardcoded jobs for now
        startAutoRole.call(this);
    }

    private deactivateModule() {
        this.moduleActivated = false;
    }
}

class InnerJob {

    public constructor(public method: (args) => void, public event:string) {}

    public destroyJob():void{
        Main.client.off(this.event, this.method);
    }

}