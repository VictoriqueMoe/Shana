import {IGuildAware} from "../IGuildAware";
import {BelongsTo, Column, DataType, ForeignKey, Model, Table} from "sequelize-typescript";
import {GuildableModel} from "./Guildable.model";
import {Identifiable} from "../Identifiable";
import {BaseGuildTextChannel} from "discord.js";
import {container} from "tsyringe";
import {Client} from "discordx";

@Table
export class MessageScheduleModel extends Model implements IGuildAware, Identifiable {

    @Column({unique: false, allowNull: false})
    public cron: string;

    @Column({
        unique: false,
        allowNull: false,
        type: DataType.TEXT,
        get(): BaseGuildTextChannel {
            const client = container.resolve(Client);
            const value: string = this.getDataValue("channel");
            const guild = client.guilds.cache.get(this.getDataValue("guildId"));
            return guild.channels.cache.get(value) as BaseGuildTextChannel;
        },
        set(channel: BaseGuildTextChannel) {
            if (!(channel instanceof BaseGuildTextChannel)) {
                throw new Error("Channel must be a Text Channel");
            }
            this.setDataValue("channel", channel.id);
        }
    })
    public channel: BaseGuildTextChannel;

    @Column({unique: false, allowNull: false})
    public message: string;

    @Column({unique: "guildIdConstraint", allowNull: false})
    public name: string;

    @Column({unique: false, allowNull: false})
    public userId: string;

    @ForeignKey(() => GuildableModel)
    @Column({unique: "guildIdConstraint"})
    public guildId: string;

    @BelongsTo(() => GuildableModel, {onDelete: "cascade"})
    public guildableModel: GuildableModel;
}