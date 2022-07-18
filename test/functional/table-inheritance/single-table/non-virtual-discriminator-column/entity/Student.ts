import { Column } from "../typeorm/decorator/columns/Column"
import { ChildEntity } from "../typeorm/decorator/entity/ChildEntity"
import { Person } from "./Person"

@ChildEntity("student-type")
export class Student extends Person {
    @Column()
    faculty: string
}
