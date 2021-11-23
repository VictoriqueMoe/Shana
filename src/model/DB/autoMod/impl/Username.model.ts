import {GuildableModel} from "../../guild/Guildable.model.js";
import {IdentifiableModel} from "../../IdentifiableModel.js";
import typeorm from "typeorm";
const { Column, Entity, JoinColumn, ManyToOne } = typeorm;
import {AbstractModel} from "../../AbstractModel.js";

@Entity()
export class UsernameModel extends IdentifiableModel {

    @Column()
    public usernameToPersist: string;

    @Column({
        default: false
    })
    public force: boolean;

    @ManyToOne(() => GuildableModel, guildableModel => guildableModel.usernameModel, AbstractModel.cascadeOps)
    @JoinColumn({name: AbstractModel.joinCol})
    public guildableModel: GuildableModel;

}