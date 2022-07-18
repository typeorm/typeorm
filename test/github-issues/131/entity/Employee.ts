import { Column } from "typeorm/decorator/columns/Column"
import { Person } from "./Person"
import { ChildEntity } from "typeorm/decorator/entity/ChildEntity"

@ChildEntity()
export class Employee extends Person {
    @Column()
    salary: number
}
