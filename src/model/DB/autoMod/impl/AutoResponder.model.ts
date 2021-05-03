import {BelongsTo, Column, DataType, ForeignKey, Model, Table} from "sequelize-typescript";
import {IGuildAware} from "../../IGuildAware";
import {GuildableModel} from "../../guild/Guildable.model";
import {IEventSecurityConstraint} from "../../IEventSecurityConstraint";
import {GuildChannel, Role} from "discord.js";
import {ArrayUtils, ModelUtils, ObjectUtil} from "../../../../utils/Utils";

@Table
export class AutoResponderModel extends Model implements IGuildAware, IEventSecurityConstraint {

    @Column({allowNull: false, defaultValue: false})
    public useRegex: boolean;

    @Column({allowNull: false, unique: true})
    public title: string;

    @Column({type: DataType.ENUM("message", "reaction", "delete"), defaultValue: "message", allowNull: false})
    public responseType: "message" | "reaction" | "delete";

    @Column({defaultValue: false, allowNull: false})
    public wildCard: boolean;

    @Column({type: DataType.TEXT, allowNull: true, defaultValue: null})
    public response: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
        get(): string[] {
            const value: string | null = this.getDataValue("emojiReactions");
            if (!ObjectUtil.validString(value)) {
                return [];
            }
            return this.getDataValue("emojiReactions").split(",");
        },
        set(roles: string[]) {
            if (!ArrayUtils.isValidArray(roles)) {
                this.setDataValue("emojiReactions", null);
                return;
            }
            this.setDataValue("emojiReactions", roles.join(","));
        }
    })
    public emojiReactions: string[];

    @Column({
        type: DataType.TEXT,
        allowNull: true,
        get(): GuildChannel[] {
            return ModelUtils.EventSecurityConstraintUtils.getChannels.call(this, "allowedChannels");
        },
        set(channels: string[]) {
            ModelUtils.EventSecurityConstraintUtils.setChannels.call(this, channels, "allowedChannels");
        }
    })
    public allowedChannels: GuildChannel[];

    @Column({
        type: DataType.TEXT,
        allowNull: true,
        get(): Role[] {
            return ModelUtils.EventSecurityConstraintUtils.getRoles.call(this, "allowedRoles");
        },
        set(roles: string[]) {
            ModelUtils.EventSecurityConstraintUtils.setRoles.call(this, roles, "allowedRoles");
        }
    })
    allowedRoles: Role[];


    @Column({
        type: DataType.TEXT,
        allowNull: true,
        get(): GuildChannel[] {
            return ModelUtils.EventSecurityConstraintUtils.getChannels.call(this, "ignoredChannels");
        },
        set(channels: string[]) {
            ModelUtils.EventSecurityConstraintUtils.setChannels.call(this, channels, "ignoredChannels");
        }
    })
    ignoredChannels: GuildChannel[];

    @Column({
        type: DataType.TEXT,
        allowNull: true,
        get(): Role[] {
            return ModelUtils.EventSecurityConstraintUtils.getRoles.call(this, "ignoredRoles");
        },
        set(roles: string[]) {
            ModelUtils.EventSecurityConstraintUtils.setRoles.call(this, roles, "ignoredRoles");
        }
    })
    ignoredRoles: Role[];


    @ForeignKey(() => GuildableModel)
    @Column
    guildId: string;

    @BelongsTo(() => GuildableModel, {onDelete: "cascade"})
    guildableModel: GuildableModel;
}