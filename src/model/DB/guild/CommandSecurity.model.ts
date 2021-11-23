import {Column, Entity, JoinColumn, ManyToOne} from "typeorm";
import {GuildableModel} from "./Guildable.model.js";
import {AbstractModel} from "../AbstractModel.js";

@Entity()
export class CommandSecurityModel extends AbstractModel {

    @Column({unique: false, nullable: false})
    public commandName: string;

    @Column({unique: false, default: true})
    public enabled: boolean;

    @Column({
        type: "simple-array",
        nullable: true,
        default: ""
    })
    public allowedRoles: string[];

    @ManyToOne(() => GuildableModel, guildableModel => guildableModel.commandSecurityModel, AbstractModel.cascadeOps)
    @JoinColumn({name: AbstractModel.joinCol})
    guildableModel: GuildableModel;
}