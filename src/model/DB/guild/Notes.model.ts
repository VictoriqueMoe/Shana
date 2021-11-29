import {IdentifiableModel} from "../IdentifiableModel";
import {Column, Entity, Unique} from "typeorm";

@Entity()
@Unique("notesUniqueIndex", ["title", "userId", "guildId"])
export class NotesModel extends IdentifiableModel {

    @Column({nullable: false})
    public title: string;

    @Column({nullable: false})
    public text: string;
}