import {GuildableModel} from "./Guildable.model.js";
import {AbstractModel} from "../AbstractModel.js";
import typeorm from "typeorm";
const { Column, Entity, JoinColumn, ManyToOne } = typeorm;

@Entity()
export class SettingsModel extends AbstractModel {

    @Column({unique: false})
    public setting: string;

    @Column({type: "text", nullable: true, default: null})
    public value: string;

    @ManyToOne(() => GuildableModel, guildableModel => guildableModel.settingsModel, AbstractModel.cascadeOps)
    @JoinColumn({name: AbstractModel.joinCol})
    guildableModel: GuildableModel;
}