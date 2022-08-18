import type {GuildableModel} from "./Guildable.model.js";
import {AbstractModel} from "../AbstractModel.js";
import {Column, Entity, JoinColumn, ManyToOne} from "typeorm";

@Entity()
export class SettingsModel extends AbstractModel {

    @Column({unique: false})
    public setting: string;

    @Column({type: "text", nullable: true, default: null})
    public value: string;

    @ManyToOne("GuildableModel", "settingsModel", AbstractModel.cascadeOps)
    @JoinColumn({name: AbstractModel.joinCol})
    public guildableModel: GuildableModel;
}
