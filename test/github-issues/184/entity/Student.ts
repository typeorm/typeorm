import { Column } from "typeorm/decorator/columns/Column"
import { Person, PersonType } from "./Person"
import { ChildEntity } from "typeorm/decorator/entity/ChildEntity"

@ChildEntity(PersonType.Student) // required
export class Student extends Person {
    @Column()
    faculty: string

    constructor() {
        super()
        this.type = 3
    }
}
