import {IdentifiableModel} from "../IdentifiableModel.js";
import {Column, Entity, Unique} from "typeorm";

@Entity()
@Unique("notesUniqueIndex", ["name", "userId", "guildId"])
export class NotesModel extends IdentifiableModel {

    @Column({nullable: false})
    public name: string;

    @Column({nullable: false})
    public text: string;
}
