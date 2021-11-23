import {IEventSecurityConstraint} from "./IEventSecurityConstraint.js";
import {AbstractModel} from "./AbstractModel.js";
import {AfterLoad, Column} from "typeorm";
import {Guild, GuildChannel, Role} from "discord.js";
import {ArrayUtils} from "../../utils/Utils.js";
import {container} from "tsyringe";
import {Client} from "discordx";

export abstract class AbstractEventSecurityConstraint extends AbstractModel implements IEventSecurityConstraint {

    private getRoles(prop: string): void {
        const value: string | null = this[prop];
        if (!ArrayUtils.isValidArray(value)) {
            this[prop] = [];
            return;
        }
        const guild = this.getGuild();
        this[prop] = value.map(roleId => guild.roles.cache.get(roleId));
    }

    private getChannels(prop: string): void {
        const value: string | null = this[prop];
        if (!ArrayUtils.isValidArray(value)) {
            this[prop] = [];
            return;
        }
        const guild = this.getGuild();
        this[prop] = value.map(channelId => guild.channels.cache.get(channelId));
    }

    private getGuild(): Guild {
        const client = container.resolve(Client);
        return client.guilds.cache.get(this.guildId);
    }


    /**
     * Transform string arrays into channel and role objects after queried from the DB
     */
    @AfterLoad()
    private unMarshallTransformer(): void {
        this.getChannels("allowedChannels");
        this.getChannels("ignoredChannels");

        this.getRoles("allowedRoles");
        this.getRoles("ignoredRoles");
    }

    @Column({
        type: "simple-array",
        nullable: false,
        default: ""
    })
    public allowedChannels: GuildChannel[];

    @Column({
        type: "simple-array",
        nullable: false,
        default: ""
    })
    public allowedRoles: Role[];


    @Column({
        type: "simple-array",
        nullable: false,
        default: ""
    })
    public ignoredChannels: GuildChannel[];

    @Column({
        type: "simple-array",
        nullable: false,
        default: ""
    })
    public ignoredRoles: Role[];
}