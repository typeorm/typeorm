import {
    Entity,
    PrimaryGeneratedColumn,
    TableInheritance,
} from "typeorm"

@Entity({ name: "wikiNote" })
@TableInheritance({ column: { type: String, name: "type" } })
export class Note {
    @PrimaryGeneratedColumn()
    public id: number
}
