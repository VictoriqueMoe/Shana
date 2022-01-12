import {IDynoAutoModFilter} from "./IDynoAutoModFilter";
import {Message, MessageEmbed} from "discord.js";
import {ACTION} from "../../../../enums/ACTION";
import {ICloseableModule} from "../../ICloseableModule";
import {DiscordUtils, TimeUtils} from "../../../../utils/Utils";

export abstract class AbstractFilter implements IDynoAutoModFilter {

    abstract readonly actions: ACTION[];
    abstract readonly id: string;
    abstract readonly isActive: boolean;
    abstract readonly warnMessage: string;
    abstract readonly priority: number;
    private _parentModule: ICloseableModule<null>;


    public set parentModule(parentModule: ICloseableModule<null>) {
        this._parentModule = parentModule;
    }

    public get parentModule(): ICloseableModule<null> {
        return this._parentModule;
    }

    /**
     * this sets the amount of filters that define "terminal operation (mute, kick and ban)" as punishment that needs to fail before the action is automatically taken
     */
    public static get autoTerminalViolationCount(): number {
        return 3; //  hard-coded for now
    }

    /**
     * How long (in seconds) are members muted for if they violate "mute" filters according to the autoMuteViolationCount
     */
    public static get autoMuteTimeout(): number {
        return TimeUtils.TIME_OUT["1 hour"] / 1000; //  hard-coded for now
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

    public abstract postProcess(member: Message): Promise<void>;

    public abstract doFilter(content: Message): Promise<boolean>;

    protected postToLog(reason: string, message: Message): Promise<Message | null> {
        if (!this.actions.includes(ACTION.DELETE) || !message.member.user) {
            return null;
        }
        const {member} = message;
        const avatarUrl = member.user.displayAvatarURL({size: 1024, dynamic: true});
        const embed = new MessageEmbed()
            .setColor(member.roles.highest.hexColor)
            .setAuthor(member.user.tag, avatarUrl)
            .setThumbnail(avatarUrl)
            .setTimestamp()
            .setDescription(`**Message sent by <@${member.id}> deleted in <#${message.channel.id}>** \n ${message.content}`)
            .addField("Reason", reason)
            .setFooter(`${member.user.id}`);
        return DiscordUtils.postToLog([embed], message.guild.id, false);
    }
}