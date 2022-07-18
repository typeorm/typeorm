import * as TypeOrm from "typeorm"
import { Note } from "./Note"
import { Employee } from "./Employee"

@TypeOrm.ChildEntity()
export class PostItNote extends Note {
    @TypeOrm.Column()
    public postItNoteLabel: string

    @TypeOrm.ManyToOne(() => Employee, (person) => person.notes)
    public owner: Employee
}
