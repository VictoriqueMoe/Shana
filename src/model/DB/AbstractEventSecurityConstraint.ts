import {IEventSecurityConstraint} from "./IEventSecurityConstraint";
import {AbstractModel} from "./AbstractModel";
import {AfterLoad, BeforeInsert, Column} from "typeorm";
import {Guild, GuildChannel, Role} from "discord.js";
import {ArrayUtils, ObjectUtil} from "../../utils/Utils";
import {container} from "tsyringe";
import {Client} from "discordx";

export abstract class AbstractEventSecurityConstraint extends AbstractModel implements IEventSecurityConstraint {

    private static getRoles(this: AbstractEventSecurityConstraint, prop: string): void {
        const value: string | null = this[prop];
        if (!ObjectUtil.validString(value)) {
            this[prop] = [];
            return;
        }
        const guild = AbstractEventSecurityConstraint.getGuild.call(this);
        const roleIds = value.split(",");
        this[prop] = roleIds.map(roleId => guild.roles.cache.get(roleId));
    }

    private static getChannels(this: AbstractEventSecurityConstraint, prop: string): void {
        const value: string | null = this[prop];
        if (!ObjectUtil.validString(value)) {
            this[prop] = [];
            return;
        }
        const guild = AbstractEventSecurityConstraint.getGuild.call(this);
        const channels = value.split(",");
        this[prop] = channels.map(channelId => guild.channels.cache.get(channelId));
    }

    private static setChannels(this: AbstractEventSecurityConstraint, channels: GuildChannel[], prop: string): void {
        if (!ArrayUtils.isValidArray(channels)) {
            this[prop] = null;
            return;
        }
        this[prop] = channels.map(channel => channel.id);
    }

    private static setRoles(this: AbstractEventSecurityConstraint, roles: GuildChannel[], prop: string): void {
        if (!ArrayUtils.isValidArray(roles)) {
            this[prop] = null;
            return;
        }
        this[prop] = roles.map(role => role.id);
    }

    private static getGuild(this: AbstractEventSecurityConstraint): Guild {
        const client = container.resolve(Client);
        return client.guilds.cache.get(this.guildId);
    }


    /**
     * Transform string arrays into channel and role objects after queried from the DB
     */
    @AfterLoad()
    private unMarshallTransformer(): void {
        AbstractEventSecurityConstraint.getChannels.call(this, "allowedChannels");
        AbstractEventSecurityConstraint.getChannels.call(this, "ignoredChannels");

        AbstractEventSecurityConstraint.getRoles.call(this, "allowedRoles");
        AbstractEventSecurityConstraint.getRoles.call(this, "ignoredRoles");
    }

    /**
     * Transform the values to String arrays to save into database
     */
    @BeforeInsert()
    private marshallTransformer(): void {
        AbstractEventSecurityConstraint.setChannels.call(this, "allowedChannels");
        AbstractEventSecurityConstraint.setChannels.call(this, "ignoredChannels");

        AbstractEventSecurityConstraint.setRoles.call(this, "allowedRoles");
        AbstractEventSecurityConstraint.setRoles.call(this, "ignoredRoles");
    }

    @Column({
        type: "simple-array",
        nullable: true
    })
    public allowedChannels: GuildChannel[];

    @Column({
        type: "simple-array",
        nullable: true
    })
    public allowedRoles: Role[];


    @Column({
        type: "simple-array",
        nullable: true
    })
    public ignoredChannels: GuildChannel[];

    @Column({
        type: "simple-array",
        nullable: true
    })
    public ignoredRoles: Role[];
}