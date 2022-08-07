import {GuildableModel} from "../../guild/Guildable.model";
import {IdentifiableModel} from "../../IdentifiableModel";
import {Column, Entity, JoinColumn, ManyToOne} from "typeorm";
import {AbstractModel} from "../../AbstractModel";

@Entity()
export class RolePersistenceModel extends IdentifiableModel {

    @Column()
    public roleId: string;

    @ManyToOne(() => GuildableModel, guildableModel => guildableModel.rolePersistence, AbstractModel.cascadeOps)
    @JoinColumn({name: AbstractModel.joinCol})
    public guildableModel: GuildableModel;
}