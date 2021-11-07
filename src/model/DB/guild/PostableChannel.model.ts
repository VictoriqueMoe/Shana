import {GuildableModel} from "./Guildable.model";
import {AbstractModel} from "../AbstractModel";
import {Column, Entity, JoinColumn, ManyToOne} from "typeorm";

@Entity()
export class PostableChannelModel extends AbstractModel {

    @Column({unique: true, default: null, nullable: true})
    public logChannel: string;

    @Column({unique: true, default: null, nullable: true})
    public AdminLogchannel: string;

    @Column({unique: true, default: null, nullable: true})
    public JailChannel: string;

    @ManyToOne(() => GuildableModel, guildableModel => guildableModel.postableChannels, AbstractModel.cascadeOps)
    @JoinColumn({name: AbstractModel.joinCol})
    guildableModel: GuildableModel;
}