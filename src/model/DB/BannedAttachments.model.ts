import {Column, Model, Table} from "sequelize-typescript";

@Table
export class BannedAttachmentsModel extends Model {

    @Column({unique: true})
    public attachmentHash: string;

    @Column
    public url: string;

    @Column
    public reason: string;
}