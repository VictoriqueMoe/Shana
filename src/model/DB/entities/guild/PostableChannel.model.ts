import {AbstractModel} from "../AbstractModel.js";
import {Column, Entity, JoinColumn, ManyToOne} from "typeorm";
import type {GuildableModel} from "./Guildable.model.js";

@Entity()
export class PostableChannelModel extends AbstractModel {

    @Column({unique: true, default: null, nullable: true})
    public logChannel: string;

    @Column({unique: true, default: null, nullable: true})
    public AdminLogchannel: string;

    @Column({unique: true, default: null, nullable: true})
    public JailChannel: string;

    @Column({unique: true, default: null, nullable: true})
    public birthdayChannel: string;

    @ManyToOne("GuildableModel", "postableChannels", AbstractModel.cascadeOps)
    @JoinColumn({name: AbstractModel.joinCol})
    public guildableModel: GuildableModel;
}
