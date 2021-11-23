import typeorm from "typeorm";
const { AfterLoad, BeforeInsert, Column, Entity, Index, JoinColumn, ManyToOne } = typeorm;
import {GuildableModel} from "./Guildable.model.js";
import {BaseGuildTextChannel} from "discord.js";
import {IdentifiableModel} from "../IdentifiableModel.js";
import {AbstractModel} from "../AbstractModel.js";
import {container} from "tsyringe";
import {Client} from "discordx";

@Entity()
@Index("guildIdConstraint", ["name", "guildId"], {
    unique: true
})
export class MessageScheduleModel extends IdentifiableModel {

    @BeforeInsert()
    private marshalTransformer(): void {
        if (!(this.channel instanceof BaseGuildTextChannel)) {
            throw new Error("Channel must be a Text Channel");
        }
        // @ts-ignore
        this.channel = this.channel.id;
    }

    @AfterLoad()
    private unMarshalTransformer(): void {
        const client = container.resolve(Client);
        const value: string = this.channel as unknown as string;
        const guild = client.guilds.cache.get(this.guildId);
        this.channel = guild.channels.cache.get(value) as BaseGuildTextChannel;
    }

    @Column({unique: false, nullable: false})
    public cron: string;

    @Column({
        unique: false,
        nullable: false,
        type: "text"
    })
    public channel: BaseGuildTextChannel;

    @Column({unique: false, nullable: false})
    public message: string;

    @Column({nullable: false})
    public name: string;

    @ManyToOne(() => GuildableModel, guildableModel => guildableModel.messageScheduleModel, AbstractModel.cascadeOps)
    @JoinColumn({name: AbstractModel.joinCol})
    public guildableModel: GuildableModel;
}