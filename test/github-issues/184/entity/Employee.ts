import { Column } from "typeorm/decorator/columns/Column"
import { Person, PersonType } from "./Person"
import { ChildEntity } from "typeorm/decorator/entity/ChildEntity"

@ChildEntity(PersonType.Employee)
export class Employee extends Person {
    @Column()
    salary: number

    @Column()
    shared: string

    constructor() {
        super()
        this.type = 1
    }
}
