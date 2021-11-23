import {Column, Entity, JoinColumn, ManyToOne} from "typeorm";
import {GuildableModel} from "./Guildable.model.js";
import {AbstractModel} from "../AbstractModel.js";

@Entity()
export class RoleJoinerModel extends AbstractModel {

    @Column({
        type: "simple-array",
        nullable: true,
        default: ""
    })
    public rolesToJoin: string[];

    @ManyToOne(() => GuildableModel, guildableModel => guildableModel.roleJoinerModel, AbstractModel.cascadeOps)
    @JoinColumn({name: AbstractModel.joinCol})
    guildableModel: GuildableModel;
}