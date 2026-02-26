import { Column } from "../../../../../../src/decorator/columns/Column"
import { ChildEntity } from "../../../../../../src/decorator/entity/ChildEntity"
import { Actor } from "./Actor"

@ChildEntity()
export class User extends Actor {
    @Column()
    email: string

    // Overloads the parent's "color" column — child's copy lives in "user" table
    @Column({ default: "user-default-color" })
    color: string
}
