import { ChildEntity } from "../../../../../../src/decorator/entity/ChildEntity"
import { Column } from "../../../../../../src/decorator/columns/Column"
import { Actor } from "./Actor"

@ChildEntity({ discriminatorValue: "user" })
export class User extends Actor {
    @Column()
    email: string
}
