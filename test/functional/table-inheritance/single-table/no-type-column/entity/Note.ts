import * as TypeOrm from "typeorm"
import { Person } from "./Person"

@TypeOrm.Entity()
@TypeOrm.TableInheritance({ column: { type: String, name: "type" } })
export class Note {
    @TypeOrm.PrimaryGeneratedColumn()
    public id: number

    @TypeOrm.Column({ default: null })
    public label?: string

    @TypeOrm.ManyToOne(() => Person)
    public owner: Person
}
