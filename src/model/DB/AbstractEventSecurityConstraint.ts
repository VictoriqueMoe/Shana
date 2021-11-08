import {IEventSecurityConstraint} from "./IEventSecurityConstraint";
import {AbstractModel} from "./AbstractModel";
import {AfterLoad, BeforeInsert, Column} from "typeorm";
import {Guild, GuildChannel, Role} from "discord.js";
import {ArrayUtils, ObjectUtil} from "../../utils/Utils";
import {container} from "tsyringe";
import {Client} from "discordx";

export abstract class AbstractEventSecurityConstraint extends AbstractModel implements IEventSecurityConstraint {

    private setRoles(roles: Role[], prop: string): void {
        if (!ArrayUtils.isValidArray(roles)) {
            this[prop] = null;
            return;
        }
        this[prop] = roles.map(role => role.id);
    }

    private getRoles(prop: string): void {
        const value: string | null = this[prop];
        if (!ObjectUtil.validString(value)) {
            this[prop] = [];
            return;
        }
        const guild = this.getGuild();
        const roleIds = value.split(",");
        this[prop] = roleIds.map(roleId => guild.roles.cache.get(roleId));
    }

    private getChannels(prop: string): void {
        const value: string | null = this[prop];
        if (!ObjectUtil.validString(value)) {
            this[prop] = [];
            return;
        }
        const guild = this.getGuild();
        const channels = value.split(",");
        this[prop] = channels.map(channelId => guild.channels.cache.get(channelId));
    }

    private setChannels(channels: GuildChannel[], prop: string): void {
        if (!ArrayUtils.isValidArray(channels)) {
            this[prop] = null;
            return;
        }
        this[prop] = channels.map(channel => channel.id);
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

    /**
     * Transform the values to String arrays to save into database
     */
    @BeforeInsert()
    private marshallTransformer(): void {
        this.setChannels(this.allowedChannels, "allowedChannels");
        this.setChannels(this.ignoredChannels, "ignoredChannels");

        this.setRoles(this.allowedRoles, "allowedRoles");
        this.setRoles(this.ignoredRoles, "ignoredRoles");
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