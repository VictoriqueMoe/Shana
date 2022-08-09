import {IAutoModFilter} from "./IAutoModFilter.js";
import {ICloseableModule} from "../../ICloseableModule";
import ACTION from "../../../../enums/ACTION.js";
import {EmbedBuilder, Message} from "discord.js";
import {ObjectUtil} from "../../../../utils/Utils.js";
import TIME_OUT from "../../../../enums/TIME_OUT.js";
import {LogChannelManager} from "../../../framework/manager/LogChannelManager.js";
import {container} from "tsyringe";

export abstract class AbstractFilter implements IAutoModFilter {

    public abstract readonly actions: ACTION[];
    public abstract readonly id: string;
    public abstract readonly isActive: boolean;
    public abstract readonly warnMessage: string;
    public abstract readonly priority: number;
    private readonly _logManager: LogChannelManager;

    public constructor() {
        this._logManager = container.resolve(LogChannelManager);
    }

    /**
     * How long to wait (in seconds) to cooldown the autoMuteViolationCount value
     * <br/><br/>
     * if autoTerminalViolationCount is set to 2 and this is set to 30 then each member will have 30 seconds to violate 2 terminal filters starting from the first violation. If a member violates ONE terminal filter and not another within 30 seconds, then the counter is reset to 0
     *
     */
    public static get terminalViolationTimeout(): number {
        return 15; //  hard-coded for now
    }

    private _parentModule: ICloseableModule<null>;

    public get parentModule(): ICloseableModule<null> {
        return this._parentModule;
    }

    public set parentModule(parentModule: ICloseableModule<null>) {
        this._parentModule = parentModule;
    }

    public get autoTerminalViolationCount(): number {
        return 3; //  hard-coded for now
    }

    public get autoMuteTimeout(): number {
        return TIME_OUT["1 hour"] / 1000; //  hard-coded for now
    }

    public abstract postProcess(member: Message): Promise<void>;

    public abstract doFilter(content: Message): Promise<boolean>;

    protected postToLog(reason: string, message: Message): Promise<Message | null> {
        if (!this.actions.includes(ACTION.DELETE) || !message.member.user) {
            return null;
        }
        const {member} = message;
        const avatarUrl = member.user.displayAvatarURL({size: 1024});
        const embed = new EmbedBuilder()
            .setColor(member.roles.highest.hexColor)
            .setAuthor({
                url: avatarUrl,
                name: member.user.tag
            })
            .setThumbnail(avatarUrl)
            .setTimestamp()
            .setDescription(`**Message sent by <@${member.id}> deleted in <#${message.channel.id}>** \n ${message.content}`)
            .addFields(ObjectUtil.singleFieldBuilder("Reason", reason))
            .setFooter({
                text: `${member.user.id}`
            });
        return this._logManager.postToLog([embed], message.guild.id, false);
    }
}
