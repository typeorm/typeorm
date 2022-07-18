import { Column } from "typeorm/decorator/columns/Column"
import { Person, PersonType } from "./Person"
import { ChildEntity } from "typeorm/decorator/entity/ChildEntity"

@ChildEntity(PersonType.Homesitter) // required
export class Homesitter extends Person {
    @Column()
    numberOfKids: number

    @Column()
    shared: string

    constructor() {
        super()
        this.type = 2
    }
}
