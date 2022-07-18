import { ChildEntity, Column } from "typeorm"
import { Note } from "./note"

@ChildEntity()
export class OwnerNote extends Note {
    @Column()
    public owner: string
}
