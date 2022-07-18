import { Column } from "../typeorm/decorator/columns/Column"
import { ChildEntity } from "../typeorm/decorator/entity/ChildEntity"
import { Person } from "./Person"

@ChildEntity()
export class Employee extends Person {
    @Column()
    salary: number
}
