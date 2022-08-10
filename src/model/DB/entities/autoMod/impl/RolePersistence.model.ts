import type {GuildableModel} from "../../guild/Guildable.model.js";
import {IdentifiableModel} from "../../IdentifiableModel.js";
import {Column, Entity, JoinColumn, ManyToOne} from "typeorm";
import {AbstractModel} from "../../AbstractModel.js";

@Entity()
export class RolePersistenceModel extends IdentifiableModel {

    @Column()
    public roleId: string;

    @ManyToOne("GuildableModel", "rolePersistence", AbstractModel.cascadeOps)
    @JoinColumn({name: AbstractModel.joinCol})
    public guildableModel: GuildableModel;
}
