import { Column } from "typeorm/decorator/columns/Column"
import { ChildEntity } from "typeorm/decorator/entity/ChildEntity"
import { Person } from "./Person"

@ChildEntity("employee-type")
export class Employee extends Person {
    @Column()
    salary: number
}
