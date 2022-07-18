import { Column } from "typeorm/decorator/columns/Column"
import { ChildEntity } from "typeorm/decorator/entity/ChildEntity"
import { Person } from "./Person"

@ChildEntity(1)
export class Teacher extends Person {
    @Column()
    specialization: string
}
