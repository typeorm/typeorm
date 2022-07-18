import {
    Entity,
    PrimaryGeneratedColumn,
    TableInheritance,
} from "typeorm"

@Entity({ name: "issueNote" })
@TableInheritance({ column: { type: String, name: "type" } })
export class Note {
    @PrimaryGeneratedColumn()
    public id: number
}
